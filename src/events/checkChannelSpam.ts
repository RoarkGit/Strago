import {
  Colors,
  EmbedBuilder,
  type Message,
  PermissionFlagsBits,
} from 'discord.js'

import { SPAM_CHANNEL_THRESHOLD, SPAM_WINDOW_MS } from '../constants/time'
import Stats from '../interfaces/models/Stats'
import type { Strago } from '../interfaces/Strago'
import { kickAndPurge } from '../utils/kickAndPurge'

interface RecentMessage {
  channelId: string
  // Content plus attachment names/sizes.
  signature: string
  content: string
  timestamp: number
}

// Recent messages per user, pruned to SPAM_WINDOW_MS.
const recentMessages = new Map<string, RecentMessage[]>()
// Users currently being kicked, so a burst of messages only triggers one kick.
const handling = new Set<string>()

const getSignature = (message: Message): string | null => {
  const attachments = message.attachments
    .map((a) => `${a.name}:${a.size}`)
    .join(',')
  const content = message.content.trim()
  if (content === '' && attachments === '') return null
  return `${content}|${attachments}`
}

/**
 * Kicks users who post the same message in multiple channels in quick succession and deletes their recent messages.
 * @param message the message that triggered the event
 * @param strago Strago client instance
 */
export const checkChannelSpam = async (
  message: Message,
  strago: Strago,
): Promise<void> => {
  if (
    !message.inGuild() ||
    message.member === null ||
    message.author.bot ||
    message.channel.parentId === strago.config.modCategoryId ||
    // Cross-posting in LFG channels is allowed.
    (strago.config.lfgCategoryId !== undefined &&
      message.channel.parentId === strago.config.lfgCategoryId)
  )
    return
  const member = message.member
  if (member.permissions.has(PermissionFlagsBits.ManageMessages)) return
  if (handling.has(member.id)) return
  const signature = getSignature(message)
  if (signature === null) return

  // Drop stale entries for everyone so users who stop posting don't linger.
  const now = message.createdTimestamp
  for (const [userId, entries] of recentMessages) {
    const fresh = entries.filter((e) => now - e.timestamp < SPAM_WINDOW_MS)
    if (fresh.length === 0) recentMessages.delete(userId)
    else recentMessages.set(userId, fresh)
  }

  const entries = recentMessages.get(member.id) ?? []
  entries.push({
    channelId: message.channelId,
    signature,
    content: message.content,
    timestamp: now,
  })
  recentMessages.set(member.id, entries)

  const matched = entries.filter((e) => e.signature === signature)
  const channelIds = new Set(matched.map((e) => e.channelId))
  if (channelIds.size < SPAM_CHANNEL_THRESHOLD) return

  const reason = `posting the same message in ${channelIds.size} channels within ${SPAM_WINDOW_MS / 1000}s`
  handling.add(member.id)
  recentMessages.delete(member.id)
  try {
    const logChannel = await strago.channels
      .fetch(strago.config.spamDetectionChannelId ?? strago.config.modChannelId)
      .catch(() => null)
    if (logChannel !== null && logChannel.isSendable()) {
      const log = matched
        .map((e) => `<#${e.channelId}>: ${e.content}`)
        .join('\n')
        .slice(0, 3500)
      const embed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setDescription(
          `**Kicked ${member} (${member.user.username} <${member.id}>) for ${reason}.**\n${log}`,
        )
      await logChannel
        .send({ embeds: [embed] })
        .catch((err) => strago.logger.error(err))
    }

    await kickAndPurge(member, `Channel spam: ${reason}.`)
    await Stats.findOneAndUpdate(
      {},
      { $inc: { channelSpamKills: 1 } },
      { upsert: true, setDefaultsOnInsert: true },
    )
    strago.logger.info(
      `Kicked ${member.user.username} for channel spam: ${reason}.`,
    )
  } catch (err) {
    strago.logger.error(err)
  } finally {
    handling.delete(member.id)
  }
}
