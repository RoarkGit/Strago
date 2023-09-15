import { readdir } from 'fs/promises'
import { join } from 'path'

import { Collection } from 'discord.js'

import type { Shortcuts } from '../commands/shortcuts'
import type { Command } from '../interfaces/Command'
import Shortcut from '../interfaces/models/Shortcut'
import { ShortcutCommand } from '../interfaces/ShortcutCommand'
import type { Strago } from '../interfaces/Strago'

/**
 * Attempts to load all Commands stored in the commands folder.
 * @returns Boolean indicating success.
 */
export const loadCommands = async (
  strago: Strago,
  commandsPath: string,
): Promise<boolean> => {
  try {
    const commands: Collection<string, Command> = new Collection<
      string,
      Command
    >()
    const files = (await readdir(commandsPath)).filter(
      (f) => !f.endsWith('.map'),
    )

    for (const file of files) {
      const name = file.split('.')[0]
      const module = await import(join(commandsPath, file))
      commands.set(name, module[name])
    }

    // Set up shortcut subcommands.
    const shortcutsCommand = commands.get('shortcuts') as Shortcuts
    if (shortcutsCommand !== undefined) {
      shortcutsCommand.generateSubcommands(strago)
    }

    // Initialize shortcuts.
    for (const t of strago.config.shortcutTypes) {
      const command = new ShortcutCommand(t)
      commands.set(t, command)
      const shortcuts = await Shortcut(t).find()
      const titles = shortcuts.map((d) => d.title)
      strago.shortcutTitles.set(t, new Set<string>(titles))
    }

    strago.commands = commands
    return true
  } catch (error) {
    strago.logger.error(error)
    return false
  }
}
