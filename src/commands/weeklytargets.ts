export interface CarnivaleTarget {
  name: string
  bonuses?: string[]
}

export interface WeeklyTargets {
  carnivale: Record<string, CarnivaleTarget[]>
  duties: Record<string, string[]>
  primes: Record<string, string[]>
  /** Video guide per rotation week, in the same order as the rotation lists. */
  videos: string[]
}
