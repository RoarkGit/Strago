/**
 * Library for retrieving assorted information about FFXIV characters.
 */

import axios from 'axios'
import crypto from 'crypto'
import path from 'path'
import { PromisePool } from '@supercharge/promise-pool'
import * as nodestone from '@xivapi/nodestone'

const parsers = {
  character: new nodestone.Character(),
  characterSearch: new nodestone.CharacterSearch()
}

const ACHIEVEMENT_COMPLETE = 'entry__achievement__view--complete'
const LODESTONE_URL = 'https://na.finalfantasyxiv.com/lodestone/character/'

/**
 * Generates simple SHA-1 hash of character info.
 * @param character The character's name
 * @param server The character's server
 * @returns SHA-1(character+server)
 */
export const generateChallenge = (character: string, server: string): string => {
  const charString = (character + server).toLowerCase()
  const hash = crypto.createHash('sha1')
  hash.update(charString)
  return hash.digest('base64')
}

/**
 * Retrieves a given character's Lodestone ID.
 * @param character The character's name
 * @param server The character's server
 * @returns The character's Lodestone ID if it exists, "-1" otherwise.
 */
export const getCharacterId = async (character: string, server: string): Promise<string> => {
  const res = await parsers.characterSearch.parse({ query: { name: character, server } } as any) as any
  if (res.NoResultsFound !== undefined) return '-1'
  for (const char of res.List) {
    if (char.Name === character) return char.ID.toString()
  }
  return '-1'
}

/**
 * Retrieves a given character's name and server by ID.
 * @param characterId The character's Lodestone ID
 * @returns The character's name and server if they exist, '-1' otherwise.
 */
export const getCharacterInfo = async (characterId: string): Promise<[string, string]> => {
  const res = await parsers.character.parse({ params: { characterId } } as any) as any
  if (res === undefined) return ['-1', '-1']
  return [res.Name, res.World]
}

/**
 * Determines which achievements in a given set of achievements a character has completed.
 * @param characterId The character's ID
 * @param achievementIds List of achievements to check
 * @returns A Set representing the completed achievements from achievementIds.
 */
export const getAchievementsComplete = async (characterId: string, achievementIds: string[]): Promise<Set<string>> => {
  const achievementSet = new Set<string>()
  await PromisePool
    .for(achievementIds)
    .withConcurrency(5)
    .handleError(async (error) => {
      throw error // Throw any errors, we only want to execute on full achievement sets.
    })
    .process(async (achievementId) => {
      if (await getAchievementComplete(characterId, achievementId)) {
        achievementSet.add(achievementId)
      };
    })
  return achievementSet
}

/**
 * Checks if a given character has completed a specified achievement.
 * @param characterId The character's ID
 * @param achievementId The achievement's ID
 * @returns Whether or not the character has completed the achievement.
 */
export const getAchievementComplete = async (characterId: string, achievementId: string): Promise<boolean> => {
  const url = getUrl([characterId, 'achievement', 'detail', achievementId])
  return await axios.get(url)
    .then(response => response.data.includes(ACHIEVEMENT_COMPLETE))
    .catch(_ => false)
}

/**
 * Checks if a given character's achievements are marked public.
 * @param characterId The character's ID
 * @returns Whether or not the character's achievements are public.
 */
export const getAchievementsPublic = async (characterId: string): Promise<boolean> => {
  const url = getUrl([characterId, 'achievement'])
  return await axios.get(url)
    .then(() => true)
    .catch(error => {
      // Private achievement pages return a 403, so we should only print other errors that occur.
      if (error.response.status !== 403) {
        console.error(error)
      }
      return false
    })
}

/**
 * Checks if a given character's Lodestone profile contains the challenge string for that character.
 * @param characterId The character's ID
 * @returns Whether or not the character challenge was successfully verified.
 */
export const verifyCharacter = async (characterId: string): Promise<boolean> => {
  const res: any = await parsers.character.parse({ params: { characterId } } as any)
  const character = res.Name
  const server = res.World
  const challenge = generateChallenge(character, server)
  return res.Bio.includes(challenge)
}

/**
 * Joins various parts of a URL into a complete Lodestone URL.
 * @param parts The URL subpaths to join
 * @returns A fully joined Lodestone URL.
 */
export const getUrl = (parts: string[]): string => {
  const urlPath = path.join.apply(null, parts)
  return new URL(urlPath, LODESTONE_URL).href
}
