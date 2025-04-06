import { Task } from '../types/task';

const NOTION_API_KEY = process.env.NEXT_PUBLIC_NOTION_API_KEY;
const DATABASE_ID = process.env.NEXT_PUBLIC_NOTION_DATABASE_ID;
const NOTION_API_VERSION = process.env.NEXT_PUBLIC_NOTION_API_VERSION || '2022-06-28';

// Debug environment variables
console.log('Environment Variables Debug:', {
  NOTION_API_KEY: NOTION_API_KEY ? '***' + NOTION_API_KEY.slice(-4) : 'undefined',
  DATABASE_ID: DATABASE_ID ? '***' + DATABASE_ID.slice(-4) : 'undefined',
  NOTION_API_VERSION,
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV
});

const headers = {
  'Authorization': `Bearer ${NOTION_API_KEY}`,
  'Content-Type': 'application/json',
  'Notion-Version': NOTION_API_VERSION,
};

// Debug headers
console.log('Request Headers:', {
  ...headers,
  Authorization: headers.Authorization ? 'Bearer ***' + headers.Authorization.slice(-4) : 'undefined'
});

export class NotionService {
  private static instance: NotionService;
  private initialized = false;

  private constructor() {
    console.log('NotionService constructor called');
  }

  public static getInstance(): NotionService {
    console.log('getInstance called, instance exists:', !!NotionService.instance);
    if (!NotionService.instance) {
      NotionService.instance = new NotionService();
    }
    return NotionService.instance;
  }

  private async fetchTasks(filter: any, sorts: any): Promise<any[]> {
    const url = `https://api.notion.com/v1/databases/${DATABASE_ID}/query`;
    console.log('Fetching tasks from Notion:', { 
      url,
      databaseId: DATABASE_ID ? '***' + DATABASE_ID.slice(-4) : 'undefined',
      filter: JSON.stringify(filter, null, 2),
      sorts: JSON.stringify(sorts, null, 2)
    });
    
    const allTasks: any[] = [];
    let payload = { filter, sorts, page_size: 100 };

    try {
      while (true) {
        console.log('Making API request with payload:', {
          ...payload,
          filter: JSON.stringify(payload.filter, null, 2),
          sorts: JSON.stringify(payload.sorts, null, 2)
        });

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        console.log('API Response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error Details:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText,
            url,
            headers: {
              ...headers,
              Authorization: 'Bearer ***' + headers.Authorization.slice(-4)
            }
          });
          throw new Error(`Failed to fetch tasks: ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        console.log('API Response Data:', {
          hasMore: data.has_more,
          nextCursor: data.next_cursor,
          resultCount: data.results?.length || 0,
          firstResult: data.results?.[0] ? {
            id: data.results[0].id,
            properties: Object.keys(data.results[0].properties || {})
          } : null
        });
        
        allTasks.push(...data.results);

        if (!data.has_more) break;
        payload['start_cursor'] = data.next_cursor;
      }
    } catch (error) {
      console.error('Error in fetchTasks:', {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        url,
        databaseId: DATABASE_ID ? '***' + DATABASE_ID.slice(-4) : 'undefined'
      });
      throw error;
    }

    return allTasks;
  }

  private convertNotionTaskToTask(notionTask: any): Task {
    console.log('Converting Notion task:', {
      id: notionTask.id,
      properties: Object.keys(notionTask.properties || {}),
      createdTime: notionTask.created_time,
      lastEditedTime: notionTask.last_edited_time
    });

    const properties = notionTask.properties;
    const name = properties.Name?.title?.[0]?.text?.content || 'Unnamed Task';
    const description = properties.Description?.rich_text?.[0]?.text?.content || '';
    const dueDate = properties.Due?.date?.start;
    const priority = properties.Priority?.status?.name || 'Low';
    const status = properties.Status?.status?.name || 'Not started';

    const task = {
      id: notionTask.id,
      name,
      description,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      priority,
      status,
      createdAt: new Date(notionTask.created_time),
      updatedAt: new Date(notionTask.last_edited_time),
    };
    
    console.log('Converted task:', {
      ...task,
      dueDate: task.dueDate?.toISOString(),
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString()
    });
    return task;
  }

  public async getRecentTasks(limit: number = 5): Promise<Task[]> {
    console.log('getRecentTasks called:', { limit, initialized: this.initialized });
    
    if (!this.initialized) {
      this.initialized = true;
    }

    try {
      console.log('Fetching tasks from API route');
      const response = await fetch(`/api/notion?limit=${limit}`);
      
      if (!response.ok) {
        const error = await response.text();
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          error
        });
        throw new Error(`Failed to fetch tasks: ${response.statusText} - ${error}`);
      }

      const tasks = await response.json();
      console.log('Successfully fetched tasks:', {
        count: tasks.length,
        tasks: tasks.map((t: Task) => ({
          id: t.id,
          name: t.name,
          priority: t.priority,
          status: t.status
        }))
      });
      
      return tasks;
    } catch (error) {
      console.error('Error in getRecentTasks:', {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        limit,
        initialized: this.initialized
      });
      throw error;
    }
  }
}

export const notionService = NotionService.getInstance(); 