import { Schema, model } from 'mongoose'

export interface ICharacter {
  discordId: string
  characterId: string
  characterName: string
}

const CharacterSchema = new Schema<ICharacter>({
  discordId: { type: String, required: true },
  characterId: { type: String, required: true },
  characterName: { type: String, required: true },
})

export default model<ICharacter>('characters', CharacterSchema)
