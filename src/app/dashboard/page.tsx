'use client';

import { useEffect, useState } from 'react';
import TaskList from '@/components/TaskList';

interface Task {
  id: string;
  name: string;
  description: string;
  dueDate: string | null;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  zoom: string;
  parentId: string | null;
  children: Task[];
  properties: any;
}

interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  highPriorityTasks: number;
  overdueTasks: number;
  upcomingDeadlines: number;
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    completedTasks: 0,
    highPriorityTasks: 0,
    overdueTasks: 0,
    upcomingDeadlines: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/tasks');
        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }
        const data = await response.json();
        if (data.tasks && Array.isArray(data.tasks)) {
          setTasks(data.tasks);
        } else {
          console.error('Invalid tasks data:', data);
          setTasks([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  useEffect(() => {
    const calculateStats = () => {
      if (!Array.isArray(tasks)) {
        console.error('Tasks is not an array:', tasks);
        return;
      }

      const now = new Date();
      const oneWeekFromNow = new Date();
      oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

      const stats: DashboardStats = {
        totalTasks: tasks.length,
        completedTasks: tasks.filter((t: Task) => t.status === 'Done').length,
        highPriorityTasks: tasks.filter((t: Task) => t.priority === 'High').length,
        overdueTasks: tasks.filter((t: Task) => 
          t.dueDate && new Date(t.dueDate) < now && t.status !== 'Done'
        ).length,
        upcomingDeadlines: tasks.filter((t: Task) => 
          t.dueDate && new Date(t.dueDate) > now && new Date(t.dueDate) <= oneWeekFromNow
        ).length
      };

      setStats(stats);
    };

    calculateStats();
  }, [tasks]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-4 text-lg text-gray-600">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-medium">Error</h3>
            <p className="text-red-600 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Tasks</h3>
            <p className="mt-2 text-2xl font-semibold">{stats.totalTasks}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Completed</h3>
            <p className="mt-2 text-2xl font-semibold text-green-600">
              {stats.completedTasks}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">High Priority</h3>
            <p className="mt-2 text-2xl font-semibold text-red-600">
              {stats.highPriorityTasks}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Overdue</h3>
            <p className="mt-2 text-2xl font-semibold text-red-600">
              {stats.overdueTasks}
            </p>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        {stats.upcomingDeadlines > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <h3 className="font-medium text-yellow-800 mb-2">Upcoming Deadlines</h3>
            <div className="space-y-2">
              {tasks
                .filter((t: Task) => 
                  t.dueDate && 
                  new Date(t.dueDate) > new Date() && 
                  new Date(t.dueDate) <= new Date(new Date().setDate(new Date().getDate() + 7))
                )
                .map((task: Task) => (
                  <div key={task.id} className="flex justify-between items-center">
                    <span>{task.name}</span>
                    <span className="text-sm text-yellow-600">
                      Due: {new Date(task.dueDate!).toLocaleDateString()}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Task List */}
        <TaskList />
      </div>
    </div>
  );
} 