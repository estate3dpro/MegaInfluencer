import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Pill } from "./pill";

interface NavItem {
  id: string;
  name: string;
  targetId: string;
}

const navItems: NavItem[] = [
  { id: "platform", name: "Platform", targetId: "architecture" },
  { id: "integrations", name: "Integrations", targetId: "integrations" },
  { id: "roadmap", name: "Roadmap", targetId: "roadmap" },
];

export function LandingHeader() {
  const [activeTab, setActiveTab] = useState<string>("platform");

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 160;

      const roadmapEl = document.getElementById("roadmap");
      const integrationsEl = document.getElementById("integrations");
      const architectureEl = document.getElementById("architecture");

      if (roadmapEl && scrollPosition >= roadmapEl.offsetTop) {
        setActiveTab("roadmap");
      } else if (integrationsEl && scrollPosition >= integrationsEl.offsetTop) {
        setActiveTab("integrations");
      } else if (architectureEl && scrollPosition >= architectureEl.offsetTop - 100) {
        setActiveTab("platform");
      } else {
        setActiveTab("platform");
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    targetId: string,
    tabId: string,
  ) => {
    e.preventDefault();
    setActiveTab(tabId);

    const element = document.getElementById(targetId);
    if (element) {
      const headerOffset = 85;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });

      window.history.pushState(null, "", `#${targetId}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#c8c4d7]/60 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-5 px-5 sm:px-8">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
            window.history.pushState(null, "", "#top");
            setActiveTab("platform");
          }}
          className="flex shrink-0 items-center gap-2.5 font-display text-lg font-bold tracking-tight transition hover:opacity-90"
        >
          <img src="/logo/MI_Logo.svg" alt="" className="h-9 w-9" />
          MegaInfluencer
          <span className="hidden rounded-full border border-[#c8c4d7]/60 bg-[#f0edf1] px-2.5 py-0.5 text-[11px] font-medium text-[#474554] sm:inline">
            Creator Commerce
          </span>
        </a>

        <nav className="relative hidden rounded-full border border-[#c8c4d7]/50 bg-[#f6f2f7] p-1.5 md:flex">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.targetId}`}
                onClick={(e) => handleNavClick(e, item.targetId, item.id)}
                className={`relative z-10 flex items-center rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? "bg-white text-[#1b1b1e] shadow-sm"
                    : "text-[#474554] hover:text-[#1b1b1e] hover:bg-white/50"
                }`}
              >
                {item.name}
                {item.name === "Roadmap" ? (
                  <i
                    className={`ml-2 inline-block h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                      isActive ? "bg-[#5341cd]" : "bg-[#5341cd]/60"
                    }`}
                  />
                ) : null}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          <Pill tone="green">Shopify & IG active</Pill>
          <Link
            to="/login"
            className="hidden text-sm font-semibold text-[#474554] hover:text-[#1b1b1e] sm:block"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center rounded-xl bg-[#5341cd] px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4029ba] sm:px-5"
          >
            Launch app <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
