import React, { useState, useEffect, useRef } from 'react';
import './OpenAITokenManager.css';

interface OpenAITokenManagerProps {
  onTokenChange: (token: string) => void;
}

const OpenAITokenManager: React.FC<OpenAITokenManagerProps> = ({ onTokenChange }) => {
  const [token, setToken] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Загрузка токена из localStorage при монтировании
  useEffect(() => {
    const savedToken = localStorage.getItem('openai-token');
    if (savedToken) {
      setToken(savedToken);
      setInputValue(savedToken);
      onTokenChange(savedToken);
    }
  }, [onTokenChange]);

  // Закрытие по клику вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSave = () => {
    const trimmedToken = inputValue.trim();
    setToken(trimmedToken);
    
    if (trimmedToken) {
      localStorage.setItem('openai-token', trimmedToken);
    } else {
      localStorage.removeItem('openai-token');
    }
    
    onTokenChange(trimmedToken);
    setIsOpen(false);
  };

  const handleClear = () => {
    setToken('');
    setInputValue('');
    localStorage.removeItem('openai-token');
    onTokenChange('');
    setIsOpen(false);
  };

  const isConnected = token.length > 0;

  return (
    <div className="openai-token-manager" ref={dropdownRef}>
      
      <button 
        className={`openai-status-button ${isConnected ? 'connected' : 'disconnected'}`}
        onClick={() => setIsOpen(!isOpen)}
        title="OpenAI API Token"
      >
        <span className="status-icon">🤖</span>
        <span className="status-text">
          {isConnected ? 'Connected' : 'Not Connected'}
        </span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div 
          className="token-dropdown" 
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '4px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            width: '320px',
            overflow: 'hidden'
          }}
        >
          <div 
            className="dropdown-header" 
            style={{
              padding: '16px 20px 12px',
              borderBottom: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)'
            }}
          >
            <h3 style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: '600',
              color: 'var(--text-primary)'
            }}>OpenAI API Token</h3>
          </div>
          <div className="dropdown-content" style={{ 
            padding: '20px'
          }}>
            <div className="token-input-section" style={{ marginBottom: '16px' }}>
              <label htmlFor="token-input" style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '13px', 
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}>API Token:</label>
              <input
                id="token-input"
                type="password"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="sk-..."
                className="token-input"
                style={{ 
                  width: '100%', 
                  padding: '10px 12px', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontFamily: 'var(--font-mono)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div className="button-group" style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleSave} className="save-button" style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                background: 'var(--accent-color)',
                border: '1px solid var(--accent-color)',
                color: 'white'
              }}>
                Save
              </button>
              {token && (
                <button onClick={handleClear} className="clear-button" style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)'
                }}>
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpenAITokenManager;