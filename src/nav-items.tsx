
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import AdvisorDashboard from "@/pages/AdvisorDashboard";
import FounderDashboard from "@/pages/FounderDashboard";
import ResourceCenter from "@/pages/ResourceCenter";

export const navItems = [
  {
    to: "/",
    page: <Index />,
    title: "Home"
  },
  {
    to: "/login",
    page: <Login />,
    title: "Login"
  },
  {
    to: "/signup",
    page: <Signup />,
    title: "Sign Up"
  },
  {
    to: "/dashboard",
    page: <Dashboard />,
    title: "Dashboard"
  },
  {
    to: "/admin-dashboard",
    page: <AdminDashboard />,
    title: "Admin Dashboard"
  },
  {
    to: "/advisor-dashboard", 
    page: <AdvisorDashboard />,
    title: "Advisor Dashboard"
  },
  {
    to: "/founder-dashboard",
    page: <FounderDashboard />,
    title: "Founder Dashboard"
  },
  {
    to: "/resources",
    page: <ResourceCenter />,
    title: "Resources"
  }
];
