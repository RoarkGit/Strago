import { GridFSBucket } from 'mongodb'
import { connect, connection } from 'mongoose'

import type { Strago } from '../interfaces/Strago'

export let gridfs: GridFSBucket

export const connectDatabase = async (strago: Strago): Promise<boolean> => {
  try {
    await connect(strago.config.databaseUri)
    gridfs = new GridFSBucket(connection.db)
    return true
  } catch (error) {
    strago.logger.error('Failed to connect to database:', error)
    return false
  }
}
