import { Strago } from '../interfaces/Strago'

import { Collection } from 'discord.js'

import spellData from '../data/spellData.json'
import { Spell } from '../interfaces/Spell'

const FFXIVCOLLECT_URL = 'https://ffxivcollect.com/api/spells'

interface XivcollectSpell {
  name: string
  description: string
  order: number
  rank: number
  icon: string
  type: {
    id: number
    name: string
  }
  aspect: {
    id: number
    name: string
  }
  sources: [
    {
      text: string
    }
  ]
}

/**
 * Attempts to load all Spells from spellData and FFXIV Collect.
 * @returns Boolean indicating success.
 */
export const loadSpells = async (strago: Strago): Promise<boolean> => {
  try {
    const spells = new Collection<string, Spell>()
    const xivcollectList: XivcollectSpell[] = await fetch(FFXIVCOLLECT_URL)
      .then(async res => await res.json())
      .then(res => res.results)
    const xivcollectInfo = new Collection<string, XivcollectSpell>()
    xivcollectList.forEach(s => xivcollectInfo.set(s.name, s))
    spellData.forEach(s => {
      const xivcollectSpell = xivcollectInfo.get(s.name)
      if (xivcollectSpell == null) return

      const spell: Spell = {
        apiId: s.apiId,
        aspect: xivcollectSpell.aspect.name,
        description: xivcollectSpell.description.replace(/\*/g, ''),
        icon: xivcollectSpell.icon,
        location: s.location ?? xivcollectSpell.sources.map(s => s.text).join('\n'),
        name: xivcollectSpell.name,
        notes: s.notes,
        number: xivcollectSpell.order.toString(),
        rank: '★'.repeat(xivcollectSpell.rank),
        type: xivcollectSpell.type.name
      }
      if (spell.aspect === 'None') {
        spell.aspect = 'Unaspected'
      }
      spells.set(spell.name.toLowerCase(), spell)
    })
    strago.data.spellData = spells
    return true
  } catch (error) {
    console.error(error)
    strago.logger.error(error)
    return false
  }
}
