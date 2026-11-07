import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppHeader, Arrow, Avatar, PreviewNotice } from "../components/Brand";
import { api, getErrorMessage } from "../lib/api";
import { getAuthToken } from "../lib/authStorage";

const STORAGE_KEY = "nitakuchapa_participant_ids";

export default function ParticipantDashboard() {
  const [ids, setIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
  });
  const [competitions, setCompetitions] = useState(() => ids.map((id) => {
    try { return JSON.parse(localStorage.getItem(`nitakuchapa_guest_${id}`) || "null"); } catch { return null; }
  }).filter(Boolean));
  const [error, setError] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }, [ids]);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    api.get("/api/competitions/user").then((response) => {
      const entries = Array.isArray(response.data?.data) ? response.data.data : [];
      setCompetitions((current) => [...entries, ...current]);
    }).catch((requestError) => setError(getErrorMessage(requestError)));
  }, []);

  function remove(id) {
    const next = ids.filter((entry) => entry !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    localStorage.removeItem(`nitakuchapa_guest_${id}`);
    setIds(next);
  }

  return <main className="dashboard-page participant-page">
    <AppHeader active="Competitions" userName="Guest player" />
    <div className="dashboard-shell"><PreviewNotice>GUEST PLAYER · competitions saved on this device</PreviewNotice>
      <div className="dashboard-greeting"><div><div className="eyebrow"><span className="eyebrow-line" /> YOUR MATCHDAY PASS</div><h1>Your competitions.<br /><em>Just the games.</em></h1><p>All the competitions you’ve joined, right here.</p></div><Link className="button button-outline" to="/signin">Create an account <Arrow /></Link></div>
      {error && <div className="dashboard-alert alert-error" role="alert">{error}</div>}
      <section className="guest-benefit"><Avatar name="Guest Player" /><div><b>Want fixtures, tables & score updates?</b><p>Create a free player account to sync all your competitions across devices.</p></div><Link to="/signup" className="guest-benefit-link">Join the squad <Arrow /></Link></section>
      <section className="guest-competitions"><div className="panel-heading"><div><span className="panel-kicker">YOUR LINE-UP</span><h2>{competitions.length} competitions</h2></div><Link className="button button-brown" to="/">Find a competition <Arrow /></Link></div>
        {competitions.length ? <div className="competition-list">{competitions.map((item, index) => <article className="competition-card guest-card" key={item.id || item.shareId || index}><div className="competition-icon">{item.type === "tournament" ? "✳" : "▤"}</div><div className="competition-copy"><span className="competition-type">{item.type || "COMPETITION"} · GUEST ENTRY</span><strong>{item.name || "Competition"}</strong><span>{item.player_name} · {item.team_name}</span></div><button className="remove-guest" onClick={() => remove(item.id || item.shareId)} aria-label={`Remove ${item.name}`}>×</button></article>)}</div> : <div className="empty-state"><span>✳</span><h3>No competitions yet.</h3><p>Open an invite link to join a crew. Your entries stay saved on this device.</p><Link className="button button-brown" to="/">Back to home <Arrow /></Link></div>}
      </section>
      <div className="guest-note">Guest entries are stored in this browser only. <Link to="/signup">Create an account</Link> to keep your place wherever you play.</div>
    </div>
  </main>;
}
