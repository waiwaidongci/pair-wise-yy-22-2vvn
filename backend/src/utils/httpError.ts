export class HttpError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const httpError = (status: number, code: string, message: string, details?: unknown): HttpError =>
  new HttpError(status, code, message, details);
