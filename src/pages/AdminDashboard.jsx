import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppHeader, Arrow, Avatar, PreviewNotice } from "../components/Brand";
import { demoCompetitions, demoUsers } from "../data/demo";
import { api, getErrorMessage, getResponseData } from "../lib/api";

export default function AdminDashboard() {
  const [preview, setPreview] = useState(localStorage.getItem("nitakuchapa_admin_preview") === "true");
  const [users, setUsers] = useState(preview ? demoUsers : []);
  const [competitions, setCompetitions] = useState(preview ? demoCompetitions : []);
  const [tab, setTab] = useState("Overview");
  const [error, setError] = useState(() => localStorage.getItem("nitakuchapa_token")
    ? ""
    : "Sign in with an admin account to see live application data. Explore the sample admin dashboard below.");
  const [loading, setLoading] = useState(() => !preview && Boolean(localStorage.getItem("nitakuchapa_token")));

  useEffect(() => {
    if (preview) return;
    const token = localStorage.getItem("nitakuchapa_token");
    if (!token) return;
    let active = true;
    Promise.allSettled([api.get("/api/users"), api.get("/api/competitions")]).then(([usersResult, competitionsResult]) => {
      if (!active) return;
      if (usersResult.status === "fulfilled") setUsers(getResponseData(usersResult.value));
      else setError(getErrorMessage(usersResult.reason));
      if (competitionsResult.status === "fulfilled") setCompetitions(getResponseData(competitionsResult.value));
      else setError((current) => current || getErrorMessage(competitionsResult.reason));
      setLoading(false);
    });
    return () => { active = false; };
  }, [preview]);

  function enterDemo() {
    localStorage.setItem("nitakuchapa_admin_preview", "true");
    setPreview(true);
    setUsers(demoUsers);
    setCompetitions(demoCompetitions);
    setError("");
  }

  return <main className="dashboard-page admin-page"><AppHeader active="Overview" userName="Admin" /><div className="dashboard-shell">
    {preview && <PreviewNotice>ADMIN PREVIEW · sample application data</PreviewNotice>}
    {error && <div className="dashboard-alert alert-error" role="status">{error}{!preview && <button className="alert-action" onClick={enterDemo}>Preview sample data <Arrow /></button>}</div>}
    <div className="dashboard-greeting"><div><div className="eyebrow"><span className="eyebrow-line" /> THE WHOLE PICTURE</div><h1>Good morning,<br /><em>admin.</em></h1><p>A little overview of the games happening across Nitakuchapa.</p></div><span className="admin-badge">✳ APPLICATION ADMIN</span></div>
    <nav className="dashboard-tabs">{["Overview", "Users", "Competitions"].map((item) => <button key={item} onClick={() => setTab(item)} className={tab === item ? "dashboard-tab-active" : ""}>{item}<span>{item === "Users" ? users.length : item === "Competitions" ? competitions.length : ""}</span></button>)}</nav>
    {loading ? <div className="loading-state"><span className="loading-spinner" /> Loading application data...</div> : <>
      {tab === "Overview" && <><div className="admin-stats"><Stat label="TOTAL PLAYERS" number={users.length} icon="♙" /><Stat label="COMPETITIONS" number={competitions.length} icon="▤" /><Stat label="LEAGUES" number={competitions.filter((item) => item.type === "league").length} icon="↗" /><Stat label="TOURNAMENTS" number={competitions.filter((item) => item.type === "tournament").length} icon="✳" /></div><div className="admin-overview-grid"><AdminList title="Recently joined players" kicker="THE SQUAD" onView={() => setTab("Users")}><UserRows users={users.slice(0, 4)} /></AdminList><AdminList title="Latest competitions" kicker="IN THE MIX" onView={() => setTab("Competitions")}><CompetitionRows competitions={competitions.slice(0, 4)} /></AdminList></div></>}
      {tab === "Users" && <AdminList title="All players" kicker="THE WHOLE SQUAD"><UserRows users={users} /></AdminList>}
      {tab === "Competitions" && <AdminList title="All competitions" kicker="EVERY GAME"><CompetitionRows competitions={competitions} /></AdminList>}
    </>}
    <div className="admin-footnote"><span>READ-ONLY OVERVIEW</span> Admin API currently supports viewing users and competitions. <Link to="/">Back to site <Arrow /></Link></div>
  </div></main>;
}

function Stat({ label, number, icon }) { return <article className="admin-stat"><span className="admin-stat-icon">{icon}</span><span>{label}</span><strong>{number}</strong><small>IN THE APP</small></article>; }
function AdminList({ title, kicker, onView, children }) { return <section className="dashboard-panel admin-list"><div className="panel-heading"><div><span className="panel-kicker">{kicker}</span><h2>{title}</h2></div>{onView && <button className="panel-action" onClick={onView}>VIEW ALL <Arrow /></button>}</div>{children}</section>; }
function UserRows({ users }) { return users.length ? <div className="admin-data-list">{users.map((user, i) => <div className="admin-data-row" key={user.id || i}><Avatar name={user.username || user.name || "Player"} small /><span className="admin-data-primary">{user.username || user.name || "Player"}<small>{user.email || "No email"}</small></span><span className={`role-tag ${user.role === "admin" ? "role-admin" : ""}`}>{user.role || "user"}</span><span className="row-date">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "PLAYER"}</span></div>)}</div> : <div className="empty-state"><h3>No players found.</h3></div>; }
function CompetitionRows({ competitions }) { return competitions.length ? <div className="admin-data-list">{competitions.map((competition, i) => <div className="admin-data-row" key={competition.id || i}><span className="competition-icon admin-comp-icon">{competition.type === "tournament" ? "✳" : "▤"}</span><span className="admin-data-primary">{competition.name}<small>{competition.type || "competition"} · {competition.participants || competition.participant || "—"} players</small></span><span className="status-pill">{competition.status || "active"}</span><span className="row-date">{competition.start_date || "—"}</span></div>)}</div> : <div className="empty-state"><h3>No competitions found.</h3></div>; }
