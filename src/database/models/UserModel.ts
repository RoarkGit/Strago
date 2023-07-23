import { model, Schema } from 'mongoose'

/**
 * Represents a row in the Users table.
 */
interface User {
  discordId: string
  numTimeouts: number
};

export const UserSchema = new Schema({
  discordId: { type: String, required: true },
  numTimeouts: { type: Number, required: true }
})

export default model<User>('users', UserSchema)
