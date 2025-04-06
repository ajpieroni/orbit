import { NextResponse } from 'next/server';

// Debug environment variables
console.log('API Route Environment Variables:', {
  NOTION_API_KEY: process.env.NOTION_API_KEY ? '***' + process.env.NOTION_API_KEY.slice(-4) : 'missing',
  NOTION_DATABASE_ID: process.env.NOTION_DATABASE_ID ? '***' + process.env.NOTION_DATABASE_ID.slice(-4) : 'missing',
  NOTION_API_VERSION: process.env.NOTION_API_VERSION || '2022-06-28',
  NODE_ENV: process.env.NODE_ENV,
  allEnvVars: Object.keys(process.env).filter(key => key.includes('NOTION'))
});

interface NotionTask {
  id: string;
  properties: {
    Name?: {
      title: Array<{
        text: {
          content: string;
        };
      }>;
    };
    Description?: {
      rich_text: Array<{
        text: {
          content: string;
        };
      }>;
    };
    'Due Date'?: {
      date: {
        start: string;
      };
    };
    Priority?: {
      select: {
        name: string;
      };
    };
    Status?: {
      select: {
        name: string;
      };
    };
    Zoom?: {
      select: {
        name: string;
      };
    };
    Parent?: {
      relation: Array<{
        id: string;
      }>;
    };
  };
  created_time: string;
  last_edited_time: string;
}

interface NotionResponse {
  results: NotionTask[];
  has_more: boolean;
  next_cursor: string | null;
}

interface Task {
  id: string;
  name: string;
  description: string;
  dueDate: string | null;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  zoom: string;
  parentId: string | null;
  children: Task[];
  properties: any;
}

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const DATABASE_ID = process.env.NOTION_DATABASE_ID;
const NOTION_API_VERSION = process.env.NOTION_API_VERSION || '2022-06-28';
const INITIAL_PAGE_SIZE = 100; // Initial number of tasks to fetch
const PAGE_SIZE = 20; // Number of tasks per page for subsequent loads

const headers = {
  'Authorization': `Bearer ${NOTION_API_KEY}`,
  'Notion-Version': NOTION_API_VERSION,
  'Content-Type': 'application/json',
};

export async function GET(request: Request) {
  try {
    if (!NOTION_API_KEY || !DATABASE_ID) {
      console.error('Missing Notion configuration:', {
        hasApiKey: !!NOTION_API_KEY,
        hasDatabaseId: !!DATABASE_ID
      });
      return NextResponse.json(
        { error: 'Notion configuration missing' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const startCursor = searchParams.get('cursor') || undefined;

    // Use larger page size for initial load
    const pageSize = page === 1 ? INITIAL_PAGE_SIZE : PAGE_SIZE;

    const body = {
      filter: {
        property: 'Status',
        status: {
          does_not_equal: 'Done'
        }
      },
      sorts: [
        {
          property: 'Created time',
          direction: 'descending'
        }
      ],
      page_size: pageSize,
      ...(startCursor ? { start_cursor: startCursor } : {})
    };

    console.log('Making Notion API request with body:', JSON.stringify(body, null, 2));

    const response = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Notion API error:', errorData);
      throw new Error(`Notion API error: ${errorData.message}`);
    }

    const data: NotionResponse = await response.json();
    console.log('Notion API response:', JSON.stringify(data, null, 2));

    const tasks: Task[] = data.results.map((page: NotionTask) => {
      const properties = page.properties;
      return {
        id: page.id,
        name: properties.Name?.title?.[0]?.text?.content || 'Untitled',
        description: properties.Description?.rich_text?.[0]?.text?.content || '',
        dueDate: properties['Due Date']?.date?.start || null,
        priority: properties.Priority?.select?.name || 'Medium',
        status: properties.Status?.select?.name || 'Not Started',
        createdAt: page.created_time,
        updatedAt: page.last_edited_time,
        zoom: properties.Zoom?.select?.name || 'Day',
        parentId: properties.Parent?.relation?.[0]?.id || null,
        children: [],
        properties: {
          ...properties,
          id: page.id
        }
      };
    });

    return NextResponse.json({
      tasks,
      hasMore: data.has_more,
      nextCursor: data.next_cursor
    });

  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch tasks',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 