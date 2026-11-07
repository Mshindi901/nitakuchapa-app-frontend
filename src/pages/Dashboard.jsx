import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AppHeader, Arrow, Avatar, PreviewNotice } from "../components/Brand";
import { demoCompetitions, demoMatches, demoParticipants, demoTable } from "../data/demo";
import { api, getErrorMessage, getResponseData } from "../lib/api";

const blankCompetition = { name: "", type: "league", participant: 8, interval_number: 1, interval_unit: "days", start_date: "", end_date: "", no_of_days: "", player_name: "", team_name: "" };
const tabs = ["Overview", "Competitions", "My fixtures"];

function formatDate(value) {
  if (!value) return "Date to be confirmed";
  return new Date(value).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

function getStoredUser(preview) {
  if (preview) return { id: "demo-user", username: "Demo Player", email: "" };
  try {
    return JSON.parse(localStorage.getItem("nitakuchapa_user") || "null") || { username: "Player", email: "" };
  } catch {
    return { username: "Player", email: "" };
  }
}

function CompetitionCard({ competition, onSelect, mine }) {
  return <button className="competition-card" onClick={() => onSelect(competition)}>
    <div className={`competition-icon ${competition.type === "tournament" ? "icon-tournament" : ""}`}>{competition.type === "tournament" ? "✳" : "▤"}</div>
    <div className="competition-copy"><span className="competition-type">{competition.type || "league"} · {mine ? "OWNER" : "PLAYER"}</span><strong>{competition.name}</strong><span>{competition.participants || competition.participant || "—"} players · Starts {formatDate(competition.start_date)}</span></div>
    <span className="status-pill">{competition.status || "active"}</span><span className="card-arrow">↗</span>
  </button>;
}

function EmptyState({ title, text, action }) {
  return <div className="empty-state"><span>✳</span><h3>{title}</h3><p>{text}</p>{action}</div>;
}

function makePreviewFixtures(players, competition) {
  const rotation = [...players];
  if (rotation.length % 2 !== 0) rotation.push(null);
  const roundCount = rotation.length - 1;
  const start = new Date(competition.start_date).getTime();
  return Array.from({ length: roundCount }, (_, round) => {
    const fixtures = [];
    for (let index = 0; index < rotation.length / 2; index += 1) {
      const a = rotation[index];
      const b = rotation[rotation.length - 1 - index];
      if (a && b) fixtures.push({
        id: `preview-${competition.id}-${round}-${index}`,
        league_id: competition.id,
        participant_a: a.id,
        participant_b: b.id,
        round: round + 1,
        schedule_at: new Date(start + round * (Number(competition.match_interval) || 86400000)).toISOString(),
        status: "pending",
      });
    }
    rotation.splice(1, 0, rotation.pop());
    return fixtures;
  }).flat();
}

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") === "fixtures" ? "My fixtures" : searchParams.get("tab") === "competitions" ? "Competitions" : "Overview");
  const [preview] = useState(localStorage.getItem("nitakuchapa_preview") === "true");
  const [competitions, setCompetitions] = useState(preview ? demoCompetitions : []);
  const [participations, setParticipations] = useState(preview ? [demoCompetitions[1]] : []);
  const [participants, setParticipants] = useState(preview ? demoParticipants : []);
  const [table, setTable] = useState(preview ? demoTable : []);
  const [matches, setMatches] = useState(preview ? demoMatches : []);
  const [selected, setSelected] = useState(preview ? demoCompetitions[0] : null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(blankCompetition);
  const [notice, setNotice] = useState(() => localStorage.getItem("nitakuchapa_token")
    ? ""
    : "You’re viewing the dashboard shell. Sign in with an API-issued token to load your live competitions, or explore sample data from the sign-in page.");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!preview && Boolean(localStorage.getItem("nitakuchapa_token")));
  const [generatingFixtures, setGeneratingFixtures] = useState(false);
  const [user] = useState(() => getStoredUser(preview));

  useEffect(() => {
    if (preview) return;
    const token = localStorage.getItem("nitakuchapa_token");
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
  }, [preview]);

  useEffect(() => {
    if (!selected || preview) return;
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
  }, [selected, preview]);

  const allCompetitions = useMemo(() => [...competitions, ...participations.filter((item) => !competitions.some((own) => own.id === item.id))], [competitions, participations]);
  const isOwner = selected && competitions.some((item) => item.id === selected.id);
  const currentUserId = preview ? "demo-user" : user.id;
  const playerMap = useMemo(() => new Map(participants.map((player) => [player.id, player])), [participants]);
  const rankedTable = useMemo(() => [...table].sort((a, b) => (b.total_points || 0) - (a.total_points || 0)), [table]);

  function setTab(tab) {
    setActiveTab(tab);
    setSearchParams(tab === "Overview" ? {} : { tab: tab === "My fixtures" ? "fixtures" : "competitions" });
  }

  function logout() {
    localStorage.removeItem("nitakuchapa_token");
    localStorage.removeItem("nitakuchapa_user");
    localStorage.removeItem("nitakuchapa_preview");
    window.location.href = "/signin";
  }

  async function createCompetition(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (preview) {
      const demo = { ...form, id: `demo-${Date.now()}`, owner: "demo-user", status: "active", share_code: "new-competition", participants: Number(form.participant) };
      setCompetitions((current) => [demo, ...current]);
      setSelected(demo);
      setShowCreate(false);
      setForm(blankCompetition);
      setNotice("Preview competition created locally. Nothing was sent to the server.");
      return;
    }
    try {
      const response = await api.post("/api/competition", { ...form, participant: Number(form.participant), interval_number: Number(form.interval_number), no_of_days: form.no_of_days ? Number(form.no_of_days) : undefined });
      if (!response.data?.success) throw new Error(response.data?.message || "Competition was not created.");
      setNotice("Competition created successfully.");
      setShowCreate(false);
      setForm(blankCompetition);
      const refresh = await api.get("/api/admin/competitions");
      setCompetitions(getResponseData(refresh));
    } catch (requestError) { setError(getErrorMessage(requestError)); }
  }

  async function updateScore(match, scoreA, scoreB) {
    const a = Number(scoreA);
    const b = Number(scoreB);
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0) {
      setError("Enter a non-negative whole-number score for both teams.");
      return;
    }
    const winner = a === b ? null : a > b ? match.participant_a : match.participant_b;
    if (preview) {
      setMatches((current) => current.map((item) => item.id === match.id ? { ...item, participant_a_score: a, participant_b_score: b, status: "completed", winning_id: winner } : item));
      setNotice("Score updated in this preview. It was not saved to the server.");
      return;
    }
    try {
      await api.put(`/api/match/scores/${selected.id}/${match.id}`, { participant_a_scores: a, participant_b_scores: b });
      const settledMatch = { ...match, participant_a_score: a, participant_b_score: b, winning_id: winner };
      await api.post("/api/points/id", { match: settledMatch });
      const refreshed = await api.get(`/api/competition/matches/${selected.id}`);
      setMatches(getResponseData(refreshed));
      const tableResponse = await api.get(`/api/points/competition/${selected.id}`);
      setTable(getResponseData(tableResponse));
      setNotice("Match score and competition table updated.");
    } catch (requestError) {
      setError(`${getErrorMessage(requestError)} The backend points endpoint may require an API correction before standings can be updated.`);
    }
  }

  async function generateFixtures() {
    if (!selected || !isOwner) return;
    setError("");
    setNotice("");
    setGeneratingFixtures(true);
    try {
      if (preview) {
        const fixtureList = makePreviewFixtures(participants, selected);
        setMatches(fixtureList);
        setNotice("Round-robin fixtures generated in preview mode.");
        return;
      }
      const response = await api.post(`/api/matches/add/${selected.id}`);
      if (!response.data?.success) throw new Error(response.data?.message || "Fixtures could not be generated.");
      const [matchResponse, tableResponse] = await Promise.all([
        api.get(`/api/competition/matches/${selected.id}`),
        api.get(`/api/points/competition/${selected.id}`),
      ]);
      setMatches(getResponseData(matchResponse));
      setTable(getResponseData(tableResponse));
      setNotice("Your round-robin fixtures are ready. Game on!");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
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
      {preview && <PreviewNotice />}
      <div className="dashboard-greeting"><div><div className="eyebrow"><span className="eyebrow-line" /> YOUR SEASON, YOUR STORY</div><h1>{activeTab === "Overview" ? <>Good game starts<br /><em>right here.</em></> : activeTab === "Competitions" ? <>Your competitions.<br /><em>All in one place.</em></> : <>The fixtures are set.<br /><em>Make them count.</em></>}</h1><p>A proper home for the games that matter. Let’s see where you stand.</p></div><button className="button button-brown create-button" onClick={() => setShowCreate(true)}>＋ <span>Create competition</span></button></div>
      {(notice || error) && <div className={`dashboard-alert ${error ? "alert-error" : ""}`} role={error ? "alert" : "status"}>{error || notice}<button onClick={() => { setError(""); setNotice(""); }} aria-label="Dismiss">×</button></div>}
      <nav className="dashboard-tabs">{tabs.map((tab) => <button key={tab} onClick={() => setTab(tab)} className={activeTab === tab ? "dashboard-tab-active" : ""}>{tab}<span>{tab === "Competitions" ? allCompetitions.length : tab === "My fixtures" ? myFixtures.length : ""}</span></button>)}</nav>
      {loading ? <div className="loading-state"><span className="loading-spinner" /> Loading your competitions...</div> : <>
        <section className="dashboard-content">
          {activeTab === "Overview" && <div className="overview-grid">
            <section className="dashboard-panel competition-panel"><div className="panel-heading"><div><span className="panel-kicker">THE LINE-UP</span><h2>Your competitions</h2></div><button className="panel-action" onClick={() => setTab("Competitions")}>SEE ALL <Arrow /></button></div>
              <div className="competition-list">{allCompetitions.slice(0, 3).map((competition) => <CompetitionCard key={competition.id} competition={competition} mine={competitions.some((item) => item.id === competition.id)} onSelect={setSelected} />)}
              {!allCompetitions.length && <EmptyState title="A clean sheet." text="No competitions just yet. Start one and bring your crew in." action={<button className="button button-brown" onClick={() => setShowCreate(true)}>Create a competition <Arrow /></button>} />}</div>
            </section>
            <section className="dashboard-panel table-panel"><div className="panel-heading"><div><span className="panel-kicker">WHERE THE POINTS LAND</span><h2>{selected?.name || "Your league table"}</h2></div><span className="mini-live"><i /> LIVE TABLE</span></div>
              {rankedTable.length ? <Standings table={rankedTable.slice(0, 5)} playerMap={playerMap} currentUserId={currentUserId} /> : <EmptyState title="No table yet." text="The standings will show up when your competition has players." />}
              {selected && <button className="panel-action table-view-action" onClick={() => setActiveTab("Competitions")}>VIEW COMPETITION <Arrow /></button>}
            </section>
            <section className="dashboard-panel fixtures-panel"><div className="panel-heading"><div><span className="panel-kicker">COMING UP NEXT</span><h2>Next fixtures</h2></div><button className="panel-action" onClick={() => setTab("My fixtures")}>ALL FIXTURES <Arrow /></button></div>
              <FixtureListWithScores matches={matches.filter((match) => match.status !== "completed").slice(0, 2)} playerMap={playerMap} onScore={updateScore} canScore={Boolean(isOwner)} />
            </section>
            <section className="dashboard-panel profile-panel" id="profile-card"><div className="profile-top"><Avatar name={user.username} /><span className="profile-tag">PLAYER PROFILE</span></div><h2>{user.username}</h2><p>{user.email}</p><div className="profile-stats"><div><strong>{competitions.length}</strong><span>CREATED</span></div><div><strong>{participations.length}</strong><span>JOINED</span></div><div><strong>{myFixtures.length}</strong><span>FIXTURES</span></div></div><button className="profile-edit" onClick={() => setNotice("Profile editing is not included in the backend API yet.")}>Manage your profile <Arrow /></button></section>
          </div>}
          {activeTab === "Competitions" && <div className="competition-view"><div className="competition-view-head"><div><span className="panel-kicker">YOUR LINE-UP</span><h2>Every competition, one place.</h2></div><div className="competition-filters"><span>{competitions.length} OWNED</span><span>{participations.length} JOINED</span></div></div><div className="competition-list">{allCompetitions.map((competition) => <CompetitionCard key={competition.id} competition={competition} mine={competitions.some((item) => item.id === competition.id)} onSelect={setSelected} />)}{!allCompetitions.length && <EmptyState title="Your next rivalry starts here." text="Create a competition or join one with an invite link." action={<button className="button button-brown" onClick={() => setShowCreate(true)}>Create your first competition <Arrow /></button>} />}</div>
            {selected && <CompetitionDetail competition={selected} participants={participants} playerMap={playerMap} table={rankedTable} matches={matches} isOwner={isOwner} currentUserId={currentUserId} onScore={updateScore} onGenerateFixtures={generateFixtures} generatingFixtures={generatingFixtures} onInvite={() => navigator.clipboard?.writeText(`${window.location.origin}/invite/${selected.share_code}`).then(() => setNotice("Invite link copied to clipboard.")).catch(() => setError("Could not copy the invite link."))} />}
          </div>}
          {activeTab === "My fixtures" && <section className="dashboard-panel fixture-view"><div className="panel-heading"><div><span className="panel-kicker">YOUR NEXT CHALLENGE</span><h2>Fixtures</h2></div><span className="mini-live"><i /> {myFixtures.length} MATCHES</span></div><FixtureListWithScores matches={myFixtures} playerMap={playerMap} onScore={updateScore} canScore={Boolean(isOwner)} /></section>}
        </section>
      </>}
    </div>
    {showCreate && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowCreate(false); }}><section className="create-modal" role="dialog" aria-modal="true" aria-labelledby="create-title"><div className="modal-heading"><div><span className="panel-kicker">MAKE IT OFFICIAL</span><h2 id="create-title">Set up your competition.</h2></div><button className="modal-close" onClick={() => setShowCreate(false)} aria-label="Close">×</button></div><form className="create-form" onSubmit={createCompetition}>
      <label>COMPETITION NAME<input required maxLength="60" placeholder="Friday Night Kings" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
      <div className="form-pair"><label>FORMAT<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="league">League</option><option value="tournament">Tournament</option></select></label><label>NUMBER OF PLAYERS<input type="number" min="2" max="64" required value={form.participant} onChange={(e) => setForm({ ...form, participant: e.target.value })} /></label></div>
      <div className="form-pair"><label>START DATE<input type="date" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></label><label>END DATE<input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></label></div>
      <div className="form-pair"><label>MATCH CADENCE<input type="number" min="1" required value={form.interval_number} onChange={(e) => setForm({ ...form, interval_number: e.target.value })} /></label><label>INTERVAL<select value={form.interval_unit} onChange={(e) => setForm({ ...form, interval_unit: e.target.value })}><option value="days">Days</option><option value="hours">Hours</option><option value="minutes">Minutes</option></select></label></div>
      <div className="form-pair"><label>YOUR PLAYER NAME<input required value={form.player_name} onChange={(e) => setForm({ ...form, player_name: e.target.value })} placeholder="Your name in the game" /></label><label>YOUR TEAM<input required value={form.team_name} onChange={(e) => setForm({ ...form, team_name: e.target.value })} placeholder="Your PES team" /></label></div>
      {error && <div className="form-message form-error">{error}</div>}<button className="button button-brown auth-submit">Create competition <Arrow /></button>
      <p className="modal-note">The backend also requires a participant count and your player/team details for the initial entry.</p>
    </form></section></div>}
  </main>;
}

