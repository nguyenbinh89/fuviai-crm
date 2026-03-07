// Auth helper functions

export function getTokenExpiry(token: string): Date | null {
  try {
    // JWT payload là phần giữa, base64 encoded
    const base64Payload = token.split('.')[1];
    const payload = JSON.parse(atob(base64Payload));
    return payload.exp ? new Date(payload.exp * 1000) : null;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const expiry = getTokenExpiry(token);
  if (!expiry) return true;
  // Coi là expired sớm hơn 30s để tránh race condition
  return expiry.getTime() < Date.now() + 30_000;
}
