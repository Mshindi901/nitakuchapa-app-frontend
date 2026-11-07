const STORAGE_KEY = "nitakuchapa_participant_ids";

export function saveGuestCompetition(competition) {
  const key = competition.id || competition.shareId;
  const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  if (!existing.includes(key)) existing.push(key);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  localStorage.setItem(`nitakuchapa_guest_${key}`, JSON.stringify(competition));
}
