import { WifiUsage } from "@/types/admin";

export async function fetchWifiSessions() {

  const response =
    await fetch("/api/wifi");

  return response.json();
}

export async function createWifiSession(
  payload: Partial<WifiUsage>
) {

  const response =
    await fetch("/api/wifi", {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify(payload),
    });

  return response.json();
}

export async function stopWifiSession(
  id: string
) {

  const response =
    await fetch(`/api/wifi/${id}`, {
      method: "PATCH",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        status: "expired",
      }),
    });

  return response.json();
}

export function sortWifiSessions(
  wifi: WifiUsage[]
) {

  return [...wifi].sort((a, b) => {

    if (
      a.status === "active" &&
      b.status !== "active"
    ) {
      return -1;
    }

    if (
      a.status !== "active" &&
      b.status === "active"
    ) {
      return 1;
    }

    return 0;
  });
}