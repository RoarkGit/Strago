export interface CarnivaleTarget {
  name: string
  bonuses?: string[]
}

export interface WeeklyTargets {
  carnivale: Record<string, CarnivaleTarget[]>
  duties: Record<string, string[]>
  primes: Record<string, string[]>
}
