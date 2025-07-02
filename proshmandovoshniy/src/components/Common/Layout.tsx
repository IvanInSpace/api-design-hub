import React from 'react';
import './Layout.css';

interface LayoutProps {
  children: [React.ReactNode, React.ReactNode]; // [LeftPanel, RightPanel]
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, theme, onThemeToggle }) => {
  const [leftPanel, rightPanel] = children;

  return (
    <div className={`layout-container ${theme}`} data-theme={theme}>
      <header className="layout-header">
        <div className="header-content">
          <div className="logo-section">
            <h1 className="app-title">
              <span className="logo-icon">🔧</span>
              Proshmandovoshniy
            </h1>
            <span className="app-subtitle">OpenAPI 3.0.3 Constructor</span>
          </div>
          
          <div className="header-actions">
            <button 
              className="theme-toggle"
              onClick={onThemeToggle}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
        </div>
      </header>

      <main className="layout-main">
        <div className="layout-panels">
          <div className="panel panel-left">
            <div className="panel-header">
              <h2 className="panel-title">
                <span className="panel-icon">📝</span>
                Visual Editor
              </h2>
            </div>
            <div className="panel-content">
              {leftPanel}
            </div>
          </div>

          <div className="panel-divider">
            <div className="divider-line"></div>
            <button className="divider-handle" aria-label="Resize panels">
              <span className="handle-dots">⋮⋮</span>
            </button>
          </div>

          <div className="panel panel-right">
            <div className="panel-header">
              <h2 className="panel-title">
                <span className="panel-icon">📄</span>
                YAML Preview
              </h2>
            </div>
            <div className="panel-content">
              {rightPanel}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;