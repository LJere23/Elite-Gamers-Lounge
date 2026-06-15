export async function getTournaments() {
  const res = await fetch("/api/tournaments");
  if (!res.ok) throw new Error("Failed to fetch tournaments");
  return res.json();
}

export async function getTournament(id: string) {
  const res = await fetch("/api/tournaments/" + id);
  if (!res.ok) throw new Error("Tournament not found");
  return res.json();
}

export async function createTournament(data: Record<string, unknown>) {
  const res = await fetch("/api/tournaments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create tournament");
  return res.json();
}

export async function updateTournament(id: string, data: Record<string, unknown>) {
  const res = await fetch(`/api/tournaments/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update tournament");
  return res.json();
}

export async function deleteTournament(id: string) {
  const res = await fetch(`/api/tournaments/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete tournament");
  return res.json();
}

export async function getTournamentEntries(id: string) {
  const res = await fetch(`/api/tournaments/${id}/entries`);
  if (!res.ok) throw new Error("Failed to fetch tournament entries");
  return res.json();
}

export async function registerEntry(
  tournamentId: string,
  playerId: string,
  playerName: string
) {
  const res = await fetch(`/api/tournaments/${tournamentId}/entries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId, playerName }),
  });
  if (!res.ok) throw new Error("Failed to register entry");
  return res.json();
}

export async function getTournamentMatches(id: string) {
  const res = await fetch(`/api/tournaments/${id}/matches`);
  if (!res.ok) throw new Error("Failed to fetch tournament matches");
  return res.json();
}

export async function updateMatch(
  tournamentId: string,
  matchId: string,
  data: Record<string, unknown>
) {
  const res = await fetch(`/api/tournaments/${tournamentId}/matches/${matchId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update match");
  return res.json();
}

export async function generateMatches(id: string) {
  const res = await fetch(`/api/tournaments/${id}/matches`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to generate matches");
  return res.json();
}

export async function getStandings(id: string) {
  const res = await fetch(`/api/tournaments/${id}/standings`);
  if (!res.ok) throw new Error("Failed to fetch standings");
  return res.json();
}
