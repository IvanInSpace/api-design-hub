import { OpenAPISpec } from '../types/openapi';

export interface ValidationError {
  path: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  infos: ValidationError[];
}

export class OpenAPIValidator {
  static validate(spec: OpenAPISpec): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const infos: ValidationError[] = [];

    // Validate OpenAPI version
    if (!spec.openapi) {
      errors.push({
        path: 'openapi',
        message: 'OpenAPI version is required',
        severity: 'error'
      });
    } else if (!spec.openapi.startsWith('3.0')) {
      warnings.push({
        path: 'openapi',
        message: 'Consider using OpenAPI 3.0.x for better compatibility',
        severity: 'warning'
      });
    }

    // Validate info object
    this.validateInfo(spec.info, errors, warnings, infos);

    // Validate servers
    if (spec.servers) {
      this.validateServers(spec.servers, errors, warnings, infos);
    }

    // Validate paths
    this.validatePaths(spec.paths, errors, warnings, infos);

    // Validate components
    if (spec.components) {
      this.validateComponents(spec.components, errors, warnings, infos);
    }

    const isValid = errors.length === 0;

    return {
      isValid,
      errors,
      warnings,
      infos
    };
  }

  private static validateInfo(info: any, errors: ValidationError[], warnings: ValidationError[], infos: ValidationError[]) {
    if (!info) {
      errors.push({
        path: 'info',
        message: 'Info object is required',
        severity: 'error'
      });
      return;
    }

    // Required fields
    if (!info.title) {
      errors.push({
        path: 'info.title',
        message: 'Title is required in info object',
        severity: 'error'
      });
    }

    if (!info.version) {
      errors.push({
        path: 'info.version',
        message: 'Version is required in info object',
        severity: 'error'
      });
    }

    // Optional but recommended fields
    if (!info.description) {
      infos.push({
        path: 'info.description',
        message: 'Consider adding a description to your API',
        severity: 'info'
      });
    }

    // Validate contact info
    if (info.contact) {
      if (info.contact.email && !this.isValidEmail(info.contact.email)) {
        errors.push({
          path: 'info.contact.email',
          message: 'Invalid email format in contact information',
          severity: 'error'
        });
      }

      if (info.contact.url && !this.isValidUrl(info.contact.url)) {
        errors.push({
          path: 'info.contact.url',
          message: 'Invalid URL format in contact information',
          severity: 'error'
        });
      }
    }

    // Validate license
    if (info.license) {
      if (!info.license.name) {
        errors.push({
          path: 'info.license.name',
          message: 'License name is required when license object is present',
          severity: 'error'
        });
      }

      if (info.license.url && !this.isValidUrl(info.license.url)) {
        errors.push({
          path: 'info.license.url',
          message: 'Invalid URL format in license information',
          severity: 'error'
        });
      }
    }
  }

  private static validateServers(servers: any[], errors: ValidationError[], warnings: ValidationError[], infos: ValidationError[]) {
    if (servers.length === 0) {
      warnings.push({
        path: 'servers',
        message: 'No servers defined. Consider adding at least one server',
        severity: 'warning'
      });
      return;
    }

    servers.forEach((server, index) => {
      if (!server.url) {
        errors.push({
          path: `servers[${index}].url`,
          message: 'Server URL is required',
          severity: 'error'
        });
      } else if (!this.isValidUrl(server.url) && !server.url.includes('{')) {
        // Allow templated URLs
        errors.push({
          path: `servers[${index}].url`,
          message: 'Invalid server URL format',
          severity: 'error'
        });
      }

      if (!server.description) {
        infos.push({
          path: `servers[${index}].description`,
          message: 'Consider adding a description to your server',
          severity: 'info'
        });
      }
    });
  }

  private static validatePaths(paths: any, errors: ValidationError[], warnings: ValidationError[], infos: ValidationError[]) {
    if (!paths || Object.keys(paths).length === 0) {
      warnings.push({
        path: 'paths',
        message: 'No paths defined. Your API should have at least one endpoint',
        severity: 'warning'
      });
      return;
    }

    Object.entries(paths).forEach(([path, pathItem]: [string, any]) => {
      // Validate path format
      if (!path.startsWith('/')) {
        errors.push({
          path: `paths.${path}`,
          message: 'Path must start with /',
          severity: 'error'
        });
      }

      // Check for path parameters consistency
      const pathParams = this.extractPathParameters(path);
      
      // Validate HTTP methods
      const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'];
      const definedMethods = Object.keys(pathItem).filter(key => httpMethods.includes(key));

      if (definedMethods.length === 0) {
        warnings.push({
          path: `paths.${path}`,
          message: 'No HTTP methods defined for this path',
          severity: 'warning'
        });
      }

      // Validate each operation
      definedMethods.forEach(method => {
        this.validateOperation(pathItem[method], `paths.${path}.${method}`, errors, warnings, infos);
      });
    });
  }

  private static validateOperation(operation: any, path: string, errors: ValidationError[], warnings: ValidationError[], infos: ValidationError[]) {
    if (!operation) return;

    // Check for responses
    if (!operation.responses || Object.keys(operation.responses).length === 0) {
      errors.push({
        path: `${path}.responses`,
        message: 'Operation must have at least one response',
        severity: 'error'
      });
    } else {
      // Check for success response
      const hasSuccessResponse = Object.keys(operation.responses).some(code => 
        code.startsWith('2') || code === 'default'
      );
      
      if (!hasSuccessResponse) {
        warnings.push({
          path: `${path}.responses`,
          message: 'Consider adding a success response (2xx)',
          severity: 'warning'
        });
      }

      // Validate each response
      Object.entries(operation.responses).forEach(([statusCode, response]: [string, any]) => {
        this.validateResponse(response, `${path}.responses.${statusCode}`, errors, warnings, infos);
      });
    }

    // Check for operation ID
    if (!operation.operationId) {
      infos.push({
        path: `${path}.operationId`,
        message: 'Consider adding an operationId for better tooling support',
        severity: 'info'
      });
    }

    // Check for summary or description
    if (!operation.summary && !operation.description) {
      warnings.push({
        path: `${path}.summary`,
        message: 'Consider adding a summary or description to your operation',
        severity: 'warning'
      });
    }
  }

  private static validateResponse(response: any, path: string, errors: ValidationError[], warnings: ValidationError[], infos: ValidationError[]) {
    if (!response.description) {
      errors.push({
        path: `${path}.description`,
        message: 'Response description is required',
        severity: 'error'
      });
    }

    // Check for content in success responses
    if (path.includes('.2') && !response.content) {
      warnings.push({
        path: `${path}.content`,
        message: 'Success responses should typically have content',
        severity: 'warning'
      });
    }
  }

  private static validateComponents(components: any, errors: ValidationError[], warnings: ValidationError[], infos: ValidationError[]) {
    // Validate schemas
    if (components.schemas) {
      Object.entries(components.schemas).forEach(([name, schema]: [string, any]) => {
        this.validateSchema(schema, `components.schemas.${name}`, errors, warnings, infos);
      });
    }
  }

  private static validateSchema(schema: any, path: string, errors: ValidationError[], warnings: ValidationError[], infos: ValidationError[]) {
    if (schema.type === 'array' && !schema.items) {
      errors.push({
        path: `${path}.items`,
        message: 'Array type must have items definition',
        severity: 'error'
      });
    }
  }

  private static extractPathParameters(path: string): string[] {
    const matches = path.match(/{([^}]+)}/g);
    return matches ? matches.map(match => match.slice(1, -1)) : [];
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

export default OpenAPIValidator;