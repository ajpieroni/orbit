import { Task, TaskFilter, TaskSort } from '../types/task';
import { notionService } from './notionService';

class TaskService {
  private static instance: TaskService;
  private initialized = false;
  private tasks: Task[] = [];
  private storageKey = 'orbit-tasks';

  private constructor() {
    console.log('TaskService constructor called');
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  public static getInstance(): TaskService {
    console.log('TaskService getInstance called, instance exists:', !!TaskService.instance);
    if (!TaskService.instance) {
      TaskService.instance = new TaskService();
    }
    return TaskService.instance;
  }

  private initialize() {
    console.log('TaskService initialize called, already initialized:', this.initialized);
    if (this.initialized) return;
    
    const storedTasks = localStorage.getItem(this.storageKey);
    console.log('Local storage tasks:', {
      hasStoredTasks: !!storedTasks,
      storageKey: this.storageKey
    });

    if (storedTasks) {
      try {
        this.tasks = JSON.parse(storedTasks).map((task: any) => ({
          ...task,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt),
        }));
        console.log('Loaded tasks from local storage:', {
          count: this.tasks.length,
          tasks: this.tasks.map(t => ({
            id: t.id,
            name: t.name,
            priority: t.priority,
            status: t.status
          }))
        });
      } catch (error) {
        console.error('Error parsing local storage tasks:', {
          error,
          storedTasks
        });
        this.tasks = [];
      }
    } else {
      console.log('No tasks in local storage, creating test tasks');
      // Add some test tasks if none exist
      this.tasks = [
        {
          id: crypto.randomUUID(),
          name: "Complete project documentation",
          description: "Write comprehensive documentation for the Orbit project",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          name: "Review pull requests",
          description: "Review and merge pending pull requests",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          name: "Plan next sprint",
          description: "Create tasks and estimate for the next sprint",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];
      this.saveTasks();
    }
    this.initialized = true;
    console.log('TaskService initialization complete:', {
      initialized: this.initialized,
      taskCount: this.tasks.length
    });
  }

  private saveTasks() {
    console.log('Saving tasks to local storage:', {
      count: this.tasks.length,
      storageKey: this.storageKey
    });
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.storageKey, JSON.stringify(this.tasks));
  }

  public async getRecentTasks(limit: number = 5): Promise<Task[]> {
    console.log('TaskService getRecentTasks called:', {
      limit,
      initialized: this.initialized,
      currentTaskCount: this.tasks.length
    });

    if (!this.initialized) {
      this.initialize();
    }

    try {
      console.log('Attempting to fetch tasks from Notion');
      const tasks = await notionService.getRecentTasks(limit);
      console.log('Successfully fetched tasks from Notion:', {
        count: tasks.length,
        tasks: tasks.map(t => ({
          id: t.id,
          name: t.name,
          priority: t.priority,
          status: t.status
        }))
      });
      return tasks;
    } catch (error) {
      console.error('Error fetching tasks from Notion, falling back to local storage:', {
        error,
        localTaskCount: this.tasks.length
      });
      return this.tasks
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit);
    }
  }

  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    console.log('Creating new task:', task);
    if (!this.initialized) {
      this.initialize();
    }
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tasks.push(newTask);
    this.saveTasks();
    console.log('Task created successfully:', {
      id: newTask.id,
      name: newTask.name
    });
    return newTask;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    console.log('Updating task:', { id, updates });
    const index = this.tasks.findIndex(task => task.id === id);
    if (index === -1) {
      console.log('Task not found:', id);
      return null;
    }

    const updatedTask = {
      ...this.tasks[index],
      ...updates,
      updatedAt: new Date(),
    };
    this.tasks[index] = updatedTask;
    this.saveTasks();
    console.log('Task updated successfully:', {
      id: updatedTask.id,
      name: updatedTask.name
    });
    return updatedTask;
  }

  async deleteTask(id: string): Promise<boolean> {
    console.log('Deleting task:', id);
    const initialLength = this.tasks.length;
    this.tasks = this.tasks.filter(task => task.id !== id);
    this.saveTasks();
    const deleted = this.tasks.length < initialLength;
    console.log('Task deletion result:', {
      id,
      deleted,
      newTaskCount: this.tasks.length
    });
    return deleted;
  }

  async getTask(id: string): Promise<Task | null> {
    console.log('Getting task:', id);
    const task = this.tasks.find(task => task.id === id) || null;
    console.log('Task found:', task ? {
      id: task.id,
      name: task.name
    } : null);
    return task;
  }

  async getTasks(filter?: TaskFilter, sort?: TaskSort): Promise<Task[]> {
    console.log('Getting tasks with filter and sort:', {
      filter,
      sort,
      totalTasks: this.tasks.length
    });
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

    console.log('Filtered and sorted tasks:', {
      count: filteredTasks.length,
      tasks: filteredTasks.map(t => ({
        id: t.id,
        name: t.name,
        priority: t.priority,
        status: t.status
      }))
    });

    return filteredTasks;
  }

  async getTasksByContext(context: string): Promise<Task[]> {
    console.log('Getting tasks by context:', context);
    const tasks = this.tasks.filter(task => 
      task.context?.includes(context) && 
      task.status !== 'Done'
    );
    console.log('Found tasks for context:', {
      context,
      count: tasks.length
    });
    return tasks;
  }

  async getTasksByEnergyLevel(energyLevel: 'Low' | 'Medium' | 'High'): Promise<Task[]> {
    console.log('Getting tasks by energy level:', energyLevel);
    const tasks = this.tasks.filter(task => 
      task.energyLevel === energyLevel && 
      task.status !== 'Done'
    );
    console.log('Found tasks for energy level:', {
      energyLevel,
      count: tasks.length
    });
    return tasks;
  }

  async getRecurringTasks(): Promise<Task[]> {
    console.log('Getting recurring tasks');
    const tasks = this.tasks.filter(task => task.recurrence !== undefined);
    console.log('Found recurring tasks:', {
      count: tasks.length
    });
    return tasks;
  }
}

export const taskService = TaskService.getInstance(); 