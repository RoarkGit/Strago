import type { Strago } from '../interfaces/Strago'

interface ApplicationEmoji {
  id: string
  name: string
  animated: boolean
}

/**
 * Loads Strago's application emoji, keyed by name. Application emoji resolve in every
 * guild the bot is in, so uploading them to the app rather than to a guild keeps the
 * Beastmaster action icons working everywhere.
 *
 * Never fatal: if the fetch fails the collection is simply left empty, and anything that
 * renders an emoji falls back to plain text.
 */
export const loadEmoji = async (strago: Strago): Promise<void> => {
  try {
    const response = await fetch(
      `https://discord.com/api/v10/applications/${strago.config.id}/emojis`,
      { headers: { Authorization: `Bot ${strago.config.token}` } },
    )
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`)
    }

    const body = (await response.json()) as { items: ApplicationEmoji[] }
    for (const emoji of body.items) {
      strago.data.emoji.set(
        emoji.name,
        `<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>`,
      )
    }
    strago.logger.info(`Loaded ${strago.data.emoji.size} application emoji.`)
  } catch (error) {
    strago.logger.error(`Failed to load application emoji: ${String(error)}`)
  }
}
