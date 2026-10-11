/** Kształt danych użytkownika zwracanych przez /api/auth/me (odpowiada UserOut w backendzie). */
export type AuthUser = {
  id: number;
  name: string;
  last_name: string;
  email: string;
  created_at: string;
};

/** Nazwa ciasteczka sesji — musi być zgodna z SESSION_COOKIE_NAME w backendzie. */
export const SESSION_COOKIE = "mzm_session";
