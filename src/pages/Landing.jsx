import { Link } from "react-router-dom";
import { Arrow, Brand } from "../components/Brand";

const scoreLines = [
  ["MWA", "KIM", "2 — 1", "FULL TIME"],
  ["OTI", "NJE", "0 — 0", "HALF TIME"],
  ["ALI", "WAN", "3 — 2", "FULL TIME"],
];

function MatchTicker() {
  return (
    <div className="ticker-wrap" aria-label="Live match results">
      <div className="ticker-track">
        {[...scoreLines, ...scoreLines].map(([a, b, score, status], i) => (
          <div className="ticker-match" key={`${a}-${i}`}>
            <span className="ticker-live"><i />{status}</span>
            <span>{a}</span><b>{score}</b><span>{b}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeroPitch() {
  return (
    <div className="hero-art" aria-label="Illustrated football pitch with a live league table">
      <div className="art-glow" />
      <div className="pitch">
        <div className="pitch-line pitch-half" />
        <div className="pitch-center" />
        <div className="pitch-box pitch-box-left" />
        <div className="pitch-box pitch-box-right" />
        <span className="pitch-player player-one">⚽</span>
        <span className="pitch-player player-two">✦</span>
        <span className="pitch-player player-three">✦</span>
        <span className="pitch-player player-four">✦</span>
        <span className="pitch-player player-five">✦</span>
        <span className="pitch-player player-six">✦</span>
      </div>
      <div className="floating-live"><span className="live-pulse" /> MATCHDAY 04 <span>LIVE</span></div>
      <div className="floating-score">
        <div className="score-top"><span>FRIDAY NIGHT KINGS</span><span className="score-dot" /></div>
        <div className="score-teams"><b><span className="team-crest crest-red">A</span> ARSENAL</b><strong>2 <i>:</i> 1</strong><b><span className="team-crest crest-blue">B</span> BARÇA</b></div>
        <div className="score-bottom"><span>84′</span><span>NAIROBI, KENYA</span></div>
      </div>
      <div className="floating-table">
        <div className="table-card-title">THE TABLE <span>↗</span></div>
        {[["01", "Barcelona", "10"], ["02", "Arsenal", "9"], ["03", "Real Madrid", "7"]].map(([pos, team, pts]) => (
          <div className="table-mini-row" key={team}><span>{pos}</span><b>{team}</b><strong>{pts}<small> PTS</small></strong></div>
        ))}
      </div>
      <div className="orbit-note">SCORE SETTLED.<br />BRAGGING RIGHTS<br /><em>SECURED.</em></div>
    </div>
  );
}

export default function Landing() {
  return (
    <main className="landing-page">
      <header className="site-header">
        <Brand />
        <nav className="site-nav"><a href="#how-it-works">How it works</a><a href="#about">The story</a></nav>
        <div className="site-actions"><Link className="text-link" to="/signin">Log in</Link><Link className="button button-dark button-nav" to="/signup">Get started <Arrow diagonal /></Link></div>
      </header>
      <section className="hero-section">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> BUILT FOR THE BEAUTIFUL GAME</div>
          <h1 className="banner-title">Your squad.<br />Your rules.<br /><span>Your bragging rights.</span></h1>
          <p>Every match deserves a proper table. Bring your PES Mobile crew together, run the competition, and let the results do the talking.</p>
          <div className="hero-actions"><Link className="button button-brown" to="/signup">Start your competition <Arrow /></Link><Link className="button button-outline" to="/coming-soon">See how it works <span className="play-icon">▶</span></Link></div>
          <div className="hero-proof"><div className="proof-avatars"><span>BK</span><span>AO</span><span>JM</span><span>+</span></div><span>Made for the ones who <b>never skip a rematch.</b></span></div>
        </div>
        <HeroPitch />
        <div className="hero-index">01 <span>/</span> THE MATCH IS YOURS</div>
      </section>
      <MatchTicker />
      <section className="matchday-gallery" aria-label="The PES Mobile matchday">
        <div className="gallery-heading">
          <div><span className="section-kicker">BUILT AROUND YOUR GAME <span>✳</span></span><h2>Every rivalry has<br /><em>a story.</em></h2></div>
          <p>From the first “uko ready?” to the final score, Nitakuchapa brings your crew together around the game.</p>
        </div>
        <div className="gallery-grid">
          <figure className="gallery-card gallery-card-phone"><img src="/Image_2.jpg" alt="Player focused on a football game on their phone" loading="lazy" /><figcaption><span>01 / THE GRIND</span><strong>Every match starts somewhere.</strong></figcaption></figure>
          <figure className="gallery-card gallery-card-controller"><img src="/image_1.jpg" alt="Game controller ready for a PES Mobile rivalry" loading="lazy" /><figcaption><span>02 / THE RIVALRY</span><strong>Bring your game face.</strong></figcaption></figure>
          <figure className="gallery-card gallery-card-ball"><img src="/image_3.jpg" alt="Football boot resting on a football" loading="lazy" /><figcaption><span>03 / THE BEAUTIFUL GAME</span><strong>Settle it on the pitch.</strong></figcaption></figure>
        </div>
      </section>
      <section className="steps-section" id="how-it-works">
        <div className="section-kicker">LESS ADMIN. MORE ACTION. <span>✳</span></div>
        <div className="steps-heading"><h2>From “uko ready?”<br />to <em>full-time.</em></h2><p>All the competition. None of the spreadsheet stress. Here’s how your next rivalry gets official.</p></div>
        <div className="steps-grid">
          {[["01", "Set the stage", "Create a league or tournament, pick your match schedule, and make it yours.", "↗"], ["02", "Send the invite", "Drop your competition link in the group chat. Your people bring their teams.", "↗"], ["03", "Let it play out", "Fixtures appear automatically. Log scores. Watch the table come alive.", "↗"]].map(([num, title, copy, icon]) => (
            <article className="step-card" key={num}><span className="step-number">{num}</span><span className="step-icon">{icon}</span><h3>{title}</h3><p>{copy}</p><div className="step-rule" /></article>
          ))}
        </div>
      </section>
      <section className="about-section" id="about">
        <div className="about-stamp">NAIROBI<br /><span>KE</span><br />EST. GAME DAY</div>
        <div className="about-copy"><div className="eyebrow eyebrow-light"><span className="eyebrow-line" /> A LITTLE FRIENDLY PRESSURE</div><h2>“Nitakuchapa.”<br /><em>Now make it official.</em></h2><p>It’s the line that starts a thousand PES Mobile rivalries. A little swagger between friends. A promise that gets settled one match at a time.</p><p>Nitakuchapa gives your crew a home for all of it: the fixtures, the scores, the table, and the receipts. Built for Kenyan players. Made for whoever takes the game personally.</p><Link className="about-link" to="/signup">Bring your crew together <Arrow /></Link></div>
        <div className="about-stat"><strong>90′</strong><span>to settle the score.<br />A lifetime to talk about it.</span><div className="stat-decoration">N!</div></div>
      </section>
      <section className="cta-section"><span className="cta-spark">✳</span><p>THE GROUP CHAT IS WAITING</p><h2>Talk is cheap.<br /><em>Let’s play.</em></h2><Link className="button button-cream" to="/signup">Create your first competition <Arrow diagonal /></Link></section>
      <footer className="site-footer">
        <div className="footer-main"><div><Brand light /><p>Good games. Good people.<br />Absolutely no excuses.</p></div><div className="footer-links"><div><b>THE GAME</b><a href="#how-it-works">How it works</a><Link to="/coming-soon">Coming soon</Link><Link to="/signup">Create a competition</Link></div><div><b>YOUR ACCOUNT</b><Link to="/signin">Log in</Link><Link to="/signup">Sign up</Link><Link to="/participant">My competitions</Link></div><div><b>THE FINE PRINT</b><a href="mailto:hello@nitakuchapa.app">Get in touch</a><a href="mailto:hello@nitakuchapa.app?subject=Privacy">Privacy</a><a href="mailto:hello@nitakuchapa.app?subject=Terms">Terms</a></div></div></div>
        <div className="footer-bottom"><span>© 2026 NITAKUCHAPA. MADE WITH HEART IN KENYA.</span><span>NO GLORY WITHOUT A GOOD GAME. <b>✳</b></span></div>
      </footer>
    </main>
  );
}
