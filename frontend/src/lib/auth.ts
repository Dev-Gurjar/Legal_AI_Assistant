/** Auth helpers — store/retrieve JWT + user from cookies. */

import Cookies from "js-cookie";
import type { User } from "./api";

const TOKEN_KEY = "token";
const USER_KEY = "user";

let memoryToken: string | undefined;
let memoryUser: User | null = null;

export function setAuth(token: string, user: User) {
  memoryToken = token;
  memoryUser = user;

  try {
    Cookies.set(TOKEN_KEY, token, { expires: 1 }); // 1 day
    Cookies.set(USER_KEY, JSON.stringify(user), { expires: 1 });
  } catch {
    // Cookie access may be blocked in some embedded/restricted browser contexts.
  }
}

export function getToken(): string | undefined {
  if (memoryToken) return memoryToken;
  try {
    return Cookies.get(TOKEN_KEY);
  } catch {
    return undefined;
  }
}

export function getUser(): User | null {
  if (memoryUser) return memoryUser;

  try {
    const raw = Cookies.get(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

export function clearAuth() {
  memoryToken = undefined;
  memoryUser = null;
  try {
    Cookies.remove(TOKEN_KEY);
    Cookies.remove(USER_KEY);
  } catch {
    // Ignore blocked cookie context.
  }
}

export function isLoggedIn(): boolean {
  return !!getToken();
}
