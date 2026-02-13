
import { z } from 'zod';
import { insertPlayerSchema, insertMatchSchema, players, matches, gameSessions, insertGameSessionSchema } from './schema';

export { insertPlayerSchema, insertMatchSchema, insertGameSessionSchema };

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  sessions: {
    create: {
      method: 'POST' as const,
      path: '/api/sessions' as const,
      input: insertGameSessionSchema,
      responses: {
        201: z.custom<typeof gameSessions.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/sessions/:code' as const,
      responses: {
        200: z.custom<typeof gameSessions.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/sessions/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  players: {
    list: {
      method: 'GET' as const,
      path: '/api/sessions/:sessionId/players' as const,
      responses: {
        200: z.array(z.custom<typeof players.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/sessions/:sessionId/players' as const,
      input: insertPlayerSchema,
      responses: {
        201: z.custom<typeof players.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/players/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  matches: {
    list: {
      method: 'GET' as const,
      path: '/api/sessions/:sessionId/matches' as const,
      responses: {
        200: z.array(z.custom<typeof matches.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/sessions/:sessionId/matches' as const,
      input: insertMatchSchema,
      responses: {
        201: z.custom<typeof matches.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
