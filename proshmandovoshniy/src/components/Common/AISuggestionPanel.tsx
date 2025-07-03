import React, { useState, useCallback } from 'react';
import { AISuggestion } from '../../utils/openAIAssistant';
import { useNotifications } from '../Common/Notifications/NotificationProvider';
import './AISuggestionPanel.css';

interface AISuggestionPanelProps {
  suggestions: AISuggestion[];
  onAcceptSuggestion: (suggestion: AISuggestion) => void;
  onRejectSuggestion: (suggestionId: string) => void;
  isVisible: boolean;
  onToggle: () => void;
  isProcessing?: boolean;
  onAnalyze: () => void; // Новый prop для ручного анализа
}

const AISuggestionPanel: React.FC<AISuggestionPanelProps> = ({
  suggestions,
  onAcceptSuggestion,
  onRejectSuggestion,
  isVisible,
  onToggle,
  isProcessing = false,
  onAnalyze
}) => {
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<string | null>(null);
  const { success, info } = useNotifications();

  const handleAccept = useCallback((suggestion: AISuggestion) => {
    onAcceptSuggestion(suggestion);
    success('Suggestion applied', `Added ${suggestion.title} to your specification`);
  }, [onAcceptSuggestion, success]);

  const handleReject = useCallback((suggestionId: string) => {
    onRejectSuggestion(suggestionId);
    info('Suggestion dismissed', 'The suggestion has been removed from the list');
  }, [onRejectSuggestion, info]);

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
  };

  const getTypeIcon = (type: AISuggestion['type']): string => {
    const icons = {
      path: '🛤️',
      operation: '⚡',
      schema: '📋',
      component: '🧩',
      parameter: '🔧'
    };
    return icons[type] || '💡';
  };

  const toggleExpanded = (suggestionId: string) => {
    setExpandedSuggestion(
      expandedSuggestion === suggestionId ? null : suggestionId
    );
  };

  const togglePreview = (suggestionId: string) => {
    setPreviewMode(
      previewMode === suggestionId ? null : suggestionId
    );
  };

  if (!isVisible) {
    return (
      <div className="ai-suggestion-panel collapsed">
        <button 
          className="panel-toggle-btn"
          onClick={onToggle}
          title="Show AI Suggestions"
        >
          <span className="toggle-icon">🤖</span>
          <span className="toggle-text">AI Assistant</span>
          {suggestions.length > 0 && (
            <span className="suggestion-count">{suggestions.length}</span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="ai-suggestion-panel expanded">
      <div className="panel-header">
        <div className="header-content">
          <span className="panel-icon">🤖</span>
          <h3 className="panel-title">AI Assistant</h3>
          {isProcessing && (
            <div className="processing-indicator">
              <span className="processing-spinner">⟳</span>
              <span className="processing-text">Analyzing...</span>
            </div>
          )}
        </div>
        <div className="panel-actions">
          <button 
            className="analyze-button"
            onClick={onAnalyze}
            disabled={isProcessing}
            title="Analyze specification for suggestions"
          >
            {isProcessing ? '⟳' : '🔍'} Analyze
          </button>
          <button 
            className="panel-close-btn"
            onClick={onToggle}
            title="Hide AI Suggestions"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="panel-content">
        {suggestions.length === 0 ? (
          <div className="no-suggestions">
            <div className="no-suggestions-icon">🎯</div>
            <p className="no-suggestions-title">Ready for analysis!</p>
            <p className="no-suggestions-text">
              Click the "Analyze" button above to get AI-powered suggestions for your OpenAPI specification.
            </p>
          </div>
        ) : (
          <div className="suggestions-list">
                {suggestions.length > 0 && (
                  <div className="suggestions-header">
                    <span className="suggestions-count">
                      {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''}
                    </span>
                    <div className="suggestions-stats">
                      <span className={`confidence-badge high`}>
                        {suggestions.filter(s => s.confidence >= 0.8).length} high
                      </span>
                      <span className={`confidence-badge medium`}>
                        {suggestions.filter(s => s.confidence >= 0.6 && s.confidence < 0.8).length} medium
                      </span>
                      <span className="suggestions-source">
                        {suggestions.some(s => s.reasoning.includes('OpenAI') || s.reasoning.includes('GPT')) ? '🤖 OpenAI' : '🧠 Local'}
                      </span>
                    </div>
                  </div>
                )}

            {suggestions.map((suggestion) => (
              <div 
                key={suggestion.id} 
                className={`suggestion-item ${expandedSuggestion === suggestion.id ? 'expanded' : ''}`}
              >
                <div className="suggestion-header">
                  <div className="suggestion-meta">
                    <span className="suggestion-icon">
                      {getTypeIcon(suggestion.type)}
                    </span>
                    <div className="suggestion-info">
                      <h4 className="suggestion-title">{suggestion.title}</h4>
                      <p className="suggestion-description">{suggestion.description}</p>
                    </div>
                  </div>
                  <div className="suggestion-actions">
                    <span 
                      className={`confidence-indicator ${getConfidenceColor(suggestion.confidence)}`}
                      title={`Confidence: ${Math.round(suggestion.confidence * 100)}%`}
                    >
                      {Math.round(suggestion.confidence * 100)}%
                    </span>
                    <button
                      className="action-btn expand-btn"
                      onClick={() => toggleExpanded(suggestion.id)}
                      title={expandedSuggestion === suggestion.id ? 'Collapse' : 'Expand details'}
                    >
                      {expandedSuggestion === suggestion.id ? '▲' : '▼'}
                    </button>
                  </div>
                </div>

                {expandedSuggestion === suggestion.id && (
                  <div className="suggestion-details">
                    <div className="suggestion-reasoning">
                      <h5>Why this suggestion?</h5>
                      <p>{suggestion.reasoning}</p>
                    </div>

                    <div className="suggestion-preview">
                      <div className="preview-header">
                        <h5>YAML Preview</h5>
                        <button
                          className={`preview-toggle ${previewMode === suggestion.id ? 'active' : ''}`}
                          onClick={() => togglePreview(suggestion.id)}
                        >
                          {previewMode === suggestion.id ? 'Hide' : 'Show'} Code
                        </button>
                      </div>
                      
                      {previewMode === suggestion.id && (
                        <div className="yaml-preview">
                          <pre className="yaml-code">
                            <code>{suggestion.yamlContent}</code>
                          </pre>
                        </div>
                      )}
                    </div>

                    <div className="suggestion-controls">
                      <button
                        className="control-btn accept-btn"
                        onClick={() => handleAccept(suggestion)}
                      >
                        <span className="btn-icon">✅</span>
                        Accept & Apply
                      </button>
                      <button
                        className="control-btn reject-btn"
                        onClick={() => handleReject(suggestion.id)}
                      >
                        <span className="btn-icon">❌</span>
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel-footer">
        <div className="footer-info">
          <span className="footer-icon">💡</span>
          <span className="footer-text">
            Suggestions are based on OpenAPI best practices and common patterns
          </span>
        </div>
      </div>
    </div>
  );
};

export default AISuggestionPanel;