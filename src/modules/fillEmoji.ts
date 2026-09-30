import type { Collection, GuildEmoji } from 'discord.js'

/**
 * Picks the emoji for a fill role or content option: the named guild emoji if the guild has it,
 * otherwise the fallback unicode emoji.
 * @param data the option's entry from fillData.json
 * @param emojis the guild's emoji
 * @returns An emoji to pass to setEmoji, or undefined if the option has none.
 */
export const fillEmoji = (
  data: { emoji?: string; guildEmoji?: string },
  emojis: Collection<string, GuildEmoji>,
): string | undefined =>
  emojis.find((e) => e.name === data.guildEmoji)?.identifier ?? data.emoji
