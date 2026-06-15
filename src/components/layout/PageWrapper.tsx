import { ReactNode } from "react";

interface PageWrapperProps {
  children: ReactNode;
}

export default function PageWrapper({
  children,
}: PageWrapperProps) {
  return (
    <main className="min-h-screen bg-[#0B0B0F] text-white">
      {children}
    </main>
  );
}