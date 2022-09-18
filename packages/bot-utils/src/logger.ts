import type { SerializedError } from 'pino';
import pino from 'pino';

export const loggerInit = (name: string, logLevel?: string) => pino({ name, level: logLevel ?? 'info' }, pino.destination({ sync: true }));

type ErrorParse = (err: Error) => SerializedError;
export const errorParse: ErrorParse = (err: Error) => pino.stdSerializers.err(err);
