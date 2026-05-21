import { readFileSync } from 'fs'
import { join } from 'path'

import { Collection } from 'discord.js'
import { load } from 'js-yaml'

import type { Spell } from '../interfaces/Spell'
import type { Strago } from '../interfaces/Strago'

const SPELL_DATA_PATH = join(__dirname, '../../src/data/Blue-Mage-Data/spell.yaml')

/**
 * Loads all spells from the Blue-Mage-Data submodule.
 * @returns Boolean indicating success.
 */
export const loadSpells = (strago: Strago): boolean => {
  try {
    const spells = new Collection<string, Spell>()
    const raw = load(readFileSync(SPELL_DATA_PATH, 'utf8')) as Spell[]

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
