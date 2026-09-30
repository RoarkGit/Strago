// Use mongoose's own copy of the driver so its types always match the connection's.
import { connect, connection, mongo } from 'mongoose'

import type { Strago } from '../interfaces/Strago'

export let gridfs: mongo.GridFSBucket

export const connectDatabase = async (strago: Strago): Promise<boolean> => {
  try {
    await connect(strago.config.databaseUri)
    const db = connection.db
    if (!db) throw new Error('Database connection failed')
    gridfs = new mongo.GridFSBucket(db)
    return true
  } catch (error) {
    strago.logger.error('Failed to connect to database:', error)
    return false
  }
}
