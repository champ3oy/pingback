export function GridSection({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className="border-b relative">
      <div className={`max-w-5xl mx-auto border-x relative ${className}`}>
        {/* Top-left diamond */}
        <div className="absolute -top-[5px] -left-[5px] w-2.5 h-2.5 rotate-45 border border-border bg-background z-10 hidden md:block" />
        {/* Top-right diamond */}
        <div className="absolute -top-[5px] -right-[5px] w-2.5 h-2.5 rotate-45 border border-border bg-background z-10 hidden md:block" />
        {/* Bottom-left diamond */}
        <div className="absolute -bottom-[5px] -left-[5px] w-2.5 h-2.5 rotate-45 border border-border bg-background z-10 hidden md:block" />
        {/* Bottom-right diamond */}
        <div className="absolute -bottom-[5px] -right-[5px] w-2.5 h-2.5 rotate-45 border border-border bg-background z-10 hidden md:block" />
        {children}
      </div>
    </section>
  );
}
