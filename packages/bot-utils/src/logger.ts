import pino, { type SerializedError } from 'pino';

export const loggerInit = (name: string, logLevel?: string) => pino({ name, level: logLevel ?? 'info' }, pino.destination({ sync: true }));

export type { Logger } from 'pino';

type ErrorParse = (err: Error) => SerializedError;
export const errorParse: ErrorParse = (err: Error) => pino.stdSerializers.err(err);
