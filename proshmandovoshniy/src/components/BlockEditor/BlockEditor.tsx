import React, { useState } from 'react';
import { BlockType } from '../../types/openapi';
import PathForm from './Forms/PathForm';
import TemplateSelector from '../Common/TemplateSelector';
import './BlockEditor.css';

interface BlockEditorProps {
  blocks: BlockType[];
  selectedBlock: string | null;
  onBlockSelect: (blockId: string) => void;
  onBlockUpdate: (blockId: string, data: any) => void;
  onBlockAdd: (type: BlockType['type']) => void;
  onBlockDelete: (blockId: string) => void;
  onApplyTemplate?: (blocks: Omit<BlockType, 'id'>[]) => void;
}

const BlockEditor: React.FC<BlockEditorProps> = ({
  blocks,
  selectedBlock,
  onBlockSelect,
  onBlockUpdate,
  onBlockAdd,
  onBlockDelete,
  onApplyTemplate
}) => {
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAddDropdown, setShowAddDropdown] = useState(false);

  const blockTypeIcons = {
    info: '📋',
    server: '🌐',
    path: '🛤️',
    component: '🧩',
    security: '🔒',
    tag: '🏷️'
  };

  const blockTypeLabels = {
    info: 'API Information',
    server: 'Server',
    path: 'API Path',
    component: 'Component',
    security: 'Security Scheme',
    tag: 'Tag'
  };

  const handleApplyTemplate = (templateBlocks: Omit<BlockType, 'id'>[]) => {
    if (onApplyTemplate) {
      onApplyTemplate(templateBlocks);
    }
  };

  const handleApplyPathTemplate = (templateData: any) => {
    onBlockAdd('path');
    // Note: This would need to be enhanced to actually apply the template data
    // to the newly created block
  };

  return (
    <div className="block-editor">
      <div className="editor-toolbar">
        <h3 className="toolbar-title">API Blocks</h3>
        <div className="toolbar-actions">
          {onApplyTemplate && (
            <button
              className="template-button"
              onClick={() => setShowTemplates(true)}
              title="Choose from templates"
            >
              <span className="btn-icon">📋</span>
              Templates
            </button>
          )}
          
          <div className="add-block-dropdown">
            <button 
              className="add-block-btn"
              onClick={() => setShowAddDropdown(!showAddDropdown)}
              title="Add new block"
            >
              <span className="btn-icon">➕</span>
              Add Block
            </button>
            {showAddDropdown && (
              <div className="dropdown-content">
                {Object.entries(blockTypeLabels).map(([type, label]) => (
                  <button
                    key={type}
                    className="dropdown-item"
                    onClick={() => {
                      onBlockAdd(type as BlockType['type']);
                      setShowAddDropdown(false);
                    }}
                  >
                    <span className="item-icon">{blockTypeIcons[type as keyof typeof blockTypeIcons]}</span>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="blocks-container">
        {blocks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h4>No blocks yet</h4>
            <p>Start building your API by adding blocks above or choose from templates</p>
            {onApplyTemplate && (
              <button
                className="template-button secondary"
                onClick={() => setShowTemplates(true)}
              >
                <span className="btn-icon">📋</span>
                Browse Templates
              </button>
            )}
          </div>
        ) : (
          blocks.map(block => (
            <div
              key={block.id}
              className={`block-item ${
                selectedBlock === block.id ? 'selected' : ''
              } ${block.expanded ? 'expanded' : ''}`}
              onClick={() => onBlockSelect(block.id)}
            >
              <div className="block-header">
                <div className="block-info">
                  <span className="block-icon">
                    {blockTypeIcons[block.type]}
                  </span>
                  <div className="block-text">
                    <h4 className="block-title">{block.title}</h4>
                    <span className="block-type">{blockTypeLabels[block.type]}</span>
                  </div>
                </div>
                <div className="block-actions">
                  <button
                    className="action-btn expand-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onBlockUpdate(block.id, { expanded: !block.expanded });
                    }}
                    title={block.expanded ? 'Collapse' : 'Expand'}
                  >
                    {block.expanded ? '🔽' : '▶️'}
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Are you sure you want to delete this block?')) {
                        onBlockDelete(block.id);
                      }
                    }}
                    title="Delete block"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {block.expanded && (
                <div className="block-content">
                  <BlockContent
                    block={block}
                    onUpdate={(data) => onBlockUpdate(block.id, data)}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {onApplyTemplate && (
        <TemplateSelector
          isOpen={showTemplates}
          onClose={() => setShowTemplates(false)}
          onApplyTemplate={handleApplyTemplate}
          onApplyPathTemplate={handleApplyPathTemplate}
        />
      )}
    </div>
  );
};

interface BlockContentProps {
  block: BlockType;
  onUpdate: (data: any) => void;
}

const BlockContent: React.FC<BlockContentProps> = ({ block, onUpdate }) => {
  const handleFieldChange = (field: string, value: any) => {
    onUpdate({
      ...block.data,
      [field]: value
    });
  };

  const renderField = (label: string, field: string, type: 'text' | 'textarea' | 'url' | 'email' = 'text') => (
    <div className="form-field">
      <label className="field-label">{label}</label>
      {type === 'textarea' ? (
        <textarea
          className="field-input"
          value={block.data[field] || ''}
          onChange={(e) => handleFieldChange(field, e.target.value)}
          rows={3}
        />
      ) : (
        <input
          type={type}
          className="field-input"
          value={block.data[field] || ''}
          onChange={(e) => handleFieldChange(field, e.target.value)}
        />
      )}
    </div>
  );

  switch (block.type) {
    case 'info':
      return (
        <div className="block-form">
          {renderField('Title*', 'title')}
          {renderField('Version*', 'version')}
          {renderField('Description', 'description', 'textarea')}
          {renderField('Terms of Service', 'termsOfService', 'url')}
          
          <div className="form-section">
            <h5 className="section-title">Contact Information</h5>
            {renderField('Contact Name', 'contactName')}
            {renderField('Contact Email', 'contactEmail', 'email')}
            {renderField('Contact URL', 'contactUrl', 'url')}
          </div>
          
          <div className="form-section">
            <h5 className="section-title">License</h5>
            {renderField('License Name', 'licenseName')}
            {renderField('License URL', 'licenseUrl', 'url')}
          </div>
        </div>
      );

    case 'server':
      return (
        <div className="block-form">
          {renderField('Server URL*', 'url', 'url')}
          {renderField('Description', 'description', 'textarea')}
        </div>
      );

    case 'path':
      return (
        <PathForm
          data={block.data}
          onUpdate={onUpdate}
        />
      );

    case 'tag':
      return (
        <div className="block-form">
          {renderField('Tag Name*', 'name')}
          {renderField('Description', 'description', 'textarea')}
          {renderField('External Docs URL', 'externalDocsUrl', 'url')}
        </div>
      );

    default:
      return (
        <div className="block-form">
          <p className="placeholder-text">
            Configuration for {block.type} blocks coming soon...
          </p>
        </div>
      );
  }
};

export default BlockEditor;