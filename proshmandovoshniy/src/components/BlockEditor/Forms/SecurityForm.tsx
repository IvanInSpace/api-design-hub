import React, { useState } from 'react';
import './SecurityForm.css';

interface SecurityFormProps {
  data: any;
  onUpdate: (data: any) => void;
}

const SecurityForm: React.FC<SecurityFormProps> = ({ data, onUpdate }) => {
  const [newSchemeName, setNewSchemeName] = useState('');

  const handleFieldChange = (field: string, value: any) => {
    onUpdate({
      ...data,
      [field]: value
    });
  };

  const addSecurityScheme = () => {
    if (!newSchemeName.trim()) return;
    
    const securitySchemes = data.securitySchemes || {};
    securitySchemes[newSchemeName] = {
      type: 'apiKey',
      name: 'api_key',
      in: 'header',
      description: ''
    };
    
    handleFieldChange('securitySchemes', securitySchemes);
    setNewSchemeName('');
  };

  const updateSecurityScheme = (schemeName: string, updates: any) => {
    const securitySchemes = { ...(data.securitySchemes || {}) };
    securitySchemes[schemeName] = { ...securitySchemes[schemeName], ...updates };
    handleFieldChange('securitySchemes', securitySchemes);
  };

  const removeSecurityScheme = (schemeName: string) => {
    const securitySchemes = { ...(data.securitySchemes || {}) };
    delete securitySchemes[schemeName];
    handleFieldChange('securitySchemes', securitySchemes);
  };

  const getSchemeTypeFields = (scheme: any, schemeName: string) => {
    switch (scheme.type) {
      case 'apiKey':
        return (
          <>
            <div className="form-field">
              <label className="field-label">Parameter Name*</label>
              <input
                type="text"
                value={scheme.name || ''}
                onChange={(e) => updateSecurityScheme(schemeName, { name: e.target.value })}
                className="field-input"
                placeholder="api_key"
              />
            </div>
            <div className="form-field">
              <label className="field-label">Location*</label>
              <select
                value={scheme.in || 'header'}
                onChange={(e) => updateSecurityScheme(schemeName, { in: e.target.value })}
                className="field-select"
              >
                <option value="header">Header</option>
                <option value="query">Query Parameter</option>
                <option value="cookie">Cookie</option>
              </select>
            </div>
          </>
        );

      case 'http':
        return (
          <>
            <div className="form-field">
              <label className="field-label">HTTP Scheme*</label>
              <select
                value={scheme.scheme || 'basic'}
                onChange={(e) => updateSecurityScheme(schemeName, { scheme: e.target.value })}
                className="field-select"
              >
                <option value="basic">Basic</option>
                <option value="bearer">Bearer</option>
                <option value="digest">Digest</option>
              </select>
            </div>
            {scheme.scheme === 'bearer' && (
              <div className="form-field">
                <label className="field-label">Bearer Format</label>
                <input
                  type="text"
                  value={scheme.bearerFormat || ''}
                  onChange={(e) => updateSecurityScheme(schemeName, { bearerFormat: e.target.value })}
                  className="field-input"
                  placeholder="JWT"
                />
              </div>
            )}
          </>
        );

      case 'oauth2':
        return (
          <div className="oauth2-flows">
            <h6>OAuth2 Flows</h6>
            <div className="flows-section">
              <label className="flow-checkbox">
                <input
                  type="checkbox"
                  checked={!!scheme.flows?.implicit}
                  onChange={(e) => {
                    const flows = { ...(scheme.flows || {}) };
                    if (e.target.checked) {
                      flows.implicit = {
                        authorizationUrl: '',
                        scopes: {}
                      };
                    } else {
                      delete flows.implicit;
                    }
                    updateSecurityScheme(schemeName, { flows });
                  }}
                />
                Implicit Flow
              </label>
              
              <label className="flow-checkbox">
                <input
                  type="checkbox"
                  checked={!!scheme.flows?.password}
                  onChange={(e) => {
                    const flows = { ...(scheme.flows || {}) };
                    if (e.target.checked) {
                      flows.password = {
                        tokenUrl: '',
                        scopes: {}
                      };
                    } else {
                      delete flows.password;
                    }
                    updateSecurityScheme(schemeName, { flows });
                  }}
                />
                Password Flow
              </label>

              <label className="flow-checkbox">
                <input
                  type="checkbox"
                  checked={!!scheme.flows?.clientCredentials}
                  onChange={(e) => {
                    const flows = { ...(scheme.flows || {}) };
                    if (e.target.checked) {
                      flows.clientCredentials = {
                        tokenUrl: '',
                        scopes: {}
                      };
                    } else {
                      delete flows.clientCredentials;
                    }
                    updateSecurityScheme(schemeName, { flows });
                  }}
                />
                Client Credentials Flow
              </label>

              <label className="flow-checkbox">
                <input
                  type="checkbox"
                  checked={!!scheme.flows?.authorizationCode}
                  onChange={(e) => {
                    const flows = { ...(scheme.flows || {}) };
                    if (e.target.checked) {
                      flows.authorizationCode = {
                        authorizationUrl: '',
                        tokenUrl: '',
                        scopes: {}
                      };
                    } else {
                      delete flows.authorizationCode;
                    }
                    updateSecurityScheme(schemeName, { flows });
                  }}
                />
                Authorization Code Flow
              </label>
            </div>
          </div>
        );

      case 'openIdConnect':
        return (
          <div className="form-field">
            <label className="field-label">OpenID Connect URL*</label>
            <input
              type="url"
              value={scheme.openIdConnectUrl || ''}
              onChange={(e) => updateSecurityScheme(schemeName, { openIdConnectUrl: e.target.value })}
              className="field-input"
              placeholder="https://example.com/.well-known/openid-connect"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="security-form">
      <div className="section-header">
        <h4>Security Schemes</h4>
        <div className="add-item-controls">
          <input
            type="text"
            value={newSchemeName}
            onChange={(e) => setNewSchemeName(e.target.value)}
            placeholder="Scheme name (e.g., bearerAuth)"
            className="add-input"
            onKeyPress={(e) => e.key === 'Enter' && addSecurityScheme()}
          />
          <button className="add-button" onClick={addSecurityScheme}>
            ➕ Add Security Scheme
          </button>
        </div>
      </div>

      {Object.keys(data.securitySchemes || {}).length === 0 ? (
        <div className="empty-state">
          <p>No security schemes defined. Add authentication methods for your API.</p>
          <div className="security-examples">
            <h6>Common security schemes:</h6>
            <ul>
              <li><strong>API Key:</strong> Simple key-based authentication</li>
              <li><strong>Bearer Token:</strong> JWT or other token authentication</li>
              <li><strong>OAuth2:</strong> Full OAuth2 flow support</li>
              <li><strong>OpenID Connect:</strong> Identity layer on top of OAuth2</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="security-schemes-list">
          {Object.entries(data.securitySchemes || {}).map(([schemeName, scheme]: [string, any]) => (
            <div key={schemeName} className="security-scheme-item">
              <div className="scheme-header">
                <h5 className="scheme-name">{schemeName}</h5>
                <button
                  className="remove-button"
                  onClick={() => removeSecurityScheme(schemeName)}
                  title="Remove security scheme"
                >
                  🗑️
                </button>
              </div>

              <div className="scheme-details">
                <div className="form-field">
                  <label className="field-label">Security Type*</label>
                  <select
                    value={scheme.type || 'apiKey'}
                    onChange={(e) => {
                      const newScheme = { type: e.target.value, description: scheme.description };
                      
                      // Set default values based on type
                      switch (e.target.value) {
                        case 'apiKey':
                          newScheme.name = 'api_key';
                          newScheme.in = 'header';
                          break;
                        case 'http':
                          newScheme.scheme = 'basic';
                          break;
                        case 'oauth2':
                          newScheme.flows = {};
                          break;
                        case 'openIdConnect':
                          newScheme.openIdConnectUrl = '';
                          break;
                      }
                      
                      updateSecurityScheme(schemeName, newScheme);
                    }}
                    className="field-select"
                  >
                    <option value="apiKey">API Key</option>
                    <option value="http">HTTP Authentication</option>
                    <option value="oauth2">OAuth2</option>
                    <option value="openIdConnect">OpenID Connect</option>
                  </select>
                </div>

                <div className="form-field">
                  <label className="field-label">Description</label>
                  <textarea
                    value={scheme.description || ''}
                    onChange={(e) => updateSecurityScheme(schemeName, { description: e.target.value })}
                    className="field-input"
                    rows={2}
                    placeholder="Describe this security scheme..."
                  />
                </div>

                {getSchemeTypeFields(scheme, schemeName)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="global-security-section">
        <h4>Global Security Requirements</h4>
        <p className="section-description">
          Define which security schemes are required globally for all operations.
        </p>
        
        <div className="form-field">
          <label className="field-label">Default Security</label>
          <textarea
            value={JSON.stringify(data.globalSecurity || [], null, 2)}
            onChange={(e) => {
              try {
                const globalSecurity = JSON.parse(e.target.value);
                handleFieldChange('globalSecurity', globalSecurity);
              } catch (err) {
                // Invalid JSON, don't update
              }
            }}
            className="json-textarea"
            rows={4}
            placeholder='[{"bearerAuth": []}]'
          />
          <div className="field-hint">
            JSON array of security requirements. Empty array [] means no security required.
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityForm;
