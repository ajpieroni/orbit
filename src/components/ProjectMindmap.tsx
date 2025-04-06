'use client';

import { useEffect, useState } from 'react';

interface Task {
  id: string;
  name: string;
  zoom: string;
  priority?: string;
  status?: string;
  dueDate?: string;
  parentId?: string;
  children?: Task[];
  properties: any;
}

interface ProjectMindmapProps {
  tasks: Task[];
}

export default function ProjectMindmap({ tasks }: ProjectMindmapProps) {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [filterZoom, setFilterZoom] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'tree' | 'radial'>('tree');
  const [showDetails, setShowDetails] = useState(true);

  // Group tasks by project (Zoom Out level)
  const projects = tasks.reduce((acc: { [key: string]: Task[] }, task) => {
    const project = task.zoom || 'Uncategorized';
    if (!acc[project]) {
      acc[project] = [];
    }
    acc[project].push(task);
    return acc;
  }, {});

  const toggleNode = (nodeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const selectNode = (nodeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedProject(selectedProject === nodeId ? null : nodeId);
  };

  const getNodeColor = (task: Task) => {
    if (!task.priority) return 'bg-gray-100';
    switch (task.priority.toLowerCase()) {
      case 'high': return 'bg-red-100 border-red-200';
      case 'medium': return 'bg-yellow-100 border-yellow-200';
      case 'low': return 'bg-green-100 border-green-200';
      default: return 'bg-gray-100 border-gray-200';
    }
  };

  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-gray-100';
    switch (status.toLowerCase()) {
      case 'done': return 'bg-green-100';
      case 'in progress': return 'bg-blue-100';
      case 'not started': return 'bg-gray-100';
      default: return 'bg-gray-100';
    }
  };

  const renderNode = (task: Task, level: number = 0) => {
    const isExpanded = expandedNodes.has(task.id);
    const isSelected = selectedProject === task.id;
    const hasChildren = task.children && task.children.length > 0;

    if (searchTerm && !task.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      if (!hasChildren || !task.children?.some(child => 
        child.name.toLowerCase().includes(searchTerm.toLowerCase())
      )) {
        return null;
      }
    }

    return (
      <div key={task.id} className="relative group">
        <div 
          className={`flex items-start p-3 rounded-lg cursor-pointer border transition-all duration-200 ${
            getNodeColor(task)
          } ${
            isSelected ? 'ring-2 ring-blue-400' : ''
          } hover:shadow-md`}
          style={{ 
            marginLeft: viewMode === 'tree' ? `${level * 24}px` : '0',
            transform: viewMode === 'radial' ? `rotate(${level * 15}deg)` : 'none'
          }}
        >
          <div className="flex-1" onClick={(e) => selectNode(task.id, e)}>
            <div className="flex items-center gap-2">
              {hasChildren && (
                <button
                  onClick={(e) => toggleNode(task.id, e)}
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200"
                >
                  {isExpanded ? '▼' : '▶'}
                </button>
              )}
              <div className="font-medium">{task.name}</div>
              {task.status && (
                <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(task.status)}`}>
                  {task.status}
                </span>
              )}
            </div>
            {showDetails && (
              <div className="mt-2 text-sm text-gray-500 space-y-1">
                <div>Zoom Level: {task.zoom}</div>
                {task.dueDate && (
                  <div>Due: {new Date(task.dueDate).toLocaleDateString()}</div>
                )}
              </div>
            )}
          </div>
        </div>
        {isExpanded && hasChildren && (
          <div className={`ml-6 mt-2 ${
            viewMode === 'tree' ? 'border-l-2 border-gray-200' : ''
          }`}>
            {task.children?.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-lg font-semibold">Project Mindmap</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search tasks..."
              className="px-3 py-1 border rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="px-3 py-1 border rounded-lg"
              value={filterZoom}
              onChange={(e) => setFilterZoom(e.target.value)}
            >
              <option value="all">All Levels</option>
              <option value="Year">Year</option>
              <option value="Quarter">Quarter</option>
              <option value="Month">Month</option>
              <option value="Week">Week</option>
              <option value="Day">Day</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              className={`px-3 py-1 rounded-lg ${
                viewMode === 'tree' ? 'bg-blue-100' : 'bg-gray-100'
              }`}
              onClick={() => setViewMode('tree')}
            >
              Tree
            </button>
            <button
              className={`px-3 py-1 rounded-lg ${
                viewMode === 'radial' ? 'bg-blue-100' : 'bg-gray-100'
              }`}
              onClick={() => setViewMode('radial')}
            >
              Radial
            </button>
            <button
              className={`px-3 py-1 rounded-lg ${
                showDetails ? 'bg-blue-100' : 'bg-gray-100'
              }`}
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>
            <button 
              className="px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200"
              onClick={() => setExpandedNodes(new Set())}
            >
              Collapse All
            </button>
            <button 
              className="px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200"
              onClick={() => {
                const allIds = tasks.map(t => t.id);
                setExpandedNodes(new Set(allIds));
              }}
            >
              Expand All
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-4">
        {filterZoom === 'all' ? (
          Object.entries(projects).map(([project, projectTasks]) => (
            <div key={project} className="mb-6">
              <h3 className="text-lg font-medium mb-2">{project}</h3>
              <div className="space-y-2">
                {projectTasks.map(task => renderNode(task))}
              </div>
            </div>
          ))
        ) : (
          <div className="space-y-2">
            {projects[filterZoom]?.map(task => renderNode(task)) || (
              <p className="text-gray-500">No tasks found for this zoom level</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 