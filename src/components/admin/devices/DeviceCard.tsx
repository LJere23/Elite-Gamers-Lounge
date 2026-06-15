"use client";

import { Device } from "@/types/device";

interface DeviceCardProps {
  device: Device;

  onStatusChange: (
    id: string,
    status: Device["status"]
  ) => void;
}

export default function DeviceCard({
  device,
  onStatusChange,
}: DeviceCardProps) {

  const statusColors = {
    available:
      "bg-green-500/20 text-green-300",

    busy:
      "bg-yellow-500/20 text-yellow-300",

    maintenance:
      "bg-red-500/20 text-red-300",
  };

  return (
    <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6">

      <div className="flex items-start justify-between gap-4">

        <div>

          <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">
            {device.type}
          </p>

          <h2 className="mt-2 text-2xl font-black text-white">
            {device.name}
          </h2>

        </div>

        <span
          className={`
            px-3 py-1 rounded-full text-xs uppercase
            ${statusColors[device.status]}
          `}
        >
          {device.status}
        </span>

      </div>

      <div className="mt-6 space-y-2 text-sm text-slate-300">

        <p>
          Hourly rate:
          <span className="text-white font-semibold ml-2">
            ${device.hourlyRate}
          </span>
        </p>

        <p>
          Location:
          <span className="text-white font-semibold ml-2">
            {device.location}
          </span>
        </p>

        {device.currentSessionId ? (
          <p>
            Current session:
            <span className="text-white font-semibold ml-2">
              {device.currentSessionId}
            </span>
          </p>
        ) : null}

      </div>

      <div className="mt-6 flex flex-wrap gap-3">

        <button
          onClick={() =>
            onStatusChange(
              device.id,
              "available"
            )
          }
          className="px-4 py-2 rounded-xl bg-green-500 text-black font-semibold"
        >
          Available
        </button>

        <button
          onClick={() =>
            onStatusChange(
              device.id,
              "busy"
            )
          }
          className="px-4 py-2 rounded-xl bg-yellow-500 text-black font-semibold"
        >
          Busy
        </button>

        <button
          onClick={() =>
            onStatusChange(
              device.id,
              "maintenance"
            )
          }
          className="px-4 py-2 rounded-xl bg-red-500 text-black font-semibold"
        >
          Maintenance
        </button>

      </div>

    </div>
  );
}