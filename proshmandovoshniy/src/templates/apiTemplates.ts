import { BlockType } from '../types/openapi';

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'common' | 'crud' | 'auth' | 'advanced';
  icon: string;
  blocks: Omit<BlockType, 'id'>[];
}

export const apiTemplates: Template[] = [
  {
    id: 'rest-crud',
    name: 'REST CRUD API',
    description: 'Complete CRUD operations for a resource',
    category: 'crud',
    icon: '🔄',
    blocks: [
      {
        type: 'info',
        title: 'Users API',
        expanded: false,
        data: {
          title: 'Users API',
          version: '1.0.0',
          description: 'Complete CRUD API for user management'
        }
      },
      {
        type: 'server',
        title: 'Production Server',
        expanded: false,
        data: {
          url: 'https://api.example.com/v1',
          description: 'Production server'
        }
      },
      {
        type: 'tag',
        title: 'Users',
        expanded: false,
        data: {
          name: 'users',
          description: 'User management operations'
        }
      },
      {
        type: 'path',
        title: '/users',
        expanded: false,
        data: {
          path: '/users',
          summary: 'User collection operations',
          description: 'Operations on the user collection',
          methods: ['get', 'post'],
          tags: ['users'],
          parameters: [],
          responses: {
            '200': {
              description: 'List of users',
              content: {
                'application/json': {
                  schema: { type: 'array', items: { type: 'object' } },
                  example: [
                    { id: 1, name: 'John Doe', email: 'john@example.com' },
                    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
                  ]
                }
              }
            }
          }
        }
      }
    ]
  },
  {
    id: 'simple-api',
    name: 'Simple API',
    description: 'Basic API with a few endpoints',
    category: 'common',
    icon: '🚀',
    blocks: [
      {
        type: 'info',
        title: 'Simple API',
        expanded: false,
        data: {
          title: 'Simple API',
          version: '1.0.0',
          description: 'A simple API example'
        }
      },
      {
        type: 'path',
        title: '/health',
        expanded: false,
        data: {
          path: '/health',
          summary: 'Health check',
          description: 'Check API health status',
          methods: ['get'],
          tags: [],
          parameters: [],
          responses: {
            '200': {
              description: 'API is healthy',
              content: {
                'application/json': {
                  schema: { type: 'object' },
                  example: { status: 'ok', timestamp: '2024-01-15T10:30:00Z' }
                }
              }
            }
          }
        }
      }
    ]
  }
];

export const pathTemplates = {
  'health-check': {
    name: 'Health Check',
    description: 'Standard health check endpoint',
    data: {
      path: '/health',
      summary: 'Health check',
      description: 'Returns the health status of the service',
      methods: ['get'],
      tags: ['health'],
      parameters: [],
      responses: {
        '200': {
          description: 'Service is healthy',
          content: {
            'application/json': {
              schema: { type: 'object' },
              example: { status: 'ok', timestamp: new Date().toISOString() }
            }
          }
        }
      }
    }
  },
  'crud-list': {
    name: 'List Resources',
    description: 'GET endpoint for listing resources with pagination',
    data: {
      path: '/resources',
      summary: 'List resources',
      description: 'Retrieve a paginated list of resources',
      methods: ['get'],
      tags: [],
      parameters: [
        {
          name: 'limit',
          in: 'query',
          required: false,
          description: 'Maximum number of items to return',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
        }
      ],
      responses: {
        '200': {
          description: 'List of resources',
          content: {
            'application/json': {
              schema: { type: 'object' },
              example: {
                data: [{ id: 1, name: 'Resource 1' }],
                total: 100,
                limit: 20,
                offset: 0
              }
            }
          }
        }
      }
    }
  }
};

export function getTemplatesByCategory(category: string): Template[] {
  return apiTemplates.filter(template => template.category === category);
}

export function getTemplateById(id: string): Template | undefined {
  return apiTemplates.find(template => template.id === id);
}

export function getPathTemplate(templateId: string) {
  return pathTemplates[templateId as keyof typeof pathTemplates];
}