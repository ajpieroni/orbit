'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r transition-all duration-300`}>
        <div className="flex items-center justify-between p-4 border-b">
          {sidebarOpen && <h1 className="text-xl font-bold">Orbit</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {sidebarOpen ? '←' : '→'}
          </button>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <Link 
                href="/dashboard" 
                className={`flex items-center p-2 rounded-lg hover:bg-gray-100 ${
                  isActive('/dashboard') ? 'bg-blue-50 text-blue-600' : ''
                }`}
              >
                <span className="mr-3">📊</span>
                {sidebarOpen && <span>Dashboard</span>}
              </Link>
            </li>
            <li>
              <Link 
                href="/dashboard/tasks" 
                className={`flex items-center p-2 rounded-lg hover:bg-gray-100 ${
                  isActive('/dashboard/tasks') ? 'bg-blue-50 text-blue-600' : ''
                }`}
              >
                <span className="mr-3">✅</span>
                {sidebarOpen && <span>Tasks</span>}
              </Link>
            </li>
            <li>
              <Link 
                href="/dashboard/calendar" 
                className={`flex items-center p-2 rounded-lg hover:bg-gray-100 ${
                  isActive('/dashboard/calendar') ? 'bg-blue-50 text-blue-600' : ''
                }`}
              >
                <span className="mr-3">📅</span>
                {sidebarOpen && <span>Calendar</span>}
              </Link>
            </li>
            <li>
              <Link 
                href="/dashboard/analytics" 
                className={`flex items-center p-2 rounded-lg hover:bg-gray-100 ${
                  isActive('/dashboard/analytics') ? 'bg-blue-50 text-blue-600' : ''
                }`}
              >
                <span className="mr-3">📈</span>
                {sidebarOpen && <span>Analytics</span>}
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              {pathname === '/dashboard' && 'Dashboard'}
              {pathname === '/dashboard/tasks' && 'Tasks'}
              {pathname === '/dashboard/calendar' && 'Calendar'}
              {pathname === '/dashboard/analytics' && 'Analytics'}
            </h2>
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-lg hover:bg-gray-100">
                🔔
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100">
                ⚙️
              </button>
            </div>
          </div>
        </header>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 