function Standings({ table, playerMap, currentUserId }) {
  return <div className="standings-wrap"><table className="standings-table"><thead><tr><th>POS</th><th>PLAYER / TEAM</th><th>PL</th><th>W</th><th>D</th><th>L</th><th>PTS</th></tr></thead><tbody>{table.map((row, i) => { const player = playerMap.get(row.participant_id); const mine = Boolean(player && currentUserId && player.user_id === currentUserId); return <tr className={mine ? "my-table-row" : ""} key={row.id || row.participant_id || i}><td>{String(i + 1).padStart(2, "0")}</td><td><span className="standings-team">{player?.team_name || "Player"}<small>{player?.player_name || "Competition player"}{mine && <em className="user-table-badge">✦ YOUR TEAM</em>}</small></span></td><td>{row.matches_played ?? 0}</td><td>{row.matches_won ?? 0}</td><td>{row.matches_drawn ?? 0}</td><td>{row.matches_lost ?? 0}</td><td><strong>{row.total_points ?? 0}</strong></td></tr>; })}</tbody></table></div>;
}

function CompetitionDetail({ competition, participants, playerMap, table, matches, isOwner, currentUserId, onScore, onGenerateFixtures, generatingFixtures, onInvite }) {
  const participantLimit = Number(competition.participants ?? competition.participant ?? 0);
  const isFull = participantLimit > 0 && participants.length === participantLimit;
  const needsFixtures = isOwner && matches.length === 0;
  return <section className="competition-detail">
    <div className="detail-header"><div><span className="panel-kicker">{competition.type?.toUpperCase() || "COMPETITION"} · {competition.status?.toUpperCase() || "ACTIVE"}</span><h2>{competition.name}</h2><p>{participants.length} of {participantLimit || "—"} players · Starts {formatDate(competition.start_date)}</p></div><div className="detail-actions">{isOwner && <button className="button button-outline invite-button" onClick={onInvite}>Copy invite link <Arrow diagonal /></button>}{needsFixtures && <button className="button button-brown fixture-generate-button" disabled={!isFull || generatingFixtures} onClick={onGenerateFixtures}>{generatingFixtures ? "Generating fixtures..." : isFull ? "⚽ Generate fixtures" : `⚽ Need ${Math.max(0, participantLimit - participants.length)} more players`}</button>}</div></div>
    {needsFixtures && <div className={`fixture-generation-status ${isFull ? "fixture-generation-ready" : ""}`}><span>{isFull ? "FULL SQUAD · READY FOR KICKOFF" : `${participants.length} / ${participantLimit || "—"} PLAYERS JOINED`}</span><p>{isFull ? "Your round-robin schedule will be created for the whole squad." : "Share the invite link. Fixtures unlock when every player has joined."}</p></div>}
    <div className="detail-grid"><div className="dashboard-panel detail-table-panel"><div className="panel-heading"><div><span className="panel-kicker">THE STANDINGS</span><h3>League table</h3></div><span className="standings-count">{table.length} PLAYERS</span></div>{table.length ? <Standings table={table} playerMap={playerMap} currentUserId={currentUserId} /> : <EmptyState title="Waiting for kickoff." text="Your table will take shape after the first results." />}</div>
      <div className="dashboard-panel detail-fixtures"><div className="panel-heading"><div><span className="panel-kicker">MATCHDAY</span><h3>Fixtures & results</h3></div>{isOwner && <span className="score-hint">Add scores to update table</span>}</div><FixtureListWithScores matches={matches} playerMap={playerMap} onScore={onScore} canScore={Boolean(isOwner)} /></div>
      <div className="dashboard-panel participants-panel"><div className="panel-heading"><div><span className="panel-kicker">THE SQUAD</span><h3>Players <span className="player-count">{participants.length}</span></h3></div></div>{participants.length ? <div className="participants-list">{participants.map((player) => <div className="participant-row" key={player.id}><Avatar small name={player.player_name} /><span><b>{player.player_name}</b><small>{player.team_name}</small></span><span className="participant-member">{player.user_id ? "MEMBER" : "GUEST"}</span></div>)}</div> : <EmptyState title="Squad up." text="Share the invite link to bring players in." />}</div>
    </div>
  </section>;
}

