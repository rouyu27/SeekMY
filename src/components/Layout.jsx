import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Home, Map, BookmarkIcon, Activity, Trophy, MessageCircle, Users, Shield, Menu, X, TrendingUp, Compass, LogOut, HelpCircle } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/map", label: "Map", icon: Map },
  { path: "/discover", label: "Discover", icon: Compass },
  { path: "/activity-log", label: "My Activities", icon: Activity },
  { path: "/bookmarks", label: "Bookmarks", icon: BookmarkIcon },
  { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { path: "/insights", label: "Insights", icon: TrendingUp },
  { path: "/chatbot", label: "AI Assistant", icon: MessageCircle },
  { path: "/contributor", label: "Contributors", icon: Users },
  { path: "/admin", label: "Admin", icon: Shield },
  { path: "/help", label: "Help", icon: HelpCircle },
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const visibleNavItems = user?.role === 'admin' ? navItems : navItems.filter(item => item.path !== '/admin');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Nav */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="w-full pl-2 pr-2 sm:pl-3 sm:pr-3 h-16 flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2.5 shrink-0 min-w-0">
            <img src="/images/logo.png" alt="SeekMY" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shadow-sm ring-1 ring-gray-200 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-lg sm:text-xl tracking-tight text-gray-900 leading-none whitespace-nowrap">
                Seek<span className="text-green-600">MY</span>
              </span>
              <span className="text-[9px] text-gray-400 tracking-[0.12em] uppercase font-semibold hidden sm:block mt-0.5 whitespace-nowrap">Outdoor Discovery</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {visibleNavItems.map(({ path, label, icon: Icon }) => {
              const active = location.pathname === path || (path !== "/" && location.pathname.startsWith(path));
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? "bg-green-50 text-green-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* User Account / Auth */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="hidden lg:flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-bold">
                    {(user.full_name || user.email || 'U')[0].toUpperCase()}
                  </div>
                  <div className="flex flex-col leading-none">
                    <span className="text-sm font-medium text-gray-900 max-w-[120px] truncate">{user.full_name || user.email}</span>
                    {user.role === 'admin' && <span className="text-[10px] text-amber-600 font-semibold mt-0.5">ADMIN</span>}
                  </div>
                </div>
                <button onClick={() => logout()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50" title="Logout">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-2">
                <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all">Login</Link>
                <Link to="/register" className="text-sm font-medium text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-all">Sign Up</Link>
              </div>
            )}

            <button
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white px-4 py-3 grid grid-cols-2 gap-1">
            {visibleNavItems.map(({ path, label, icon: Icon }) => {
              const active = location.pathname === path || (path !== "/" && location.pathname.startsWith(path));
              return (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    active ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
            {user && (
              <button onClick={() => logout()} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 col-span-2 mt-2 border-t border-gray-100 pt-3">
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            )}
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-gray-100 py-6 text-center text-sm text-gray-400">
        <p>SeekMY — Malaysia Outdoor Activity Discovery Platform &copy; 2026 · Visit Malaysia 2026</p>
      </footer>
    </div>
  );
}
