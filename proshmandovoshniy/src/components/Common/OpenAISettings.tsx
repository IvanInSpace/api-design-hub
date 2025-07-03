import React, { useState, useRef, useEffect } from 'react';
import './OpenAISettings.css';

interface OpenAISettingsProps {
  apiKey: string;
  onApiKeyChange: (apiKey: string) => void;
  onTest?: () => Promise<boolean>;
  isConnected?: boolean;
  usage?: {
    requests: number;
    tokens: number;
  };
}

const OpenAISettings: React.FC<OpenAISettingsProps> = ({
  apiKey,
  onApiKeyChange,
  onTest,
  isConnected,
  usage
}) => {
  // Отладка: проверяем, что компонент рендерится
  console.log('OpenAISettings рендерится:', { apiKey: apiKey ? 'есть' : 'нет', isConnected });
  
  const [isOpen, setIsOpen] = useState(false);
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [isVisible, setIsVisible] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalApiKey(apiKey);
  }, [apiKey]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTriggerClick = () => {
    console.log('OpenAI кнопка нажата! Текущее состояние isOpen:', isOpen);
    setIsOpen(!isOpen);
    console.log('Новое состояние isOpen будет:', !isOpen);
  };

  const handleSave = () => {
    console.log('Сохраняем API ключ:', localApiKey ? 'есть значение' : 'пустое');
    onApiKeyChange(localApiKey);
    setIsOpen(false);
    setTestResult(null);
  };

  const handleTest = async () => {
    if (!onTest) return;
    
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const success = await onTest();
      setTestResult(success ? 'success' : 'error');
    } catch (error) {
      setTestResult('error');
    } finally {
      setIsTesting(false);
    }
  };

  const maskApiKey = (key: string) => {
    if (!key) return 'Not configured';
    if (key.length <= 8) return key;
    return `${key.substring(0, 7)}...${key.substring(key.length - 4)}`;
  };

  const getConnectionStatus = () => {
    if (!apiKey) return { icon: '🔴', text: 'Not configured', class: 'disconnected' };
    if (isConnected === undefined) return { icon: '🟡', text: 'Unknown', class: 'unknown' };
    return isConnected 
      ? { icon: '🟢', text: 'Connected', class: 'connected' }
      : { icon: '🔴', text: 'Disconnected', class: 'disconnected' };
  };

  const status = getConnectionStatus();

  // Отладка состояния перед рендером
  console.log('OpenAI рендер состояние:', { isOpen, apiKey: apiKey ? 'есть' : 'нет', status });

  return (
    <div className="openai-settings" ref={dropdownRef}>
      {/* Отладочная информация прямо в UI */}
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'black',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        zIndex: 10000,
        fontSize: '12px'
      }}>
        isOpen: {isOpen.toString()}<br/>
        apiKey: {apiKey ? 'есть' : 'нет'}<br/>
        status: {status.text}
      </div>
      <button 
        className={`openai-trigger ${status.class}`}
        onClick={handleTriggerClick}
        title="OpenAI API Settings"
        style={{
          background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
          color: 'white',
          fontWeight: 'bold',
          minHeight: '44px'
        }}
      >
        <span className="openai-icon">🤖</span>
        <span className="openai-status">
          <span className="status-indicator">{status.icon}</span>
          <span className="status-text">AI</span>
        </span>
        {usage && (
          <span className="usage-badge">{usage.requests}</span>
        )}
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="openai-dropdown" style={{
          background: 'yellow',
          border: '3px solid red',
          zIndex: 9999
        }}>
          <div className="dropdown-header">
            <h3>OpenAI Configuration (isOpen: {isOpen.toString()})</h3>
            <span className={`connection-status ${status.class}`}>
              {status.icon} {status.text}
            </span>
          </div>

          <div className="dropdown-content">
            <div className="api-key-section">
              <label className="field-label">
                API Key
                <a 
                  href="https://platform.openai.com/api-keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="help-link"
                >
                  Get your key
                </a>
              </label>
              
              <div className="api-key-input-group">
                <input
                  type={isVisible ? 'text' : 'password'}
                  value={localApiKey}
                  onChange={(e) => setLocalApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="api-key-input"
                />
                <button
                  type="button"
                  onClick={() => setIsVisible(!isVisible)}
                  className="visibility-toggle"
                  title={isVisible ? 'Hide' : 'Show'}
                >
                  {isVisible ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              
              {apiKey && (
                <div className="current-key">
                  Current: {maskApiKey(apiKey)}
                </div>
              )}
            </div>

            {usage && (
              <div className="usage-section">
                <h4>Session Usage</h4>
                <div className="usage-stats">
                  <div className="usage-stat">
                    <span className="stat-label">Requests:</span>
                    <span className="stat-value">{usage.requests}</span>
                  </div>
                  <div className="usage-stat">
                    <span className="stat-label">Tokens:</span>
                    <span className="stat-value">{usage.tokens.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="model-section">
              <label className="field-label">Model</label>
              <select className="model-select" defaultValue="gpt-4">
                <option value="gpt-4">GPT-4 (Recommended)</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </select>
            </div>

            <div className="action-buttons">
              {localApiKey && onTest && (
                <button
                  onClick={handleTest}
                  disabled={isTesting}
                  className={`test-button ${testResult || ''}`}
                >
                  {isTesting ? (
                    <><span className="spinner">⟳</span> Testing...</>
                  ) : testResult === 'success' ? (
                    <><span>✅</span> Connected!</>
                  ) : testResult === 'error' ? (
                    <><span>❌</span> Failed</>
                  ) : (
                    <><span>🔍</span> Test Connection</>
                  )}
                </button>
              )}
              
              <button
                onClick={handleSave}
                className="save-button"
                disabled={localApiKey === apiKey}
              >
                <span>💾</span> Save
              </button>
            </div>

            <div className="info-section">
              <div className="info-item">
                <span className="info-icon">💡</span>
                <span className="info-text">
                  Your API key is stored locally and never shared
                </span>
              </div>
              <div className="info-item">
                <span className="info-icon">⚡</span>
                <span className="info-text">
                  AI suggestions will be powered by OpenAI GPT
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpenAISettings;