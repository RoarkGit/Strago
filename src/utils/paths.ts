import { join } from 'path'

const getDataDir = () =>
  join(process.cwd(), process.env.NODE_ENV === 'production' ? 'data/blue-mage-data' : 'src/data/blue-mage-data')

export const PATHS = {
  spellData: () => join(getDataDir(), 'spell.yaml'),
  spellImages: () => join(getDataDir(), 'images'),
  weeklyTargets: () => join(getDataDir(), 'weeklyTargets.yaml'),
}
