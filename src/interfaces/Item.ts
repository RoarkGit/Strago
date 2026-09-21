/**
 * Represents a Beastmaster item, sourced from the Limited-Job-Data submodule.
 * Covers all three item categories the game defines under XBMItemType: Beast Gear,
 * Crucible Item, and Feed.
 */
export interface Item {
  id: string
  name: string
  number: number
  category: string
  /** Territory tokens received selling to an NPC vendor; 0 for Feed, which cannot be sold. */
  sellPrice: number
  description: string
}
