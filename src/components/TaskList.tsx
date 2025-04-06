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
        
        if (!data.tasks) {
          throw new Error('Invalid response format: tasks array not found');
        }
        
        setTasks(data.tasks);
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

  const getPropertyValue = (property: any) => {
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
      default:
        return 'Not set';
    }
  };

  return (
    <div className="space-y-4 p-4">
      {tasks.map((task) => (
        <div key={task.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-black">{task.name}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">Priority:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    task.priority === 'High' ? 'bg-red-100 text-red-800' :
                    task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {task.priority}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    task.status === 'Done' ? 'bg-green-100 text-green-800' :
                    task.status === 'In progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {task.status}
                  </span>
                </div>
                {task.properties['Level of Effort'] && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">Effort:</span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {getPropertyValue(task.properties['Level of Effort'])}
                    </span>
                  </div>
                )}
                {task.properties['Zoom Out'] && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">Zoom:</span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {getPropertyValue(task.properties['Zoom Out'])}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">Due:</span>
              <span className="text-sm text-gray-700">
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 