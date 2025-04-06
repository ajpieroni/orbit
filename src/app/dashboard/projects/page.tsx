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
  zoom: string;
  parentId: string | null;
  children: Task[];
  properties: any;
}

interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  upcomingDeadlines: number;
  overdueTasks: number;
}

export default function ProjectsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [projectStats, setProjectStats] = useState<ProjectStats>({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    upcomingDeadlines: 0,
    overdueTasks: 0
  });

  const fetchTasks = async (cursor: string | null = null) => {
    try {
      if (!cursor) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const url = new URL('/api/tasks', window.location.origin);
      if (cursor) {
        url.searchParams.set('cursor', cursor);
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      const data = await response.json();
      
      if (!cursor) {
        setTasks(data.tasks);
      } else {
        setTasks(prevTasks => [...prevTasks, ...data.tasks]);
      }
      
      setHasMore(data.hasMore);
      setNextCursor(data.nextCursor);
      calculateProjectStats(data.tasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleLoadMore = () => {
    if (nextCursor) {
      fetchTasks(nextCursor);
    }
  };

  const calculateProjectStats = (tasks: any[]) => {
    const now = new Date();
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

    const stats: ProjectStats = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'Done').length,
      inProgressTasks: tasks.filter(t => t.status === 'In progress').length,
      upcomingDeadlines: tasks.filter(t => {
        const dueDate = t.dueDate ? new Date(t.dueDate) : null;
        return dueDate && dueDate > now && dueDate <= oneWeekFromNow;
      }).length,
      overdueTasks: tasks.filter(t => {
        const dueDate = t.dueDate ? new Date(t.dueDate) : null;
        return dueDate && dueDate < now && t.status !== 'Done';
      }).length
    };

    setProjectStats(stats);
  };

  const transformTasksToHierarchy = (tasks: any[]): Task[] => {
    // First, create a map of tasks by their ID for quick lookup
    const taskMap = new Map<string, Task>();
    const rootTasks: Task[] = [];

    // Initialize all tasks
    tasks.forEach(task => {
      const newTask: Task = {
        id: task.id,
        name: task.name,
        description: task.description || '',
        dueDate: task.dueDate,
        priority: task.priority,
        status: task.status,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        zoom: task.properties['Zoom Out']?.select?.name || 'Uncategorized',
        parentId: task.parentId || null,
        children: [],
        properties: task.properties
      };
      taskMap.set(task.id, newTask);
    });

    // Build the hierarchy
    tasks.forEach(task => {
      const currentTask = taskMap.get(task.id);
      if (!currentTask) return;

      if (currentTask.parentId) {
        const parent = taskMap.get(currentTask.parentId);
        if (parent) {
          parent.children.push(currentTask);
        } else {
          rootTasks.push(currentTask);
        }
      } else {
        rootTasks.push(currentTask);
      }
    });

    return rootTasks;
  };

  const renderTaskTree = (tasks: Task[], level: number = 0) => {
    return (
      <div className="space-y-2">
        {tasks.map(task => (
          <div key={task.id} className="pl-4">
            <div className={`p-4 border rounded-lg hover:shadow-md transition-shadow ${
              level === 0 ? 'bg-white' : 'bg-gray-50'
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{task.name}</h3>
                  <div className="mt-2 flex items-center space-x-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.priority === 'High' ? 'bg-red-100 text-red-900' :
                      task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-900' :
                      'bg-green-100 text-green-900'
                    }`}>
                      {task.priority}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.status === 'Done' ? 'bg-green-100 text-green-900' :
                      task.status === 'In progress' ? 'bg-blue-100 text-blue-900' :
                      'bg-gray-100 text-gray-900'
                    }`}>
                      {task.status}
                    </span>
                    <span className="text-sm text-gray-900">
                      Zoom: {task.zoom}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-900">
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                </div>
              </div>
            </div>
            {task.children && task.children.length > 0 && (
              <div className="mt-2">
                {renderTaskTree(task.children, level + 1)}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-4 text-lg text-gray-900">Loading your projects...</p>
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
            <h3 className="text-red-900 font-medium">Error</h3>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Group tasks by project (Zoom Out level)
  const projects = tasks.reduce((acc: { [key: string]: Task[] }, task) => {
    const project = task.properties['Zoom Out']?.select?.name || 'Uncategorized';
    if (!acc[project]) {
      acc[project] = [];
    }
    acc[project].push(task);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-900">Total Tasks</h3>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{projectStats.totalTasks}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-900">Completed</h3>
          <p className="mt-2 text-2xl font-semibold text-green-900">
            {projectStats.completedTasks}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-900">In Progress</h3>
          <p className="mt-2 text-2xl font-semibold text-blue-900">
            {projectStats.inProgressTasks}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-900">Upcoming</h3>
          <p className="mt-2 text-2xl font-semibold text-yellow-900">
            {projectStats.upcomingDeadlines}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-900">Overdue</h3>
          <p className="mt-2 text-2xl font-semibold text-red-900">
            {projectStats.overdueTasks}
          </p>
        </div>
      </div>

      {/* Projects Tree View */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {Object.entries(projects).map(([project, projectTasks]) => (
          <div key={project} className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{project}</h2>
            {renderTaskTree(transformTasksToHierarchy(projectTasks))}
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
} 