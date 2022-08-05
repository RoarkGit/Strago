import { Strago } from "../interfaces/Strago";

import { createLogger, format, transports } from "winston";
import TransportStream from "winston-transport";
import LokiTransport from "winston-loki";

export const initLogger = async (strago: Strago): Promise<void> => {
    if (strago.logger) return;

    const winstonTransports: TransportStream[] = [
        new transports.Console({
            format: format.combine(format.timestamp(), format.simple(), format.colorize())
        })
    ];

    if (strago.config.loggerUri) {
        winstonTransports.push(new LokiTransport({
            host: strago.config.loggerUri,
            labels: { app: "Strago" },
            json: true,
            format: format.json(),
            onConnectionError: (err) => console.error(err),
        }));
    };

    strago.logger = createLogger({
        transports: winstonTransports
    });
};