import { VALID_CATEGORIES } from "./types.js";
import { ValidationError } from "./errors.js";

export function assertEthAddress(value: string, field = "address"): void {
  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
    throw new ValidationError(`${field} must be a valid Ethereum address (0x + 40 hex chars)`);
  }
}

export function assertHttpUrl(value: string, field = "upstreamUrl"): void {
  if (!value.startsWith("http://") && !value.startsWith("https://")) {
    throw new ValidationError(`${field} must start with http:// or https://`);
  }
}

export function assertCategory(value: string): void {
  if (!VALID_CATEGORIES.includes(value as never)) {
    throw new ValidationError(
      `category must be one of: ${VALID_CATEGORIES.join(", ")}`,
    );
  }
}

export function assertMethod(value: string): void {
  if (value !== "GET" && value !== "POST") {
    throw new ValidationError('method must be "GET" or "POST"');
  }
}

export function assertPrice(value: string): void {
  const match = value.match(/\d*\.?\d+/);
  const num = match ? parseFloat(match[0]) : NaN;
  if (isNaN(num) || num <= 0) {
    throw new ValidationError(
      'price must be a positive dollar amount — use "0.01" (no $ sign on Windows)',
    );
  }
}

export function normalisePrice(value: string): string {
  const match = value.match(/\d*\.?\d+/);
  if (!match) return value;
  const num = parseFloat(match[0]);
  return `$${num.toFixed(2)}`;
}

export function assertRequired(
  body: Record<string, unknown>,
  fields: string[],
): void {
  for (const field of fields) {
    if (body[field] === undefined || body[field] === null || body[field] === "") {
      throw new ValidationError(`Missing required field: ${field}`);
    }
  }
}