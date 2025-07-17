
import { HomeIcon, Users, CalendarIcon, BookOpenIcon, CogIcon, UserIcon } from "lucide-react";

/**
 * Central place for defining the navigation items. Used for navigation components and routing.
 */
export const navItems = [
  {
    title: "Home",
    to: "/",
    icon: HomeIcon,
  },
  {
    title: "Dashboard",
    to: "/dashboard",
    icon: HomeIcon,
  },
  {
    title: "Apply as Founder",
    to: "/apply-founder",
    icon: UserIcon,
  },
  {
    title: "Apply as Advisor",
    to: "/apply-advisor",
    icon: Users,
  },
  {
    title: "Login",
    to: "/login",
    icon: UserIcon,
  },
  {
    title: "Sign Up",
    to: "/signup",
    icon: UserIcon,
  },
];
