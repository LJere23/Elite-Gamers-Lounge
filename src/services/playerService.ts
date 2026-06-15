export async function getPlayers() {
  const res = await fetch("/api/players");
  if (!res.ok) throw new Error("Failed to fetch players");
  return res.json();
}

export async function getPlayer(id: string) {
  const res = await fetch(`/api/players/${id}`);
  if (!res.ok) throw new Error("Player not found");
  return res.json();
}

export async function createPlayer(data: Record<string, unknown>) {
  const res = await fetch("/api/players", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create player");
  return res.json();
}

export async function updatePlayer(id: string, data: Record<string, unknown>) {
  const res = await fetch(`/api/players/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update player");
  return res.json();
}

export async function deletePlayer(id: string) {
  const res = await fetch(`/api/players/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete player");
  return res.json();
}

export async function awardXp(
  playerId: string,
  amount: number,
  source: string,
  note?: string
) {
  const res = await fetch("/api/loyalty/xp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId, amount, source, note }),
  });
  if (!res.ok) throw new Error("Failed to award XP");
  return res.json();
}
