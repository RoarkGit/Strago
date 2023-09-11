import { Schema, model } from 'mongoose'

interface IUser {
  discordId: string
  numTimeouts: number
}

const UserSchema = new Schema<IUser>({
  discordId: { type: String, required: true },
  numTimeouts: { type: Number, required: true, default: 0 },
})

export default model<IUser>('users', UserSchema)
