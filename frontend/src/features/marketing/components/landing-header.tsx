import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

interface NavItem {
  id: string;
  name: string;
  targetId?: string;
  href?: string;
}

const navItems: NavItem[] = [
  { id: "platform", name: "Platform", targetId: "architecture" },
  { id: "integrations", name: "Integrations", targetId: "integrations" },
  { id: "roadmap", name: "Roadmap", targetId: "roadmap" },
  { id: "contact", name: "Contact", href: "/contact" },
];

export function LandingHeader() {
  const [activeTab, setActiveTab] = useState<string>("platform");

  useEffect(() => {
    if (window.location.pathname === "/contact") {
      setActiveTab("contact");
      return;
    }

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
    } else {
      window.location.href = `/#${targetId}`;
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#c8c4d7]/60 bg-white/90 backdrop-blur-md">
      <div className="mx-auto grid h-20 max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-5 sm:px-8">
        {/* Left Column: Brand Logo */}
        <div className="flex items-center justify-start">
          <Link
            to="/"
            onClick={() => {
              setActiveTab("platform");
            }}
            className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight text-[#1b1b1e] transition hover:opacity-90"
          >
            <img src="/logo/MI_Logo.svg" alt="" className="h-9 w-9" />
            MegaInfluencer
          </Link>
        </div>

        {/* Center Column: Perfectly Symmetrical Navigation Capsule */}
        <div className="hidden md:flex md:items-center md:justify-center">
          <nav className="flex items-center rounded-full border border-[#c8c4d7]/50 bg-[#f6f2f7] p-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const linkClassName = `relative flex items-center justify-center rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-white text-[#1b1b1e] shadow-sm"
                  : "text-[#474554] hover:text-[#1b1b1e] hover:bg-white/50"
              }`;

              if (item.href) {
                return (
                  <Link key={item.id} to={item.href} className={linkClassName}>
                    {item.name}
                  </Link>
                );
              }

              return (
                <a
                  key={item.id}
                  href={`#${item.targetId}`}
                  onClick={(e) => handleNavClick(e, item.targetId!, item.id)}
                  className={linkClassName}
                >
                  {item.name}
                </a>
              );
            })}
          </nav>
        </div>

        {/* Right Column: Clean Actions */}
        <div className="flex items-center justify-end gap-3 sm:gap-4">
          <Link
            to="/login"
            className="hidden text-sm font-semibold text-[#474554] transition hover:text-[#1b1b1e] sm:block"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center rounded-xl bg-[#5341cd] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4029ba] sm:px-5"
          >
            Launch app <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
