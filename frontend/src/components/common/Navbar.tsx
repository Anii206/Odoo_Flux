import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Search, Sun, Moon, Mail, LogOut, Shield, Briefcase, BarChart3, UserCheck, Layers } from 'lucide-react';
import { User } from '../../types';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenCommandPalette: () => void;
  outboxCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  theme,
  onToggleTheme,
  onOpenCommandPalette,
  outboxCount = 0,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Generate dynamic breadcrumb from location.pathname
  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumb = pathParts.length > 0 ? pathParts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' / ') : 'Overview';

  return (
    <header className="sticky top-0 z-40 bg-[#000000]/90 backdrop-blur-md border-b border-[#222222] text-[#EDEDED] font-sans">
      {/* Row 1: Global Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between text-xs">
        {/* Left: Vercel Logo + Breadcrumbs */}
        <div className="flex items-center gap-3">
          <div onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer group">
            {/* Minimalist Vercel-Style Geometric Triangle Logo */}
            <svg viewBox="0 0 75 65" height="18" width="20" fill="currentColor" className="text-white group-hover:opacity-80 transition">
              <polygon points="37.5,0 75,65 0,65" />
            </svg>
            <span className="font-bold tracking-tight text-white">Brightloop</span>
          </div>

          <span className="text-[#444444] font-mono">/</span>
          <span className="text-[#888888] font-medium hidden sm:inline">Production</span>
          <span className="text-[#444444] font-mono hidden sm:inline">/</span>
          <span className="font-mono text-[#CCCCCC] truncate max-w-[200px]">{breadcrumb}</span>
        </div>

        {/* Center/Right Actions: Cmd+K, Theme, Outbox Bell, Role, Logout */}
        <div className="flex items-center gap-2">
          {/* Cmd + K Palette Trigger */}
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#111111] hover:bg-[#1A1A1A] border border-[#222222] text-[#888888] hover:text-[#EDEDED] transition font-mono text-[11px]"
          >
            <Search className="w-3 h-3" />
            <span className="hidden md:inline">Search...</span>
            <kbd className="hidden sm:inline px-1 py-0.2 rounded bg-[#222222] text-[#AAAAAA] text-[10px]">⌘K</kbd>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            className="p-1.5 rounded-md hover:bg-[#1A1A1A] text-[#888888] hover:text-white transition border border-transparent hover:border-[#222222]"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* User Role Pill & Logout */}
          {user ? (
            <div className="flex items-center gap-2 pl-1 border-l border-[#222222]">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold bg-[#111111] border border-[#333333] text-[#CCCCCC]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0070F3]" />
                <span>{user.role}</span>
              </span>

              <button
                onClick={() => { onLogout(); navigate('/login'); }}
                title="Log Out"
                aria-label="Log Out"
                data-testid="logout-btn"
                className="p-1.5 rounded-md hover:bg-[#1A1A1A] text-[#888888] hover:text-rose-400 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <NavLink to="/login" className="px-3 py-1 rounded-md bg-white text-black font-semibold text-xs hover:bg-[#EAEAEA] transition">
              Sign In
            </NavLink>
          )}
        </div>
      </div>

      {/* Row 2: Sticky Sub-Nav Tabs with Animated/Active Underline */}
      {user && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-10 flex items-center gap-1 overflow-x-auto border-t border-[#161616] text-xs">
          {user.role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `h-full flex items-center px-3 font-medium transition-colors border-b-2 ${
                  isActive ? 'border-white text-white font-semibold' : 'border-transparent text-[#888888] hover:text-[#CCCCCC]'
                }`
              }
            >
              Admin Controls
            </NavLink>
          )}

          {(user.role === 'admin' || user.role === 'staff') && (
            <>
              <NavLink
                to="/workspace"
                className={({ isActive }) =>
                  `h-full flex items-center px-3 font-medium transition-colors border-b-2 ${
                    isActive ? 'border-white text-white font-semibold' : 'border-transparent text-[#888888] hover:text-[#CCCCCC]'
                  }`
                }
              >
                Subscriptions & Invoices
              </NavLink>
              <NavLink
                to="/finance"
                className={({ isActive }) =>
                  `h-full flex items-center px-3 font-medium transition-colors border-b-2 ${
                    isActive ? 'border-white text-white font-semibold' : 'border-transparent text-[#888888] hover:text-[#CCCCCC]'
                  }`
                }
              >
                Finance Analytics
              </NavLink>
            </>
          )}

          {user.role === 'customer' && (
            <NavLink
              to="/portal"
              className={({ isActive }) =>
                `h-full flex items-center px-3 font-medium transition-colors border-b-2 ${
                  isActive ? 'border-white text-white font-semibold' : 'border-transparent text-[#888888] hover:text-[#CCCCCC]'
                }`
              }
            >
              Customer Portal
            </NavLink>
          )}
        </div>
      )}
    </header>
  );
};
