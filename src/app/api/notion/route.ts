import { NextResponse } from 'next/server';

// Server-side environment variables
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const DATABASE_ID = process.env.NOTION_DATABASE_ID;
const NOTION_API_VERSION = process.env.NOTION_API_VERSION || '2022-06-28';

// Debug environment variables (server-side only)
console.log('Server Environment Variables Debug:', {
  allEnvVars: Object.keys(process.env).filter(key => key.includes('NOTION')),
  apiKey: {
    exists: !!NOTION_API_KEY,
    length: NOTION_API_KEY?.length,
    last4: NOTION_API_KEY?.slice(-4)
  },
  databaseId: {
    exists: !!DATABASE_ID,
    value: DATABASE_ID
  },
  apiVersion: {
    value: NOTION_API_VERSION,
    isDefault: NOTION_API_VERSION === '2022-06-28'
  }
});

const headers = {
  'Authorization': `Bearer ${NOTION_API_KEY}`,
  'Content-Type': 'application/json',
  'Notion-Version': NOTION_API_VERSION,
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    if (!NOTION_API_KEY || !DATABASE_ID) {
      console.error('Missing Notion configuration:', {
        hasApiKey: !!NOTION_API_KEY,
        hasDatabaseId: !!DATABASE_ID,
        envVars: {
          NOTION_API_KEY: process.env.NOTION_API_KEY,
          NOTION_DATABASE_ID: process.env.NOTION_DATABASE_ID,
          NOTION_API_VERSION: process.env.NOTION_API_VERSION
        }
      });
      return NextResponse.json(
        { error: 'Notion configuration missing' },
        { status: 500 }
      );
    }

    const filter = {
      and: [
        { property: 'Done', checkbox: { equals: false } },
        { property: 'Priority', status: { does_not_equal: 'Someday' } },
        { property: 'Status', status: { does_not_equal: 'Done' } },
      ],
    };

    const sorts = [
      { timestamp: 'created_time', direction: 'descending' },
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
        page_size: limit
      }
    });

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ filter, sorts, page_size: limit }),
      next: {
        revalidate: 60 // Revalidate cache every 60 seconds
      }
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Notion API Error:', {
        status: response.status,
        statusText: response.statusText,
        error
      });
      return NextResponse.json(
        { error: `Failed to fetch tasks: ${response.statusText} - ${error}` },
        { status: response.status }
      );
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
        createdAt: new Date(notionTask.created_time),
        updatedAt: new Date(notionTask.last_edited_time),
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

    return NextResponse.json(tasks, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
      }
    });
  } catch (error) {
    console.error('Error in Notion API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 