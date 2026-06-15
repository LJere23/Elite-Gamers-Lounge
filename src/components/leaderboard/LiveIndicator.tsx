export default function LiveIndicator() {
  return (
    <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium">

      <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />

      Live

    </div>
  );
}