import pino from 'pino';

export const discordLogger = pino({ name: 'discord', level: process.env.LOG_LEVEL || 'info' });
export const slackLogger = pino({ name: 'slack', level: process.env.LOG_LEVEL || 'info' });
