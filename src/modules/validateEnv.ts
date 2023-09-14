import type { Strago } from '../interfaces/Strago'

/**
 * Reads and validate .env file for required values and correctness.
 * @param strago Strago client instance
 * @returns Whether or not the environment variables were valid.
 */
export const validateEnv = (
  strago: Strago,
): { valid: boolean; message: string } => {
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

    if (process.env.DELETED_MESSAGES_CHANNEL_ID === undefined) {
      return { valid: false, message: 'Missing deleted messages channel ID.' }
    }

    if (process.env.FILL_CHANNEL_ID === undefined) {
      return { valid: false, message: 'Missing fill channel ID.' }
    }

    if (process.env.LFG_CATEGORY_ID === undefined) {
      return { valid: false, message: 'Missing fill LFG category ID.' }
    }

    if (process.env.MOD_CATEGORY_ID === undefined) {
      return { valid: false, message: 'Missing moderator category ID.' }
    }

    if (process.env.MOD_CHANNEL_ID === undefined) {
      return { valid: false, message: 'Missing moderator channel ID.' }
    }

    if (process.env.WEEKLY_TARGET_CHANNEL_ID === undefined) {
      return { valid: false, message: 'Missing weekly target channel ID.' }
    }

    if (process.env.DATABASE_URI === undefined) {
      return { valid: false, message: 'Missing database URI.' }
    }

    if (process.env.NODE_ENV === undefined) {
      return { valid: false, message: 'Missing node environment.' }
    }

    strago.config = {
      shortcutTypes:
        process.env.SHORTCUT_TYPES === undefined
          ? []
          : process.env.SHORTCUT_TYPES.split(','),
      databaseUri: process.env.DATABASE_URI,
      env: process.env.NODE_ENV,
      id: process.env.CLIENT_ID,
      loggerUri: process.env.LOKI_URI,
      homeGuildId: process.env.HOME_GUILD_ID,
      deletedMessagesChannelId: process.env.DELETED_MESSAGES_CHANNEL_ID,
      fillChannelId: process.env.FILL_CHANNEL_ID,
      lfgCategoryId: process.env.LFG_CATEGORY_ID,
      modCategoryId: process.env.MOD_CATEGORY_ID,
      modChannelId: process.env.MOD_CHANNEL_ID,
      weeklyTargetChannelId: process.env.WEEKLY_TARGET_CHANNEL_ID,
      pruneChannels:
        process.env.PRUNE_CHANNELS === undefined
          ? []
          : process.env.PRUNE_CHANNELS.split(','),
      token: process.env.BOT_TOKEN,
    }

    return { valid: true, message: 'Environment validated.' }
  } catch (error) {
    console.error(error)
    return {
      valid: false,
      message: 'Uncaught error when validating environment.',
    }
  }
}
