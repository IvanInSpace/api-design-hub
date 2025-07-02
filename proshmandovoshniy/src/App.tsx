import React from 'react';
import './styles/App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>🔧 Proshmandovoshniy</h1>
        <p>OpenAPI 3.0.3 Constructor</p>
      </header>
      
      <main className="app-main">
        <div className="layout">
          <div className="editor-panel">
            <h2>Visual Editor</h2>
            <p>Block editor will be here...</p>
          </div>
          
          <div className="yaml-panel">
            <h2>YAML Preview</h2>
            <pre className="yaml-preview">
{`openapi: 3.0.3
info:
  title: My API
  version: 1.0.0
  description: API created with Proshmandovoshniy
paths: {}`}
            </pre>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;