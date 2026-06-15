export function formatCountdown(
  expiresAt: string
) {

  const difference =
    new Date(expiresAt).getTime()
    - Date.now();

  if (difference <= 0) {
    return "Expired";
  }

  const minutes =
    Math.floor(difference / 60000);

  const seconds =
    Math.floor(
      (difference % 60000) / 1000
    );

  return `${minutes}m ${seconds}s`;
}