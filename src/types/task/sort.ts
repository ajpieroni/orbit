import { Task } from './task';

export interface TaskSort {
  field: keyof Task;
  direction: 'asc' | 'desc';
} 