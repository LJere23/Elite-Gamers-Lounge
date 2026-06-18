import { prisma } from "./db";

let cache: { multiplier: number; label: string; expiresAt: number } | null = null;

export async function getDoubleXpMultiplier(): Promise<{ multiplier: number; label: string }> {
  const now = Date.now();

  if (cache && now < cache.expiresAt) {
    return { multiplier: cache.multiplier, label: cache.label };
  }

  const settings = await prisma.loungeSettings.findUnique({ where: { id: "singleton" } });
  const multiplier =
    settings?.doubleXpActive &&
    (!settings.doubleXpUntil || settings.doubleXpUntil > new Date())
      ? (settings.doubleXpMultiplier ?? 2.0)
      : 1.0;

  const label = settings?.doubleXpLabel ?? "Double XP Event";

  cache = { multiplier, label, expiresAt: now + 60_000 };
  return { multiplier, label };
}

export function clearDoubleXpCache() {
  cache = null;
}
