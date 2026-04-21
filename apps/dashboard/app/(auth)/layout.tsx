function GridDot({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      className="absolute w-2.5 h-2.5 rotate-45 border bg-background z-10"
      style={{ borderColor: "var(--border)", ...style }}
    />
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: "#121210" }}
    >
      {/* Vertical grid lines */}
      <div className="fixed inset-0 flex justify-center pointer-events-none">
        <div className="w-full max-w-sm h-full border-x" style={{ borderColor: "var(--border)" }} />
      </div>

      {/* Horizontal grid lines */}
      <div
        className="fixed left-0 right-0 border-t pointer-events-none"
        style={{ borderColor: "var(--border)", top: "15%" }}
      />
      <div
        className="fixed left-0 right-0 border-t pointer-events-none"
        style={{ borderColor: "var(--border)", top: "85%" }}
      />

      {/* Corner dots at intersections */}
      <div className="fixed inset-0 flex justify-center pointer-events-none">
        <div className="w-full max-w-sm h-full relative">
          <GridDot style={{ top: "calc(15% - 5px)", left: "-6px" }} />
          <GridDot style={{ top: "calc(15% - 5px)", right: "-6px", left: "auto" }} />
          <GridDot style={{ top: "calc(85% - 5px)", left: "-6px" }} />
          <GridDot style={{ top: "calc(85% - 5px)", right: "-6px", left: "auto" }} />
        </div>
      </div>

      {/* Content */}
      <div className="w-full max-w-sm relative z-20 px-12">
        {children}
      </div>
    </div>
  );
}
