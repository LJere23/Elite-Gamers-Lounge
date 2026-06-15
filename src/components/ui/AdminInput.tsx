interface AdminInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export default function AdminInput({
  label,
  className = "",
  ...props
}: AdminInputProps) {
  return (
    <label className="block text-sm font-semibold text-slate-100">

      {label}

      <input
        className={`
          mt-3 w-full rounded-3xl
          border border-white/10
          bg-black/40
          px-4 py-3
          text-white
          outline-none
          focus:border-cyan-400
          ${className}
        `}
        {...props}
      />

    </label>
  );
}