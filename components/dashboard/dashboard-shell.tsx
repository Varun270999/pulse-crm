'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/app/actions/auth';
import { getNavItemsForRole } from '@/lib/auth/navigation';
import { cn } from '@/lib/utils';
import {
  Activity,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  User,
  Bell,
  LayoutDashboard,
  Users,
  UserPlus,
  Clock,
  Kanban,
  Receipt,
  CreditCard,
  LifeBuoy,
  Briefcase,
  BarChart3,
  ShieldAlert,
  Settings,
} from 'lucide-react';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { IdleSessionTimer } from '@/components/auth/idle-session-timer';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Users,
  UserPlus,
  Clock,
  Kanban,
  Receipt,
  CreditCard,
  LifeBuoy,
  Briefcase,
  BarChart3,
  Bell,
  ShieldAlert,
  Settings,
};

interface UserSessionInfo {
  id?: string;
  name?: string | null;
  email?: string | null;
  role?: string;
  avatarUrl?: string | null;
}

interface DashboardShellProps {
  user: UserSessionInfo;
  children: React.ReactNode;
}

function getInitials(name?: string | null): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getRoleBadgeStyle(role?: string) {
  switch (role) {
    case 'ADMIN':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'MANAGER':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'SALES_EXECUTIVE':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'SUPPORT_AGENT':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

function formatRoleName(role?: string): string {
  if (!role) return 'User';
  return role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const navItems = getNavItemsForRole(user.role);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [pathname]);

  // Current page title derived from active route
  const currentNavItem = navItems.find((item) =>
    item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href)
  );
  const pageTitle = currentNavItem ? currentNavItem.title : 'Dashboard';

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      <IdleSessionTimer />
      {/* Mobile Slide-Out Drawer Backdrop */}
      {isMobileDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsMobileDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Slide-Out Drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white border-r border-gray-200 shadow-2xl transition-transform duration-300 ease-in-out lg:hidden',
          isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between px-5 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-gray-900 text-lg">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Activity className="h-5 w-5" />
            </div>
            <span>Pulse CRM</span>
          </Link>
          <button
            onClick={() => setIsMobileDrawerOpen(false)}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mobile Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Navigation ({formatRoleName(user.role)})
          </div>
          {navItems.map((item) => {
            const Icon = ICON_MAP[item.iconName] || LayoutDashboard;
            const isActive =
              item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <Icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-blue-600' : 'text-gray-500')} />
                <span className="truncate">{item.title}</span>
                {user.role === 'SUPPORT_AGENT' && item.title === 'Clients' && (
                  <span className="ml-auto text-[10px] font-medium bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                    Read-Only
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Mobile Sidebar Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
              {getInitials(user.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name || 'User'}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main App Container */}
      <div className="flex flex-1">
        {/* Desktop Collapsible Left Sidebar */}
        <aside
          className={cn(
            'hidden lg:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out shrink-0 sticky top-0 h-screen z-20',
            isSidebarCollapsed ? 'w-20' : 'w-64'
          )}
        >
          {/* Sidebar Header with Pulse CRM Wordmark */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-100">
            <Link
              href="/dashboard"
              className={cn(
                'flex items-center gap-2.5 font-bold text-gray-900 text-lg transition-opacity duration-200',
                isSidebarCollapsed && 'justify-center w-full'
              )}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                <Activity className="h-5 w-5" />
              </div>
              {!isSidebarCollapsed && <span className="tracking-tight">Pulse CRM</span>}
            </Link>

            {!isSidebarCollapsed && (
              <button
                onClick={() => setIsSidebarCollapsed(true)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Collapsed Expand Toggle Button */}
          {isSidebarCollapsed && (
            <div className="flex justify-center py-2 border-b border-gray-100">
              <button
                onClick={() => setIsSidebarCollapsed(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Desktop Navigation List */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {!isSidebarCollapsed && (
              <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Menu • {formatRoleName(user.role)}
              </div>
            )}
            {navItems.map((item) => {
              const Icon = ICON_MAP[item.iconName] || LayoutDashboard;
              const isActive =
                item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isSidebarCollapsed ? item.title : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all group',
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                    isSidebarCollapsed && 'justify-center px-2 py-2.5'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 shrink-0 transition-transform group-hover:scale-105',
                      isActive ? 'text-blue-600' : 'text-gray-500'
                    )}
                  />
                  {!isSidebarCollapsed && <span className="truncate">{item.title}</span>}
                  {!isSidebarCollapsed && user.role === 'SUPPORT_AGENT' && item.title === 'Clients' && (
                    <span className="ml-auto text-[10px] font-medium bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                      RO
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Sidebar Footer Info */}
          <div className="p-3 border-t border-gray-100 bg-gray-50/50">
            <div className={cn('flex items-center gap-3', isSidebarCollapsed && 'justify-center')}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-xs font-semibold text-white shadow-xs">
                {getInitials(user.name)}
              </div>
              {!isSidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 truncate">{user.name || 'User'}</p>
                  <span
                    className={cn(
                      'inline-block px-1.5 py-0.5 text-[10px] font-medium rounded border uppercase',
                      getRoleBadgeStyle(user.role)
                    )}
                  >
                    {formatRoleName(user.role)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Content Wrapper */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 backdrop-blur-md px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              {/* Mobile Hamburger Toggle */}
              <button
                onClick={() => setIsMobileDrawerOpen(true)}
                className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 lg:hidden transition-colors"
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Dynamic Page Title */}
              <div>
                <h1 className="text-lg font-bold text-gray-900 sm:text-xl">{pageTitle}</h1>
              </div>
            </div>

            {/* Right Top Bar: Notifications & User Menu */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Interactive Notification Bell */}
              <NotificationBell />

              {/* User Dropdown Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2.5 rounded-full p-1 text-left hover:bg-gray-50 transition-colors focus:outline-hidden"
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="true"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white shadow-xs">
                    {getInitials(user.name)}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-xs font-semibold text-gray-900 leading-tight">{user.name || 'User'}</p>
                    <p className="text-[10px] text-gray-500">{formatRoleName(user.role)}</p>
                  </div>
                  <ChevronDown className="hidden md:block h-3.5 w-3.5 text-gray-400" />
                </button>

                {/* Dropdown Menu Panel */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-gray-100 bg-white p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                    <div className="px-3 py-2 border-b border-gray-100 mb-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.name || 'User'}</p>
                      <p className="text-xs text-gray-500 truncate mb-1.5">{user.email}</p>
                      <span
                        className={cn(
                          'inline-block px-2 py-0.5 text-[10px] font-medium rounded-full border',
                          getRoleBadgeStyle(user.role)
                        )}
                      >
                        {formatRoleName(user.role)}
                      </span>
                    </div>

                    <Link
                      href="/dashboard/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                    >
                      <User className="h-4 w-4 text-gray-500" />
                      Profile & Account
                    </Link>

                    <Link
                      href="/dashboard/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                    >
                      <Settings className="h-4 w-4 text-gray-500" />
                      Settings
                    </Link>

                    <div className="my-1 border-t border-gray-100" />

                    <form action={logoutAction} className="w-full">
                      <button
                        type="submit"
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4 text-red-500" />
                        Log out
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Main Body Area */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
