import * as yaml from 'js-yaml';
import { OpenAPISpec } from '../types/openapi';

export interface OpenAIConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
}

export interface AISuggestion {
  id: string;
  type: 'path' | 'operation' | 'schema' | 'component' | 'parameter' | 'improvement';
  title: string;
  description: string;
  yamlContent: string;
  insertPosition: {
    path: string[];
    line?: number;
  };
  confidence: number;
  reasoning: string;
  category: 'completion' | 'enhancement' | 'best-practice' | 'security';
}

export interface AnalysisContext {
  spec: OpenAPISpec;
  recentChanges: string[];
  lastModifiedSection?: string;
  userIntent?: string;
}

class OpenAIAssistant {
  private config: OpenAIConfig;
  private baseUrl = 'https://api.openai.com/v1/chat/completions';

  constructor(config: OpenAIConfig) {
    this.config = {
      model: 'gpt-4o-mini',
      temperature: 0.3,
      ...config
    };
  }

  async analyzePotentialSuggestions(context: AnalysisContext): Promise<AISuggestion[]> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    try {
      const prompt = this.buildAnalysisPrompt(context);
      const response = await this.callOpenAI(prompt);
      return this.parseSuggestions(response);
    } catch (error) {
      console.error('Error analyzing with OpenAI:', error);
      throw error;
    }
  }

  private buildAnalysisPrompt(context: AnalysisContext): string {
    const { spec, recentChanges, lastModifiedSection } = context;
    const yamlContent = yaml.dump(spec, { indent: 2, lineWidth: 120 });

    return `You are an expert OpenAPI 3.0.3 specification assistant. Analyze the following OpenAPI specification and provide intelligent suggestions for improvements, completions, and best practices.

CURRENT SPECIFICATION:
\`\`\`yaml
${yamlContent}
\`\`\`

RECENT CHANGES:
${recentChanges.length > 0 ? recentChanges.join(', ') : 'None'}

LAST MODIFIED SECTION: ${lastModifiedSection || 'None'}

Please analyze the specification and provide suggestions in the following JSON format:

{
  "suggestions": [
    {
      "id": "unique-id",
      "type": "path|operation|schema|component|parameter|improvement",
      "title": "Brief title",
      "description": "Detailed description",
      "yamlContent": "YAML content to add/modify",
      "insertPosition": {
        "path": ["paths", "/users", "get"],
        "line": 45
      },
      "confidence": 0.9,
      "reasoning": "Why this suggestion makes sense",
      "category": "completion|enhancement|best-practice|security"
    }
  ]
}

ANALYSIS GUIDELINES:
1. Look for incomplete CRUD operations (missing GET, POST, PUT, DELETE)
2. Identify tags without corresponding endpoints
3. Find unused schemas in components that could be utilized
4. Suggest security schemes if missing
5. Recommend pagination parameters for list endpoints
6. Identify missing error responses (400, 404, 500)
7. Suggest request/response examples
8. Check for missing descriptions and summaries
9. Recommend consistent naming conventions
10. Suggest OpenAPI best practices

FOCUS AREAS:
- Complete REST patterns
- Security considerations
- Error handling
- Documentation completeness
- Reusable components
- Performance optimizations

Provide maximum 8 suggestions, prioritized by importance and relevance to recent changes.`;
  }

  private async callOpenAI(prompt: string): Promise<string> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert OpenAPI specification assistant. Always respond with valid JSON containing suggestions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.config.temperature,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  private parseSuggestions(response: string): AISuggestion[] {
    try {
      // Clean up the response in case it has markdown formatting
      const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanedResponse);
      
      if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
        console.warn('Invalid response format from OpenAI');
        return [];
      }

      return parsed.suggestions.map((suggestion: any, index: number) => ({
        id: suggestion.id || `openai-suggestion-${index}`,
        type: suggestion.type || 'improvement',
        title: suggestion.title || 'Improvement suggestion',
        description: suggestion.description || '',
        yamlContent: suggestion.yamlContent || '',
        insertPosition: suggestion.insertPosition || { path: [] },
        confidence: Math.min(Math.max(suggestion.confidence || 0.5, 0), 1),
        reasoning: suggestion.reasoning || 'Suggested by AI analysis',
        category: suggestion.category || 'enhancement'
      }));
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      console.log('Raw response:', response);
      return [];
    }
  }

  async generateEndpoint(description: string, context: AnalysisContext): Promise<string> {
    const prompt = `Generate an OpenAPI 3.0.3 endpoint based on this description: "${description}"

Context from existing specification:
${yaml.dump(context.spec, { indent: 2, lineWidth: 120 })}

Generate only the YAML for the new endpoint(s), following OpenAPI 3.0.3 standards and matching the existing specification style.`;

    const response = await this.callOpenAI(prompt);
    return response;
  }

  async improveDescription(currentDescription: string, context: string): Promise<string> {
    const prompt = `Improve this OpenAPI description: "${currentDescription}"

Context: ${context}

Provide a better, more detailed description that follows OpenAPI documentation best practices. Return only the improved description text.`;

    const response = await this.callOpenAI(prompt);
    return response.trim();
  }

  async generateExamples(endpoint: string, method: string, context: AnalysisContext): Promise<any> {
    const prompt = `Generate realistic examples for the OpenAPI endpoint: ${method.toUpperCase()} ${endpoint}

Context:
${yaml.dump(context.spec, { indent: 2, lineWidth: 120 })}

Generate request and response examples in JSON format. Return a JSON object with 'request' and 'response' properties.`;

    const response = await this.callOpenAI(prompt);
    try {
      return JSON.parse(response);
    } catch {
      return { request: {}, response: {} };
    }
  }

  updateConfig(config: Partial<OpenAIConfig>) {
    this.config = { ...this.config, ...config };
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

      // Detect changes in operations
      if (newSpec.paths && oldSpec.paths) {
        Object.keys(newSpec.paths).forEach(path => {
          const newPathItem = newSpec.paths![path];
          const oldPathItem = oldSpec.paths![path];
          
          if (newPathItem && oldPathItem) {
            const newMethods = Object.keys(newPathItem).filter(key => 
              ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(key)
            );
            const oldMethods = Object.keys(oldPathItem).filter(key => 
              ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(key)
            );
            
            newMethods.forEach(method => {
              if (!oldMethods.includes(method)) {
                changes.push(`Added ${method.toUpperCase()} operation to ${path}`);
              }
            });
          }
        });
      }
      
    } catch (error) {
      console.error('Error detecting changes:', error);
    }
    
    return changes;
  }
}

export default OpenAIAssistant;