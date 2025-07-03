import * as yaml from 'js-yaml';
import { OpenAPISpec, BlockType, InfoObject, ServerObject, PathItemObject, TagObject } from '../types/openapi';

export class YamlGenerator {
  static generateFromBlocks(blocks: BlockType[]): string {
    const spec: Partial<OpenAPISpec> = {
      openapi: '3.0.3'
    };

    // Process blocks by type
    blocks.forEach(block => {
      switch (block.type) {
        case 'info':
          spec.info = this.generateInfoObject(block.data);
          break;
        case 'server':
          if (!spec.servers) spec.servers = [];
          spec.servers.push(this.generateServerObject(block.data));
          break;
        case 'path':
          if (!spec.paths) spec.paths = {};
          Object.assign(spec.paths, this.generatePathObject(block.data));
          break;
        case 'tag':
          if (!spec.tags) spec.tags = [];
          spec.tags.push(this.generateTagObject(block.data));
          break;
        case 'component':
          if (!spec.components) spec.components = {};
          this.mergeComponentsObject(spec.components, block.data);
          break;
        case 'security':
          if (!spec.components) spec.components = {};
          if (!spec.components.securitySchemes) spec.components.securitySchemes = {};
          if (block.data.securitySchemes) {
            Object.assign(spec.components.securitySchemes, block.data.securitySchemes);
          }
          if (block.data.globalSecurity && Array.isArray(block.data.globalSecurity)) {
            spec.security = block.data.globalSecurity;
          }
          break;
        case 'component':
          if (!spec.components) spec.components = {};
          this.mergeComponentsObject(spec.components, block.data);
          break;
        case 'security':
          if (!spec.components) spec.components = {};
          if (block.data.securitySchemes) {
            spec.components.securitySchemes = {
              ...spec.components.securitySchemes,
              ...block.data.securitySchemes
            };
          }
          break;
      }
    });

    // Set defaults if not provided
    if (!spec.info) {
      spec.info = {
        title: 'My API',
        version: '1.0.0',
        description: 'API created with Proshmandovoshniy'
      };
    }

    if (!spec.paths) {
      spec.paths = {};
    }

    try {
      return yaml.dump(spec, {
        indent: 2,
        lineWidth: 120,
        noRefs: true,
        sortKeys: false
      });
    } catch (error) {
      console.error('Error generating YAML:', error);
      return '# Error generating YAML specification\n# Please check your block configuration';
    }
  }

  private static generateInfoObject(data: any): InfoObject {
    const info: InfoObject = {
      title: data.title || 'My API',
      version: data.version || '1.0.0'
    };

    if (data.description) info.description = data.description;
    if (data.termsOfService) info.termsOfService = data.termsOfService;

    // Contact information
    if (data.contactName || data.contactEmail || data.contactUrl) {
      info.contact = {};
      if (data.contactName) info.contact.name = data.contactName;
      if (data.contactEmail) info.contact.email = data.contactEmail;
      if (data.contactUrl) info.contact.url = data.contactUrl;
    }

    // License information
    if (data.licenseName) {
      info.license = {
        name: data.licenseName
      };
      if (data.licenseUrl) info.license.url = data.licenseUrl;
    }

    return info;
  }

  private static generateServerObject(data: any): ServerObject {
    const server: ServerObject = {
      url: data.url || 'https://api.example.com'
    };

    if (data.description) {
      server.description = data.description;
    }

    return server;
  }

  private static generatePathObject(data: any): { [path: string]: PathItemObject } {
    const path = data.path || '/example';
    const pathItem: PathItemObject = {};

    if (data.summary) pathItem.summary = data.summary;
    if (data.description) pathItem.description = data.description;

    // Add HTTP methods
    const methods = data.methods || ['get'];
    methods.forEach((method: string) => {
      pathItem[method as keyof PathItemObject] = this.generateOperationObject(data, method);
    });

    return { [path]: pathItem };
  }

