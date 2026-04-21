/**
 * Escapes special regex metacharacters in a user-supplied string,
 * preventing ReDoS attacks and unintended pattern matching.
 */
export const escapeRegex = (str: string): string =>
  str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
