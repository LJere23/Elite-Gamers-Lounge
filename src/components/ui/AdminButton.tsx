interface AdminButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "danger" | "secondary";
}

export default function AdminButton({
  variant = "primary",
  className = "",
  children,
  ...props
}: AdminButtonProps) {

  const styles = {
    primary:
      "bg-cyan-500 hover:bg-cyan-400 text-black",

    danger:
      "bg-red-500 hover:bg-red-400 text-black",

    secondary:
      "bg-white/10 hover:bg-white/20 text-white",
  };

  return (
    <button
      className={`
        px-5 py-3 rounded-2xl
        font-semibold transition-all
        active:scale-95
        ${styles[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}