"use client";

import { Device } from "@/types/device";

import DeviceCard from "./DeviceCard";

interface DeviceGridProps {
  devices: Device[];

  onStatusChange: (
    id: string,
    status: Device["status"]
  ) => void;
}

export default function DeviceGrid({
  devices,
  onStatusChange,
}: DeviceGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

      {devices.map((device) => (

        <DeviceCard
          key={device.id}
          device={device}
          onStatusChange={onStatusChange}
        />

      ))}

    </div>
  );
}