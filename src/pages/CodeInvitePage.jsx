import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Arrow, Brand } from "../components/Brand";
import { api, getErrorMessage } from "../lib/api";
import { getAuthToken, getAuthUser } from "../lib/authStorage";

export default function CodeInvitePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user] = useState(getAuthUser);
  const [form, setForm] = useState(() => ({
    code: searchParams.get("code") || "",
    player_name: user?.username || user?.name || "",
    team_name: "",
  }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function joinWithCode(event) {
    event.preventDefault();
    setError("");

    if (!getAuthToken()) {
      navigate(`/signin?joinCode=${encodeURIComponent(form.code.trim())}`);
      return;
    }

    setLoading(true);
    try {
      const lookup = await api.post("/api/competitions/invite/code", { code: form.code.trim() });
      if (!lookup.data?.success || !lookup.data.data?.share_code) {
        throw new Error(lookup.data?.message || "Could not find that competition.");
      }

      const competition = lookup.data.data;
      const joined = await api.post(`/api/participant/${encodeURIComponent(competition.share_code)}`, {
        player_name: form.player_name.trim(),
        team_name: form.team_name.trim(),
      });
      if (!joined.data?.success) {
        throw new Error(joined.data?.message || "Could not join this competition.");
      }

      toast.success(`You joined ${competition.name}.`);
      navigate("/dashboard?tab=competitions");
    } catch (requestError) {
      const message = getErrorMessage(requestError);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return <main className="invite-page">
    <header className="site-header"><Brand /><Link to="/" className="text-link">Back to home <Arrow /></Link></header>
    <section className="invite-layout">
      <div className="invite-story">
        <div className="eyebrow"><span className="eyebrow-line" /> YOUR CREW IS WAITING</div>
        <h1 className="banner-title">Got the code?<br /><em>Get in the game.</em></h1>
        <p>Enter the six-digit code from your competition owner and claim your place in the squad.</p>
        <div className="invite-card"><span className="invite-card-icon">✳</span><div><span className="panel-kicker">QUICK JOIN</span><strong>One code. One competition.</strong><small>Enter the code and your team details to join.</small></div><span className="invite-card-arrow">↗</span></div>
      </div>
      <div className="invite-form-card">
        {user
          ? <div className="invite-account-active"><span className="invite-account-avatar">{(user.username || user.name || "P").slice(0, 1).toUpperCase()}</span><div><span className="panel-kicker">YOUR ACCOUNT IS READY</span><strong>Playing as {user.username || user.name}</strong></div><span className="invite-account-check">✓</span></div>
          : <Link className="invite-account-cta" to={`/signin${form.code ? `?joinCode=${encodeURIComponent(form.code)}` : ""}`}><span className="invite-cta-icon">↗</span><span><b>Sign in to join</b><small>Your competitions stay synced to your account</small></span><Arrow diagonal /></Link>}
        <span className="panel-kicker">JOIN A COMPETITION</span>
        <h2>Bring your game.</h2>
        <p>Enter the code and your PES team details. You’ll be added straight to the competition.</p>
        <form className="auth-form" onSubmit={joinWithCode}>
          <label>COMPETITION CODE<input required inputMode="numeric" pattern="[0-9]{6}" maxLength="6" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.replace(/\D/g, "") })} placeholder="Six-digit code" /></label>
          <label>YOUR PLAYER NAME<input required maxLength="50" value={form.player_name} onChange={(event) => setForm({ ...form, player_name: event.target.value })} placeholder="What your rivals call you" /></label>
          <label>YOUR PES TEAM<input required maxLength="50" value={form.team_name} onChange={(event) => setForm({ ...form, team_name: event.target.value })} placeholder="The team you’re backing" /></label>
          {error && <div className="form-message form-error" role="alert">{error}</div>}
          <button disabled={loading} className="button button-brown auth-submit">{loading ? "Joining competition..." : user ? "Join competition" : "Sign in to join"} <Arrow /></button>
        </form>
        <p className="invite-privacy">Your details are only used to manage this competition.</p>
      </div>
    </section>
  </main>;
}
