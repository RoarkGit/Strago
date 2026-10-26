import { Schema, model } from 'mongoose'

interface IStats {
  honeypotKills: number
  botTrapRoleKills: number
  channelSpamKills: number
}

const StatsSchema = new Schema<IStats>({
  honeypotKills: { type: Number, required: true, default: 0 },
  botTrapRoleKills: { type: Number, required: true, default: 0 },
  channelSpamKills: { type: Number, required: true, default: 0 },
})

export default model<IStats>('stats', StatsSchema)
