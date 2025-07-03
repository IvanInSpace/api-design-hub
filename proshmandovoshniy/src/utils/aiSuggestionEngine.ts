import * as yaml from 'js-yaml';
import { OpenAPISpec, PathItem, Operation, Tag } from '../types/openapi';

export interface AISuggestion {
  id: string;
  type: 'path' | 'operation' | 'schema' | 'component' | 'parameter';
  title: string;
  description: string;
  yamlContent: string;
  insertPosition: {
    path: string[];
    line?: number;
  };
  confidence: number;
  reasoning: string;
}

export interface AnalysisContext {
  spec: OpenAPISpec;
  recentChanges: string[];
  lastModifiedSection?: string;
}

class AISuggestionEngine {
  private static readonly COMMON_PATTERNS = {
    crud: ['get', 'post', 'put', 'patch', 'delete'],
    restfulPaths: [
      '/{resource}',
      '/{resource}/{id}',
      '/{resource}/search',
      '/{resource}/{id}/{subresource}'
    ],
    commonParameters: [
      { name: 'limit', type: 'integer', description: 'Number of items to return' },
      { name: 'offset', type: 'integer', description: 'Number of items to skip' },
      { name: 'sort', type: 'string', description: 'Sort field and direction' },
      { name: 'filter', type: 'string', description: 'Filter criteria' }
    ]
  };