  private static generateOperationObject(data: any, method: string) {
    const operation: any = {
      summary: data.summary || `${method.toUpperCase()} ${data.path || '/example'}`,
      responses: {
        '200': {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                example: this.generateExampleForMethod(method)
              }
            }
          }
        }
      }
    };

    if (data.description) {
      operation.description = data.description;
    }

    // Add request body for POST, PUT, PATCH
    if (['post', 'put', 'patch'].includes(method)) {
      operation.requestBody = {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              example: this.generateExampleRequestBody(method)
            }
          }
        }
      };
    }

    return operation;
  }

  private static mergeComponentsObject(components: any, blockData: any) {
    if (blockData.schemas) {
      components.schemas = {
        ...components.schemas,
        ...blockData.schemas
      };
    }
    
    if (blockData.responses) {
      components.responses = {
        ...components.responses,
        ...blockData.responses
      };
    }
    
    if (blockData.parameters) {
      components.parameters = {
        ...components.parameters,
        ...blockData.parameters
      };
    }
  }

  private static generateTagObject(data: any): TagObject {
    const tag: TagObject = {
      name: data.name || 'default'
    };

    if (data.description) tag.description = data.description;
    if (data.externalDocsUrl) {
      tag.externalDocs = {
        url: data.externalDocsUrl
      };
    }

    return tag;
  }

  private static generateExampleForMethod(method: string): any {
    switch (method) {
      case 'get':
        return {
          id: 1,
          name: 'Example Item',
          status: 'active',
          created_at: '2024-01-15T10:30:00Z'
        };
      case 'post':
        return {
          id: 2,
          name: 'New Item',
          status: 'created',
          created_at: '2024-01-15T10:35:00Z'
        };
      case 'put':
        return {
          id: 1,
          name: 'Updated Item',
          status: 'updated',
          updated_at: '2024-01-15T10:40:00Z'
        };
      case 'delete':
        return {
          message: 'Item deleted successfully',
          deleted_at: '2024-01-15T10:45:00Z'
        };
      default:
        return {
          message: 'Operation completed successfully'
        };
    }
  }

  private static generateExampleRequestBody(method: string): any {
    switch (method) {
      case 'post':
        return {
          name: 'New Item Name',
          description: 'Description of the new item',
          status: 'active'
        };
      case 'put':
        return {
          name: 'Updated Item Name',
          description: 'Updated description',
          status: 'updated'
        };
      case 'patch':
        return {
          status: 'modified'
        };
      default:
        return {
          data: 'example'
        };
    }
  }

  static parseYamlToBlocks(yamlContent: string): BlockType[] {
    try {
      const spec = yaml.load(yamlContent) as OpenAPISpec;
      const blocks: BlockType[] = [];

      // Generate info block
      if (spec.info) {
        blocks.push({
          id: 'info-' + Date.now(),
          type: 'info',
          title: spec.info.title,
          expanded: true,
          data: {
            title: spec.info.title,
            version: spec.info.version,
            description: spec.info.description,
            termsOfService: spec.info.termsOfService,
            contactName: spec.info.contact?.name,
            contactEmail: spec.info.contact?.email,
            contactUrl: spec.info.contact?.url,
            licenseName: spec.info.license?.name,
            licenseUrl: spec.info.license?.url
          }
        });
      }

      // Generate server blocks
      if (spec.servers) {
        spec.servers.forEach((server, index) => {
          blocks.push({
            id: `server-${index}-${Date.now()}`,
            type: 'server',
            title: server.url,
            expanded: false,
            data: {
              url: server.url,
              description: server.description
            }
          });
        });
      }

      // Generate path blocks
      if (spec.paths) {
        Object.entries(spec.paths).forEach(([path, pathItem]) => {
          const methods = Object.keys(pathItem).filter(key => 
            ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'].includes(key)
          );

          blocks.push({
            id: `path-${path.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}`,
            type: 'path',
            title: path,
            expanded: false,
            data: {
              path,
              summary: pathItem.summary,
              description: pathItem.description,
              methods
            }
          });
        });
      }

      // Generate tag blocks
      if (spec.tags) {
        spec.tags.forEach((tag, index) => {
          blocks.push({
            id: `tag-${index}-${Date.now()}`,
            type: 'tag',
            title: tag.name,
            expanded: false,
            data: {
              name: tag.name,
              description: tag.description,
              externalDocsUrl: tag.externalDocs?.url
            }
          });
        });
      }

      // Generate component blocks
      if (spec.components && (spec.components.schemas || spec.components.responses || spec.components.parameters)) {
        blocks.push({
          id: `components-${Date.now()}`,
          type: 'component',
          title: 'Components',
          expanded: false,
          data: {
            schemas: spec.components.schemas || {},
            responses: spec.components.responses || {},
            parameters: spec.components.parameters || {}
          }
        });
      }

      // Generate security blocks
      if (spec.components?.securitySchemes) {
        blocks.push({
          id: `security-${Date.now()}`,
          type: 'security',
          title: 'Security Schemes',
          expanded: false,
          data: {
            securitySchemes: spec.components.securitySchemes
          }
        });
      }

      return blocks;
    } catch (error) {
      console.error('Error parsing YAML:', error);
      return [];
    }
  }
}

export default YamlGenerator;