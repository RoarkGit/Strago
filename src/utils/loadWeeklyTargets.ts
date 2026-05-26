import { readFileSync } from 'fs'

import { load } from 'js-yaml'

import type { WeeklyTargets } from '../interfaces/WeeklyTargets'
import type { Strago } from '../interfaces/Strago'
import { PATHS } from './paths'

export const loadWeeklyTargets = (strago: Strago): boolean => {
  try {
    strago.data.weeklyTargets = load(
      readFileSync(PATHS.weeklyTargets(), 'utf8'),
    ) as WeeklyTargets
    return true
  } catch (error) {
    console.error(error)
    strago.logger.error(error)
    return false
  }
}
