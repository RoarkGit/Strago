import { Strago } from '../interfaces/Strago'

/**
 * Reads and validate .env file for required values and correctness.
 * @param strago Strago client instance
 * @returns Whether or not the environment variables were valid.
 */
export const validateEnv = (strago: Strago): { valid: boolean, message: string } => {
  try {
    if (process.env.BOT_TOKEN === undefined) {
      return { valid: false, message: 'Missing bot token.' }
    }

    if (process.env.CLIENT_ID === undefined) {
      return { valid: false, message: 'Missing client ID.' }
    }

    if (process.env.HOME_GUILD_ID === undefined) {
      return { valid: false, message: 'Missing test guild ID.' }
    }

    if (process.env.DATABASE_URI === undefined) {
      return { valid: false, message: 'Missing database URI.' }
    }

    if (process.env.NODE_ENV === undefined) {
      return { valid: false, message: 'Missing node environment.' }
    }

    strago.config = {
      databaseUri: process.env.DATABASE_URI,
      env: process.env.NODE_ENV,
      id: process.env.CLIENT_ID,
      loggerUri: process.env.LOKI_URI,
      homeGuildId: process.env.HOME_GUILD_ID,
      pruneChannels: process.env.PRUNE_CHANNELS === undefined ? [] : process.env.PRUNE_CHANNELS.split(','),
      token: process.env.BOT_TOKEN
    }

    return { valid: true, message: 'Environment validated.' }
  } catch (error) {
    console.error(error)
    return { valid: false, message: 'Uncaught error when validating environment.' }
  }
}
