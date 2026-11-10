import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { AppHeader, Arrow, Avatar } from "../components/Brand";
import { api, getErrorMessage, getResponseData } from "../lib/api";
import { clearAuthSession, getAuthToken, getAuthUser } from "../lib/authStorage";

const blankCompetition = { name: "", type: "league", participant: 8, interval_number: 1, interval_unit: "days", start_date: "", end_date: "", no_of_days: "", player_name: "", team_name: "" };
const tabs = ["Overview", "Competitions", "My fixtures"];

function formatDate(value) {
  if (!value) return "Date to be confirmed";
  return new Date(value).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

function getReturnLegStorageKey(competitionId) {
  return `nitakuchapa_return_leg_scores_${competitionId}`;
}

function getReturnLegResults(competitionId) {
  const saved = localStorage.getItem(getReturnLegStorageKey(competitionId));
  if (!saved) return {};
  const results = JSON.parse(saved);
  if (!results || typeof results !== "object" || Array.isArray(results)) {
    throw new Error("Saved return-leg scores have an invalid format.");
  }
  return results;
}

function loadReturnLegState(competitionId, showLegs) {
  if (!showLegs || !competitionId) return { results: {}, error: "" };
  try {
    return { results: getReturnLegResults(competitionId), error: "" };
  } catch (error) {
    console.error("Could not load locally saved return-leg scores.", error);
    return { results: {}, error: "Return-leg scores saved on this device could not be loaded." };
  }
}

function getCompetitionForm(competition) {
  const duration = Number(competition.match_interval);
  const units = [
    ["days", 24 * 60 * 60 * 1000],
    ["hours", 60 * 60 * 1000],
    ["minutes", 60 * 1000],
  ];
  const [interval_unit, multiplier] = units.find(([, unit]) => duration >= unit && duration % unit === 0) || units[2];
  return {
    ...blankCompetition,
    name: competition.name || "",
    type: competition.type || "league",
    participant: competition.participants ?? competition.participant ?? 2,
    interval_number: duration ? duration / multiplier : 1,
    interval_unit,
    start_date: String(competition.start_date || "").slice(0, 10),
    end_date: String(competition.end_date || "").slice(0, 10),
  };
}

function CompetitionIcon({ type }) {
  return <span className={`competition-icon ${type === "tournament" ? "icon-tournament" : ""}`} aria-hidden="true">
    {type === "tournament"
      ? <svg viewBox="0 0 24 24" fill="none"><path d="M7 4h10v4a5 5 0 0 1-10 0V4Zm5 9v5m-4 2h8m-4-7v5M7 6H4v2a4 4 0 0 0 4 4m9-6h3v2a4 4 0 0 1-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
      : <svg viewBox="0 0 24 24" fill="none"><path d="M4 5.5h16v13H4zM4 10h16M9 10v8.5M15 10v8.5M7 7.8h.01M10 7.8h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>}
  </span>;
}

function CompetitionCard({ competition, onSelect, onEdit, onDelete, deleting, mine }) {
  return <article className="competition-card">
    <button className="competition-select" onClick={() => onSelect(competition)}>
      <CompetitionIcon type={competition.type} />
      <span className="competition-copy"><span className="competition-type">{competition.type || "league"} · {mine ? "OWNER" : "PLAYER"}</span><strong>{competition.name}</strong><span>{competition.participants || competition.participant || "—"} players · Starts {formatDate(competition.start_date)}</span></span>
      <span className="status-pill">{competition.status || "active"}</span><span className="card-arrow">↗</span>
    </button>
    {mine && <div className="competition-actions">
      <button className="competition-edit" type="button" onClick={() => onEdit(competition)} disabled={deleting} aria-label={`Edit ${competition.name}`} title="Edit competition"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m14 5 5 5M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
      <button className="competition-delete" type="button" onClick={() => onDelete(competition)} disabled={deleting} aria-label={`Delete ${competition.name}`} title="Delete competition"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
    </div>}
  </article>;
}

function EmptyState({ title, text, action }) {
  return <div className="empty-state"><span>✳</span><h3>{title}</h3><p>{text}</p>{action}</div>;
}

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "fixtures" ? "My fixtures" : searchParams.get("tab") === "competitions" ? "Competitions" : "Overview";
  const [competitions, setCompetitions] = useState([]);
  const [participations, setParticipations] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [table, setTable] = useState([]);
  const [matches, setMatches] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingCompetition, setEditingCompetition] = useState(null);
  const [form, setForm] = useState(blankCompetition);
  const [notice, setNotice] = useState(() => getAuthToken() ? "" : "Sign in to manage your competitions and fixtures.");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(getAuthToken()));
  const [generatingFixtures, setGeneratingFixtures] = useState(false);
  const [savingMatchId, setSavingMatchId] = useState(null);
  const [savingCompetition, setSavingCompetition] = useState(false);
  const [deletingCompetitionId, setDeletingCompetitionId] = useState(null);
  const [user] = useState(() => getAuthUser() || { username: "Player", email: "" });

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [ownerResult, participationResult] = await Promise.allSettled([
          api.get("/api/admin/competitions"),
          api.get("/api/competitions/user"),
        ]);
        if (!active) return;
        const own = ownerResult.status === "fulfilled" ? getResponseData(ownerResult.value) : [];
        const joined = participationResult.status === "fulfilled" ? getResponseData(participationResult.value) : [];
        setCompetitions(Array.isArray(own) ? own : []);
        setParticipations(Array.isArray(joined) ? joined : []);
        if (ownerResult.status === "rejected" && participationResult.status === "rejected") {
          setError(getErrorMessage(ownerResult.reason));
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selected) return;
    let active = true;
    Promise.allSettled([
      api.get(`/api/competition/participants/${selected.id}`),
      api.get(`/api/points/competition/${selected.id}`),
      api.get(`/api/competition/matches/${selected.id}`),
    ]).then(([playersResult, tableResult, matchesResult]) => {
      if (!active) return;
      if (playersResult.status === "fulfilled") setParticipants(getResponseData(playersResult.value));
      if (tableResult.status === "fulfilled") setTable(getResponseData(tableResult.value));
      if (matchesResult.status === "fulfilled") setMatches(getResponseData(matchesResult.value));
    });
    return () => { active = false; };
  }, [selected]);

  const allCompetitions = useMemo(() => [...competitions, ...participations.filter((item) => !competitions.some((own) => own.id === item.id))], [competitions, participations]);
  const isOwner = selected && competitions.some((item) => item.id === selected.id);
  const currentUserId = user.id;
  const playerMap = useMemo(() => new Map(participants.map((player) => [player.id, player])), [participants]);
  const rankedTable = useMemo(() => [...table].sort((a, b) => (b.total_points || 0) - (a.total_points || 0)), [table]);
  const totalRounds = useMemo(() => Math.max(0, ...matches.map((match) => Number(match.round) || 0)), [matches]);

  function setTab(tab) {
    setSearchParams(tab === "Overview" ? {} : { tab: tab === "My fixtures" ? "fixtures" : "competitions" });
  }

  function logout() {
    clearAuthSession();
    window.location.href = "/signin";
  }

  function openCompetitionEditor(competition) {
    setEditingCompetition(competition);
    setForm(getCompetitionForm(competition));
    setError("");
    setNotice("");
    setShowCreate(true);
  }

  function closeCompetitionForm() {
    setShowCreate(false);
    setEditingCompetition(null);
    setForm(blankCompetition);
    setError("");
  }

  async function saveCompetition(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setSavingCompetition(true);
    if (editingCompetition) {
      const payload = {
        name: form.name.trim(),
        participant: Number(form.participant),
        start_date: form.start_date,
        end_date: form.end_date || form.start_date,
        interval_number: Number(form.interval_number),
        interval_unit: form.interval_unit,
      };
      try {
        const response = await api.put(`/api/competition/${editingCompetition.id}`, payload);
        if (!response.data?.success) {
          throw new Error(response.data?.message || "Competition was not updated.");
        }
        const updated = response.data.data;
        setCompetitions((current) => current.map((item) => item.id === editingCompetition.id ? updated : item));
        setParticipations((current) => current.map((item) => item.id === editingCompetition.id ? updated : item));
        if (selected?.id === editingCompetition.id) setSelected(updated);
        setNotice("Competition updated successfully.");
        toast.success("Competition updated.");
        closeCompetitionForm();
      } catch (requestError) {
        const message = getErrorMessage(requestError);
        setError(message);
        toast.error(message);
      } finally {
        setSavingCompetition(false);
      }
      return;
    }
    try {
      const response = await api.post("/api/competition", { ...form, participant: Number(form.participant), interval_number: Number(form.interval_number), no_of_days: form.no_of_days ? Number(form.no_of_days) : undefined });
      if (!response.data?.success) throw new Error(response.data?.message || "Competition was not created.");
      const created = response.data.data;
      closeCompetitionForm();
      setSelected(created);
      setTab("Competitions");
      setNotice(`Competition created. Share join code ${created.competition_code} with players.`);
      toast.success("Competition created.");
      const refresh = await api.get("/api/admin/competitions");
      setCompetitions(getResponseData(refresh));
    } catch (requestError) {
      const message = getErrorMessage(requestError);
      setError(message);
      toast.error(message);
    }
    finally { setSavingCompetition(false); }
  }

  async function updateScore(match, scoreA, scoreB) {
    const a = Number(scoreA);
    const b = Number(scoreB);
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0) {
      setError("Enter a non-negative whole-number score for both teams.");
      return;
    }
    const winner = a === b ? null : a > b ? match.participant_a : match.participant_b;
    setSavingMatchId(match.id);
    setError("");
    setNotice("");
    try {
      await api.put(`/api/match/scores/${selected.id}/${match.id}`, { participant_a_scores: a, participant_b_scores: b });
      const settledMatch = { ...match, participant_a_score: a, participant_b_score: b, winning_id: winner };
      await api.post("/api/points/id", { match: settledMatch });
      const refreshed = await api.get(`/api/competition/matches/${selected.id}`);
      setMatches(getResponseData(refreshed));
      const tableResponse = await api.get(`/api/points/competition/${selected.id}`);
      setTable(getResponseData(tableResponse));
      setNotice("Match score and competition table updated.");
      toast.success("Match result and table updated.");
    } catch (requestError) {
      const message = `${getErrorMessage(requestError)} The backend points endpoint may require an API correction before standings can be updated.`;
      setError(message);
      toast.error(message);
    } finally {
      setSavingMatchId(null);
    }
  }

  async function deleteCompetition(competition) {
    if (!window.confirm(`Delete "${competition.name}" and its fixtures and standings? This cannot be undone.`)) return;
    setDeletingCompetitionId(competition.id);
    setError("");
    setNotice("");
    try {
      const response = await api.delete(`/api/competition/${competition.id}`);
      if (!response.data?.success) throw new Error(response.data?.message || "Competition was not deleted.");
      setCompetitions((current) => current.filter((item) => item.id !== competition.id));
      setParticipations((current) => current.filter((item) => item.id !== competition.id));
      if (selected?.id === competition.id) {
        setSelected(null);
        setParticipants([]);
        setTable([]);
        setMatches([]);
      }
      setNotice("Competition and its records were deleted.");
      toast.success("Competition deleted.");
    } catch (requestError) {
      const message = getErrorMessage(requestError);
      setError(message);
      toast.error(message);
    } finally {
      setDeletingCompetitionId(null);
    }
  }

  async function copyCompetitionCode(competition) {
    try {
      await navigator.clipboard.writeText(String(competition.competition_code));
      setError("");
      setNotice("Competition code copied to clipboard.");
      toast.success("Competition code copied.");
    } catch {
      setError("Could not copy the competition code. Please copy it manually.");
      toast.error("Could not copy the competition code.");
    }
  }

  async function generateFixtures() {
    if (!selected || !isOwner) return;
    setError("");
    setNotice("");
    setGeneratingFixtures(true);
    try {
      const response = await api.post(`/api/matches/add/${selected.id}`);
      if (!response.data?.success) throw new Error(response.data?.message || "Fixtures could not be generated.");
      const [matchResponse, tableResponse] = await Promise.all([
        api.get(`/api/competition/matches/${selected.id}`),
        api.get(`/api/points/competition/${selected.id}`),
      ]);
      setMatches(getResponseData(matchResponse));
      setTable(getResponseData(tableResponse));
      setNotice("First-leg fixtures are ready. Use the fixture tabs to view the return leg.");
      toast.success("First-leg fixtures generated.");
    } catch (requestError) {
      const message = getErrorMessage(requestError);
      setError(message);
      toast.error(message);
    } finally {
      setGeneratingFixtures(false);
    }
  }

  const myParticipantIds = new Set([
    ...participants.filter((player) => player.user_id === currentUserId).map((player) => player.id),
  ]);
  const myFixtures = matches.filter((match) => [match.participant_a, match.participant_b].some((id) => myParticipantIds.has(id)));

  return <main className="dashboard-page">
    <AppHeader active={activeTab} onLogout={logout} userName={user.username || user.name || "Player"} />
    <div className="dashboard-shell">
      <div className="dashboard-greeting"><div><div className="eyebrow"><span className="eyebrow-line" /> YOUR SEASON, YOUR STORY</div><h1>{activeTab === "Overview" ? <>Good game, <em>{(user.username || user.name || "Player").split(" ")[0]}.</em><br />Ready for matchday?</> : activeTab === "Competitions" ? <>Your competitions.<br /><em>All in one place.</em></> : <>The fixtures are set.<br /><em>Make them count.</em></>}</h1><p>A proper home for the games that matter. Let’s see where you stand.</p></div><button className="button button-brown create-button" onClick={() => setShowCreate(true)}>＋ <span>Create competition</span></button></div>
      {(notice || error) && <div className={`dashboard-alert ${error ? "alert-error" : ""}`} role={error ? "alert" : "status"}>{error || notice}<button onClick={() => { setError(""); setNotice(""); }} aria-label="Dismiss">×</button></div>}
      <nav className="dashboard-tabs">{tabs.map((tab) => <button key={tab} onClick={() => setTab(tab)} className={activeTab === tab ? "dashboard-tab-active" : ""}>{tab}<span>{tab === "Competitions" ? allCompetitions.length : tab === "My fixtures" ? myFixtures.length : ""}</span></button>)}</nav>
      {loading ? <div className="loading-state"><span className="loading-spinner" /> Loading your competitions...</div> : <>
        <section className="dashboard-content">
          {activeTab === "Overview" && <div className="overview-grid">
            <section className="dashboard-panel competition-panel"><div className="panel-heading"><div><span className="panel-kicker">THE LINE-UP</span><h2>Your competitions</h2></div><button className="panel-action" onClick={() => setTab("Competitions")}>SEE ALL <Arrow /></button></div>
              <div className="competition-list">{allCompetitions.slice(0, 3).map((competition) => { const mine = competitions.some((item) => item.id === competition.id); return <CompetitionCard key={competition.id} competition={competition} mine={mine} deleting={deletingCompetitionId === competition.id} onSelect={setSelected} onEdit={openCompetitionEditor} onDelete={deleteCompetition} />; })}
              {!allCompetitions.length && <EmptyState title="A clean sheet." text="No competitions just yet. Start one and bring your crew in." action={<button className="button button-brown" onClick={() => setShowCreate(true)}>Create a competition <Arrow /></button>} />}</div>
            </section>
            <section className="dashboard-panel table-panel"><div className="panel-heading"><div><span className="panel-kicker">WHERE THE POINTS LAND</span><h2>{selected?.name || "Your league table"}</h2></div><span className="mini-live"><i /> LIVE TABLE</span></div>
              {rankedTable.length ? <Standings table={rankedTable.slice(0, 5)} playerMap={playerMap} currentUserId={currentUserId} matches={matches} /> : <EmptyState title="No table yet." text="The standings will show up when your competition has players." />}
              {selected && <button className="panel-action table-view-action" onClick={() => setTab("Competitions")}>VIEW COMPETITION <Arrow /></button>}
            </section>
            <section className="dashboard-panel fixtures-panel"><div className="panel-heading"><div><span className="panel-kicker">COMING UP NEXT</span><h2>Next fixtures</h2></div><button className="panel-action" onClick={() => setTab("My fixtures")}>ALL FIXTURES <Arrow /></button></div>
              <FixtureListWithScores key={`overview-${selected?.id || "none"}`} matches={matches.filter((match) => match.status !== "completed").slice(0, 2)} playerMap={playerMap} onScore={updateScore} canScore={Boolean(isOwner)} savingMatchId={savingMatchId} competitionId={selected?.id} matchInterval={selected?.match_interval} showLegs={false} />
            </section>
            <section className="dashboard-panel profile-panel" id="profile-card"><div className="profile-top"><Avatar name={user.username} /><span className="profile-tag">PLAYER PROFILE</span></div><h2>{user.username}</h2><p>{user.email}</p><div className="profile-stats"><div><strong>{competitions.length}</strong><span>CREATED</span></div><div><strong>{participations.length}</strong><span>JOINED</span></div><div><strong>{myFixtures.length}</strong><span>FIXTURES</span></div></div><button className="profile-edit" onClick={() => setNotice("Profile editing is not included in the backend API yet.")}>Manage your profile <Arrow /></button></section>
          </div>}
          {activeTab === "Competitions" && <div className="competition-view"><div className="competition-view-head"><div><span className="panel-kicker">YOUR LINE-UP</span><h2>Every competition, one place.</h2></div><div className="competition-filters"><Link className="button button-outline" to="/competitions/invite/code">Join with a code <Arrow /></Link><span>{competitions.length} OWNED</span><span>{participations.length} JOINED</span></div></div><div className="competition-list">{allCompetitions.map((competition) => { const mine = competitions.some((item) => item.id === competition.id); return <CompetitionCard key={competition.id} competition={competition} mine={mine} deleting={deletingCompetitionId === competition.id} onSelect={setSelected} onEdit={openCompetitionEditor} onDelete={deleteCompetition} />; })}{!allCompetitions.length && <EmptyState title="Your next rivalry starts here." text="Create a competition or join one with an invite link or code." action={<Link className="button button-brown" to="/competitions/invite/code">Join with a code <Arrow /></Link>} />}</div>
            {selected && <CompetitionDetail competition={selected} participants={participants} playerMap={playerMap} table={rankedTable} matches={matches} isOwner={isOwner} currentUserId={currentUserId} onScore={updateScore} savingMatchId={savingMatchId} onGenerateFixtures={generateFixtures} generatingFixtures={generatingFixtures} onCopyCode={() => copyCompetitionCode(selected)} onInvite={() => navigator.clipboard?.writeText(`${window.location.origin}/invite/${selected.share_code}`).then(() => { setNotice("Invite link copied to clipboard."); toast.success("Invite link copied."); }).catch(() => { setError("Could not copy the invite link."); toast.error("Could not copy the invite link."); })} />}
          </div>}
          {activeTab === "My fixtures" && <section className="dashboard-panel fixture-view"><div className="panel-heading"><div><span className="panel-kicker">YOUR NEXT CHALLENGE</span><h2>Fixtures</h2></div><span className="mini-live"><i /> {myFixtures.length} MATCHES</span></div><FixtureListWithScores key={`my-fixtures-${selected?.id || "none"}`} matches={myFixtures} playerMap={playerMap} onScore={updateScore} canScore={Boolean(isOwner)} savingMatchId={savingMatchId} competitionId={selected?.id} matchInterval={selected?.match_interval} totalRounds={totalRounds} /></section>}
        </section>
      </>}
    </div>
    {showCreate && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeCompetitionForm(); }}><section className="create-modal" role="dialog" aria-modal="true" aria-labelledby="create-title"><div className="modal-heading"><div><span className="panel-kicker">{editingCompetition ? "UPDATE THE DETAILS" : "MAKE IT OFFICIAL"}</span><h2 id="create-title">{editingCompetition ? "Edit your competition." : "Set up your competition."}</h2></div><button className="modal-close" onClick={closeCompetitionForm} aria-label="Close">×</button></div><form className="create-form" onSubmit={saveCompetition}>
      <label>COMPETITION NAME<input required maxLength="60" placeholder="Friday Night Kings" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
      {!editingCompetition && <div className="form-pair"><label>FORMAT<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="league">League</option><option value="tournament">Tournament</option></select></label><label>NUMBER OF PLAYERS<input type="number" min="2" max="64" step="1" required value={form.participant} onChange={(e) => setForm({ ...form, participant: e.target.value })} /></label></div>}
      {editingCompetition && <label>NUMBER OF PLAYERS<input type="number" min="2" max="64" step="1" required value={form.participant} onChange={(e) => setForm({ ...form, participant: e.target.value })} /><small>Capacity cannot be lower than the number of players already joined.</small></label>}
      <div className="form-pair"><label>START DATE<input type="date" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></label><label>END DATE<input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></label></div>
      <div className="form-pair"><label>TIME BETWEEN MATCHES<input type="number" min="1" required value={form.interval_number} onChange={(e) => setForm({ ...form, interval_number: e.target.value })} /></label><label>MEASURE IN<select value={form.interval_unit} onChange={(e) => setForm({ ...form, interval_unit: e.target.value })}><option value="days">Days</option><option value="hours">Hours</option><option value="minutes">Minutes</option></select></label></div>
      <p className="interval-help">Your fixtures will be scheduled one match every {form.interval_number || "—"} {form.interval_unit}.</p>
      {!editingCompetition && <div className="form-pair"><label>YOUR PLAYER NAME<input required value={form.player_name} onChange={(e) => setForm({ ...form, player_name: e.target.value })} placeholder="Your name in the game" /></label><label>YOUR TEAM<input required value={form.team_name} onChange={(e) => setForm({ ...form, team_name: e.target.value })} placeholder="Your PES team" /></label></div>}
      {error && <div className="form-message form-error">{error}</div>}<button className="button button-brown auth-submit" disabled={savingCompetition}>{savingCompetition ? (editingCompetition ? "Saving changes..." : "Creating competition...") : (editingCompetition ? "Save changes" : "Create competition")} <Arrow /></button>
      {!editingCompetition && <p className="modal-note">The backend also requires a participant count and your player/team details for the initial entry.</p>}
    </form></section></div>}
  </main>;
}