  static analyzePotentialSuggestions(context: AnalysisContext): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    
    try {
      // Анализ тегов без путей
      suggestions.push(...this.suggestPathsForNewTags(context));
      
      // Анализ неполных CRUD операций
      suggestions.push(...this.suggestMissingCrudOperations(context));
      
      // Анализ схем без использования
      suggestions.push(...this.suggestSchemaUsage(context));
      
      // Предложения для улучшения структуры
      suggestions.push(...this.suggestStructureImprovements(context));
      
      return suggestions.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error('Error analyzing suggestions:', error);
      return [];
    }
  }

  private static suggestPathsForNewTags(context: AnalysisContext): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    const { spec } = context;
    
    if (!spec.tags || !spec.paths) return suggestions;

    // Найти теги без путей
    const usedTags = new Set<string>();
    Object.values(spec.paths).forEach(pathItem => {
      if (pathItem) {
        Object.values(pathItem).forEach(operation => {
          if (operation && typeof operation === 'object' && 'tags' in operation) {
            operation.tags?.forEach(tag => usedTags.add(tag));
          }
        });
      }
    });

    spec.tags.forEach(tag => {
      if (!usedTags.has(tag.name)) {
        const resourceName = tag.name.toLowerCase();
        const pathName = `/${resourceName}`;
        
        const suggestion: AISuggestion = {
          id: `path-for-tag-${tag.name}`,
          type: 'path',
          title: `Create ${tag.name} endpoints`,
          description: `Add RESTful endpoints for ${tag.name} operations`,
          yamlContent: this.generateCrudPaths(resourceName, tag.name),
          insertPosition: {
            path: ['paths', pathName]
          },
          confidence: 0.9,
          reasoning: `Tag "${tag.name}" exists but has no associated endpoints. Adding RESTful CRUD operations would provide a complete API interface.`
        };
        
        suggestions.push(suggestion);
      }
    });

    return suggestions;
  }

  private static suggestMissingCrudOperations(context: AnalysisContext): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    const { spec } = context;
    
    if (!spec.paths) return suggestions;

    Object.entries(spec.paths).forEach(([path, pathItem]) => {
      if (!pathItem) return;

      const existingMethods = Object.keys(pathItem).filter(key => 
        this.COMMON_PATTERNS.crud.includes(key)
      );

      // Анализ для коллекций (например, /users)
      if (!path.includes('{') && existingMethods.length > 0 && existingMethods.length < 3) {
        const missingMethods = this.COMMON_PATTERNS.crud.filter(method => 
          !existingMethods.includes(method) && ['get', 'post'].includes(method)
        );

        missingMethods.forEach(method => {
          if (method === 'get' && !existingMethods.includes('get')) {
            suggestions.push(this.createOperationSuggestion(
              path, method, 'List all items', 'collection-get', 0.8
            ));
          } else if (method === 'post' && !existingMethods.includes('post')) {
            suggestions.push(this.createOperationSuggestion(
              path, method, 'Create new item', 'collection-post', 0.8
            ));
          }
        });
      }

      // Анализ для элементов (например, /users/{id})
      if (path.includes('{id}') && existingMethods.length > 0 && existingMethods.length < 4) {
        const missingMethods = this.COMMON_PATTERNS.crud.filter(method => 
          !existingMethods.includes(method) && ['get', 'put', 'patch', 'delete'].includes(method)
        );

        missingMethods.forEach(method => {
          const operationType = {
            'get': 'Get item by ID',
            'put': 'Update item',
            'patch': 'Partially update item', 
            'delete': 'Delete item'
          }[method];

          if (operationType) {
            suggestions.push(this.createOperationSuggestion(
              path, method, operationType, `item-${method}`, 0.7
            ));
          }
        });
      }
    });

    return suggestions;
  }

  private static suggestSchemaUsage(context: AnalysisContext): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    const { spec } = context;
    
    if (!spec.components?.schemas) return suggestions;

    const usedSchemas = new Set<string>();
    
    // Собрать все используемые схемы
    const collectSchemaRefs = (obj: any) => {
      if (typeof obj === 'object' && obj !== null) {
        if (obj.$ref && typeof obj.$ref === 'string' && obj.$ref.startsWith('#/components/schemas/')) {
          usedSchemas.add(obj.$ref.split('/').pop()!);
        }
        Object.values(obj).forEach(collectSchemaRefs);
      }
    };

    if (spec.paths) {
      collectSchemaRefs(spec.paths);
    }

    // Найти неиспользуемые схемы
    Object.keys(spec.components.schemas).forEach(schemaName => {
      if (!usedSchemas.has(schemaName)) {
        suggestions.push({
          id: `use-schema-${schemaName}`,
          type: 'path',
          title: `Create endpoints for ${schemaName}`,
          description: `Add API endpoints that use the ${schemaName} schema`,
          yamlContent: this.generateSchemaBasedPath(schemaName),
          insertPosition: {
            path: ['paths', `/${schemaName.toLowerCase()}`]
          },
          confidence: 0.6,
          reasoning: `Schema "${schemaName}" is defined but not used in any endpoints. Consider creating REST endpoints to utilize this schema.`
        });
      }
    });

    return suggestions;
  }

  private static suggestStructureImprovements(context: AnalysisContext): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    const { spec } = context;

    // Предложить добавить общие компоненты, если их нет
    if (!spec.components) {
      suggestions.push({
        id: 'add-components-section',
        type: 'component',
        title: 'Add Components section',
        description: 'Add reusable components section for schemas, parameters, and responses',
        yamlContent: this.generateBasicComponents(),
        insertPosition: {
          path: ['components']
        },
        confidence: 0.5,
        reasoning: 'Adding a components section will help organize reusable schemas and improve API maintainability.'
      });
    }

    // Предложить добавить общие параметры
    if (spec.paths && Object.keys(spec.paths).length > 3 && !spec.components?.parameters) {
      suggestions.push({
        id: 'add-common-parameters',
        type: 'component',
        title: 'Add common parameters',
        description: 'Add reusable parameters like pagination, sorting, and filtering',
        yamlContent: this.generateCommonParameters(),
        insertPosition: {
          path: ['components', 'parameters']
        },
        confidence: 0.4,
        reasoning: 'Common parameters for pagination and filtering can be reused across multiple endpoints.'
      });
    }

    return suggestions;
  }

  private static createOperationSuggestion(
    path: string, 
    method: string, 
    description: string, 
    type: string, 
    confidence: number
  ): AISuggestion {
    return {
      id: `${type}-${path}-${method}`,
      type: 'operation',
      title: `Add ${method.toUpperCase()} ${path}`,
      description,
      yamlContent: this.generateOperation(method, description, path),
      insertPosition: {
        path: ['paths', path, method]
      },
      confidence,
      reasoning: `${method.toUpperCase()} operation is commonly used for ${description.toLowerCase()} in REST APIs.`
    };
  }

  private static generateCrudPaths(resourceName: string, tagName: string): string {
    return `  /${resourceName}:
    get:
      tags:
        - ${tagName}
      summary: List all ${resourceName}
      description: Retrieve a list of ${resourceName}
      parameters:
        - name: limit
          in: query
          description: Number of items to return
          schema:
            type: integer
            default: 10
        - name: offset
          in: query
          description: Number of items to skip
          schema:
            type: integer
            default: 0
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      type: object
                  total:
                    type: integer
    post:
      tags:
        - ${tagName}
      summary: Create new ${resourceName.slice(0, -1)}
      description: Create a new ${resourceName.slice(0, -1)}
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
      responses:
        '201':
          description: Created successfully
        '400':
          description: Bad request
  /${resourceName}/{id}:
    get:
      tags:
        - ${tagName}
      summary: Get ${resourceName.slice(0, -1)} by ID
      description: Retrieve a specific ${resourceName.slice(0, -1)} by its ID
      parameters:
        - name: id
          in: path
          required: true
          description: ${tagName} ID
          schema:
            type: string
      responses:
        '200':
          description: Successful response
        '404':
          description: ${tagName} not found
    put:
      tags:
        - ${tagName}
      summary: Update ${resourceName.slice(0, -1)}
      description: Update an existing ${resourceName.slice(0, -1)}
      parameters:
        - name: id
          in: path
          required: true
          description: ${tagName} ID
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
      responses:
        '200':
          description: Updated successfully
        '404':
          description: ${tagName} not found
    delete:
      tags:
        - ${tagName}
      summary: Delete ${resourceName.slice(0, -1)}
      description: Delete a ${resourceName.slice(0, -1)}
      parameters:
        - name: id
          in: path
          required: true
          description: ${tagName} ID
          schema:
            type: string
      responses:
        '204':
          description: Deleted successfully
        '404':
          description: ${tagName} not found`;
  }

  private static generateOperation(method: string, description: string, path: string): string {
    const hasPathParams = path.includes('{');
    const resourceName = path.split('/').pop()?.replace(/[{}]/g, '') || 'resource';
    
    let operation = `    ${method}:
      summary: ${description}
      description: ${description}`;

    if (hasPathParams) {
      operation += `
      parameters:
        - name: id
          in: path
          required: true
          description: Resource ID
          schema:
            type: string`;
    }

    if (['post', 'put', 'patch'].includes(method)) {
      operation += `
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object`;
    }

    operation += `
      responses:`;

    switch (method) {
      case 'get':
        operation += `
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: ${hasPathParams ? 'object' : 'array'}`;
        break;
      case 'post':
        operation += `
        '201':
          description: Created successfully
        '400':
          description: Bad request`;
        break;
      case 'put':
      case 'patch':
        operation += `
        '200':
          description: Updated successfully
        '404':
          description: Not found`;
        break;
      case 'delete':
        operation += `
        '204':
          description: Deleted successfully
        '404':
          description: Not found`;
        break;
      default:
        operation += `
        '200':
          description: Successful response`;
    }

    return operation;
  }

  private static generateSchemaBasedPath(schemaName: string): string {
    const resourceName = schemaName.toLowerCase();
    return `  /${resourceName}:
    get:
      summary: List ${schemaName} items
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/${schemaName}'
    post:
      summary: Create ${schemaName}
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/${schemaName}'
      responses:
        '201':
          description: Created successfully`;
  }

  private static generateBasicComponents(): string {
    return `components:
  schemas:
    Error:
      type: object
      properties:
        code:
          type: integer
        message:
          type: string
        details:
          type: string
  responses:
    BadRequest:
      description: Bad request
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    InternalServerError:
      description: Internal server error
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'`;
  }

  private static generateCommonParameters(): string {
    return `    limit:
      name: limit
      in: query
      description: Maximum number of items to return
      schema:
        type: integer
        minimum: 1
        maximum: 100
        default: 10
    offset:
      name: offset
      in: query
      description: Number of items to skip
      schema:
        type: integer
        minimum: 0
        default: 0
    sort:
      name: sort
      in: query
      description: Sort order (field:direction)
      schema:
        type: string
        pattern: '^[a-zA-Z_][a-zA-Z0-9_]*:(asc|desc)$'
    filter:
      name: filter
      in: query
      description: Filter criteria
      schema:
        type: string`;
  }

  static detectRecentChanges(oldYaml: string, newYaml: string): string[] {
    const changes: string[] = [];
    
    try {
      const oldSpec = yaml.load(oldYaml) as OpenAPISpec;
      const newSpec = yaml.load(newYaml) as OpenAPISpec;
      
      // Detect new tags
      const oldTags = new Set(oldSpec.tags?.map(t => t.name) || []);
      const newTags = newSpec.tags?.map(t => t.name) || [];
      newTags.forEach(tag => {
        if (!oldTags.has(tag)) {
          changes.push(`Added tag: ${tag}`);
        }
      });
      
      // Detect new paths
      const oldPaths = new Set(Object.keys(oldSpec.paths || {}));
      const newPaths = Object.keys(newSpec.paths || {});
      newPaths.forEach(path => {
        if (!oldPaths.has(path)) {
          changes.push(`Added path: ${path}`);
        }
      });
      
      // Detect new schemas
      const oldSchemas = new Set(Object.keys(oldSpec.components?.schemas || {}));
      const newSchemas = Object.keys(newSpec.components?.schemas || {});
      newSchemas.forEach(schema => {
        if (!oldSchemas.has(schema)) {
          changes.push(`Added schema: ${schema}`);
        }
      });
      
    } catch (error) {
      console.error('Error detecting changes:', error);
    }
    
    return changes;
  }
}

export default AISuggestionEngine;