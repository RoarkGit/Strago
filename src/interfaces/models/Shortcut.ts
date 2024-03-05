import { Model, Schema, model } from 'mongoose'

export interface IShortcut {
  title: string
  content: string
  files: { filename: string; data: string }[]
}

const FileSchema = new Schema({
  filename: { type: String, required: true },
  data: { type: String, required: true },
})

const ShortcutSchema = new Schema<IShortcut>({
  title: { type: String, required: true },
  content: { type: String, required: false },
  files: { type: [FileSchema], required: false },
})

export default function (type: string): Model<IShortcut> {
  return model<IShortcut>(type, ShortcutSchema)
}
