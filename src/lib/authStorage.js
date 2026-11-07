function readSessionValue(key) {
  const sessionValue = sessionStorage.getItem(key);
  if (sessionValue) return sessionValue;

  const legacyValue = localStorage.getItem(key);
  if (legacyValue) {
    sessionStorage.setItem(key, legacyValue);
    localStorage.removeItem(key);
  }
  return legacyValue;
}

export function getAuthToken() {
  return readSessionValue("nitakuchapa_token");
}

export function getAuthUser() {
  const value = readSessionValue("nitakuchapa_user");
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    sessionStorage.removeItem("nitakuchapa_user");
    return null;
  }
}

export function setAuthSession(token, user) {
  sessionStorage.setItem("nitakuchapa_token", token);
  sessionStorage.setItem("nitakuchapa_user", JSON.stringify(user));
  localStorage.removeItem("nitakuchapa_token");
  localStorage.removeItem("nitakuchapa_user");
}

export function clearAuthSession() {
  sessionStorage.removeItem("nitakuchapa_token");
  sessionStorage.removeItem("nitakuchapa_user");
  localStorage.removeItem("nitakuchapa_token");
  localStorage.removeItem("nitakuchapa_user");
}
