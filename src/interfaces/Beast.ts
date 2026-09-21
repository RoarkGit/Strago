/**
 * One of a beast's two named actions, with its full in-game tooltip.
 */
export interface BeastAction {
  name: string
  /** Omitted when the action deals no damage. */
  element?: string
  /** Instinctual Affinity; present on tricks only. */
  affinity?: string
  range?: number
  radius?: number
  description: string
}

/**
 * Represents a Beastmaster beast, sourced from the Limited-Job-Data submodule.
 */
export interface Beast {
  id: string
  name: string
  number: number
  classification: string
  satiety: number
  habitat: string
  lore: string
  autoAttack: {
    element: string
    range: number
  }
  trick: BeastAction
  temperedRelease: BeastAction
  stats: {
    strength: number
    intelligence: number
    physicalResistance: number
    magicalResistance: number
    constitution: number
  }
}
