import { readFileSync } from 'fs'

import { Collection } from 'discord.js'
import { load } from 'js-yaml'

import type { Strago } from '../interfaces/Strago'

/**
 * Loads a YAML list of named entries (spells, beasts, items) from the Limited-Job-Data submodule.
 * @param strago Strago client instance
 * @param file path to the YAML file
 * @returns The entries keyed by lowercase name, or null if the file could not be loaded.
 */
export const loadByName = <T extends { name: string }>(
  strago: Strago,
  file: string,
): Collection<string, T> | null => {
  try {
    const entries = load(readFileSync(file, 'utf8')) as T[]
    return new Collection(entries.map((e) => [e.name.toLowerCase(), e]))
  } catch (error) {
    strago.logger.error(`Failed to load ${file}`, error)
    return null
  }
}
