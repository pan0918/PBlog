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

let _secret: Uint8Array | null = null;

export function getJwtSecret(): Uint8Array {
  if (_secret) return _secret;
  _secret = new TextEncoder().encode(normalizeJwtSecret(process.env.JWT_SECRET));
  return _secret;
}
