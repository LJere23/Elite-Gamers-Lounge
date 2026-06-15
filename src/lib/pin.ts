import { randomBytes, pbkdf2Sync } from "crypto";

export function generateSalt(): string {
  return randomBytes(16).toString("hex");
}

export function hashPin(pin: string, salt: string): string {
  return pbkdf2Sync(pin, salt, 100_000, 64, "sha512").toString("hex");
}

export function verifyPin(pin: string, salt: string, storedHash: string): boolean {
  return hashPin(pin, salt) === storedHash;
}

export function validatePinFormat(pin: string): string | null {
  if (!/^\d{4,6}$/.test(pin)) return "PIN must be 4–6 digits.";
  // Reject all-same-digit PINs like 0000, 1111
  if (/^(\d)\1+$/.test(pin)) return "PIN is too simple. Avoid repeating digits.";
  return null;
}
