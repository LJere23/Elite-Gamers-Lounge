import { Device } from "@/types/device";

const API_URL = "/api/devices";

/*
|--------------------------------------------------------------------------
| GET DEVICES
|--------------------------------------------------------------------------
*/

export async function getDevices(): Promise<Device[]> {

  const response =
    await fetch(API_URL);

  if (!response.ok) {

    throw new Error(
      "Failed to fetch devices"
    );
  }

  return response.json();
}

/*
|--------------------------------------------------------------------------
| AVAILABLE DEVICES
|--------------------------------------------------------------------------
*/

export function getAvailableDevices(
  devices: Device[]
): Device[] {

  return devices.filter(
    (device) =>
      device.status ===
      "available"
  );
}

/*
|--------------------------------------------------------------------------
| LOCK DEVICE
|--------------------------------------------------------------------------
*/

export async function lockDevice(
  id: string,
  sessionId: string
): Promise<Device> {

  const response =
    await fetch(
      `${API_URL}/${id}`,
      {
        method: "PATCH",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          status: "busy",
          currentSessionId:
            sessionId,
        }),
      }
    );

  if (!response.ok) {

    throw new Error(
      "Failed to lock device"
    );
  }

  return response.json();
}

/*
|--------------------------------------------------------------------------
| RELEASE DEVICE
|--------------------------------------------------------------------------
*/

export async function releaseDevice(
  id: string
): Promise<Device> {

  const response =
    await fetch(
      `${API_URL}/${id}`,
      {
        method: "PATCH",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          status: "available",
          currentSessionId:
            null,
        }),
      }
    );

  if (!response.ok) {

    throw new Error(
      "Failed to release device"
    );
  }

  return response.json();
}