interface AdminSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: string[];
}

export default function AdminSelect({
  label,
  options,
  className = "",
  ...props
}: AdminSelectProps) {
  return (
    <label className="block text-sm font-semibold text-slate-100">

      {label}

      <select
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
      >

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}

      </select>

    </label>
  );
}