function Standings({ table, playerMap, currentUserId, matches }) {
  const goalsByParticipant = new Map();
  for (const match of matches) {
    if (match.status !== "completed" || match.participant_a_score == null || match.participant_b_score == null) continue;
    const scoreA = Number(match.participant_a_score);
    const scoreB = Number(match.participant_b_score);
    if (!Number.isFinite(scoreA) || !Number.isFinite(scoreB)) continue;
    const statsA = goalsByParticipant.get(match.participant_a) || { goalsFor: 0, goalsAgainst: 0 };
    const statsB = goalsByParticipant.get(match.participant_b) || { goalsFor: 0, goalsAgainst: 0 };
    statsA.goalsFor += scoreA;
    statsA.goalsAgainst += scoreB;
    statsB.goalsFor += scoreB;
    statsB.goalsAgainst += scoreA;
    goalsByParticipant.set(match.participant_a, statsA);
    goalsByParticipant.set(match.participant_b, statsB);
  }
  const getGoals = (participantId) => {
    const { goalsFor = 0, goalsAgainst = 0 } = goalsByParticipant.get(participantId) || {};
    return { goalsFor, goalsAgainst, goalDifference: goalsFor - goalsAgainst };
  };
  const rows = [...table].sort((a, b) => {
    const goalsA = getGoals(a.participant_id);
    const goalsB = getGoals(b.participant_id);
    return (b.total_points ?? 0) - (a.total_points ?? 0) ||
      (b.matches_won ?? 0) - (a.matches_won ?? 0) ||
      goalsB.goalDifference - goalsA.goalDifference ||
      goalsB.goalsFor - goalsA.goalsFor;
  });
  return <div className="standings-wrap" role="region" aria-label="League table" tabIndex="0">
    <table className="standings-table">
      <thead><tr>
        <th scope="col">POS</th><th scope="col">PLAYER / TEAM</th><th scope="col">GAMES</th>
        <th scope="col">W</th><th scope="col">D</th><th scope="col">L</th>
        <th scope="col">GF</th><th scope="col">GA</th><th scope="col">GD</th><th scope="col">POINTS</th>
      </tr></thead>
      <tbody>{rows.map((row, i) => {
        const player = playerMap.get(row.participant_id);
        const mine = Boolean(player && currentUserId && player.user_id === currentUserId);
        const { goalsFor, goalsAgainst, goalDifference } = getGoals(row.participant_id);
        return <tr className={mine ? "my-table-row" : ""} key={row.id || row.participant_id || i}>
          <td className="standings-position">{String(i + 1).padStart(2, "0")}</td>
          <td><span className="standings-team"><span className="standings-team-crest" aria-hidden="true">{(player?.team_name || "P").slice(0, 1).toUpperCase()}</span><span className="standings-team-copy">{player?.team_name || "Player"}<small>{player?.player_name || "Competition player"}{mine && <em className="user-table-badge">✦ YOUR TEAM</em>}</small></span></span></td>
          <td>{row.matches_played ?? 0}</td><td>{row.matches_won ?? 0}</td><td>{row.matches_drawn ?? 0}</td>
          <td>{row.matches_lost ?? 0}</td><td>{goalsFor}</td><td>{goalsAgainst}</td><td>{goalDifference > 0 ? `+${goalDifference}` : goalDifference}</td>
          <td className="standings-points"><strong>{row.total_points ?? 0}</strong></td>
        </tr>;
      })}</tbody>
    </table>
  </div>;
}

