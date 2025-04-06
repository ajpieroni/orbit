'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, Home, CheckSquare, Folder, BarChart2, Bell, Settings } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out ${isSidebarCollapsed ? '-translate-x-full' : 'translate-x-0'}`}>
        <div className="flex flex-col h-full">
          {/* Logo and Toggle */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-gray-900">Orbit</span>
            </Link>
            <button
              onClick={() => setIsSidebarCollapsed(true)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-900"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <ul className="space-y-2">
              <li>
                <Link
                  href="/dashboard"
                  className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${
                    pathname === '/dashboard'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Home className="w-5 h-5" />
                  <span>Overview</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/tasks"
                  className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${
                    pathname === '/dashboard/tasks'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <CheckSquare className="w-5 h-5" />
                  <span>Tasks</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/projects"
                  className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${
                    pathname === '/dashboard/projects'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Folder className="w-5 h-5" />
                  <span>Projects</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/analytics"
                  className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${
                    pathname === '/dashboard/analytics'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <BarChart2 className="w-5 h-5" />
                  <span>Analytics</span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-200 ease-in-out ${isSidebarCollapsed ? 'ml-0' : 'ml-64'}`}>
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              {isSidebarCollapsed && (
                <button
                  onClick={() => setIsSidebarCollapsed(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-900"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
              <h1 className="text-xl font-semibold text-gray-900">
                {pathname === '/dashboard' && 'Overview'}
                {pathname === '/dashboard/tasks' && 'Tasks'}
                {pathname === '/dashboard/projects' && 'Projects'}
                {pathname === '/dashboard/analytics' && 'Analytics'}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-900">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-900">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 