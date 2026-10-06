"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Destination = Readonly<{
  href: string;
  label: string;
  routes: readonly string[];
  icon: "home" | "money" | "plan" | "timeline" | "settings";
  disabled?: boolean;
}>;

const mobileDestinations: readonly Destination[] = [
  { href: "/", label: "Home", routes: ["/"], icon: "home" },
  {
    href: "/accounts",
    label: "Accounts",
    routes: ["/accounts"],
    icon: "money",
  },
  {
    href: "/plan",
    label: "Plan",
    routes: ["/plan", "/scenario", "/explore", "/build"],
    icon: "plan",
  },
  {
    href: "/settings",
    label: "Settings",
    routes: ["/settings", "/methodology", "/privacy"],
    icon: "settings",
  },
] as const;

const desktopDestinations = [
  { href: "/", label: "Home", routes: ["/"] },
  { href: "/accounts", label: "Accounts", routes: ["/accounts"] },
  {
    href: "/plan",
    label: "Plan",
    routes: ["/plan", "/scenario", "/explore", "/build"],
  },
  {
    href: "/settings",
    label: "Settings",
    routes: ["/settings", "/methodology", "/privacy"],
  },
] as const;

function isActive(pathname: string, routes: readonly string[]): boolean {
  return routes.some((route) =>
    route === "/" ? pathname === route : pathname.startsWith(route),
  );
}

function NavigationIcon({ icon }: Readonly<{ icon: Destination["icon"] }>) {
  if (icon === "home")
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M4 10.5 12 4l8 6.5V20h-5v-6H9v6H4z" />
      </svg>
    );
  if (icon === "money")
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <rect height="14" rx="2" width="18" x="3" y="5" />
        <circle cx="12" cy="12" r="3" />
        <path d="M6 9h1M17 15h1" />
      </svg>
    );
  if (icon === "plan")
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M5 19V9m7 10V5m7 14v-7" />
      </svg>
    );
  if (icon === "timeline")
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M4 12h4l2-5 4 10 2-5h4" />
      </svg>
    );
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
    </svg>
  );
}

export function DesktopNavigation() {
  const pathname = usePathname();
  return (
    <nav className="desktop-navigation" aria-label="Primary navigation">
      <ul className="nav-list">
        {desktopDestinations.map((destination) => {
          const active = isActive(pathname, destination.routes);
          return (
            <li key={destination.href}>
              <Link
                aria-current={active ? "page" : undefined}
                href={destination.href}
              >
                {destination.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function MobileNavigation() {
  const pathname = usePathname();
  return (
    <nav className="mobile-navigation" aria-label="App navigation">
      <ul>
        {mobileDestinations.map((destination) => {
          const active = isActive(pathname, destination.routes);
          return (
            <li key={destination.href}>
              <Link
                aria-current={active ? "page" : undefined}
                href={destination.href}
              >
                <NavigationIcon icon={destination.icon} />
                <span>{destination.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
