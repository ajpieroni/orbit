'use client';

import { useState } from 'react';
import TaskList from '../../../components/TaskList';

export default function TasksPage() {
  const [filter, setFilter] = useState({
    status: 'all',
    priority: 'all',
    zoom: 'all',
    effort: 'all'
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Add Task
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full rounded-lg border-gray-300"
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            >
              <option value="all">All Statuses</option>
              <option value="Not started">Not Started</option>
              <option value="In progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              className="w-full rounded-lg border-gray-300"
              value={filter.priority}
              onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
            >
              <option value="all">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zoom Level</label>
            <select
              className="w-full rounded-lg border-gray-300"
              value={filter.zoom}
              onChange={(e) => setFilter({ ...filter, zoom: e.target.value })}
            >
              <option value="all">All Levels</option>
              <option value="Day">Day</option>
              <option value="Week">Week</option>
              <option value="Month">Month</option>
              <option value="Quarter">Quarter</option>
              <option value="Year">Year</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Effort</label>
            <select
              className="w-full rounded-lg border-gray-300"
              value={filter.effort}
              onChange={(e) => setFilter({ ...filter, effort: e.target.value })}
            >
              <option value="all">All Efforts</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-lg shadow-sm">
        <TaskList />
      </div>
    </div>
  );
} 