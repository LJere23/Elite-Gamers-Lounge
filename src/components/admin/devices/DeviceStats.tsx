import { Device } from "@/types/device";

interface DeviceStatsProps {
  devices: Device[];
}

export default function DeviceStats({
  devices,
}: DeviceStatsProps) {

  const available =
    devices.filter(
      (d) => d.status === "available"
    ).length;

  const busy =
    devices.filter(
      (d) => d.status === "busy"
    ).length;

  const maintenance =
    devices.filter(
      (d) => d.status === "maintenance"
    ).length;

  return (
    <div className="grid gap-6 md:grid-cols-3">

      <div className="rounded-[2rem] bg-green-500/10 border border-green-500/20 p-6">
        <p className="text-green-300 text-sm uppercase">
          Available
        </p>

        <h2 className="mt-3 text-5xl font-black text-white">
          {available}
        </h2>
      </div>

      <div className="rounded-[2rem] bg-yellow-500/10 border border-yellow-500/20 p-6">
        <p className="text-yellow-300 text-sm uppercase">
          Busy
        </p>

        <h2 className="mt-3 text-5xl font-black text-white">
          {busy}
        </h2>
      </div>

      <div className="rounded-[2rem] bg-red-500/10 border border-red-500/20 p-6">
        <p className="text-red-300 text-sm uppercase">
          Maintenance
        </p>

        <h2 className="mt-3 text-5xl font-black text-white">
          {maintenance}
        </h2>
      </div>

    </div>
  );
}