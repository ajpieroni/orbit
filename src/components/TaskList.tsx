'use client';

import { useEffect, useState } from 'react';

interface Task {
  id: string;
  name: string;
  description: string;
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
    async function fetchTasks() {
      try {
        console.log('Fetching tasks from API...');
        const response = await fetch('/api/tasks');
        const data = await response.json();
        
        if (!response.ok) {
          console.error('API Error Response:', data);
          throw new Error(data.message || 'Failed to fetch tasks');
        }
        
        console.log('Tasks fetched successfully:', data);
        setTasks(data);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError({
          message: err instanceof Error ? err.message : 'An error occurred',
          details: err
        });
      } finally {
        setLoading(false);
      }
    }

    fetchTasks();
  }, []);

  if (loading) return (
    <div className="p-4">
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
        ))}
      </div>
    </div>
  );

  if (error) return (
    <div className="p-4">
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p className="font-medium">Error loading tasks</p>
        <p className="text-sm mt-1">{error.message}</p>
        {error.details && (
          <pre className="mt-2 text-xs overflow-auto">
            {JSON.stringify(error.details, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );

  if (tasks.length === 0) return (
    <div className="p-4 text-center text-gray-500">
      No tasks found
    </div>
  );

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <div key={task.id} className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold">{task.name}</h3>
          <p className="text-gray-600">{task.description}</p>
          <p className="text-sm text-gray-500">
            Created: {new Date(task.createdAt).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
} 