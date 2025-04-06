export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Must Be Done Today' | 'Someday' | 'Unassigned';

export type TaskStatus = 
  | 'Not Started'
  | 'In Progress'
  | 'Done'
  | 'Handed Off'
  | 'Deprecated'
  | 'Waiting on Reply'
  | 'Waiting on other task';

export type TaskCategory = 
  | 'Work'
  | 'Personal'
  | 'Health'
  | 'Learning'
  | 'Relationships'
  | 'Admin'
  | 'Other';

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

export interface TaskFilter {
  priority?: TaskPriority[];
  status?: TaskStatus[];
  category?: TaskCategory[];
  dueDate?: {
    start?: Date;
    end?: Date;
  };
  tags?: string[];
  context?: string[];
  energyLevel?: ('Low' | 'Medium' | 'High')[];
  searchTerm?: string;
}

export interface TaskSort {
  field: keyof Task;
  direction: 'asc' | 'desc';
} 