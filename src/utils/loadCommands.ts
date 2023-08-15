import { type Strago } from '../interfaces/Strago'

import { Collection } from 'discord.js'
import { readdir } from 'fs/promises'
import { join } from 'path'

import { type Command } from '../interfaces/Command'
import { ShortcutCommand } from '../interfaces/ShortcutCommand'
import { type Shortcuts } from '../commands/shortcuts'

/**
 * Attempts to load all Commands stored in the commands folder.
 * @returns Boolean indicating success.
 */
export const loadCommands = async (strago: Strago, commandsPath: string): Promise<boolean> => {
  try {
    const commands: Collection<string, Command> = new Collection<string, Command>()
    const files = await readdir(commandsPath)

    for (const file of files) {
      const name = file.split('.')[0]
      const module = await import(
        join(commandsPath, file)
      )
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
      const titles = await strago.db.collection(t).find().map(d => d.title).toArray()
      strago.shortcutTitles.set(t, new Set<string>(titles))
    }

    strago.commands = commands
    return true
  } catch (error) {
    strago.logger.error(error)
    return false
  }
}
