export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
    this.name = "ValidationError";
  }
}

export class UpstreamError extends AppError {
  constructor(message: string) {
    super(502, `Upstream error: ${message}`);
    this.name = "UpstreamError";
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super(429, "Rate limit: 3 free previews per hour per feed");
    this.name = "RateLimitError";
  }
}