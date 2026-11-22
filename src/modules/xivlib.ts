/**
 * Library for retrieving assorted information about FFXIV characters.
 */
/* eslint-disable  @typescript-eslint/no-explicit-any */
import crypto from 'crypto'
import path from 'path'

import { PromisePool } from '@supercharge/promise-pool'
import * as nodestone from '@xivapi/nodestone'

const parsers = {
  character: new nodestone.Character(),
  characterSearch: new nodestone.CharacterSearch(),
}

const ACHIEVEMENT_COMPLETE = 'entry__achievement__view--complete'
const LODESTONE_URL = 'https://na.finalfantasyxiv.com/lodestone/character/'

/**
 * Generates simple SHA-1 hash of character info.
 * @param character The character's name
 * @param server The character's server
 * @returns SHA-1(character+server)
 */
export const generateChallenge = (
  character: string,
  server: string,
): string => {
  const charString = (character + server).toLowerCase()
  const hash = crypto.createHash('sha1')
  hash.update(charString)
  return hash.digest('base64')
}

/**
 * Retrieves a given character's Lodestone ID.
 * @param character The character's name
 * @param server The character's server
 * @returns The character's Lodestone ID if it exists, null otherwise.
 */
export const getCharacterId = async (
  character: string,
  server: string,
): Promise<string | null> => {
  const res = (await parsers.characterSearch.parse({
    query: { name: character, server },
  } as any)) as any
  if (res.NoResultsFound !== undefined) return null
  for (const char of res.List) {
    if (char.Name === character) return char.ID.toString()
  }
  return null
}

/**
 * Retrieves a given character's name and server by ID.
 * @param characterId The character's Lodestone ID
 * @returns The character's name and server if they exist, null otherwise.
 */
export const getCharacterInfo = async (
  characterId: string,
): Promise<[string, string] | null> => {
  // Lodestone returns a 404 for unknown IDs, which the parser throws.
  const res = (await parsers.character
    .parse({ params: { characterId } } as any)
    .catch(() => undefined)) as any
  if (res === undefined) return null
  return [res.Name, res.World]
}

const MAX_ATTEMPTS = 5
const BASE_RETRY_DELAY_MS = 1000

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Called before each retry of a Lodestone request.
 * @param achievementId The achievement being retried
 * @param attempt The attempt about to be made (2 for the first retry)
 * @param reason The HTTP status or error that caused the retry
 */
export type RetryCallback = (
  achievementId: string,
  attempt: number,
  reason: string,
) => void | Promise<void>

/**
 * Thrown when Lodestone keeps responding with 429 Too Many Requests after all retries.
 */
export class RateLimitedError extends Error {
  constructor(url: string) {
    super(`Rate limited by Lodestone after ${MAX_ATTEMPTS} attempts: ${url}`)
    this.name = 'RateLimitedError'
  }
}

/**
 * Determines which achievements in a given set of achievements a character has completed.
 * @param characterId The character's ID
 * @param achievementIds List of achievements to check
 * @param onRetry Optional callback invoked before each retried request
 * @returns A Set representing the completed achievements from achievementIds.
 */
export const getAchievementsComplete = async (
  characterId: string,
  achievementIds: string[],
  onRetry?: RetryCallback,
): Promise<Set<string>> => {
  const achievementSet = new Set<string>()
  await PromisePool.for(achievementIds)
    .withConcurrency(5)
    .handleError(async (error) => {
      throw error // Throw any errors, we only want to execute on full achievement sets.
    })
    .process(async (achievementId) => {
      if (await getAchievementComplete(characterId, achievementId, onRetry)) {
        achievementSet.add(achievementId)
      }
    })
  return achievementSet
}

/**
 * Checks if a given character has completed a specified achievement.
 * Lodestone rate limits bursts of requests with a 429 (no Retry-After header),
 * so transient failures are retried with exponential backoff. If the page still
 * cannot be fetched, this throws rather than returning false, since a false
 * negative would cause earned roles to be skipped or removed.
 * @param characterId The character's ID
 * @param achievementId The achievement's ID
 * @param onRetry Optional callback invoked before each retried request
 * @returns Whether or not the character has completed the achievement.
 * @throws RateLimitedError if every attempt was rate limited.
 */
export const getAchievementComplete = async (
  characterId: string,
  achievementId: string,
  onRetry?: RetryCallback,
): Promise<boolean> => {
  const url = getUrl([characterId, 'achievement', 'detail', achievementId])
  let lastError = ''
  let lastStatus: number | undefined
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await onRetry?.(achievementId, attempt + 1, lastError)
      const jitter = Math.random() * BASE_RETRY_DELAY_MS
      await sleep(BASE_RETRY_DELAY_MS * 2 ** (attempt - 1) + jitter)
    }
    try {
      const response = await fetch(url)
      if (response.ok) {
        return (await response.text()).includes(ACHIEVEMENT_COMPLETE)
      }
      // A 404 means there is no completion page for this achievement.
      if (response.status === 404) return false
      lastStatus = response.status
      lastError = `${response.status} ${response.statusText}`.trim()
      if (response.status !== 429 && response.status < 500) break
    } catch (error) {
      lastStatus = undefined
      lastError = String(error)
    }
  }
  if (lastStatus === 429) throw new RateLimitedError(url)
  throw new Error(`Failed to fetch ${url}: ${lastError}`)
}

/**
 * Checks if a given character's achievements are marked public.
 * @param characterId The character's ID
 * @returns Whether or not the character's achievements are public.
 */
export const getAchievementsPublic = async (
  characterId: string,
): Promise<boolean> => {
  const url = getUrl([characterId, 'achievement'])
  try {
    const response = await fetch(url)
    // Private achievement pages return a 403, so we should only print other errors that occur.
    if (!response.ok && response.status !== 403) {
      console.error(`${response.status} ${response.statusText} for ${url}`)
    }
    return response.ok
  } catch (error) {
    console.error(error)
    return false
  }
}

/**
 * Checks if a given character's Lodestone profile contains the challenge string for that character.
 * @param characterId The character's ID
 * @returns Whether or not the character challenge was successfully verified.
 */
export const verifyCharacter = async (
  characterId: string,
): Promise<boolean> => {
  const res: any = await parsers.character.parse({
    params: { characterId },
  } as any)
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
