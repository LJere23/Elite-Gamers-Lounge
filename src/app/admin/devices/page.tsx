"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  Device,
} from "@/types/device";

export default function DevicesPage() {

  const [devices, setDevices] =
    useState<Device[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [form, setForm] =
    useState({

      name: "",

      type: "PS5",

      hourlyRate: 2,

      location: "Main Floor",
    });

  /*
  |--------------------------------------------------------------------------
  | LOAD DEVICES
  |--------------------------------------------------------------------------
  */

  async function loadDevices() {

    try {

      const response =
        await fetch(
          "/api/devices"
        );

      const data =
        await response.json();

      setDevices(data);

    } catch (error) {

      console.error(error);
    }
  }

  useEffect(() => {

    loadDevices();

  }, []);

  /*
  |--------------------------------------------------------------------------
  | CREATE DEVICE
  |--------------------------------------------------------------------------
  */

  async function createDevice(
    event: React.FormEvent
  ) {

    event.preventDefault();

    try {

      setLoading(true);

      const response =
        await fetch(
          "/api/devices",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({

              ...form,

              status:
                "available",
            }),
          }
        );

      const created =
        await response.json();

      setDevices((prev) => [
        created,
        ...prev,
      ]);

      setForm({

        name: "",

        type: "PS5",

        hourlyRate: 2,

        location:
          "Main Floor",
      });

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | DELETE DEVICE
  |--------------------------------------------------------------------------
  */

  async function deleteDevice(
    id: string
  ) {

    const confirmed =
      confirm(
        "Delete device?"
      );

    if (!confirmed) return;

    await fetch(
      `/api/devices/${id}`,
      {
        method: "DELETE",
      }
    );

    setDevices((prev) =>
      prev.filter(
        (device) =>
          device.id !== id
      )
    );
  }

  /*
  |--------------------------------------------------------------------------
  | UPDATE STATUS
  |--------------------------------------------------------------------------
  */

  async function updateStatus(
    id: string,
    status: Device["status"]
  ) {

    const response =
      await fetch(
        `/api/devices/${id}`,
        {

          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            status,
          }),
        }
      );

    const updated =
      await response.json();

    setDevices((prev) =>
      prev.map((device) =>
        device.id === id
          ? updated
          : device
      )
    );
  }

  return (
    <main className="p-8 space-y-8">

      {/* HEADER */}

      <div>

        <h1 className="text-4xl font-black text-white">
          Devices
        </h1>

        <p className="text-zinc-400 mt-2">
          Manage consoles, PCs, simulators and gaming stations.
        </p>

      </div>

      {/* FORM */}

      <form
        onSubmit={createDevice}
        className="bg-zinc-950 border border-white/10 rounded-3xl p-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4"
      >

        <input
          required
          placeholder="Device Name"
          value={form.name}
          onChange={(e) =>
            setForm({
              ...form,
              name:
                e.target.value,
            })
          }
          className="bg-black border border-white/10 rounded-2xl px-4 py-3"
        />

        <select
          value={form.type}
          onChange={(e) =>
            setForm({
              ...form,
              type:
                e.target.value,
            })
          }
          className="bg-black border border-white/10 rounded-2xl px-4 py-3"
        >

          <option>
            PS5
          </option>

          <option>
            PS4
          </option>

          <option>
            Gaming PC
          </option>

          <option>
            Racing Simulator
          </option>

          <option>
            VR
          </option>

        </select>

        <input
          type="number"
          required
          placeholder="Hourly Rate"
          value={form.hourlyRate}
          onChange={(e) =>
            setForm({
              ...form,
              hourlyRate:
                Number(
                  e.target.value
                ),
            })
          }
          className="bg-black border border-white/10 rounded-2xl px-4 py-3"
        />

        <input
          required
          placeholder="Location"
          value={form.location}
          onChange={(e) =>
            setForm({
              ...form,
              location:
                e.target.value,
            })
          }
          className="bg-black border border-white/10 rounded-2xl px-4 py-3"
        />

        <button
          disabled={loading}
          className="md:col-span-2 xl:col-span-4 bg-cyan-400 text-black font-bold py-4 rounded-2xl hover:bg-cyan-300 transition"
        >

          {loading
            ? "Creating..."
            : "Add Device"}

        </button>

      </form>

      {/* DEVICES */}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

        {devices.map((device) => (

          <div
            key={device.id}
            className="bg-zinc-950 border border-white/10 rounded-3xl p-6"
          >

            <div className="flex items-start justify-between">

              <div>

                <h2 className="text-2xl font-black text-white">
                  {device.name}
                </h2>

                <p className="text-zinc-400 mt-1">
                  {device.type}
                </p>

              </div>

              <span
                className={`
                  px-3 py-1 rounded-full text-xs font-bold

                  ${
                    device.status ===
                    "available"
                      ? "bg-green-500/20 text-green-400"

                    : device.status ===
                      "busy"
                      ? "bg-red-500/20 text-red-400"

                    : "bg-yellow-500/20 text-yellow-400"
                  }
                `}
              >

                {device.status}

              </span>

            </div>

            <div className="mt-6 space-y-2 text-zinc-300">

              <p>
                Hourly Rate:
                ${device.hourlyRate}
              </p>

              <p>
                Location:
                {device.location}
              </p>

            </div>

            <div className="mt-6 flex flex-wrap gap-3">

              <button
                onClick={() =>
                  updateStatus(
                    device.id,
                    "available"
                  )
                }
                className="bg-green-500 text-black px-4 py-2 rounded-xl text-sm font-bold"
              >
                Available
              </button>

              <button
                onClick={() =>
                  updateStatus(
                    device.id,
                    "maintenance"
                  )
                }
                className="bg-yellow-500 text-black px-4 py-2 rounded-xl text-sm font-bold"
              >
                Maintenance
              </button>

              <button
                onClick={() =>
                  deleteDevice(
                    device.id
                  )
                }
                className="bg-red-500 text-black px-4 py-2 rounded-xl text-sm font-bold"
              >
                Delete
              </button>

            </div>

          </div>
        ))}

      </div>

    </main>
  );
}