function FixtureListWithScores({ matches, playerMap, onScore, canScore }) {
  if (!matches.length) return <EmptyState title="Fixtures are getting ready." text="Your match schedule will appear here." />;
  return <div className="fixture-list">{matches.map((match) => <article className="fixture-row" key={match.id}><div className="fixture-date"><strong>{new Date(match.schedule_at).toLocaleDateString("en-KE", { day: "2-digit" })}</strong><span>{new Date(match.schedule_at).toLocaleDateString("en-KE", { month: "short" }).toUpperCase()}</span></div><div className="fixture-teams"><strong>{playerMap.get(match.participant_a)?.team_name || "Team A"} <span>vs</span> {playerMap.get(match.participant_b)?.team_name || "Team B"}</strong><small>{playerMap.get(match.participant_a)?.player_name || "Player"} · {playerMap.get(match.participant_b)?.player_name || "Player"} <span>ROUND {match.round || "—"}</span></small></div>{canScore && match.status !== "completed" ? <ScoreInput match={match} onScore={onScore} /> : <div className={match.status === "completed" ? "fixture-result" : "fixture-pending"}>{match.status === "completed" ? <>{match.participant_a_score} — {match.participant_b_score}<small>FULL TIME</small></> : "UP NEXT"}</div>}</article>)}</div>;
}

function ScoreInput({ match, onScore }) {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [saving, setSaving] = useState(false);
  return <form className="fixture-score-form" onSubmit={async (event) => { event.preventDefault(); setSaving(true); await onScore(match, a, b); setSaving(false); }}><input aria-label="First team score" required min="0" type="number" value={a} onChange={(e) => setA(e.target.value)} /><span>:</span><input aria-label="Second team score" required min="0" type="number" value={b} onChange={(e) => setB(e.target.value)} /><button className="score-save" disabled={saving} aria-label="Save score">✓</button></form>;
}
