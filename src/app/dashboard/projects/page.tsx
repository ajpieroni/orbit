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

interface ProjectSection {
  name: string;
  isExpanded: boolean;
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
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});

  const fetchAllTasks = async () => {
    try {
      setLoading(true);
      let currentCursor = null;
      let allTasks: Task[] = [];
      let totalTasksFetched = 0;

      do {
        const url = new URL('/api/notion', window.location.origin);
        if (currentCursor) {
          url.searchParams.set('startCursor', currentCursor);
        }
        url.searchParams.set('dueToday', 'true');

        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }

        const data = await response.json();
        allTasks = [...allTasks, ...data.tasks];
        totalTasksFetched += data.tasks.length;
        currentCursor = data.nextCursor;

        // Update the UI progressively
        setTasks(allTasks);
        calculateProjectStats(data.tasks);
        
        console.log(`Fetched ${data.tasks.length} tasks. Total so far: ${totalTasksFetched}`);
      } while (currentCursor);

      console.log(`Finished fetching all tasks. Total: ${totalTasksFetched}`);
      setHasMore(false);
      setNextCursor(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTasks();
  }, []);

  const calculateProjectStats = (newTasks: any[]) => {
    const now = new Date();
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

    // Calculate stats for all tasks, not just the new ones
    const allTasks = [...tasks, ...newTasks];
    
    const stats: ProjectStats = {
      totalTasks: allTasks.length,
      completedTasks: allTasks.filter(t => t.status === 'Done').length,
      inProgressTasks: allTasks.filter(t => t.status === 'In progress').length,
      upcomingDeadlines: allTasks.filter(t => {
        const dueDate = t.dueDate ? new Date(t.dueDate) : null;
        return dueDate && dueDate > now && dueDate <= oneWeekFromNow;
      }).length,
      overdueTasks: allTasks.filter(t => {
        const dueDate = t.dueDate ? new Date(t.dueDate) : null;
        return dueDate && dueDate < now && t.status !== 'Done';
      }).length
    };

    setProjectStats(stats);
  };

  const getProjectStats = (projectTasks: Task[]) => {
    const now = new Date();
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

    return {
      totalTasks: projectTasks.length,
      completedTasks: projectTasks.filter(t => t.status === 'Done').length,
      inProgressTasks: projectTasks.filter(t => t.status === 'In progress').length,
      upcomingDeadlines: projectTasks.filter(t => {
        const dueDate = t.dueDate ? new Date(t.dueDate) : null;
        return dueDate && dueDate > now && dueDate <= oneWeekFromNow;
      }).length,
      overdueTasks: projectTasks.filter(t => {
        const dueDate = t.dueDate ? new Date(t.dueDate) : null;
        return dueDate && dueDate < now && t.status !== 'Done';
      }).length,
      highPriorityTasks: projectTasks.filter(t => t.priority === 'High').length,
      mediumPriorityTasks: projectTasks.filter(t => t.priority === 'Medium').length,
      lowPriorityTasks: projectTasks.filter(t => t.priority === 'Low').length
    };
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

  const toggleSection = (projectName: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [projectName]: !prev[projectName]
    }));
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

  // Group tasks by project (Zoom Out property)
  const projects = tasks.reduce((acc: { [key: string]: Task[] }, task) => {
    const properties = task.properties;
    let projectName = '';

    // Check Projects property first
    if (properties['Projects']?.relation?.length > 0) {
      projectName = 'Projects';
    }
    // Then check Goals property
    else if (properties['Goals']?.relation?.length > 0) {
      projectName = 'Goals';
    }
    // Then check Class property
    else if (properties['Class']?.select?.name) {
      const className = properties['Class'].select.name;
      if (className !== 'Academics' && className !== 'Admin' && className !== 'House') {
        projectName = className;
      } else {
        projectName = className;
      }
    }

    // Only use 'Other Tasks' if no other condition was met
    if (!projectName) {
      projectName = 'Other Tasks';
    }

    if (!acc[projectName]) {
      acc[projectName] = [];
    }
    acc[projectName].push(task);
    return acc;
  }, {});

  // Sort projects alphabetically with specific order
  const sortedProjects = Object.keys(projects).sort((a, b) => {
    // Define the desired order
    const order = ['Projects', 'Goals', 'Academics', 'Admin', 'House'];
    
    // If both items are in the order array, sort by their position
    const aIndex = order.indexOf(a);
    const bIndex = order.indexOf(b);
    
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    
    // If only one item is in the order array, it comes first
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    
    // If neither item is in the order array, sort alphabetically
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-8">
      {/* Global Project Stats */}
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
      <div className="space-y-8">
        {sortedProjects.map((project) => {
          const projectTasks = projects[project];
          const stats = getProjectStats(projectTasks);
          const isExpanded = expandedSections[project] ?? true; // Default to expanded

          return (
            <div key={project} className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Project Header */}
              <div className="bg-gray-50 px-6 py-4 border-b">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => toggleSection(project)}
                      className="text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      <svg
                        className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    <h2 className="text-2xl font-semibold text-gray-900">
                      {project === 'Other Tasks' ? 'Other Tasks' : project}
                    </h2>
                  </div>
                  <div className="flex space-x-6">
                    <div className="text-center">
                      <div className="text-sm text-gray-900">Total Tasks</div>
                      <div className="text-lg font-semibold">{stats.totalTasks}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-900">Completed</div>
                      <div className="text-lg font-semibold text-green-900">{stats.completedTasks}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-900">In Progress</div>
                      <div className="text-lg font-semibold text-blue-900">{stats.inProgressTasks}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-900">High Priority</div>
                      <div className="text-lg font-semibold text-red-900">{stats.highPriorityTasks}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Content */}
              <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[5000px]' : 'max-h-0 overflow-hidden'}`}>
                <div className="p-6">
                  {renderTaskTree(transformTasksToHierarchy(projectTasks))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="mt-6 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-2 text-gray-900">Loading all tasks...</p>
        </div>
      )}
    </div>
  );
} 