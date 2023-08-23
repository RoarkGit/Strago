import { MongoClient } from 'mongodb'

import type { Strago } from '../interfaces/Strago'

/**
 * Attempts to connect to the bot's database.
 * @param strago Strago client instance
 * @returns Whether the connection was successful or not.
 */
export const connectDatabase = async (strago: Strago): Promise<boolean> => {
  try {
    const client = new MongoClient(strago.config.databaseUri)
    strago.db = client.db(strago.config.env)

    return true
  } catch (error) {
    strago.logger.error('Failed to connect to database:', error)
    return false
  }
}
