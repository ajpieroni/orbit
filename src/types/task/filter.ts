import { TaskPriority, TaskStatus, TaskCategory } from './index';

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