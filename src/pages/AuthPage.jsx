import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { api, getErrorMessage } from "../lib/api";
import { setAuthSession } from "../lib/authStorage";
import { Arrow, Brand } from "../components/Brand";

export default function AuthPage({ mode }) {
  const isSignup = mode === "signup";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteId = searchParams.get("invite");
  const joinCode = searchParams.get("joinCode");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (sessionStorage.getItem("nitakuchapa_session_expired") !== "true") return;
    sessionStorage.removeItem("nitakuchapa_session_expired");
    toast.error("Your session expired. Please sign in again.");
  }, []);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const response = await api.post(isSignup ? "/api/auth/signup" : "/api/auth/signin", isSignup
        ? { name: form.name, email: form.email, password: form.password }
        : { email: form.email, password: form.password });
      if (!response.data?.success) throw new Error(response.data?.message || "The server could not complete this request.");
      if (isSignup) {
        setNotice("Account created. You can now sign in.");
        toast.success("Account created. You can now sign in.");
        if (inviteId || joinCode) {
          const nextParams = new URLSearchParams();
          if (inviteId) nextParams.set("invite", inviteId);
          if (joinCode) nextParams.set("joinCode", joinCode);
          navigate(`/signin?${nextParams.toString()}`);
        }
      } else {
        if (!response.data?.token) {
          setError("Sign in succeeded, but the server did not return an authentication token.");
          return;
        }
        setAuthSession(response.data.token, response.data.data);
        navigate(inviteId
          ? `/invite/${encodeURIComponent(inviteId)}`
          : joinCode
            ? `/competitions/invite/code?code=${encodeURIComponent(joinCode)}`
          : response.data.data?.role === "admin" ? "/admin" : "/dashboard");
      }
    } catch (requestError) {
      const message = getErrorMessage(requestError);
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <aside className="auth-story"><div className="auth-home"><Brand light /></div><div className="auth-story-content"><div className="eyebrow eyebrow-light"><span className="eyebrow-line" /> THE GAME IS BETTER TOGETHER</div><h1>Every great<br />rivalry needs<br /><em>a record.</em></h1><p>From the first “uko ready?” to the last-minute winner. Keep the fixtures, the table, and every bit of bragging right in one place.</p><div className="auth-quote"><span>“</span><blockquote>Hakuna pressure. Just me, three points, and the group chat.</blockquote><small>— THE ENERGY, ALWAYS</small></div><div className="auth-story-footer">✳ &nbsp; MADE FOR PES MOBILE FANS, EVERYWHERE.</div></div><span className="auth-watermark">N!</span></aside>
      <section className="auth-form-side"><Link className="auth-back" to="/">← Back to home</Link><div className="auth-form-wrap"><span className="auth-kicker">{isSignup ? "YOUR NEXT MATCH STARTS HERE" : "GOOD TO HAVE YOU BACK"}</span><h2>{isSignup ? "Join the squad." : "Welcome back."}</h2><p className="auth-description">{isSignup ? "Make an account and get your crew’s competition underway." : "Your fixtures aren’t going to check themselves."}</p>
        <form className="auth-form" onSubmit={submit}>
          {isSignup && <label>YOUR NAME<input required autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="What should we call you?" /></label>}
          <label>EMAIL ADDRESS<input required type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" /></label>
          <label>PASSWORD<input required minLength="6" type="password" autoComplete={isSignup ? "new-password" : "current-password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={isSignup ? "At least 6 characters" : "Your password"} /></label>
          {error && <div className="form-message form-error" role="alert">{error}</div>}
          {notice && <div className="form-message form-success" role="status">{notice}</div>}
          <button className="button button-brown auth-submit" disabled={busy}>{busy ? "One sec..." : isSignup ? "Create your account" : "Sign in"} <Arrow /></button>
        </form>
        <div className="auth-switch">{isSignup ? "Already got an account?" : "New to the squad?"} <Link to={`${isSignup ? "/signin" : "/signup"}${inviteId || joinCode ? `?${new URLSearchParams({ ...(inviteId ? { invite: inviteId } : {}), ...(joinCode ? { joinCode } : {}) }).toString()}` : ""}`}>{isSignup ? "Log in" : "Create an account"}</Link></div>
        <p className="auth-terms">By continuing, you agree to keep it competitive and keep it friendly.</p>
      </div></section>
    </main>
  );
}
