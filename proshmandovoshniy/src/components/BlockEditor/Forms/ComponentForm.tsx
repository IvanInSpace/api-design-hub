import React, { useState } from 'react';
import { SchemaObject } from '../../../types/openapi';
import './ComponentForm.css';

interface ComponentFormProps {
  data: any;
  onUpdate: (data: any) => void;
}

const ComponentForm: React.FC<ComponentFormProps> = ({ data, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'schemas' | 'responses' | 'parameters'>('schemas');
  const [newSchemaName, setNewSchemaName] = useState('');
  const [newResponseCode, setNewResponseCode] = useState('200');
  const [newParameterName, setNewParameterName] = useState('');

  const handleFieldChange = (field: string, value: any) => {
    onUpdate({
      ...data,
      [field]: value
    });
  };

  // Schema management
  const addSchema = () => {
    if (!newSchemaName.trim()) {
      alert('Please enter a schema name');
      return;
    }
    
    const schemas = { ...(data.schemas || {}) };
    schemas[newSchemaName] = {
      type: 'object',
      properties: {},
      required: []
    };
    
    handleFieldChange('schemas', schemas);
    setNewSchemaName('');
  };

  const updateSchema = (schemaName: string, updates: Partial<SchemaObject>) => {
    const schemas = { ...(data.schemas || {}) };
    schemas[schemaName] = { ...schemas[schemaName], ...updates };
    handleFieldChange('schemas', schemas);
  };

  const removeSchema = (schemaName: string) => {
    const schemas = { ...(data.schemas || {}) };
    delete schemas[schemaName];
    handleFieldChange('schemas', schemas);
  };

  const addSchemaProperty = (schemaName: string) => {
    const propertyName = prompt('Property name:');
    if (!propertyName) return;
    
    const schemas = { ...(data.schemas || {}) };
    if (!schemas[schemaName].properties) {
      schemas[schemaName].properties = {};
    }
    
    schemas[schemaName].properties[propertyName] = {
      type: 'string',
      description: ''
    };
    
    handleFieldChange('schemas', schemas);
  };

  // Response management
  const addResponse = () => {
    if (!newResponseCode.trim()) {
      alert('Please enter a response name');
      return;
    }
    
    const responses = { ...(data.responses || {}) };
    responses[newResponseCode] = {
      description: 'Response description',
      content: {
        'application/json': {
          schema: { type: 'object' },
          example: {}
        }
      }
    };
    
    handleFieldChange('responses', responses);
    setNewResponseCode('');
  };

  const updateResponse = (statusCode: string, updates: any) => {
    const responses = { ...(data.responses || {}) };
    responses[statusCode] = { ...responses[statusCode], ...updates };
    handleFieldChange('responses', responses);
  };

  const removeResponse = (statusCode: string) => {
    const responses = { ...(data.responses || {}) };
    delete responses[statusCode];
    handleFieldChange('responses', responses);
  };

  // Parameter management
  const addParameter = () => {
    if (!newParameterName.trim()) return;
    
    const parameters = data.parameters || {};
    parameters[newParameterName] = {
      name: newParameterName,
      in: 'query',
      required: false,
      schema: { type: 'string' },
      description: ''
    };
    
    handleFieldChange('parameters', parameters);
    setNewParameterName('');
  };

  const updateParameter = (paramName: string, updates: any) => {
    const parameters = { ...(data.parameters || {}) };
    parameters[paramName] = { ...parameters[paramName], ...updates };
    handleFieldChange('parameters', parameters);
  };

  const removeParameter = (paramName: string) => {
    const parameters = { ...(data.parameters || {}) };
    delete parameters[paramName];
    handleFieldChange('parameters', parameters);
  };

  return (
    <div className="component-form">
      <div className="form-tabs">
        <button
          className={`tab-button ${activeTab === 'schemas' ? 'active' : ''}`}
          onClick={() => setActiveTab('schemas')}
        >
          🧩 Schemas
        </button>
        <button
          className={`tab-button ${activeTab === 'responses' ? 'active' : ''}`}
          onClick={() => setActiveTab('responses')}
        >
          📤 Responses
        </button>
        <button
          className={`tab-button ${activeTab === 'parameters' ? 'active' : ''}`}
          onClick={() => setActiveTab('parameters')}
        >
          ⚙️ Parameters
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'schemas' && (
          <div className="schemas-tab">
            <div className="section-header">
              <h4>Schema Definitions</h4>
              <div className="add-item-controls">
                <input
                  type="text"
                  value={newSchemaName}
                  onChange={(e) => setNewSchemaName(e.target.value)}
                  placeholder="Schema name (e.g., User)"
                  className="add-input"
                  onKeyPress={(e) => e.key === 'Enter' && addSchema()}
                />
                <button className="add-button" onClick={addSchema}>
                  ➕ Add Schema
                </button>
              </div>
            </div>

            {Object.keys(data.schemas || {}).length === 0 ? (
              <div className="empty-state">
                <p>No schemas defined. Add reusable data models for your API.</p>
              </div>
            ) : (
              <div className="schemas-list">
                {Object.entries(data.schemas || {}).map(([schemaName, schema]: [string, any]) => (
                  <div key={schemaName} className="schema-item">
                    <div className="schema-header">
                      <h5 className="schema-name">{schemaName}</h5>
                      <div className="schema-actions">
                        <button
                          className="action-button secondary"
                          onClick={() => addSchemaProperty(schemaName)}
                          title="Add property"
                        >
                          ➕ Property
                        </button>
                        <button
                          className="remove-button"
                          onClick={() => removeSchema(schemaName)}
                          title="Remove schema"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div className="schema-details">
                      <div className="form-field">
                        <label className="field-label">Type</label>
                        <select
                          value={schema.type || 'object'}
                          onChange={(e) => updateSchema(schemaName, { type: e.target.value })}
                          className="field-select"
                        >
                          <option value="object">Object</option>
                          <option value="array">Array</option>
                          <option value="string">String</option>
                          <option value="number">Number</option>
                          <option value="integer">Integer</option>
                          <option value="boolean">Boolean</option>
                        </select>
                      </div>

                      <div className="form-field">
                        <label className="field-label">Description</label>
                        <textarea
                          value={schema.description || ''}
                          onChange={(e) => updateSchema(schemaName, { description: e.target.value })}
                          className="field-input"
                          rows={2}
                          placeholder="Describe this schema..."
                        />
                      </div>

                      {schema.type === 'object' && schema.properties && (
                        <div className="properties-section">
                          <h6>Properties:</h6>
                          <div className="properties-list">
                            {Object.entries(schema.properties).map(([propName, prop]: [string, any]) => (
                              <div key={propName} className="property-item">
                                <span className="property-name">{propName}</span>
                                <span className="property-type">({prop.type || 'string'})</span>
                                {schema.required?.includes(propName) && (
                                  <span className="required-indicator">*</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'responses' && (
          <div className="responses-tab">
            <div className="section-header">
              <h4>Response Definitions</h4>
              <div className="add-item-controls">
                <input
                  type="text"
                  value={newResponseCode}
                  onChange={(e) => setNewResponseCode(e.target.value)}
                  placeholder="Response name (e.g., NotFound)"
                  className="add-input"
                  onKeyPress={(e) => e.key === 'Enter' && addResponse()}
                />
                <button className="add-button" onClick={addResponse}>
                  ➕ Add Response
                </button>
              </div>
            </div>

            {Object.keys(data.responses || {}).length === 0 ? (
              <div className="empty-state">
                <p>No reusable responses defined. Add common response patterns.</p>
              </div>
            ) : (
              <div className="responses-list">
                {Object.entries(data.responses || {}).map(([responseName, response]: [string, any]) => (
                  <div key={responseName} className="response-item">
                    <div className="response-header">
                      <h5 className="response-name">{responseName}</h5>
                      <button
                        className="remove-button"
                        onClick={() => removeResponse(responseName)}
                        title="Remove response"
                      >
                        🗑️
                      </button>
                    </div>

                    <div className="response-details">
                      <div className="form-field">
                        <label className="field-label">Description*</label>
                        <textarea
                          value={response.description || ''}
                          onChange={(e) => updateResponse(responseName, { description: e.target.value })}
                          className="field-input"
                          rows={2}
                          placeholder="Response description..."
                        />
                      </div>

                      <div className="form-field">
                        <label className="field-label">Example Response</label>
                        <textarea
                          value={JSON.stringify(response.content?.['application/json']?.example || {}, null, 2)}
                          onChange={(e) => {
                            try {
                              const example = JSON.parse(e.target.value);
                              updateResponse(responseName, {
                                content: {
                                  'application/json': {
                                    ...response.content?.['application/json'],
                                    example
                                  }
                                }
                              });
                            } catch (err) {
                              // Invalid JSON, don't update
                            }
                          }}
                          className="json-textarea"
                          rows={4}
                          placeholder='{"message": "Example response"}'
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'parameters' && (
          <div className="parameters-tab">
            <div className="section-header">
              <h4>Parameter Definitions</h4>
              <div className="add-item-controls">
                <input
                  type="text"
                  value={newParameterName}
                  onChange={(e) => setNewParameterName(e.target.value)}
                  placeholder="Parameter name (e.g., limit)"
                  className="add-input"
                  onKeyPress={(e) => e.key === 'Enter' && addParameter()}
                />
                <button className="add-button" onClick={addParameter}>
                  ➕ Add Parameter
                </button>
              </div>
            </div>

            {Object.keys(data.parameters || {}).length === 0 ? (
              <div className="empty-state">
                <p>No reusable parameters defined. Add common parameters like pagination.</p>
              </div>
            ) : (
              <div className="parameters-list">
                {Object.entries(data.parameters || {}).map(([paramName, param]: [string, any]) => (
                  <div key={paramName} className="parameter-item">
                    <div className="parameter-header">
                      <h5 className="parameter-name">{paramName}</h5>
                      <button
                        className="remove-button"
                        onClick={() => removeParameter(paramName)}
                        title="Remove parameter"
                      >
                        🗑️
                      </button>
                    </div>

                    <div className="parameter-details">
                      <div className="param-row">
                        <div className="form-field">
                          <label className="field-label">Location</label>
                          <select
                            value={param.in || 'query'}
                            onChange={(e) => updateParameter(paramName, { in: e.target.value })}
                            className="field-select"
                          >
                            <option value="query">Query</option>
                            <option value="header">Header</option>
                            <option value="path">Path</option>
                            <option value="cookie">Cookie</option>
                          </select>
                        </div>
                        <div className="form-field">
                          <label className="field-label">Type</label>
                          <select
                            value={param.schema?.type || 'string'}
                            onChange={(e) => updateParameter(paramName, { 
                              schema: { ...param.schema, type: e.target.value }
                            })}
                            className="field-select"
                          >
                            <option value="string">String</option>
                            <option value="integer">Integer</option>
                            <option value="number">Number</option>
                            <option value="boolean">Boolean</option>
                            <option value="array">Array</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-field">
                        <label className="param-checkbox">
                          <input
                            type="checkbox"
                            checked={param.required || false}
                            onChange={(e) => updateParameter(paramName, { required: e.target.checked })}
                          />
                          Required
                        </label>
                      </div>

                      <div className="form-field">
                        <label className="field-label">Description</label>
                        <textarea
                          value={param.description || ''}
                          onChange={(e) => updateParameter(paramName, { description: e.target.value })}
                          className="field-input"
                          rows={2}
                          placeholder="Parameter description..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComponentForm;