function CompetitionDetail({ competition, participants, playerMap, table, matches, isOwner, currentUserId, onScore, savingMatchId, onGenerateFixtures, generatingFixtures, onCopyCode, onInvite }) {
  const participantLimit = Number(competition.participants ?? competition.participant ?? 0);
  const isFull = participantLimit > 0 && participants.length === participantLimit;
  const needsFixtures = isOwner && matches.length === 0;
  return <section className="competition-detail">
    <div className="detail-header"><div><span className="panel-kicker">{competition.type?.toUpperCase() || "COMPETITION"} · {competition.status?.toUpperCase() || "ACTIVE"}</span><h2>{competition.name}</h2><p>{participants.length} of {participantLimit || "—"} players · Starts {formatDate(competition.start_date)}</p></div><div className="detail-actions">{isOwner && competition.competition_code && <button className="button button-outline invite-button" onClick={onCopyCode}>Copy join code: {competition.competition_code}</button>}{isOwner && <button className="button button-outline invite-button" onClick={onInvite}>Copy invite link <Arrow diagonal /></button>}{needsFixtures && <button className="button button-brown fixture-generate-button" disabled={!isFull || generatingFixtures} onClick={onGenerateFixtures}>{generatingFixtures ? "Generating fixtures..." : isFull ? "⚽ Generate fixtures" : `⚽ Need ${Math.max(0, participantLimit - participants.length)} more players`}</button>}</div></div>
    {needsFixtures &&     <div className={`fixture-generation-status ${isFull ? "fixture-generation-ready" : ""}`}><span>{isFull ? "FULL SQUAD · READY FOR KICKOFF" : `${participants.length} / ${participantLimit || "—"} PLAYERS JOINED`}</span><p>{isFull ? "Your first-leg round-robin schedule will be created for the whole squad." : "Share the invite link. Fixtures unlock when every player has joined."}</p></div>}
    <div className="detail-grid"><div className="dashboard-panel detail-table-panel"><div className="panel-heading"><div><span className="panel-kicker">THE STANDINGS</span><h3>League table</h3></div><span className="standings-count">{table.length} PLAYERS</span></div>{table.length ? <Standings table={table} playerMap={playerMap} currentUserId={currentUserId} matches={matches} /> : <EmptyState title="Waiting for kickoff." text="Your table will take shape after the first results." />}</div>
      <div className="dashboard-panel detail-fixtures"><div className="panel-heading"><div><span className="panel-kicker">MATCHDAY</span><h3>Fixtures & results</h3></div>{isOwner && <span className="score-hint">Add first-leg scores to update table</span>}</div><FixtureListWithScores key={competition.id} matches={matches} playerMap={playerMap} onScore={onScore} canScore={Boolean(isOwner)} savingMatchId={savingMatchId} competitionId={competition.id} matchInterval={competition.match_interval} /></div>
      <div className="dashboard-panel participants-panel"><div className="panel-heading"><div><span className="panel-kicker">THE SQUAD</span><h3>Players <span className="player-count">{participants.length}</span></h3></div></div>{participants.length ? <div className="participants-list">{participants.map((player) => <div className="participant-row" key={player.id}><Avatar small name={player.player_name} /><span><b>{player.player_name}</b><small>{player.team_name}</small></span><span className="participant-member">{player.user_id ? "MEMBER" : "GUEST"}</span></div>)}</div> : <EmptyState title="Squad up." text="Share the invite link to bring players in." />}</div>
    </div>
  </section>;
}

