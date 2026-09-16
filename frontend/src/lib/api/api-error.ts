export type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
    requestId?: string;
  };
};

export class ApiError extends Error {
  readonly status: number | null;
  readonly code: string;
  readonly requestId?: string;

  constructor({
    message,
    status = null,
    code = "REQUEST_FAILED",
    requestId,
  }: {
    message: string;
    status?: number | null;
    code?: string;
    requestId?: string;
  }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
