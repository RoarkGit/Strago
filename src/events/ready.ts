import { Strago } from '../interfaces/Strago'

import { userPrune } from '../modules/userPrune'

const userPruneLoop = (strago: Strago): void => {
  (async (): Promise<void> => await userPrune(strago))().catch(error => strago.logger.error(error))
  setInterval(userPruneLoop, 1000 * 60, strago)
}

/**
 * Prints message when bot is connected and ready.
 * @param strago Strago client instance
 */
export const ready = async (strago: Strago): Promise<void> => {
  strago.logger.info('Discord ready!')
  userPruneLoop(strago)
}
