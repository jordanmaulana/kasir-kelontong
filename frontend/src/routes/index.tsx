import { createFileRoute } from "@tanstack/react-router";

import { LandingAudienceStrip } from "@/features/landing/components/landing-audience-strip";
import { LandingFeatures } from "@/features/landing/components/landing-features";
import { LandingFooterCta } from "@/features/landing/components/landing-footer-cta";
import { LandingHero } from "@/features/landing/components/landing-hero";
import { LandingHowItWorks } from "@/features/landing/components/landing-how-it-works";
import { LandingNav } from "@/features/landing/components/landing-nav";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <main>
        <LandingHero />
        <LandingAudienceStrip />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingFooterCta />
      </main>
    </div>
  );
}
