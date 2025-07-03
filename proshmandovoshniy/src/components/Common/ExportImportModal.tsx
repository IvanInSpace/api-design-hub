import React, { useState } from 'react';
import * as yaml from 'js-yaml';
import { useNotifications } from './Notifications/NotificationProvider';
import './ExportImportModal.css';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  yamlContent: string;
  onImport: (content: string) => void;
  onExportSuccess?: () => void;
}

const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  yamlContent,
  onImport,
  onExportSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importText, setImportText] = useState('');
  const [fileName, setFileName] = useState('openapi-spec');
  const [exportFormat, setExportFormat] = useState<'yaml' | 'json'>('yaml');
  const { success, error, warning } = useNotifications();

  if (!isOpen) return null;

  const handleExportFile = () => {
    try {
      let content = yamlContent;
      let mimeType = 'text/yaml';
      let extension = 'yaml';

      if (exportFormat === 'json') {
        // Convert YAML to JSON
        const parsed = yaml.load(yamlContent);
        content = JSON.stringify(parsed, null, 2);
        mimeType = 'application/json';
        extension = 'json';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      success('Export successful', `Specification exported as ${fileName}.${extension}`);
      onExportSuccess?.();
      onClose();
    } catch (err) {
      error('Export failed', 'Failed to export specification. Please check the content and try again.');
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      let content = yamlContent;
      
      if (exportFormat === 'json') {
        const parsed = yaml.load(yamlContent);
        content = JSON.stringify(parsed, null, 2);
      }

      await navigator.clipboard.writeText(content);
      success('Copied to clipboard', `${exportFormat.toUpperCase()} content copied successfully`);
    } catch (err) {
      error('Copy failed', 'Failed to copy to clipboard');
    }
  };

  const handleImportText = () => {
    if (!importText.trim()) {
      warning('Empty content', 'Please paste some content to import');
      return;
    }

    try {
      // Try to parse as JSON first, then YAML
      let parsed;
      try {
        parsed = JSON.parse(importText);
      } catch {
        parsed = yaml.load(importText);
      }

      // Convert back to YAML for consistency
      const yamlString = yaml.dump(parsed, { indent: 2, lineWidth: 120 });
      
      onImport(yamlString);
      success('Import successful', 'Specification imported successfully');
      setImportText('');
      onClose();
    } catch (err) {
      error('Import failed', 'Invalid YAML/JSON format. Please check your content and try again.');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportText(content);
    };
    reader.readAsText(file);
  };

  const handleImportFromUrl = async () => {
    const url = prompt('Enter URL to import from:');
    if (!url) return;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch');
      
      const content = await response.text();
      setImportText(content);
      success('URL loaded', 'Content loaded from URL successfully');
    } catch (err) {
      error('URL import failed', 'Failed to load content from URL. Please check the URL and try again.');
    }
  };

  return (
    <div className="export-import-overlay">
      <div className="export-import-modal">
        <div className="modal-header">
          <h2 className="modal-title">
            <span className="title-icon">📦</span>
            Export / Import Specification
          </h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-tabs">
          <button
            className={`tab-button ${activeTab === 'export' ? 'active' : ''}`}
            onClick={() => setActiveTab('export')}
          >
            📤 Export
          </button>
          <button
            className={`tab-button ${activeTab === 'import' ? 'active' : ''}`}
            onClick={() => setActiveTab('import')}
          >
            📥 Import
          </button>
        </div>

        <div className="modal-content">
          {activeTab === 'export' && (
            <div className="export-tab">
              <div className="export-options">
                <div className="option-group">
                  <label className="option-label">File Name</label>
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="option-input"
                    placeholder="openapi-spec"
                  />
                </div>

                <div className="option-group">
                  <label className="option-label">Format</label>
                  <div className="format-buttons">
                    <button
                      className={`format-button ${exportFormat === 'yaml' ? 'active' : ''}`}
                      onClick={() => setExportFormat('yaml')}
                    >
                      📄 YAML
                    </button>
                    <button
                      className={`format-button ${exportFormat === 'json' ? 'active' : ''}`}
                      onClick={() => setExportFormat('json')}
                    >
                      🔧 JSON
                    </button>
                  </div>
                </div>

                <div className="preview-section">
                  <label className="option-label">Preview</label>
                  <div className="preview-content">
                    <pre className="preview-text">
                      {exportFormat === 'yaml' 
                        ? yamlContent.substring(0, 500) + (yamlContent.length > 500 ? '...' : '')
                        : JSON.stringify(yaml.load(yamlContent), null, 2).substring(0, 500) + '...'
                      }
                    </pre>
                  </div>
                </div>
              </div>

              <div className="export-actions">
                <button className="action-button primary" onClick={handleExportFile}>
                  <span className="button-icon">💾</span>
                  Download File
                </button>
                <button className="action-button secondary" onClick={handleCopyToClipboard}>
                  <span className="button-icon">📋</span>
                  Copy to Clipboard
                </button>
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="import-tab">
              <div className="import-options">
                <div className="import-methods">
                  <button className="import-method-button" onClick={() => document.getElementById('file-input')?.click()}>
                    <span className="method-icon">📁</span>
                    <div className="method-text">
                      <div className="method-title">Upload File</div>
                      <div className="method-desc">Import from YAML or JSON file</div>
                    </div>
                  </button>

                  <button className="import-method-button" onClick={handleImportFromUrl}>
                    <span className="method-icon">🌐</span>
                    <div className="method-text">
                      <div className="method-title">Import from URL</div>
                      <div className="method-desc">Load specification from a URL</div>
                    </div>
                  </button>

                  <input
                    id="file-input"
                    type="file"
                    accept=".yaml,.yml,.json"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </div>

                <div className="text-import">
                  <label className="option-label">Or paste content directly</label>
                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="Paste your OpenAPI specification here (YAML or JSON format)..."
                    className="import-textarea"
                    rows={12}
                  />
                </div>
              </div>

              <div className="import-actions">
                <button 
                  className="action-button primary" 
                  onClick={handleImportText}
                  disabled={!importText.trim()}
                >
                  <span className="button-icon">📥</span>
                  Import Specification
                </button>
                <button 
                  className="action-button secondary" 
                  onClick={() => setImportText('')}
                  disabled={!importText.trim()}
                >
                  <span className="button-icon">🗑️</span>
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportImportModal;