import { Task, TaskFilter, TaskSort } from '../types/task';

class TaskService {
  private tasks: Task[] = [];
  private storageKey = 'orbit-tasks';
  private isInitialized = false;

  constructor() {
    // Only initialize on the client side
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private initialize() {
    if (this.isInitialized) return;
    
    const storedTasks = localStorage.getItem(this.storageKey);
    if (storedTasks) {
      this.tasks = JSON.parse(storedTasks).map((task: any) => ({
        ...task,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
      }));
    }
    this.isInitialized = true;
  }

  private saveTasks() {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.storageKey, JSON.stringify(this.tasks));
  }

  async getRecentTasks(limit: number = 5): Promise<Task[]> {
    if (!this.isInitialized) {
      return [];
    }
    return this.tasks
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    if (!this.isInitialized) {
      throw new Error('TaskService not initialized');
    }
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tasks.push(newTask);
    this.saveTasks();
    return newTask;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    const index = this.tasks.findIndex(task => task.id === id);
    if (index === -1) return null;

    const updatedTask = {
      ...this.tasks[index],
      ...updates,
      updatedAt: new Date(),
    };
    this.tasks[index] = updatedTask;
    this.saveTasks();
    return updatedTask;
  }

  async deleteTask(id: string): Promise<boolean> {
    const initialLength = this.tasks.length;
    this.tasks = this.tasks.filter(task => task.id !== id);
    this.saveTasks();
    return this.tasks.length < initialLength;
  }

  async getTask(id: string): Promise<Task | null> {
    return this.tasks.find(task => task.id === id) || null;
  }

  async getTasks(filter?: TaskFilter, sort?: TaskSort): Promise<Task[]> {
    let filteredTasks = [...this.tasks];

    if (filter) {
      filteredTasks = filteredTasks.filter(task => {
        if (filter.priority && !filter.priority.includes(task.priority)) return false;
        if (filter.status && !filter.status.includes(task.status)) return false;
        if (filter.category && !filter.category.includes(task.category)) return false;
        if (filter.dueDate) {
          if (filter.dueDate.start && task.dueDate && task.dueDate < filter.dueDate.start) return false;
          if (filter.dueDate.end && task.dueDate && task.dueDate > filter.dueDate.end) return false;
        }
        if (filter.tags && !filter.tags.every(tag => task.tags?.includes(tag))) return false;
        if (filter.context && !filter.context.every(ctx => task.context?.includes(ctx))) return false;
        if (filter.energyLevel && !filter.energyLevel.includes(task.energyLevel || 'Medium')) return false;
        if (filter.searchTerm) {
          const searchLower = filter.searchTerm.toLowerCase();
          if (!task.name.toLowerCase().includes(searchLower) && 
              !task.description?.toLowerCase().includes(searchLower)) return false;
        }
        return true;
      });
    }

    if (sort) {
      filteredTasks.sort((a, b) => {
        const aValue = a[sort.field];
        const bValue = b[sort.field];
        
        if (aValue === undefined || bValue === undefined) return 0;
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sort.direction === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        if (aValue instanceof Date && bValue instanceof Date) {
          return sort.direction === 'asc'
            ? aValue.getTime() - bValue.getTime()
            : bValue.getTime() - aValue.getTime();
        }
        
        return sort.direction === 'asc'
          ? Number(aValue) - Number(bValue)
          : Number(bValue) - Number(aValue);
      });
    }

    return filteredTasks;
  }

  async getTasksByContext(context: string): Promise<Task[]> {
    return this.tasks.filter(task => 
      task.context?.includes(context) && 
      task.status !== 'Done'
    );
  }

  async getTasksByEnergyLevel(energyLevel: 'Low' | 'Medium' | 'High'): Promise<Task[]> {
    return this.tasks.filter(task => 
      task.energyLevel === energyLevel && 
      task.status !== 'Done'
    );
  }

  async getRecurringTasks(): Promise<Task[]> {
    return this.tasks.filter(task => task.recurrence !== undefined);
  }
}

// Create a single instance of the service
export const taskService = new TaskService(); 