import React, { useState } from 'react';
import { OperationObject, ParameterObject, ResponseObject } from '../../../types/openapi';
import './PathForm.css';

interface PathFormProps {
  data: any;
  onUpdate: (data: any) => void;
}

const PathForm: React.FC<PathFormProps> = ({ data, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'parameters' | 'responses'>('general');

  const handleFieldChange = (field: string, value: any) => {
    onUpdate({
      ...data,
      [field]: value
    });
  };

  const handleMethodToggle = (method: string) => {
    const methods = data.methods || [];
    const newMethods = methods.includes(method)
      ? methods.filter((m: string) => m !== method)
      : [...methods, method];
    handleFieldChange('methods', newMethods);
  };

  const addParameter = () => {
    const parameters = data.parameters || [];
    const newParameter: Partial<ParameterObject> = {
      name: 'newParam',
      in: 'query',
      required: false,
      schema: { type: 'string' }
    };
    handleFieldChange('parameters', [...parameters, newParameter]);
  };

  const updateParameter = (index: number, updates: Partial<ParameterObject>) => {
    const parameters = [...(data.parameters || [])];
    parameters[index] = { ...parameters[index], ...updates };
    handleFieldChange('parameters', parameters);
  };

  const removeParameter = (index: number) => {
    const parameters = data.parameters || [];
    handleFieldChange('parameters', parameters.filter((_: any, i: number) => i !== index));
  };

  const addResponse = () => {
    const responses = data.responses || {};
    const statusCode = '200';
    responses[statusCode] = {
      description: 'Successful response',
      content: {
        'application/json': {
          schema: { type: 'object' },
          example: {}
        }
      }
    };
    handleFieldChange('responses', responses);
  };

  const updateResponse = (statusCode: string, updates: Partial<ResponseObject>) => {
    const responses = { ...(data.responses || {}) };
    responses[statusCode] = { ...responses[statusCode], ...updates };
    handleFieldChange('responses', responses);
  };

  const removeResponse = (statusCode: string) => {
    const responses = { ...(data.responses || {}) };
    delete responses[statusCode];
    handleFieldChange('responses', responses);
  };

  return (
    <div className="path-form">
      <div className="form-tabs">
        <button
          className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          📋 General
        </button>
        <button
          className={`tab-button ${activeTab === 'parameters' ? 'active' : ''}`}
          onClick={() => setActiveTab('parameters')}
        >
          ⚙️ Parameters
        </button>
        <button
          className={`tab-button ${activeTab === 'responses' ? 'active' : ''}`}
          onClick={() => setActiveTab('responses')}
        >
          📤 Responses
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'general' && (
          <div className="general-tab">
            <div className="form-field">
              <label className="field-label">Path*</label>
              <input
                type="text"
                className="field-input"
                value={data.path || ''}
                onChange={(e) => handleFieldChange('path', e.target.value)}
                placeholder="/api/users/{id}"
              />
              <div className="field-hint">
                Use curly braces for path parameters: /users/{'{userId}'}
              </div>
            </div>

            <div className="form-field">
              <label className="field-label">Summary</label>
              <input
                type="text"
                className="field-input"
                value={data.summary || ''}
                onChange={(e) => handleFieldChange('summary', e.target.value)}
                placeholder="Brief description of the endpoint"
              />
            </div>

            <div className="form-field">
              <label className="field-label">Description</label>
              <textarea
                className="field-input"
                value={data.description || ''}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                rows={3}
                placeholder="Detailed description of what this endpoint does"
              />
            </div>

            <div className="form-field">
              <label className="field-label">HTTP Methods</label>
              <div className="methods-grid">
                {['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'].map(method => (
                  <label key={method} className="method-checkbox">
                    <input
                      type="checkbox"
                      checked={data.methods?.includes(method.toLowerCase()) || false}
                      onChange={() => handleMethodToggle(method.toLowerCase())}
                    />
                    <span className={`method-label method-${method.toLowerCase()}`}>
                      {method}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-field">
              <label className="field-label">Tags</label>
              <input
                type="text"
                className="field-input"
                value={data.tags?.join(', ') || ''}
                onChange={(e) => handleFieldChange('tags', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
                placeholder="users, authentication, admin"
              />
              <div className="field-hint">
                Comma-separated list of tags for grouping endpoints
              </div>
            </div>
          </div>
        )}

        {activeTab === 'parameters' && (
          <div className="parameters-tab">
            <div className="section-header">
              <h4>Parameters</h4>
              <button className="add-button" onClick={addParameter}>
                ➕ Add Parameter
              </button>
            </div>

            {(data.parameters || []).length === 0 ? (
              <div className="empty-state">
                <p>No parameters defined. Add parameters to specify query strings, headers, or path variables.</p>
              </div>
            ) : (
              <div className="parameters-list">
                {(data.parameters || []).map((param: any, index: number) => (
                  <div key={index} className="parameter-item">
                    <div className="parameter-header">
                      <div className="parameter-name">
                        <input
                          type="text"
                          value={param.name || ''}
                          onChange={(e) => updateParameter(index, { name: e.target.value })}
                          placeholder="Parameter name"
                          className="param-name-input"
                        />
                        <select
                          value={param.in || 'query'}
                          onChange={(e) => updateParameter(index, { in: e.target.value as any })}
                          className="param-location-select"
                        >
                          <option value="query">Query</option>
                          <option value="header">Header</option>
                          <option value="path">Path</option>
                          <option value="cookie">Cookie</option>
                        </select>
                      </div>
                      <button
                        className="remove-button"
                        onClick={() => removeParameter(index)}
                        title="Remove parameter"
                      >
                        🗑️
                      </button>
                    </div>

                    <div className="parameter-details">
                      <div className="param-row">
                        <label className="param-checkbox">
                          <input
                            type="checkbox"
                            checked={param.required || false}
                            onChange={(e) => updateParameter(index, { required: e.target.checked })}
                          />
                          Required
                        </label>
                        <select
                          value={param.schema?.type || 'string'}
                          onChange={(e) => updateParameter(index, { 
                            schema: { ...param.schema, type: e.target.value }
                          })}
                          className="param-type-select"
                        >
                          <option value="string">String</option>
                          <option value="integer">Integer</option>
                          <option value="number">Number</option>
                          <option value="boolean">Boolean</option>
                          <option value="array">Array</option>
                        </select>
                      </div>
                      <textarea
                        value={param.description || ''}
                        onChange={(e) => updateParameter(index, { description: e.target.value })}
                        placeholder="Parameter description"
                        className="param-description"
                        rows={2}
                      />
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
              <h4>Responses</h4>
              <button className="add-button" onClick={addResponse}>
                ➕ Add Response
              </button>
            </div>

            {Object.keys(data.responses || {}).length === 0 ? (
              <div className="empty-state">
                <p>No responses defined. Add responses to specify what the API returns.</p>
              </div>
            ) : (
              <div className="responses-list">
                {Object.entries(data.responses || {}).map(([statusCode, response]: [string, any]) => (
                  <div key={statusCode} className="response-item">
                    <div className="response-header">
                      <div className="status-code-badge">
                        <span className={`status-code status-${statusCode[0]}xx`}>
                          {statusCode}
                        </span>
                        <span className="status-text">
                          {getStatusText(statusCode)}
                        </span>
                      </div>
                      <button
                        className="remove-button"
                        onClick={() => removeResponse(statusCode)}
                        title="Remove response"
                      >
                        🗑️
                      </button>
                    </div>

                    <div className="response-details">
                      <textarea
                        value={response.description || ''}
                        onChange={(e) => updateResponse(statusCode, { description: e.target.value })}
                        placeholder="Response description"
                        className="response-description"
                        rows={2}
                      />
                      
                      <div className="content-type-section">
                        <label className="field-label">Example Response</label>
                        <textarea
                          value={JSON.stringify(response.content?.['application/json']?.example || {}, null, 2)}
                          onChange={(e) => {
                            try {
                              const example = JSON.parse(e.target.value);
                              updateResponse(statusCode, {
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
                          placeholder='{"message": "Success"}'
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

function getStatusText(statusCode: string): string {
  const statusTexts: Record<string, string> = {
    '200': 'OK',
    '201': 'Created',
    '204': 'No Content',
    '400': 'Bad Request',
    '401': 'Unauthorized',
    '403': 'Forbidden',
    '404': 'Not Found',
    '500': 'Internal Server Error'
  };
  return statusTexts[statusCode] || 'Response';
}

export default PathForm;