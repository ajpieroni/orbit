'use client';

import { useEffect, useState } from 'react';

interface AnalyticsData {
  tasksByStatus: { [key: string]: number };
  tasksByPriority: { [key: string]: number };
  tasksByZoom: { [key: string]: number };
  tasksByEffort: { [key: string]: number };
  completionRate: number;
  averageCompletionTime: number;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>({
    tasksByStatus: {},
    tasksByPriority: {},
    tasksByZoom: {},
    tasksByEffort: {},
    completionRate: 0,
    averageCompletionTime: 0
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/tasks');
        if (!response.ok) throw new Error('Failed to fetch tasks');
        const tasks = await response.json();

        // Calculate analytics
        const analytics: AnalyticsData = {
          tasksByStatus: {},
          tasksByPriority: {},
          tasksByZoom: {},
          tasksByEffort: {},
          completionRate: 0,
          averageCompletionTime: 0
        };

        tasks.forEach((task: any) => {
          // Count by status
          analytics.tasksByStatus[task.status] = (analytics.tasksByStatus[task.status] || 0) + 1;
          
          // Count by priority
          analytics.tasksByPriority[task.priority] = (analytics.tasksByPriority[task.priority] || 0) + 1;
          
          // Count by zoom level
          if (task.properties['Zoom Out']) {
            const zoom = task.properties['Zoom Out'].select?.name || 'Unknown';
            analytics.tasksByZoom[zoom] = (analytics.tasksByZoom[zoom] || 0) + 1;
          }
          
          // Count by effort
          if (task.properties['Level of Effort']) {
            const effort = task.properties['Level of Effort'].select?.name || 'Unknown';
            analytics.tasksByEffort[effort] = (analytics.tasksByEffort[effort] || 0) + 1;
          }
        });

        // Calculate completion rate
        const totalTasks = tasks.length;
        const completedTasks = analytics.tasksByStatus['Done'] || 0;
        analytics.completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        setData(analytics);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      }
    };

    fetchAnalytics();
  }, []);

  const renderBarChart = (data: { [key: string]: number }, color: string) => {
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    return (
      <div className="space-y-2">
        {Object.entries(data).map(([key, value]) => (
          <div key={key}>
            <div className="flex justify-between text-sm mb-1">
              <span>{key}</span>
              <span>{Math.round((value / total) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${color}`}
                style={{ width: `${(value / total) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Tasks by Status</h2>
          {renderBarChart(data.tasksByStatus, 'bg-blue-600')}
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Tasks by Priority</h2>
          {renderBarChart(data.tasksByPriority, 'bg-red-600')}
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Tasks by Zoom Level</h2>
          {renderBarChart(data.tasksByZoom, 'bg-green-600')}
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Tasks by Effort</h2>
          {renderBarChart(data.tasksByEffort, 'bg-yellow-600')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Completion Rate</h2>
          <div className="flex items-center justify-center">
            <div className="text-4xl font-bold text-blue-600">
              {Math.round(data.completionRate)}%
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Average Completion Time</h2>
          <div className="flex items-center justify-center">
            <div className="text-4xl font-bold text-green-600">
              {data.averageCompletionTime} days
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 