export type DeviceStatus =
  | "available"
  | "busy"
  | "maintenance";

export interface Device {

  id: string;

  name: string;

  type: string;

  hourlyRate: number;

  supportedGames: string[];

  status: DeviceStatus;

  location: string;

  currentSessionId: string | null;
}