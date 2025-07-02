import { SchemaObject } from '../types/openapi';

export interface ExampleGeneratorOptions {
  useRealData?: boolean;
  locale?: string;
  seed?: number;
}

export class ExampleGenerator {
  private static readonly SAMPLE_NAMES = [
    'John Doe', 'Jane Smith', 'Alice Johnson', 'Bob Wilson', 'Emma Brown',
    'Michael Davis', 'Sarah Garcia', 'David Miller', 'Lisa Anderson', 'James Taylor'
  ];

  private static readonly SAMPLE_EMAILS = [
    'john.doe@example.com', 'jane.smith@example.com', 'alice@company.com',
    'bob.wilson@test.org', 'emma.brown@demo.net', 'michael@sample.io'
  ];

  private static readonly SAMPLE_COMPANIES = [
    'Acme Corp', 'TechStart Inc', 'Global Solutions', 'Innovation Labs',
    'Future Systems', 'Digital Dynamics', 'Smart Technologies'
  ];

  private static readonly SAMPLE_ADDRESSES = [
    '123 Main St, New York, NY 10001',
    '456 Oak Ave, Los Angeles, CA 90210',
    '789 Pine Rd, Chicago, IL 60601',
    '321 Elm St, Houston, TX 77001'
  ];

  private static readonly SAMPLE_PRODUCTS = [
    'Premium Widget', 'Deluxe Component', 'Standard Module', 'Advanced Tool',
    'Professional Service', 'Enterprise Solution', 'Basic Package'
  ];

  private static readonly SAMPLE_STATUSES = [
    'active', 'inactive', 'pending', 'completed', 'processing', 'cancelled', 'draft'
  ];

  private static readonly SAMPLE_CATEGORIES = [
    'electronics', 'books', 'clothing', 'home', 'sports', 'automotive', 'health'
  ];

  private static randomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private static randomFloat(min: number, max: number, decimals: number = 2): number {
    const value = Math.random() * (max - min) + min;
    return parseFloat(value.toFixed(decimals));
  }

