import type { LucideIcon } from "lucide-react";
import {
  AwardIcon,
  BookOpenIcon,
  CalendarIcon,
  CreditCardIcon,
  DumbbellIcon,
  FileTextIcon,
  GraduationCapIcon,
  HandshakeIcon,
  HeartIcon,
  ImageIcon,
  LandmarkIcon,
  LayoutDashboardIcon,
  MailIcon,
  ReceiptIcon,
  ShieldIcon,
  UsersIcon,
  UserPlusIcon,
  WalletIcon,
  BedIcon,
  ChurchIcon,
} from "lucide-react";
import type { AdminModule, AdminRole } from "@/lib/admin/roles";
import {
  canAccessAdminModule,
  isFullAccessAdminRole,
} from "@/lib/admin/roles";

export type AdminNavGroupKey =
  | "dashboard"
  | "secretary"
  | "treasurer"
  | "multimedia"
  | "sports"
  | "welfare"
  | "academic";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  module: AdminModule;
  isAccessible: boolean;
};

export type NavGroup = {
  key: AdminNavGroupKey;
  title: string;
  icon: LucideIcon;
  items: NavItem[];
};

type NavGroupDefinition = Omit<NavGroup, "items"> & {
  items: Omit<NavItem, "isAccessible">[];
};

const DASHBOARD_NAV_ITEM: Omit<NavItem, "isAccessible"> = {
  title: "Dashboard",
  href: "/admin",
  icon: LayoutDashboardIcon,
  module: "dashboard",
};

const NAV_GROUPS: NavGroupDefinition[] = [
  {
    key: "secretary",
    title: "Secretary",
    icon: ShieldIcon,
    items: [
      {
        title: "Rank Holders",
        href: "/admin/secretary/rank-holders",
        icon: AwardIcon,
        module: "rank-holders",
      },
      {
        title: "Intakes",
        href: "/admin/secretary/intakes",
        icon: UsersIcon,
        module: "intakes",
      },
      {
        title: "Cadets",
        href: "/admin/secretary/cadets",
        icon: UserPlusIcon,
        module: "cadets",
      },
    ],
  },
  {
    key: "treasurer",
    title: "Treasurer",
    icon: WalletIcon,
    items: [
      {
        title: "Accounts",
        href: "/admin/treasurer/accounts",
        icon: LandmarkIcon,
        module: "accounts",
      },
      {
        title: "Collections",
        href: "/admin/treasurer/collections",
        icon: WalletIcon,
        module: "collections",
      },
      {
        title: "Payments",
        href: "/admin/treasurer/payments",
        icon: CreditCardIcon,
        module: "payments",
      },
      {
        title: "Expenses",
        href: "/admin/treasurer/expenses",
        icon: ReceiptIcon,
        module: "expenses",
      },
      {
        title: "Claims",
        href: "/admin/treasurer/claims",
        icon: FileTextIcon,
        module: "claims",
      },
    ],
  },
  {
    key: "multimedia",
    title: "Multimedia",
    icon: ImageIcon,
    items: [
      {
        title: "Portfolio",
        href: "/admin/multimedia/portfolio",
        icon: ImageIcon,
        module: "portfolio",
      },
      {
        title: "Stories",
        href: "/admin/multimedia/stories",
        icon: BookOpenIcon,
        module: "stories",
      },
      {
        title: "Newsletters",
        href: "/admin/multimedia/newsletters",
        icon: MailIcon,
        module: "newsletters",
      },
    ],
  },
  {
    key: "sports",
    title: "Sports",
    icon: DumbbellIcon,
    items: [
      {
        title: "Activities",
        href: "/admin/sports/activities",
        icon: DumbbellIcon,
        module: "activities",
      },
      {
        title: "Collaborations",
        href: "/admin/sports/collaborations",
        icon: HandshakeIcon,
        module: "collaborations",
      },
    ],
  },
  {
    key: "welfare",
    title: "Welfare",
    icon: HeartIcon,
    items: [
      {
        title: "Health",
        href: "/admin/welfare/health",
        icon: HeartIcon,
        module: "health",
      },
      {
        title: "Accommodations",
        href: "/admin/welfare/accommodations",
        icon: BedIcon,
        module: "accommodations",
      },
      {
        title: "Religion",
        href: "/admin/welfare/religion",
        icon: ChurchIcon,
        module: "religion",
      },
    ],
  },
  {
    key: "academic",
    title: "Academic",
    icon: GraduationCapIcon,
    items: [
      {
        title: "Results",
        href: "/admin/academic/results",
        icon: GraduationCapIcon,
        module: "results",
      },
      {
        title: "Timetables",
        href: "/admin/academic/timetables",
        icon: CalendarIcon,
        module: "timetables",
      },
    ],
  },
];

function normalizePathname(pathname: string) {
  return pathname.replace(/\/+$/, "") || "/";
}

function toTitleCase(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isPathActive(pathname: string, href: string) {
  const normalizedPathname = normalizePathname(pathname);
  const normalizedHref = normalizePathname(href);

  if (normalizedHref === "/admin") {
    return normalizedPathname === "/admin";
  }

  return (
    normalizedPathname === normalizedHref ||
    normalizedPathname.startsWith(`${normalizedHref}/`)
  );
}

export function getNavConfig(role: AdminRole): NavGroup[] {
  return NAV_GROUPS.flatMap((group) => {
    const items = group.items.map((item) => ({
      ...item,
      isAccessible: isFullAccessAdminRole(role)
        ? true
        : canAccessAdminModule(role, item.module),
    }));

    if (!items.some((item) => item.isAccessible)) {
      return [];
    }

    return { ...group, items };
  });
}

export function getDashboardNavItem(role: AdminRole) {
  return {
    ...DASHBOARD_NAV_ITEM,
    isAccessible: isFullAccessAdminRole(role),
  };
}

export function getActiveNavLocation(role: AdminRole, pathname: string) {
  const groups = getNavConfig(role);

  for (const group of groups) {
    const activeItem = group.items.find((item) => isPathActive(pathname, item.href));

    if (activeItem) {
      return { group, item: activeItem };
    }
  }

  return null;
}

export function getDefaultOpenGroupKey(role: AdminRole, pathname: string) {
  const activeLocation = getActiveNavLocation(role, pathname);
  return activeLocation?.group.key ?? null;
}

export function getAdminBreadcrumbLabels(role: AdminRole, pathname: string) {
  const activeLocation = getActiveNavLocation(role, pathname);

  if (activeLocation) {
    return [activeLocation.group.title, activeLocation.item.title];
  }

  const normalizedPathname = normalizePathname(pathname);

  if (normalizedPathname === "/admin") {
    return ["Dashboard"];
  }

  const segments = normalizedPathname
    .replace(/^\/admin\/?/, "")
    .split("/")
    .filter(Boolean);

  if (segments.length === 0) {
    return ["Dashboard"];
  }

  return segments.map((segment) => toTitleCase(decodeURIComponent(segment)));
}
