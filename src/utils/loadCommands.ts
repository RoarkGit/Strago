import { readdir } from 'fs/promises'
import { join } from 'path'

import { Collection } from 'discord.js'

import { generateSubcommands } from '../commands/shortcuts'
import type { Command } from '../interfaces/Command'
import Shortcut from '../interfaces/models/Shortcut'
import { createShortcutCommand } from '../interfaces/ShortcutCommand'
import type { Strago } from '../interfaces/Strago'

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

    // Build subcommands for the shortcuts management command.
    if (commands.has('shortcuts')) {
      generateSubcommands(strago)
    }

    // Register a command and load titles for each shortcut type.
    for (const t of strago.config.shortcutTypes) {
      commands.set(t, createShortcutCommand(t))
      const docs = await Shortcut(t).find()
      strago.shortcutTitles.set(t, new Set<string>(docs.map((d) => d.title)))
    }

    strago.commands = commands
    return true
  } catch (error) {
    strago.logger.error(error)
    return false
  }
}
