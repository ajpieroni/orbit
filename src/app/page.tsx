'use client';

import React from 'react';
import TaskList from '../components/TaskList';

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Tasks</h1>
      <TaskList />
    </main>
  );
}
