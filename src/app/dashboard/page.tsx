'use client';

import { useEffect, useState } from 'react';
import { Task } from '@/types/task';
import Link from 'next/link';
import { Calendar, Clock, CheckCircle, AlertTriangle, Folder } from 'lucide-react';

interface ProjectStats {
  total: number;
  completed: number;
  overdue: number;
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/notion?dueToday=true');
        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }
        const data = await response.json();
        setTasks(data.tasks);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const getTaskStats = () => {
    const today = new Date();
    const overdueTasks = tasks.filter(task => 
      task.dueDate && new Date(task.dueDate) < today
    );
    const dueToday = tasks.filter(task => 
      task.dueDate && new Date(task.dueDate).toDateString() === today.toDateString()
    );
    const highPriority = tasks.filter(task => task.priority === 'High');
    const completedToday = tasks.filter(task => 
      task.status === 'Done' && 
      new Date(task.updatedAt).toDateString() === today.toDateString()
    );

    return {
      total: tasks.length,
      overdue: overdueTasks.length,
      dueToday: dueToday.length,
      highPriority: highPriority.length,
      completedToday: completedToday.length
    };
  };

  const stats = getTaskStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Due Today</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.dueToday}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <Calendar className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Overdue</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.overdue}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-full">
              <Clock className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">High Priority</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.highPriority}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-full">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Completed Today</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.completedToday}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Tasks Due Today */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Tasks Due Today</h2>
            <Link 
              href="/dashboard/tasks" 
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All
            </Link>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {tasks
            .filter(task => 
              task.dueDate && 
              new Date(task.dueDate).toDateString() === new Date().toDateString()
            )
            .map(task => (
              <div key={task.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{task.name}</h3>
                    <p className="text-sm text-gray-500">
                      {task.properties['Zoom Out']?.formula?.string || 'No Project'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      task.priority === 'High' ? 'bg-red-100 text-red-800' :
                      task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {task.priority}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      task.status === 'Done' ? 'bg-green-100 text-green-800' :
                      task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          {tasks.filter(task => 
            task.dueDate && 
            new Date(task.dueDate).toDateString() === new Date().toDateString()
          ).length === 0 && (
            <div className="p-4 text-center text-gray-500">
              No tasks due today
            </div>
          )}
        </div>
      </div>

      {/* Projects Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Projects Overview</h2>
            <Link 
              href="/dashboard/projects" 
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All
            </Link>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {Object.entries(
            tasks.reduce((acc, task) => {
              const project = task.properties['Zoom Out']?.formula?.string || 'Uncategorized';
              if (!acc[project]) {
                acc[project] = {
                  total: 0,
                  completed: 0,
                  overdue: 0
                };
              }
              acc[project].total++;
              if (task.status === 'Done') acc[project].completed++;
              if (task.dueDate && new Date(task.dueDate) < new Date()) acc[project].overdue++;
              return acc;
            }, {} as Record<string, ProjectStats>)
          ).map(([project, stats]) => (
            <div key={project} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 rounded-full">
                    <Folder className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{project}</h3>
                    <p className="text-sm text-gray-500">
                      {stats.completed} of {stats.total} tasks completed
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {stats.overdue > 0 && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                      {stats.overdue} overdue
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 