export async function getAnalytics(period?: "daily" | "weekly" | "monthly" | "all") {
  const url = period ? `/api/analytics?period=${period}` : "/api/analytics";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json();
}
