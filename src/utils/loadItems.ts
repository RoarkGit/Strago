import { readFileSync } from 'fs'

import { Collection } from 'discord.js'
import { load } from 'js-yaml'

import { PATHS } from './paths'
import type { Item } from '../interfaces/Item'
import type { Strago } from '../interfaces/Strago'

/**
 * Loads all Beastmaster items from the Limited-Job-Data submodule.
 * @returns Boolean indicating success.
 */
export const loadItems = (strago: Strago): boolean => {
  try {
    const items = new Collection<string, Item>()
    const raw = load(readFileSync(PATHS.itemData(), 'utf8')) as Item[]

    for (const item of raw) {
      items.set(item.name.toLowerCase(), item)
    }

    strago.data.itemData = items
    return true
  } catch (error) {
    console.error(error)
    strago.logger.error(error)
    return false
  }
}
