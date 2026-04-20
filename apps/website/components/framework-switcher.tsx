"use client";

import { useState } from "react";

const frameworks = [
  { id: "next", label: "Next.js" },
  { id: "nuxt", label: "Nuxt", disabled: true },
  { id: "sveltekit", label: "SvelteKit", disabled: true },
];

interface FrameworkSwitcherProps {
  children: Record<string, React.ReactNode>;
}

export function FrameworkSwitcher({ children }: FrameworkSwitcherProps) {
  const [active, setActive] = useState("next");

  return (
    <div className="my-4">
      <div className="flex gap-0 border-b">
        {frameworks.map((fw) => (
          <button
            key={fw.id}
            onClick={() => !fw.disabled && setActive(fw.id)}
            className={`px-3 py-1.5 text-xs font-medium transition-colors relative ${
              active === fw.id
                ? "text-accent"
                : fw.disabled
                  ? "text-muted-foreground/40 cursor-not-allowed"
                  : "text-muted-foreground hover:text-foreground cursor-pointer"
            }`}
          >
            {fw.label}
            {fw.disabled && (
              <span className="ml-1 text-[10px] text-muted-foreground/30">soon</span>
            )}
            {active === fw.id && (
              <div className="absolute bottom-0 left-0 right-0 h-px bg-accent" />
            )}
          </button>
        ))}
      </div>
      <div>{children[active]}</div>
    </div>
  );
}
