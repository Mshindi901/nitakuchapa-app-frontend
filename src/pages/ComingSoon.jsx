import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Arrow, Brand } from "../components/Brand";

function getTarget() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date()).reduce((result, part) => {
    result[part.type] = part.value;
    return result;
  }, {});
  return new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day) + 1, 3));
}

export default function ComingSoon() {
  const [target] = useState(getTarget);
  const [remaining, setRemaining] = useState(() => Math.max(0, target - Date.now()));
  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(Math.max(0, target - Date.now())), 1000);
    return () => window.clearInterval(timer);
  }, [target]);
  const seconds = Math.floor(remaining / 1000);
  const units = [["DAYS", Math.floor(seconds / 86400)], ["HRS", Math.floor((seconds % 86400) / 3600)], ["MIN", Math.floor((seconds % 3600) / 60)], ["SEC", seconds % 60]];
  return (
    <main className="coming-page">
      <header className="site-header"><Brand /><Link className="text-link" to="/">Back to home <Arrow /></Link></header>
      <section className="coming-hero">
        <div className="coming-intro"><div className="eyebrow"><span className="eyebrow-line" /> A NEW WAY TO SETTLE IT</div><h1>The next match<br />starts <em>here.</em></h1><p>Your PES Mobile rivalries are getting a home. Invite your crew, play your fixtures, own the table.</p><Link className="button button-dark" to="/signup">Get early access <Arrow /></Link></div>
        <div className="countdown-card"><div className="countdown-top"><span>THE FIRST WHISTLE</span><span className="countdown-live"><i /> COUNTING DOWN</span></div><p>DEMO DROPS IN</p><div className="countdown-numbers">{units.map(([label, value], i) => <div className="count-unit" key={label}><strong>{String(value).padStart(2, "0")}</strong><span>{label}</span>{i < units.length - 1 && <i>:</i>}</div>)}</div><div className="countdown-date"><span>✳</span> TOMORROW · 6:00 AM EAT <span>✳</span></div><div className="countdown-graphic">N!</div></div>
      </section>
      <section className="coming-steps" id="how-it-works"><div className="eyebrow"><span className="eyebrow-line" /> HOW IT WORKS</div><h2>Built for the group chat.<br /><em>Ready for matchday.</em></h2><div className="coming-step-grid">{[["01 / CREATE", "Pick your format", "Start a league for the long game or a tournament for one glorious run. Set your match cadence."], ["02 / INVITE", "Bring your starting XI", "Share one link with your PES crew. Players join with an account or just their name and team."], ["03 / PLAY", "Settle it on the pitch", "Fixtures and tables do the admin. You play, log your score, and let the standings talk."]].map(([tag, title, copy]) => <article key={tag}><span>{tag}</span><h3>{title}</h3><p>{copy}</p><div className="coming-step-symbol">✳</div></article>)}</div></section>
      <footer className="coming-footer"><Brand /><span>BUILT FOR PLAYERS WHO MEAN IT.</span><Link to="/">Back to the pitch ↗</Link></footer>
    </main>
  );
}
