'use client';

import { useEffect, useState } from 'react';

interface Task {
  id: string;
  name: string;
  description: string;
  dueDate: string | null;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  properties: any; // All raw properties from Notion
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

  const formatProperty = (property: any) => {
    if (!property) return 'Not set';
    
    switch (property.type) {
      case 'title':
        return property.title?.[0]?.plain_text || 'Untitled';
      case 'rich_text':
        return property.rich_text?.[0]?.plain_text || '';
      case 'date':
        return property.date?.start ? new Date(property.date.start).toLocaleDateString() : 'Not set';
      case 'select':
        return property.select?.name || 'Not set';
      case 'multi_select':
        return property.multi_select?.map((item: any) => item.name).join(', ') || 'Not set';
      case 'checkbox':
        return property.checkbox ? 'Yes' : 'No';
      case 'number':
        return property.number?.toString() || 'Not set';
      case 'url':
        return property.url || 'Not set';
      case 'email':
        return property.email || 'Not set';
      case 'phone_number':
        return property.phone_number || 'Not set';
      default:
        return JSON.stringify(property);
    }
  };

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
          
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-500">Due:</span>{' '}
              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}
            </div>
            <div>
              <span className="font-medium text-gray-500">Created:</span>{' '}
              {new Date(task.createdAt).toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium text-gray-500">Last Updated:</span>{' '}
              {new Date(task.updatedAt).toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium text-gray-500">ID:</span>{' '}
              <span className="font-mono text-xs">{task.id}</span>
            </div>
          </div>

          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-500 mb-2">All Properties:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {Object.entries(task.properties).map(([key, value]: [string, any]) => (
                <div key={key}>
                  <span className="font-medium text-gray-500">{key}:</span>{' '}
                  <span className="text-gray-700">{formatProperty(value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 