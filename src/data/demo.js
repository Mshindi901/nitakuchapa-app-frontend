export const demoCompetitions = [
  {
    id: "demo-kpl",
    name: "Friday Night Kings",
    type: "league",
    status: "active",
    participants: 8,
    start_date: "2026-11-14",
    share_code: "friday-kings",
    owner: "demo-user",
  },
  {
    id: "demo-cup",
    name: "Eastlands El Clásico",
    type: "tournament",
    status: "active",
    participants: 16,
    start_date: "2026-11-20",
    share_code: "eastlands-cup",
    owner: "other-user",
  },
];

export const demoParticipants = [
  { id: "p1", player_name: "Demo Player", team_name: "Arsenal", user_id: "demo-user" },
  { id: "p2", player_name: "Kevin Otieno", team_name: "Real Madrid", user_id: "u2" },
  { id: "p3", player_name: "Aisha Wanjiku", team_name: "Barcelona", user_id: "u3" },
  { id: "p4", player_name: "Sam Kimani", team_name: "Liverpool", user_id: "u4" },
  { id: "p5", player_name: "Musa Ali", team_name: "Man City", user_id: "u5" },
  { id: "p6", player_name: "Faith Njeri", team_name: "Bayern Munich", user_id: "u6" },
];

export const demoTable = [
  { participant_id: "p3", matches_played: 4, matches_won: 3, matches_drawn: 1, matches_lost: 0, total_points: 10 },
  { participant_id: "p1", matches_played: 4, matches_won: 3, matches_drawn: 0, matches_lost: 1, total_points: 9 },
  { participant_id: "p2", matches_played: 4, matches_won: 2, matches_drawn: 1, matches_lost: 1, total_points: 7 },
  { participant_id: "p5", matches_played: 4, matches_won: 2, matches_drawn: 0, matches_lost: 2, total_points: 6 },
  { participant_id: "p4", matches_played: 4, matches_won: 1, matches_drawn: 1, matches_lost: 2, total_points: 4 },
  { participant_id: "p6", matches_played: 4, matches_won: 0, matches_drawn: 1, matches_lost: 3, total_points: 1 },
];

export const demoMatches = [
  { id: "m1", participant_a: "p1", participant_b: "p2", round: 5, schedule_at: "2026-11-09T18:00:00", status: "pending" },
  { id: "m2", participant_a: "p3", participant_b: "p4", round: 5, schedule_at: "2026-11-09T19:00:00", status: "pending" },
  { id: "m3", participant_a: "p5", participant_b: "p6", round: 5, schedule_at: "2026-11-10T18:00:00", status: "pending" },
  { id: "m4", participant_a: "p1", participant_b: "p3", round: 4, schedule_at: "2026-11-06T18:00:00", status: "completed", participant_a_score: 2, participant_b_score: 3 },
];

export const demoUsers = [
  { id: "u1", username: "Demo Player", email: "player@example.com", role: "user" },
  { id: "u2", username: "Kevin Otieno", email: "kevin@email.com", role: "user" },
  { id: "u3", username: "Aisha Wanjiku", email: "aisha@email.com", role: "user" },
  { id: "u4", username: "Sam Kimani", email: "sam@email.com", role: "user" },
];