  private static randomDate(start?: Date, end?: Date): string {
    const startDate = start || new Date(2020, 0, 1);
    const endDate = end || new Date();
    const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime());
    return new Date(randomTime).toISOString();
  }

  private static generateStringExample(schema: SchemaObject): string {
    // Check for format-specific examples
    switch (schema.format) {
      case 'email':
        return this.randomElement(this.SAMPLE_EMAILS);
      case 'date':
        return new Date().toISOString().split('T')[0];
      case 'date-time':
        return this.randomDate();
      case 'uri':
      case 'url':
        return 'https://example.com';
      case 'uuid':
        return '123e4567-e89b-12d3-a456-426614174000';
      case 'password':
        return 'password123';
      case 'byte':
        return 'U3dhZ2dlciByb2Nrcw==';
      case 'binary':
        return 'binary-data';
    }

    // Check for enum values
    if (schema.enum && schema.enum.length > 0) {
      return this.randomElement(schema.enum as string[]);
    }

    // Check for pattern-based generation
    if (schema.pattern) {
      // Simple pattern matching for common cases
      if (schema.pattern.includes('\\d')) {
        return this.randomInt(100000, 999999).toString();
      }
    }

    // Generate based on property name hints
    const title = schema.title?.toLowerCase() || '';
    if (title.includes('name') || title.includes('title')) {
      return this.randomElement(this.SAMPLE_NAMES);
    }
    if (title.includes('email')) {
      return this.randomElement(this.SAMPLE_EMAILS);
    }
    if (title.includes('company')) {
      return this.randomElement(this.SAMPLE_COMPANIES);
    }
    if (title.includes('address')) {
      return this.randomElement(this.SAMPLE_ADDRESSES);
    }
    if (title.includes('status')) {
      return this.randomElement(this.SAMPLE_STATUSES);
    }
    if (title.includes('category')) {
      return this.randomElement(this.SAMPLE_CATEGORIES);
    }

    // Default string examples
    if (schema.minLength && schema.maxLength) {
      const length = this.randomInt(schema.minLength, schema.maxLength);
      return 'example'.repeat(Math.ceil(length / 7)).substring(0, length);
    }

    return 'example string';
  }

  private static generateNumberExample(schema: SchemaObject): number {
    const min = schema.minimum ?? 0;
    const max = schema.maximum ?? 1000;

    if (schema.type === 'integer') {
      return this.randomInt(min, max);
    } else {
      return this.randomFloat(min, max);
    }
  }

  private static generateArrayExample(schema: SchemaObject): any[] {
    const minItems = schema.minItems ?? 1;
    const maxItems = schema.maxItems ?? 3;
    const itemCount = this.randomInt(minItems, Math.min(maxItems, 5));

    const items: any[] = [];
    for (let i = 0; i < itemCount; i++) {
      if (schema.items) {
        items.push(this.generateExample(schema.items as SchemaObject));
      } else {
        items.push('item ' + (i + 1));
      }
    }

    return items;
  }

  private static generateObjectExample(schema: SchemaObject): Record<string, any> {
    const obj: Record<string, any> = {};

    // Handle properties
    if (schema.properties) {
      Object.entries(schema.properties).forEach(([key, propSchema]) => {
        // Check if property is required
        const isRequired = schema.required?.includes(key) ?? false;
        
        // Generate example for required properties or randomly for optional ones
        if (isRequired || Math.random() > 0.3) {
          obj[key] = this.generateExample(propSchema as SchemaObject);
        }
      });
    }

    // If no properties defined, generate a simple object
    if (Object.keys(obj).length === 0) {
      obj.id = this.randomInt(1, 1000);
      obj.name = this.randomElement(this.SAMPLE_NAMES);
      obj.createdAt = this.randomDate();
    }

    return obj;
  }

  static generateExample(schema: SchemaObject, options: ExampleGeneratorOptions = {}): any {
    // Return existing example if available
    if (schema.example !== undefined) {
      return schema.example;
    }

    // Handle enum values
    if (schema.enum && schema.enum.length > 0) {
      return this.randomElement(schema.enum);
    }

    // Handle different types
    switch (schema.type) {
      case 'string':
        return this.generateStringExample(schema);

      case 'number':
      case 'integer':
        return this.generateNumberExample(schema);

      case 'boolean':
        return Math.random() > 0.5;

      case 'array':
        return this.generateArrayExample(schema);

      case 'object':
        return this.generateObjectExample(schema);

      case 'null':
        return null;

      default:
        // Handle oneOf, anyOf, allOf
        if (schema.oneOf && schema.oneOf.length > 0) {
          const randomSchema = this.randomElement(schema.oneOf as SchemaObject[]);
          return this.generateExample(randomSchema, options);
        }

        if (schema.anyOf && schema.anyOf.length > 0) {
          const randomSchema = this.randomElement(schema.anyOf as SchemaObject[]);
          return this.generateExample(randomSchema, options);
        }

        if (schema.allOf && schema.allOf.length > 0) {
          // Merge all schemas and generate example
          const mergedSchema: SchemaObject = { type: 'object', properties: {} };
          schema.allOf.forEach(subSchema => {
            const subSchemaObj = subSchema as SchemaObject;
            if (subSchemaObj.properties) {
              Object.assign(mergedSchema.properties!, subSchemaObj.properties);
            }
          });
          return this.generateExample(mergedSchema, options);
        }

        // Default fallback
        return 'example value';
    }
  }

  static generateExampleFromPath(path: string, method: string): any {
    // Generate context-aware examples based on path and method
    const pathLower = path.toLowerCase();
    const methodLower = method.toLowerCase();

    if (pathLower.includes('user')) {
      return this.generateUserExample(methodLower);
    }

    if (pathLower.includes('product') || pathLower.includes('item')) {
      return this.generateProductExample(methodLower);
    }

    if (pathLower.includes('order')) {
      return this.generateOrderExample(methodLower);
    }

    if (pathLower.includes('auth') || pathLower.includes('login')) {
      return this.generateAuthExample(methodLower);
    }

    // Default generic example
    return this.generateGenericExample(methodLower);
  }

  private static generateUserExample(method: string): any {
    const baseUser = {
      id: this.randomInt(1, 10000),
      name: this.randomElement(this.SAMPLE_NAMES),
      email: this.randomElement(this.SAMPLE_EMAILS),
      createdAt: this.randomDate(),
      status: this.randomElement(['active', 'inactive', 'pending'])
    };

    switch (method) {
      case 'post':
        return {
          ...baseUser,
          message: 'User created successfully'
        };
      case 'put':
      case 'patch':
        return {
          ...baseUser,
          updatedAt: this.randomDate(),
          message: 'User updated successfully'
        };
      case 'delete':
        return {
          message: 'User deleted successfully',
          deletedAt: this.randomDate()
        };
      default:
        return baseUser;
    }
  }

  private static generateProductExample(method: string): any {
    const baseProduct = {
      id: this.randomInt(1, 1000),
      name: this.randomElement(this.SAMPLE_PRODUCTS),
      price: this.randomFloat(9.99, 999.99),
      category: this.randomElement(this.SAMPLE_CATEGORIES),
      inStock: Math.random() > 0.2,
      createdAt: this.randomDate()
    };

    switch (method) {
      case 'post':
        return {
          ...baseProduct,
          message: 'Product created successfully'
        };
      case 'put':
      case 'patch':
        return {
          ...baseProduct,
          updatedAt: this.randomDate(),
          message: 'Product updated successfully'
        };
      case 'delete':
        return {
          message: 'Product deleted successfully',
          deletedAt: this.randomDate()
        };
      default:
        return baseProduct;
    }
  }

  private static generateOrderExample(method: string): any {
    const baseOrder = {
      id: 'ord_' + this.randomInt(100000, 999999),
      customerId: this.randomInt(1, 1000),
      total: this.randomFloat(29.99, 499.99),
      status: this.randomElement(['pending', 'confirmed', 'processing', 'shipped', 'delivered']),
      items: [
        {
          productId: this.randomInt(1, 100),
          quantity: this.randomInt(1, 5),
          price: this.randomFloat(9.99, 99.99)
        }
      ],
      createdAt: this.randomDate()
    };

    switch (method) {
      case 'post':
        return {
          ...baseOrder,
          message: 'Order created successfully'
        };
      case 'put':
      case 'patch':
        return {
          ...baseOrder,
          updatedAt: this.randomDate(),
          message: 'Order updated successfully'
        };
      case 'delete':
        return {
          message: 'Order cancelled successfully',
          cancelledAt: this.randomDate()
        };
      default:
        return baseOrder;
    }
  }

  private static generateAuthExample(method: string): any {
    switch (method) {
      case 'post':
        if (Math.random() > 0.5) {
          // Login success
          return {
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            user: {
              id: this.randomInt(1, 1000),
              email: this.randomElement(this.SAMPLE_EMAILS),
              name: this.randomElement(this.SAMPLE_NAMES)
            },
            expiresIn: 3600
          };
        } else {
          // Registration success
          return {
            message: 'Registration successful',
            user: {
              id: this.randomInt(1000, 9999),
              email: this.randomElement(this.SAMPLE_EMAILS),
              name: this.randomElement(this.SAMPLE_NAMES)
            }
          };
        }
      default:
        return {
          message: 'Authentication successful'
        };
    }
  }

  private static generateGenericExample(method: string): any {
    switch (method) {
      case 'post':
        return {
          id: this.randomInt(1, 1000),
          message: 'Resource created successfully',
          createdAt: this.randomDate()
        };
      case 'put':
      case 'patch':
        return {
          id: this.randomInt(1, 1000),
          message: 'Resource updated successfully',
          updatedAt: this.randomDate()
        };
      case 'delete':
        return {
          message: 'Resource deleted successfully',
          deletedAt: this.randomDate()
        };
      default:
        return {
          id: this.randomInt(1, 1000),
          status: 'success',
          data: 'example data'
        };
    }
  }
}

export default ExampleGenerator;