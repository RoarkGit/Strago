import { join } from 'path'

const getDataDir = () => join(process.cwd(), 'data/Blue-Mage-Data')

export const PATHS = {
  spellData: () => join(getDataDir(), 'spell.yaml'),
  spellImages: () => getDataDir() + '/images',
}
