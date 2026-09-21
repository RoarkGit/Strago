import { join } from 'path'

const getDataDir = () =>
  join(
    process.cwd(),
    process.env.NODE_ENV === 'prod'
      ? 'data/limited-job-data'
      : 'src/data/limited-job-data',
  )

export const PATHS = {
  spellData: () => join(getDataDir(), 'spell/spell.yaml'),
  spellImages: () => join(getDataDir(), 'spell/images'),
  beastData: () => join(getDataDir(), 'beast/beast.yaml'),
  beastImages: () => join(getDataDir(), 'beast/images'),
  weeklyTargets: () => join(getDataDir(), 'weeklyTargets.yaml'),
}
