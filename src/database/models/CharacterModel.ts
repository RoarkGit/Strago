import { model, Schema } from 'mongoose'

/**
 * Represents a row in the Characters table.
 */
interface Character {
  discordId: string
  characterId: string
  characterName: string
};

export const CharacterSchema = new Schema({
  discordId: { type: String, required: true },
  characterId: { type: String, required: true },
  characterName: { type: String, required: true }
})

export default model<Character>('characters', CharacterSchema)
