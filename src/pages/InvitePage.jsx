import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Arrow, Brand } from "../components/Brand";
import { api, getErrorMessage } from "../lib/api";
import { saveGuestCompetition } from "../lib/participantStorage";

export default function InvitePage() {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const [competition, setCompetition] = useState(null);
  const [lookingUp, setLookingUp] = useState(true);
  const [form, setForm] = useState({ player_name: "", team_name: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    api.get(`/api/competition/invite/${encodeURIComponent(shareId)}`)
      .then((response) => {
        if (!response.data?.success) throw new Error(response.data?.message || "This invite is unavailable.");
        if (active) setCompetition(response.data.data);
      })
      .catch((requestError) => {
        if (active) setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (active) setLookingUp(false);
      });
    return () => { active = false; };
  }, [shareId]);

  async function joinAsGuest(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    if (!competition) {
      setLoading(false);
      setError("This competition invite could not be verified.");
      return;
    }
    const token = localStorage.getItem("nitakuchapa_token");
    try {
      const response = await api.post(`/api/participant/${encodeURIComponent(shareId)}`, form);
      if (!response.data?.success) throw new Error(response.data?.message || "Could not join this competition.");
      if (!token) {
        const guest = { ...competition, ...form, id: competition.id, shareId, joinedAt: new Date().toISOString() };
        saveGuestCompetition(guest);
      }
      setNotice(token
        ? "You’re in. Welcome to the competition."
        : "You’re in. Your guest entry is saved on this device; create an account to sync it.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally { setLoading(false); }
  }

  return <main className="invite-page">
    <header className="site-header"><Brand /><Link to="/" className="text-link">Back to home <Arrow /></Link></header>
    <section className="invite-layout">
      <div className="invite-story"><div className="eyebrow"><span className="eyebrow-line" /> YOU’VE BEEN CALLED OUT</div><h1>Looks like<br />someone thinks<br /><em>they can beat you.</em></h1><p>There’s only one way to find out. Claim your spot, bring your team, and settle it on the pitch.</p><div className="invite-card"><span className="invite-card-icon">✳</span><div><span className="panel-kicker">YOUR INVITATION</span><strong>{competition?.name || (lookingUp ? "Finding your competition..." : "Competition unavailable")}</strong><small>{competition?.type || "COMPETITION"} · {competition?.status || "ACTIVE"}</small></div><span className="invite-card-arrow">↗</span></div><div className="invite-account-note">BETTER WITH AN ACCOUNT <p>Your fixtures and standings follow you between devices. It’s free, and takes about a minute.</p><Link to={`/signup?invite=${encodeURIComponent(shareId)}`}>Create an account <Arrow /></Link></div></div>
      <div className="invite-form-card"><span className="panel-kicker">CLAIM YOUR PLACE</span><h2>Bring your game.</h2><p>No account? No problem. Jump in as a guest.</p><form className="auth-form" onSubmit={joinAsGuest}><label>YOUR PLAYER NAME<input required maxLength="50" value={form.player_name} onChange={(e) => setForm({ ...form, player_name: e.target.value })} placeholder="What your rivals call you" /></label><label>YOUR PES TEAM<input required maxLength="50" value={form.team_name} onChange={(e) => setForm({ ...form, team_name: e.target.value })} placeholder="The team you’re backing" /></label>{error && <div className="form-message form-error" role="alert">{error}</div>}{notice && <div className="form-message form-success" role="status">{notice}</div>}<button disabled={loading || lookingUp || !competition} className="button button-brown auth-submit">{loading ? "Saving your spot..." : "Join as a guest"} <Arrow /></button></form>
        {notice && <button className="invite-next" onClick={() => navigate("/participant")}>See my competitions <Arrow /></button>}
        <div className="invite-or"><span /> OR MAKE IT YOURS <span /></div><Link className="button button-outline invite-signup" to={`/signup?invite=${encodeURIComponent(shareId)}`}>Create a free account <Arrow diagonal /></Link><p className="invite-privacy">Your details are only used to manage this competition.</p>
      </div>
    </section>
  </main>;
}
