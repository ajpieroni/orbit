'use client';

import React from 'react';
import { TaskList } from '../components/TaskList';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Recent Tasks</h1>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="p-4">
              <TaskList />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
