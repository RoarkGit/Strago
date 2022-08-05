import { Strago } from "../interfaces/Strago";

import { createLogger, format, transports } from "winston";
import TransportStream from "winston-transport";
import LokiTransport from "winston-loki";

const logFormat = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    format.printf((log) => {
        return `${log.timestamp} [${log.level}]: ${log.message}`;
    })
);

export const initLogger = async (strago: Strago): Promise<void> => {
    if (strago.logger) return;

    const winstonTransports: TransportStream[] = [
        new transports.Console({
            format: format.combine(logFormat, format.colorize())
        })
    ];

    if (strago.config.loggerUri) {
        winstonTransports.push(new LokiTransport({
            host: strago.config.loggerUri,
            labels: { app: "Strago" },
            format: format.json(),
            onConnectionError: (err) => console.error(err),
        }));
    };

    strago.logger = createLogger({
        transports: winstonTransports
    });
};