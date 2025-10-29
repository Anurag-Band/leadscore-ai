import type { Context } from 'hono';

// Common HTTP error status codes we'll use
export type HTTPErrorStatus = 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500 | 503;

export class APIError extends Error {
  constructor(
    public code: string,
    public message: string,
    public status: HTTPErrorStatus = 400,
    public details?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export const errorHandler = (err: Error, c: Context) => {
  console.error('Error:', err);

  if (err instanceof APIError) {
    return c.json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      timestamp: new Date().toISOString(),
    }, err.status);
  }

  return c.json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
    timestamp: new Date().toISOString(),
  }, 500);
};
