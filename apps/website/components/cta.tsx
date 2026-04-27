import Link from "next/link";
import { GridSection } from "./grid-section";

export function CTA() {
  return (
    <GridSection className="py-24 px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight mb-3">
          Your background jobs deserve a dashboard.
        </h2>
        <p className="text-muted-foreground mb-8">No credit card required.</p>
        <Link
          href="https://app.pingback.lol/register"
          className="bg-gradient-to-b from-accent to-accent/80 text-accent-foreground px-8 py-2.5 rounded-full text-sm font-medium shadow-[0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_1px_3px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15)] hover:brightness-110 active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] active:brightness-95 transition-all inline-block"
        >
          Get Started
        </Link>
    </GridSection>
  );
}
