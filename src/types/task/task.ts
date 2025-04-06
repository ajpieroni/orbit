import { TaskPriority, TaskStatus, TaskCategory } from './index';

export interface Task {
  id: string;
  name: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  category: TaskCategory;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  estimatedTime?: number; // in minutes
  actualTime?: number; // in minutes
  tags?: string[];
  dependencies?: string[]; // IDs of tasks this task depends on
  parentTaskId?: string; // For subtasks
  energyLevel?: 'Low' | 'Medium' | 'High'; // How much mental/physical energy this task requires
  context?: string[]; // Where/when this task can be done (e.g., 'home', 'office', 'morning')
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: Date;
  };
} 