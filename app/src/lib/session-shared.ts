// Konstanta session yang dipakai lintas runtime (edge proxy + Node API routes).
// Dipisah dari auth.ts supaya proxy.ts (edge) tidak menarik dependensi Node (bcrypt, next/headers).

export const SESSION_COOKIE = "webuild_session";
