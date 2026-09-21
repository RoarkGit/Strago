import { readFileSync } from 'fs'

import { Collection } from 'discord.js'
import { load } from 'js-yaml'

import { PATHS } from './paths'
import type { Beast } from '../interfaces/Beast'
import type { Strago } from '../interfaces/Strago'

/**
 * Loads all beasts from the Limited-Job-Data submodule.
 * @returns Boolean indicating success.
 */
export const loadBeasts = (strago: Strago): boolean => {
  try {
    const beasts = new Collection<string, Beast>()
    const raw = load(readFileSync(PATHS.beastData(), 'utf8')) as Beast[]

    for (const beast of raw) {
      beasts.set(beast.name.toLowerCase(), beast)
    }

    strago.data.beastData = beasts
    return true
  } catch (error) {
    console.error(error)
    strago.logger.error(error)
    return false
  }
}
