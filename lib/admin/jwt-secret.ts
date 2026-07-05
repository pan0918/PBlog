const MIN_JWT_SECRET_LENGTH = 32;

export function normalizeJwtSecret(value: string | undefined): string {
  if (!value) {
    throw new Error('Missing JWT_SECRET environment variable');
  }
  if (value.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters`);
  }
  return value;
}

export function getJwtSecret(): Uint8Array {
  return new TextEncoder().encode(normalizeJwtSecret(process.env.JWT_SECRET));
}
