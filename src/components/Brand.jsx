import { Link } from "react-router-dom";

export function Brand({ light = false }) {
  return (
    <Link className={`brand ${light ? "brand-light" : ""}`} to="/" aria-label="Nitakuchapa home">
      <span className="brand-mark">N<span>!</span></span>
      <span className="brand-word">nitakuchapa<span className="brand-period">.</span></span>
    </Link>
  );
}

export function Arrow({ diagonal = false }) {
  return <span aria-hidden="true">{diagonal ? "↗" : "→"}</span>;
}

export function Avatar({ name = "Player", small = false }) {
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return <span className={`avatar ${small ? "avatar-small" : ""}`}>{initials}</span>;
}

export function PreviewNotice({ children = "Preview mode · using sample competition data" }) {
  return <div className="preview-notice"><span className="preview-dot" />{children}</div>;
}

export function AppHeader({ active = "Overview", onLogout, userName = "Player" }) {
  const items = [
    ["Overview", "/dashboard", "⌂"],
    ["Competitions", "/dashboard?tab=competitions", "▤"],
    ["My fixtures", "/dashboard?tab=fixtures", "◷"],
  ];
  return (
    <header className="app-header">
      <Brand />
      <nav className="app-nav" aria-label="Main navigation">
        {items.map(([label, href, icon]) => (
          <Link className={active === label ? "app-nav-active" : ""} key={label} to={href}>
            <span className="nav-icon">{icon}</span>{label}
          </Link>
        ))}
      </nav>
      <div className="header-account">
        <button className="profile-button" onClick={() => document.getElementById("profile-card")?.scrollIntoView({ behavior: "smooth" })}>
          <Avatar name={userName} small />
          <span>{userName.split(" ")[0]}</span>
          <span className="chevron">⌄</span>
        </button>
        {onLogout && <button className="logout-button" onClick={onLogout} aria-label="Log out">↗</button>}
      </div>
    </header>
  );
}
