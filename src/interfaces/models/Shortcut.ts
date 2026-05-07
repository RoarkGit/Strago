import { Model, Schema, Types, model } from 'mongoose'

export interface IShortcut {
  title: string
  content: string
  files: { filename: string; fileId: Types.ObjectId }[]
}

const FileSchema = new Schema({
  filename: { type: String, required: true },
  fileId: { type: Schema.Types.ObjectId, required: true },
})

const ShortcutSchema = new Schema<IShortcut>({
  title: { type: String, required: true },
  content: { type: String, required: false },
  files: { type: [FileSchema], required: false },
})

export default function (type: string): Model<IShortcut> {
  return model<IShortcut>(type, ShortcutSchema)
}
