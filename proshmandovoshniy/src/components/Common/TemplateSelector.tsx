import React, { useState } from 'react';
import { Template, apiTemplates, pathTemplates, getTemplatesByCategory } from '../../templates/apiTemplates';
import { BlockType } from '../../types/openapi';
import './TemplateSelector.css';

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (blocks: Omit<BlockType, 'id'>[]) => void;
  onApplyPathTemplate: (data: any) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  isOpen,
  onClose,
  onApplyTemplate,
  onApplyPathTemplate
}) => {
  const [activeTab, setActiveTab] = useState<'full' | 'paths'>('full');
  const [selectedCategory, setSelectedCategory] = useState<string>('common');

  if (!isOpen) return null;

  const categories = [
    { id: 'common', name: 'Common', icon: '⭐' },
    { id: 'crud', name: 'CRUD', icon: '🔄' },
    { id: 'auth', name: 'Auth', icon: '🔐' },
    { id: 'advanced', name: 'Advanced', icon: '🚀' }
  ];

  const handleTemplateSelect = (template: Template) => {
    onApplyTemplate(template.blocks);
    onClose();
  };

  const handlePathTemplateSelect = (templateId: string) => {
    const template = pathTemplates[templateId as keyof typeof pathTemplates];
    if (template) {
      onApplyPathTemplate(template.data);
      onClose();
    }
  };

  return (
    <div className="template-selector-overlay">
      <div className="template-selector-modal">
        <div className="modal-header">
          <h2 className="modal-title">
            <span className="title-icon">📋</span>
            Choose Template
          </h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-tabs">
          <button
            className={`tab-button ${activeTab === 'full' ? 'active' : ''}`}
            onClick={() => setActiveTab('full')}
          >
            🏗️ Full API Templates
          </button>
          <button
            className={`tab-button ${activeTab === 'paths' ? 'active' : ''}`}
            onClick={() => setActiveTab('paths')}
          >
            🛤️ Path Templates
          </button>
        </div>

        <div className="modal-content">
          {activeTab === 'full' && (
            <div className="full-templates-tab">
              <div className="category-filter">
                {categories.map(category => (
                  <button
                    key={category.id}
                    className={`category-button ${
                      selectedCategory === category.id ? 'active' : ''
                    }`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <span className="category-icon">{category.icon}</span>
                    {category.name}
                  </button>
                ))}
              </div>

              <div className="templates-grid">
                {getTemplatesByCategory(selectedCategory).map(template => (
                  <div
                    key={template.id}
                    className="template-card"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <div className="template-icon">{template.icon}</div>
                    <div className="template-info">
                      <h3 className="template-name">{template.name}</h3>
                      <p className="template-description">{template.description}</p>
                      <div className="template-stats">
                        <span className="stat">
                          {template.blocks.length} blocks
                        </span>
                        <span className="stat">
                          {template.blocks.filter(b => b.type === 'path').length} paths
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {getTemplatesByCategory(selectedCategory).length === 0 && (
                  <div className="empty-category">
                    <div className="empty-icon">📭</div>
                    <p>No templates available in this category yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'paths' && (
            <div className="path-templates-tab">
              <div className="path-templates-grid">
                {Object.entries(pathTemplates).map(([templateId, template]) => (
                  <div
                    key={templateId}
                    className="path-template-card"
                    onClick={() => handlePathTemplateSelect(templateId)}
                  >
                    <div className="path-template-header">
                      <div className="path-template-path">
                        {template.data.path}
                      </div>
                      <div className="path-template-methods">
                        {template.data.methods.map((method: string) => (
                          <span
                            key={method}
                            className={`method-badge method-${method}`}
                          >
                            {method.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="path-template-info">
                      <h4 className="path-template-name">{template.name}</h4>
                      <p className="path-template-description">{template.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="secondary-button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateSelector;