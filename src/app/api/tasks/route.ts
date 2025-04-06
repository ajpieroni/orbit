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
  if (!NOTION_API_KEY || !DATABASE_ID) {
    console.error('Missing Notion configuration:', {
      hasApiKey: !!NOTION_API_KEY,
      hasDatabaseId: !!DATABASE_ID,
      apiVersion: NOTION_API_VERSION
    });
    return NextResponse.json(
      { error: 'Notion configuration missing' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://api.notion.com/v1/databases/${DATABASE_ID}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_API_KEY}`,
          'Notion-Version': NOTION_API_VERSION,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filter: {
            property: 'Done',
            checkbox: {
              equals: false
            }
          },
          sorts: [
            {
              property: 'Created time',
              direction: 'descending'
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Notion API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      return NextResponse.json(
        { error: 'Failed to fetch tasks from Notion', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Full Notion API Response:', JSON.stringify(data, null, 2));

    const tasks = data.results.map((page: any) => {
      const properties = page.properties;
      console.log('Page Properties:', JSON.stringify(properties, null, 2));
      
      return {
        id: page.id,
        name: properties.Name?.title?.[0]?.plain_text || 'Untitled',
        description: properties.Description?.rich_text?.[0]?.plain_text || '',
        dueDate: properties['Due Date']?.date?.start || null,
        priority: properties.Priority?.select?.name || 'Not set',
        status: properties.Status?.select?.name || 'Not started',
        createdAt: page.created_time,
        updatedAt: page.last_edited_time,
        // Add all available properties
        properties: properties
      };
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks', details: error },
      { status: 500 }
    );
  }
} 