'use client';

import { useEffect, useState } from 'react';
import ProjectMindmap from '../../../components/ProjectMindmap';

interface Task {
  id: string;
  name: string;
  zoom: string;
  parentId?: string;
  children?: Task[];
  properties: any;
}

export default function ProjectsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'mindmap' | 'list'>('mindmap');

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch('/api/tasks');
        if (!response.ok) throw new Error('Failed to fetch tasks');
        const data = await response.json();

        // Transform tasks into hierarchical structure
        const transformedTasks = transformTasksToHierarchy(data);
        setTasks(transformedTasks);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const transformTasksToHierarchy = (tasks: any[]): Task[] => {
    // First, create a map of zoom levels and their tasks
    const zoomLevels = ['Year', 'Quarter', 'Month', 'Week', 'Day'];
    const tasksByZoom = tasks.reduce((acc: { [key: string]: Task[] }, task: any) => {
      const zoom = task.properties['Zoom Out']?.select?.name || 'Uncategorized';
      if (!acc[zoom]) {
        acc[zoom] = [];
      }
      acc[zoom].push({
        id: task.id,
        name: task.name,
        zoom,
        properties: task.properties,
      });
      return acc;
    }, {});

    // Then, build the hierarchy
    const hierarchy: Task[] = [];
    let previousLevelTasks: Task[] = [];

    zoomLevels.forEach((level) => {
      const currentLevelTasks = tasksByZoom[level] || [];
      
      if (previousLevelTasks.length === 0) {
        // First level, just add all tasks
        hierarchy.push(...currentLevelTasks);
      } else {
        // Connect tasks to their parent based on some criteria
        currentLevelTasks.forEach((task) => {
          const parent = findParentTask(task, previousLevelTasks);
          if (parent) {
            if (!parent.children) parent.children = [];
            parent.children.push(task);
          } else {
            hierarchy.push(task);
          }
        });
      }
      
      previousLevelTasks = currentLevelTasks;
    });

    return hierarchy;
  };

  const findParentTask = (task: Task, potentialParents: Task[]): Task | null => {
    // This is a simplified example. You might want to implement more sophisticated
    // parent-child relationship detection based on your specific needs
    return potentialParents[0] || null;
  };

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
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <div className="flex space-x-2">
          <button
            className={`px-4 py-2 rounded-lg ${
              viewMode === 'mindmap' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
            onClick={() => setViewMode('mindmap')}
          >
            Mindmap View
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${
              viewMode === 'list' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
            onClick={() => setViewMode('list')}
          >
            List View
          </button>
        </div>
      </div>

      {viewMode === 'mindmap' ? (
        <ProjectMindmap tasks={tasks} />
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-4">
          {/* Implement list view here */}
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="p-4 border rounded-lg">
                <h3 className="font-medium">{task.name}</h3>
                <p className="text-sm text-gray-500">{task.zoom}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 