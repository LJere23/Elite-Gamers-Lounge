interface SectionHeadingProps {
  title: string;
  subtitle: string;
}

export default function SectionHeading({
  title,
  subtitle,
}: SectionHeadingProps) {
  return (
    <div className="text-center mb-16">

      <p className="uppercase tracking-[0.3em] text-purple-400 mb-4">
        {subtitle}
      </p>

      <h2 className="text-4xl md:text-6xl font-black uppercase">
        {title}
      </h2>

    </div>
  );
}