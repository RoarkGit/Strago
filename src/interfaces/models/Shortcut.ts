import { Model, Schema, model } from 'mongoose'

export interface IShortcut {
  title: string
  content: string
  files: string[]
}

const ShortcutSchema = new Schema<IShortcut>({
  title: { type: String, required: true },
  content: { type: String, required: false },
  files: { type: [String], required: false },
})

export default function (type: string): Model<IShortcut> {
  return model<IShortcut>(type, ShortcutSchema)
}
