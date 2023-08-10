import { type Strago } from '../interfaces/Strago'

import { createLogger, format, transports } from 'winston'
import type TransportStream from 'winston-transport'
import LokiTransport from 'winston-loki'

export const initLogger = async (strago: Strago): Promise<void> => {
  if (strago.logger != null) return

  const winstonTransports: TransportStream[] = [
    new transports.Console()
  ]

  if (strago.config.loggerUri !== undefined) {
    winstonTransports.push(new LokiTransport({
      host: strago.config.loggerUri,
      labels: { app: 'Strago' },
      format: format.json(),
      onConnectionError: (err) => { console.error(err) }
    }))
  };

  strago.logger = createLogger({
    transports: winstonTransports,
    format: format.combine(format.errors({ stack: true }), format.json())
  })
}
