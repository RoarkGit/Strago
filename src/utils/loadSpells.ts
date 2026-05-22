import { readFileSync } from 'fs'

import { Collection } from 'discord.js'
import { load } from 'js-yaml'

import { PATHS } from './paths'
import type { Spell } from '../interfaces/Spell'
import type { Strago } from '../interfaces/Strago'

/**
 * Loads all spells from the Blue-Mage-Data submodule.
 * @returns Boolean indicating success.
 */
export const loadSpells = (strago: Strago): boolean => {
  try {
    const spells = new Collection<string, Spell>()
    const raw = load(readFileSync(PATHS.spellData(), 'utf8')) as Spell[]

    for (const spell of raw) {
      spells.set(spell.name.toLowerCase(), spell)
    }

    strago.data.spellData = spells
    return true
  } catch (error) {
    console.error(error)
    strago.logger.error(error)
    return false
  }
}
