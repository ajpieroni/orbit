'use client';

import React, { useEffect, useState } from 'react';
import { Task } from '../types/task';
import { taskService } from '../services/taskService';

export const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const loadTasks = async () => {
      try {
        setLoading(true);
        const recentTasks = await taskService.getRecentTasks(5);
        setTasks(recentTasks);
        setError(null);
      } catch (err) {
        setError('Failed to load tasks');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [mounted]);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  if (loading) return <div>Loading tasks...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-4">
      {tasks.length === 0 ? (
        <div className="text-gray-500">No tasks found</div>
      ) : (
        tasks.map(task => (
          <div
            key={task.id}
            className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium">{task.name}</h3>
                {task.description && (
                  <p className="text-gray-600 mt-1">{task.description}</p>
                )}
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Created: {new Date(task.createdAt).toLocaleString()}
            </div>
          </div>
        ))
      )}
    </div>
  );
}; 