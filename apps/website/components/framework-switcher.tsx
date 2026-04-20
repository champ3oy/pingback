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
    <div className="my-4 rounded-lg border bg-[#0d1117] overflow-hidden">
      <div className="flex gap-0 border-b border-[#2a2a25] px-1">
        {frameworks.map((fw) => (
          <button
            key={fw.id}
            onClick={() => !fw.disabled && setActive(fw.id)}
            className={`px-3 py-2 text-xs font-medium transition-colors relative ${
              active === fw.id
                ? "text-white"
                : fw.disabled
                  ? "text-gray-600 cursor-not-allowed"
                  : "text-gray-400 hover:text-gray-200 cursor-pointer"
            }`}
          >
            {fw.label}
            {fw.disabled && (
              <span className="ml-1 text-[10px] text-gray-700">soon</span>
            )}
            {active === fw.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
            )}
          </button>
        ))}
      </div>
      <div className="[&_.rounded-lg]:rounded-none [&_.border]:border-0 [&_.bg-\\[\\#0d1117\\]]:bg-transparent [&_.my-4]:my-0">
        {children[active]}
      </div>
    </div>
  );
}
