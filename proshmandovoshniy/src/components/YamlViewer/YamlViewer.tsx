import React, { useState, useMemo } from 'react';
import * as yaml from 'js-yaml';
import ValidationPanel from './ValidationPanel';
import ExportImportModal from '../Common/ExportImportModal';
import OpenAPIValidator, { ValidationResult } from '../../utils/openApiValidator';
import ExampleGenerator from '../../utils/exampleGenerator';
import { OpenAPISpec } from '../../types/openapi';
import './YamlViewer.css';

interface YamlViewerProps {
  yamlContent: string;
  onExport?: () => void;
  onImport?: (content: string) => void;
  onGenerateExample?: (path: string, method: string) => void;
}

const YamlViewer: React.FC<YamlViewerProps> = ({ 
  yamlContent, 
  onExport, 
  onImport,
  onGenerateExample
}) => {
  const [copied, setCopied] = useState(false);
  const [showValidation, setShowValidation] = useState(true);
  const [showExportImport, setShowExportImport] = useState(false);

  // Parse and validate YAML content
  const validationResult: ValidationResult = useMemo(() => {
    try {
      if (!yamlContent.trim()) {
        return {
          isValid: false,
          errors: [{ path: 'root', message: 'Empty specification', severity: 'error' }],
          warnings: [],
          infos: []
        };
      }

      const spec = yaml.load(yamlContent) as OpenAPISpec;
      return OpenAPIValidator.validate(spec);
    } catch (error) {
      return {
        isValid: false,
        errors: [{ 
          path: 'yaml', 
          message: `YAML parsing error: ${(error as Error).message}`, 
          severity: 'error' 
        }],
        warnings: [],
        infos: []
      };
    }
  }, [yamlContent]);

  const generateExampleForPath = (path: string, method: string) => {
    if (onGenerateExample) {
      onGenerateExample(path, method);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(yamlContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([yamlContent], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'openapi-spec.yaml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImport) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onImport(content);
      };
      reader.readAsText(file);
    }
  };

  const lineCount = yamlContent.split('\n').length;

  return (
    <div className="yaml-viewer">
      <div className="viewer-toolbar">
        <div className="toolbar-info">
          <span className="line-count">{lineCount} lines</span>
          <span className="file-type">YAML</span>
        </div>
        
        <div className="toolbar-actions">
          <button
            className="action-btn copy-btn"
            onClick={handleCopy}
            title="Copy to clipboard"
            disabled={!yamlContent.trim()}
          >
            <span className="btn-icon">{copied ? '✅' : '📋'}</span>
            {copied ? 'Copied!' : 'Copy'}
          </button>
          
          <button
            className="action-btn download-btn"
            onClick={() => setShowExportImport(true)}
            title="Export or import specification"
            disabled={!yamlContent.trim()}
          >
            <span className="btn-icon">💾</span>
            Export
          </button>
          
          <button
            className="action-btn upload-btn"
            onClick={() => setShowExportImport(true)}
            title="Import specification"
          >
            <span className="btn-icon">📁</span>
            Import
          </button>
          
          {onExport && (
            <button
              className="action-btn export-btn"
              onClick={onExport}
              title="Export specification"
            >
              <span className="btn-icon">📤</span>
              Export
            </button>
          )}
        </div>
      </div>

      <div className="yaml-content-container">
        <div className="line-numbers">
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i + 1} className="line-number">
              {i + 1}
            </div>
          ))}
        </div>
        
        <div className="yaml-content">
          <pre className="yaml-text">
            <code className="yaml-code">{yamlContent || '# Your OpenAPI specification will appear here\n# Start by adding blocks in the editor'}</code>
          </pre>
        </div>
      </div>
      
      <div className="viewer-status">
        <div className="status-info">
          <span className={`status-indicator ${
            validationResult.isValid ? 'valid' : 'invalid'
          }`}>
            {validationResult.isValid ? '✓' : '✗'}
          </span>
          <span className="status-text">
            {validationResult.isValid 
              ? 'Valid OpenAPI 3.0.3' 
              : `${validationResult.errors.length} error${validationResult.errors.length !== 1 ? 's' : ''}`
            }
          </span>
        </div>
        
        <div className="viewer-stats">
          <span className="stat-item">
            <strong>{yamlContent.split('\n').filter(line => line.trim().startsWith('/')).length}</strong> paths
          </span>
          <span className="stat-item">
            <strong>{(yamlContent.match(/components:/g) || []).length}</strong> components
          </span>
          <span className="stat-item">
            <strong>{validationResult.warnings.length}</strong> warnings
          </span>
        </div>
      </div>
      
      <ValidationPanel
        validationResult={validationResult}
        isVisible={showValidation}
        onToggle={() => setShowValidation(!showValidation)}
      />
      
      <ExportImportModal
        isOpen={showExportImport}
        onClose={() => setShowExportImport(false)}
        yamlContent={yamlContent}
        onImport={onImport || (() => {})}
      />
    </div>
  );
};

export default YamlViewer;