export class NotFoundError extends Error {}
export class InternalServerError extends Error {}

// Database Errors:
export class DatabaseError extends Error {}
export class InvalidRowError extends DatabaseError {}
