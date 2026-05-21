/**
 * Represents a Blue Mage spell, sourced from the Blue-Mage-Data submodule.
 */
export interface Spell {
  id: string
  name: string
  number: number
  actionType: string
  spellType: string
  spellAspect: string
  rank: number
  range?: number
  radius?: number
  cast: number
  recast: number
  mp?: number
  hp?: number
  face?: boolean
  location: string
  description: string
  target: string[]
  status?: string[]
  notes?: string
}
