export async function getMembershipPlans() {
  const res = await fetch("/api/memberships");
  if (!res.ok) throw new Error("Failed to fetch membership plans");
  return res.json();
}

export async function createMembershipPlan(data: Record<string, unknown>) {
  const res = await fetch("/api/memberships", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create membership plan");
  return res.json();
}

export async function updateMembershipPlan(id: string, data: Record<string, unknown>) {
  const res = await fetch(`/api/memberships/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update membership plan");
  return res.json();
}

export async function deleteMembershipPlan(id: string) {
  const res = await fetch(`/api/memberships/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete membership plan");
  return res.json();
}
