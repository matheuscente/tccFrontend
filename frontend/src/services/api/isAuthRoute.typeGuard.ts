const AUTH_ROUTES = ["/auth/login", "/auth/logout", "/auth/refresh", "/auth/forgot-password", "/auth/reset-password"];

export function isAuthRoute(url?: string): boolean {
  return AUTH_ROUTES.some((route) => url?.includes(route));
}
