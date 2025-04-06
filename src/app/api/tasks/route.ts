import { NextResponse } from 'next/server';

// Debug environment variables
console.log('API Route Environment Variables:', {
  NOTION_API_KEY: process.env.NOTION_API_KEY ? '***' + process.env.NOTION_API_KEY.slice(-4) : 'missing',
  NOTION_DATABASE_ID: process.env.NOTION_DATABASE_ID ? '***' + process.env.NOTION_DATABASE_ID.slice(-4) : 'missing',
  NOTION_API_VERSION: process.env.NOTION_API_VERSION || '2022-06-28',
  NODE_ENV: process.env.NODE_ENV,
  allEnvVars: Object.keys(process.env).filter(key => key.includes('NOTION'))
});

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const DATABASE_ID = process.env.NOTION_DATABASE_ID;
const NOTION_API_VERSION = process.env.NOTION_API_VERSION || '2022-06-28';

const headers = {
  'Authorization': `Bearer ${NOTION_API_KEY}`,
  'Content-Type': 'application/json',
  'Notion-Version': NOTION_API_VERSION,
};

export async function GET() {
  try {
    if (!NOTION_API_KEY || !DATABASE_ID) {
      const error = {
        message: 'Notion configuration missing',
        details: {
          hasApiKey: !!NOTION_API_KEY,
          hasDatabaseId: !!DATABASE_ID,
          envVars: {
            NOTION_API_KEY: process.env.NOTION_API_KEY,
            NOTION_DATABASE_ID: process.env.NOTION_DATABASE_ID,
            NOTION_API_VERSION: process.env.NOTION_API_VERSION
          }
        }
      };
      console.error('Configuration Error:', error);
      return NextResponse.json(error, { status: 500 });
    }

    // Simplified filter to just get non-completed tasks
    const filter = {
      property: 'Done',
      checkbox: {
        equals: false
      }
    };

    const sorts = [
      {
        property: 'Created time',
        direction: 'descending'
      }
    ];

    const url = `https://api.notion.com/v1/databases/${DATABASE_ID}/query`;
    console.log('Making Notion API request:', {
      url,
      method: 'POST',
      headers: {
        ...headers,
        Authorization: 'Bearer ***' + NOTION_API_KEY.slice(-4)
      },
      body: {
        filter,
        sorts,
        page_size: 5
      }
    });

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ filter, sorts, page_size: 5 }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const error = {
        message: 'Notion API Error',
        details: {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        }
      };
      console.error('API Error:', error);
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    console.log('Notion API Response:', {
      hasMore: data.has_more,
      nextCursor: data.next_cursor,
      resultCount: data.results?.length || 0
    });

    const tasks = data.results.map((notionTask: any) => {
      const properties = notionTask.properties;
      return {
        id: notionTask.id,
        name: properties.Name?.title?.[0]?.text?.content || 'Unnamed Task',
        description: properties.Description?.rich_text?.[0]?.text?.content || '',
        dueDate: properties.Due?.date?.start ? new Date(properties.Due.date.start) : undefined,
        priority: properties.Priority?.status?.name || 'Low',
        status: properties.Status?.status?.name || 'Not started',
        createdAt: new Date(notionTask.created_time).toISOString(),
        updatedAt: new Date(notionTask.last_edited_time).toISOString(),
      };
    });

    console.log('Converted tasks:', {
      count: tasks.length,
      tasks: tasks.map(t => ({
        id: t.id,
        name: t.name,
        priority: t.priority,
        status: t.status
      }))
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Unexpected Error:', error);
    return NextResponse.json(
      { 
        message: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 