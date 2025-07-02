import React, { useState } from 'react';
import { ValidationResult, ValidationError } from '../../utils/openApiValidator';
import './ValidationPanel.css';

interface ValidationPanelProps {
  validationResult: ValidationResult;
  isVisible: boolean;
  onToggle: () => void;
}

const ValidationPanel: React.FC<ValidationPanelProps> = ({
  validationResult,
  isVisible,
  onToggle
}) => {
  const [activeTab, setActiveTab] = useState<'errors' | 'warnings' | 'infos'>('errors');

  const { errors, warnings, infos, isValid } = validationResult;
  const totalIssues = errors.length + warnings.length + infos.length;

  const getStatusIcon = () => {
    if (errors.length > 0) return '❌';
    if (warnings.length > 0) return '⚠️';
    return '✅';
  };

  const getStatusText = () => {
    if (errors.length > 0) return 'Errors found';
    if (warnings.length > 0) return 'Valid with warnings';
    return 'Valid specification';
  };

  const getStatusColor = () => {
    if (errors.length > 0) return 'error';
    if (warnings.length > 0) return 'warning';
    return 'success';
  };

  const renderIssuesList = (issues: ValidationError[], type: string) => {
    if (issues.length === 0) {
      return (
        <div className="no-issues">
          <div className="no-issues-icon">✨</div>
          <p>No {type} found</p>
        </div>
      );
    }

    return (
      <div className="issues-list">
        {issues.map((issue, index) => (
          <div key={index} className={`issue-item ${issue.severity}`}>
            <div className="issue-header">
              <span className="issue-icon">
                {issue.severity === 'error' ? '🔴' : 
                 issue.severity === 'warning' ? '🟡' : '🔵'}
              </span>
              <span className="issue-path">{issue.path}</span>
            </div>
            <div className="issue-message">{issue.message}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`validation-panel ${isVisible ? 'visible' : 'collapsed'}`}>
      <div className="validation-header" onClick={onToggle}>
        <div className="validation-status">
          <span className="status-icon">{getStatusIcon()}</span>
          <span className={`status-text ${getStatusColor()}`}>
            {getStatusText()}
          </span>
          {totalIssues > 0 && (
            <span className="issue-count">
              ({totalIssues} issue{totalIssues !== 1 ? 's' : ''})
            </span>
          )}
        </div>
        <button className="toggle-button">
          {isVisible ? '🔽' : '▶️'}
        </button>
      </div>

      {isVisible && (
        <div className="validation-content">
          <div className="validation-tabs">
            <button
              className={`tab-button ${activeTab === 'errors' ? 'active' : ''} ${errors.length > 0 ? 'has-issues' : ''}`}
              onClick={() => setActiveTab('errors')}
            >
              <span className="tab-icon">🔴</span>
              Errors ({errors.length})
            </button>
            <button
              className={`tab-button ${activeTab === 'warnings' ? 'active' : ''} ${warnings.length > 0 ? 'has-issues' : ''}`}
              onClick={() => setActiveTab('warnings')}
            >
              <span className="tab-icon">🟡</span>
              Warnings ({warnings.length})
            </button>
            <button
              className={`tab-button ${activeTab === 'infos' ? 'active' : ''} ${infos.length > 0 ? 'has-issues' : ''}`}
              onClick={() => setActiveTab('infos')}
            >
              <span className="tab-icon">🔵</span>
              Info ({infos.length})
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'errors' && renderIssuesList(errors, 'errors')}
            {activeTab === 'warnings' && renderIssuesList(warnings, 'warnings')}
            {activeTab === 'infos' && renderIssuesList(infos, 'suggestions')}
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationPanel;