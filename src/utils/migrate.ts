import * as dotenv from 'dotenv'
import { GridFSBucket, MongoClient, ObjectId } from 'mongodb'
import * as path from 'path'

const envFile = process.argv[2] ?? '.env.dev'
dotenv.config({ path: path.resolve(process.cwd(), envFile) })

const uri = process.env.DATABASE_URI
const shortcutTypes = process.env.SHORTCUT_TYPES?.split(',').filter(Boolean) ?? []

if (uri === undefined) {
  console.error('DATABASE_URI is not set.')
  process.exit(1)
}

if (shortcutTypes.length === 0) {
  console.error('SHORTCUT_TYPES is not set or empty.')
  process.exit(1)
}

async function main(): Promise<void> {
  const client = new MongoClient(uri!)
  await client.connect()
  const db = client.db()
  const bucket = new GridFSBucket(db)

  let totalMigrated = 0

  for (const type of shortcutTypes) {
    const collection = db.collection(type)
    const docs = await collection.find({ 'files.data': { $exists: true } }).toArray()

    if (docs.length === 0) {
      console.log(`${type}: nothing to migrate`)
      continue
    }

    console.log(`${type}: migrating ${docs.length} document(s)`)

    for (const doc of docs) {
      const newFiles = await Promise.all(
        (doc.files as Array<{ filename: string; data: string }>).map(async (f) => {
          const buffer = Buffer.from(f.data, 'base64')
          const fileId = await new Promise<ObjectId>((resolve, reject) => {
            const stream = bucket.openUploadStream(f.filename)
            stream.end(buffer)
            stream.on('finish', () => resolve(stream.id as ObjectId))
            stream.on('error', reject)
          })
          return { filename: f.filename, fileId }
        }),
      )

      await collection.updateOne({ _id: doc._id }, { $set: { files: newFiles } })
      console.log(`  migrated: ${doc.title as string}`)
      totalMigrated++
    }
  }

  await client.close()
  console.log(`\nDone. ${totalMigrated} document(s) migrated.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
