/**
 * Represents a Blue Mage spell.
 */
export interface Spell {
  apiId: string
  aspect: string
  description: string
  icon: string
  location: string
  name: string
  notes?: string
  number: string
  rank: string
  type: string
  range: number | undefined
  radius: number | undefined
}
