'use client';

import { useEffect, useState } from 'react';
import TaskList from '../../components/TaskList';

interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  highPriorityTasks: number;
  overdueTasks: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    completedTasks: 0,
    highPriorityTasks: 0,
    overdueTasks: 0
  });

  useEffect(() => {
    // Fetch dashboard stats
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/tasks');
        if (!response.ok) throw new Error('Failed to fetch tasks');
        const tasks = await response.json();
        
        const now = new Date();
        const stats = {
          totalTasks: tasks.length,
          completedTasks: tasks.filter((t: any) => t.status === 'Done').length,
          highPriorityTasks: tasks.filter((t: any) => t.priority === 'High').length,
          overdueTasks: tasks.filter((t: any) => 
            t.dueDate && new Date(t.dueDate) < now && t.status !== 'Done'
          ).length
        };
        
        setStats(stats);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Total Tasks</h3>
          <p className="mt-2 text-3xl font-semibold">{stats.totalTasks}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Completed</h3>
          <p className="mt-2 text-3xl font-semibold text-green-600">{stats.completedTasks}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">High Priority</h3>
          <p className="mt-2 text-3xl font-semibold text-red-600">{stats.highPriorityTasks}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Overdue</h3>
          <p className="mt-2 text-3xl font-semibold text-yellow-600">{stats.overdueTasks}</p>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Recent Tasks</h2>
        </div>
        <div className="p-6">
          <TaskList />
        </div>
      </div>

      {/* Calendar Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Upcoming Events</h2>
          <div className="space-y-4">
            {/* Placeholder for calendar events */}
            <div className="flex items-center p-3 rounded-lg bg-blue-50">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-medium">15</span>
              </div>
              <div className="ml-4">
                <h3 className="font-medium">Team Meeting</h3>
                <p className="text-sm text-gray-500">10:00 AM - 11:00 AM</p>
              </div>
            </div>
          </div>
        </div>

        {/* Task Analytics */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Task Analytics</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>High Priority</span>
                <span>{Math.round((stats.highPriorityTasks / stats.totalTasks) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-600 h-2 rounded-full" 
                  style={{ width: `${(stats.highPriorityTasks / stats.totalTasks) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Completed</span>
                <span>{Math.round((stats.completedTasks / stats.totalTasks) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${(stats.completedTasks / stats.totalTasks) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 