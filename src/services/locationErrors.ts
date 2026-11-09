const MISSING_LOCATION_SCHEMA_CODES = new Set(['PGRST202', 'PGRST204', 'PGRST205', '42P01', '42703', '42883']);

export class LocationSetupError extends Error {
  constructor(cause?: unknown) {
    super('Location sharing is not configured on this server yet. An administrator must apply the technician-location database migrations.', { cause });
    this.name = 'LocationSetupError';
  }
}

/** A missing RPC/table is a deployment problem, not a denied GPS permission. */
export function locationServiceError(cause: unknown, fallback: string): Error {
  const code = cause && typeof cause === 'object' && 'code' in cause ? String(cause.code) : '';
  return MISSING_LOCATION_SCHEMA_CODES.has(code) ? new LocationSetupError(cause) : new Error(fallback, { cause });
}
