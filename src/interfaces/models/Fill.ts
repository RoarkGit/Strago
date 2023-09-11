import { Schema, model } from 'mongoose'

export interface IFill {
  discordId: string
  arrExtremes: boolean
  hwExtremes: boolean
  sbExtremes: boolean
  shbExtremes: boolean
  morbolRaids: boolean
  omegaRaids: boolean
  edenRaids: boolean
  tankRole: boolean
  healerRole: boolean
  dpsRole: boolean
  enabled: boolean
}

const FillSchema = new Schema<IFill>({
  discordId: { type: String, required: true },
  arrExtremes: { type: Boolean, required: true, default: false },
  hwExtremes: { type: Boolean, required: true, default: false },
  sbExtremes: { type: Boolean, required: true, default: false },
  shbExtremes: { type: Boolean, required: true, default: false },
  morbolRaids: { type: Boolean, required: true, default: false },
  omegaRaids: { type: Boolean, required: true, default: false },
  edenRaids: { type: Boolean, required: true, default: false },
  tankRole: { type: Boolean, required: true, default: false },
  healerRole: { type: Boolean, required: true, default: false },
  dpsRole: { type: Boolean, required: true, default: false },
  enabled: { type: Boolean, required: true, default: false },
})

export default model<IFill>('fills', FillSchema)
