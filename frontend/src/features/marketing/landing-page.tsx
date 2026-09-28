import {
  AttributionSection,
  BrandsSection,
  CreatorStorefrontSection,
  CtaSection,
  FeaturesSection,
  HeroSection,
  HowItWorksSection,
  InstagramAutomationSection,
  IntegrationsSection,
  LandingFooter,
  LandingHeader,
  RoadmapSection,
} from "./components";

export function LandingPage() {
  return (
    <main className="bg-[#fbf8fc] font-sans text-[#1b1b1e]">
      <LandingHeader />
      <HeroSection />
      <HowItWorksSection />
      <CreatorStorefrontSection />
      <InstagramAutomationSection />
      <AttributionSection />
      <BrandsSection />
      <IntegrationsSection />
      <RoadmapSection />
      <FeaturesSection />
      <CtaSection />
      <LandingFooter />
    </main>
  );
}