function FixtureListWithScores({ matches, playerMap, onScore, canScore, savingMatchId, competitionId, matchInterval, totalRounds, showLegs = true }) {
  const [activeLeg, setActiveLeg] = useState(1);
  const [returnLegState, setReturnLegState] = useState(() => loadReturnLegState(competitionId, showLegs));
  const { results: returnLegResults, error: localError } = returnLegState;

  if (!matches.length) return <EmptyState title="Fixtures are getting ready." text="Your match schedule will appear here." />;

  const maxRound = totalRounds ?? Math.max(...matches.map((match) => Number(match.round) || 0));
  const interval = Number(matchInterval);
  const roundDuration = Number.isFinite(interval) && interval > 0 ? interval : 24 * 60 * 60 * 1000;
  const returnMatches = matches.map((match) => {
    const id = `${match.id}-return`;
    const result = returnLegResults[id];
    const schedule = match.schedule_at ? new Date(match.schedule_at) : null;
    const hasSchedule = schedule && Number.isFinite(schedule.getTime());
    const returnSchedule = hasSchedule ? new Date(schedule.getTime() + roundDuration * maxRound) : null;
    const returnScheduleValid = returnSchedule && Number.isFinite(returnSchedule.getTime());
    return {
      ...match,
      id,
      originalMatchId: match.id,
      participant_a: match.participant_b,
      participant_b: match.participant_a,
      round: maxRound + (Number(match.round) || 1),
      schedule_at: returnScheduleValid ? returnSchedule.toISOString() : null,
      leg: 2,
      participant_a_score: result?.participant_a_score ?? null,
      participant_b_score: result?.participant_b_score ?? null,
      status: result ? "completed" : "pending",
    };
  });
  const visibleMatches = !showLegs || activeLeg === 1 ? matches : returnMatches;

  function saveReturnLegScore(match, scoreA, scoreB) {
    if (!showLegs || !competitionId) return;
    const a = Number(scoreA);
    const b = Number(scoreB);
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0) {
      setReturnLegState((current) => ({ ...current, error: "Enter a non-negative whole-number score for both teams." }));
      return;
    }
    try {
      const saved = getReturnLegResults(competitionId);
      const next = {
        ...saved,
        [match.id]: { participant_a_score: a, participant_b_score: b },
      };
      localStorage.setItem(getReturnLegStorageKey(competitionId), JSON.stringify(next));
      setReturnLegState({ results: next, error: "" });
    } catch (error) {
      console.error("Could not save the return-leg score on this device.", error);
      setReturnLegState((current) => ({ ...current, error: "Could not save this return-leg score on this device. Check your browser storage settings." }));
    }
  }

  return <div>
    {showLegs && <div className="fixture-leg-controls" role="tablist" aria-label="Fixture legs">
      {[1, 2].map((leg) => <button key={leg} type="button" role="tab" aria-selected={activeLeg === leg} className={activeLeg === leg ? "fixture-leg-active" : ""} onClick={() => setActiveLeg(leg)}>
        {leg === 1 ? "1st Leg" : "2nd Leg"} <span>{leg === 1 ? matches.length : returnMatches.length}</span>
      </button>)}
    </div>}
    {showLegs && activeLeg === 2 && <p className="fixture-leg-note">Return-leg fixtures reverse the first-leg home and away teams. Their scores are saved only in this browser and do not update shared standings.</p>}
    {localError && <p className="fixture-leg-error" role="alert">{localError}</p>}
    <div className="fixture-list">{visibleMatches.map((match) => {
    const scheduled = new Date(match.schedule_at);
    const scheduleValid = Boolean(match.schedule_at) && Number.isFinite(scheduled.getTime());
    const saving = savingMatchId === match.id;
    return <article className={`fixture-row ${saving ? "fixture-row-saving" : ""}`} key={match.id}>
      <div className="fixture-date"><strong>{scheduleValid ? scheduled.toLocaleDateString("en-KE", { day: "2-digit" }) : "TBD"}</strong><span>{scheduleValid ? scheduled.toLocaleDateString("en-KE", { month: "short" }).toUpperCase() : "DATE"}</span></div>
      <div className="fixture-teams"><strong>{playerMap.get(match.participant_a)?.team_name || "Team A"} <span>vs</span> {playerMap.get(match.participant_b)?.team_name || "Team B"}</strong><small>{playerMap.get(match.participant_a)?.player_name || "Player"} · {playerMap.get(match.participant_b)?.player_name || "Player"} <span>ROUND {match.round || "—"} · LEG {activeLeg}</span></small><time className="fixture-kickoff">{scheduleValid ? scheduled.toLocaleTimeString("en-KE", { hour: "numeric", minute: "2-digit" }) : "Schedule pending"}</time></div>
      {canScore && match.status !== "completed" ? <ScoreInput key={match.id} match={match} onScore={match.leg === 2 ? saveReturnLegScore : onScore} saving={saving} busy={savingMatchId !== null} /> : <div className={match.status === "completed" ? "fixture-result" : "fixture-pending"}>{saving ? <><span className="loading-spinner" /> Updating table…</> : match.status === "completed" ? <>{match.participant_a_score} — {match.participant_b_score}<small>{match.leg === 2 ? "SAVED ON THIS DEVICE" : "FULL TIME"}</small></> : "UP NEXT"}</div>}
    </article>;
  })}</div>
  </div>;
}

function ScoreInput({ match, onScore, saving, busy }) {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  return <form className="fixture-score-form" onSubmit={async (event) => { event.preventDefault(); await onScore(match, a, b); }}><input aria-label="First team score" required min="0" type="number" value={a} onChange={(e) => setA(e.target.value)} disabled={busy} /><span>:</span><input aria-label="Second team score" required min="0" type="number" value={b} onChange={(e) => setB(e.target.value)} disabled={busy} /><button className="score-save" disabled={busy} aria-label={saving ? "Saving score" : "Save score"}>{saving ? <span className="loading-spinner" /> : "✓"}</button></form>;
}
