export default function AdminLoading() {
  return (
    <div className="flex items-center justify-center py-20">

      <div className="space-y-4 text-center">

        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />

        <p className="text-slate-400">
          Loading data...
        </p>

      </div>

    </div>
  );
}