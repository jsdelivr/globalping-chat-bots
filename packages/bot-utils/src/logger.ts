import type { SerializedError } from 'pino';
import pino from 'pino';


export const discordLogger = pino({ name: 'discord', level: process.env.LOG_LEVEL || 'info' });
export const slackLogger = pino({ name: 'slack', level: process.env.LOG_LEVEL || 'debug' }, pino.destination({ sync: true }));

type ErrorParse = (err: Error) => SerializedError;
export const errorParse: ErrorParse = (err: Error) => pino.stdSerializers.err(err);
