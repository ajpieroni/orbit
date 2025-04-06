'use client';

import { useEffect, useState } from 'react';
import ProjectMindmap from '../../../components/ProjectMindmap';

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
  const [viewMode, setViewMode] = useState<'mindmap' | 'kanban' | 'list'>('mindmap');
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
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate,
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
        hierarchy.push(...currentLevelTasks);
      } else {
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
    // Find a parent task based on the zoom level hierarchy
    const taskZoomIndex = ['Year', 'Quarter', 'Month', 'Week', 'Day'].indexOf(task.zoom);
    const potentialParentZoomIndex = taskZoomIndex - 1;
    
    if (potentialParentZoomIndex < 0) return null;
    
    return potentialParents.find(parent => {
      // Add your logic here to determine parent-child relationships
      // For example, you might want to check if the task's name includes the parent's name
      // or if they share certain properties
      return parent.zoom === ['Year', 'Quarter', 'Month', 'Week', 'Day'][potentialParentZoomIndex];
    }) || null;
  };

  const renderKanbanBoard = () => {
    const columns = ['Not started', 'In progress', 'Done'];
    
    return (
      <div className="grid grid-cols-3 gap-4">
        {columns.map(column => (
          <div key={column} className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-4">{column}</h3>
            <div className="space-y-2">
              {tasks.filter(task => task.status === column).map(task => (
                <div 
                  key={task.id} 
                  className={`p-3 rounded-lg bg-white shadow-sm border-l-4 ${
                    task.priority === 'High' ? 'border-red-400' :
                    task.priority === 'Medium' ? 'border-yellow-400' :
                    'border-green-400'
                  }`}
                >
                  <div className="font-medium">{task.name}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {task.zoom} • Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                  </div>
                </div>
              ))}
            </div>
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
              <p className="mt-4 text-lg text-gray-600">Loading your projects...</p>
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
    <div className="space-y-6">
      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Total Tasks</h3>
          <p className="mt-2 text-2xl font-semibold">{projectStats.totalTasks}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Completed</h3>
          <p className="mt-2 text-2xl font-semibold text-green-600">
            {projectStats.completedTasks}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">In Progress</h3>
          <p className="mt-2 text-2xl font-semibold text-blue-600">
            {projectStats.inProgressTasks}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Overdue</h3>
          <p className="mt-2 text-2xl font-semibold text-red-600">
            {projectStats.overdueTasks}
          </p>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      {projectStats.upcomingDeadlines > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-800 mb-2">Upcoming Deadlines</h3>
          <div className="space-y-2">
            {Array.from({ length: projectStats.upcomingDeadlines }, (_, i) => (
              <div key={i} className="flex justify-between items-center">
                <span>Task {i + 1}</span>
                <span className="text-sm text-yellow-600">
                  Due: {new Date(tasks[i].dueDate!).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View Controls */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('mindmap')}
            className={`px-4 py-2 rounded-lg ${
              viewMode === 'mindmap' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Mindmap
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-4 py-2 rounded-lg ${
              viewMode === 'kanban' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Kanban
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg ${
              viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'mindmap' ? (
        <ProjectMindmap tasks={tasks} />
      ) : viewMode === 'kanban' ? (
        renderKanbanBoard()
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium">{task.name}</h3>
              <p className="text-gray-600">{task.description}</p>
              <div className="mt-2 flex items-center space-x-2">
                <span className="text-sm text-gray-500">Zoom: {task.zoom}</span>
                <span className="text-sm text-gray-500">Priority: {task.priority}</span>
                <span className="text-sm text-gray-500">Status: {task.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && !loading && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMore ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Loading...
              </div>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}
    </div>
  );
} 