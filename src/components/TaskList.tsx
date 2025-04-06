'use client';

import { useEffect, useState } from 'react';

interface Task {
  id: string;
  name: string;
  description: string;
  dueDate: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiError {
  message: string;
  details?: any;
}

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        console.log('Fetching tasks from API...');
        const response = await fetch('/api/tasks');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch tasks');
        }

        const data = await response.json();
        console.log('Tasks fetched successfully:', data);
        setTasks(data);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError({
          message: err instanceof Error ? err.message : 'Failed to fetch tasks',
          details: err
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-medium">Error</h3>
        <p className="text-red-600">{error.message}</p>
        {error.details && (
          <pre className="mt-2 text-sm text-red-500 overflow-auto">
            {JSON.stringify(error.details, null, 2)}
          </pre>
        )}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No tasks found
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {tasks.map((task) => (
        <div key={task.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium">{task.name}</h3>
              {task.description && (
                <p className="text-gray-600 mt-1">{task.description}</p>
              )}
            </div>
            <div className="flex space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                task.priority === 'High' ? 'bg-red-100 text-red-800' :
                task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {task.priority}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                task.status === 'Done' ? 'bg-green-100 text-green-800' :
                task.status === 'In progress' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {task.status}
              </span>
            </div>
          </div>
          
          <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-500">
            <div>
              <span className="font-medium">Due:</span>{' '}
              {new Date(task.dueDate).toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium">Created:</span>{' '}
              {new Date(task.createdAt).toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span>{' '}
              {new Date(task.updatedAt).toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium">ID:</span>{' '}
              <span className="font-mono text-xs">{task.id}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 