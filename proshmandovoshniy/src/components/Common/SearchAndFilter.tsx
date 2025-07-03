import React, { useState, useMemo } from 'react';
import { BlockType } from '../../types/openapi';
import './SearchAndFilter.css';

interface SearchAndFilterProps {
  blocks: BlockType[];
  onBlockSelect: (blockId: string) => void;
  selectedBlock: string | null;
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  blocks,
  onBlockSelect,
  selectedBlock
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | BlockType['type']>('all');
  const [isExpanded, setIsExpanded] = useState(false);

  const blockTypeLabels = {
    info: 'API Information',
    server: 'Server',
    path: 'API Path',
    component: 'Component',
    security: 'Security Scheme',
    tag: 'Tag'
  };

  const blockTypeIcons = {
    info: '📋',
    server: '🌐',
    path: '🛤️',
    component: '🧩',
    security: '🔒',
    tag: '🏷️'
  };

  const filteredBlocks = useMemo(() => {
    return blocks.filter(block => {
      // Filter by type
      if (filterType !== 'all' && block.type !== filterType) {
        return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          block.title.toLowerCase().includes(query) ||
          blockTypeLabels[block.type].toLowerCase().includes(query) ||
          (block.data.description && block.data.description.toLowerCase().includes(query)) ||
          (block.data.path && block.data.path.toLowerCase().includes(query)) ||
          (block.data.name && block.data.name.toLowerCase().includes(query)) ||
          (block.data.url && block.data.url.toLowerCase().includes(query))
        );
      }

      return true;
    });
  }, [blocks, searchQuery, filterType]);

  const getBlockPreview = (block: BlockType) => {
    switch (block.type) {
      case 'path':
        return block.data.path || '/path';
      case 'server':
        return block.data.url || 'server-url';
      case 'tag':
        return block.data.name || 'tag-name';
      default:
        return block.data.description || block.data.title || 'No description';
    }
  };

  const getBlockMethods = (block: BlockType) => {
    if (block.type === 'path' && block.data.methods) {
      return block.data.methods.slice(0, 3); // Show max 3 methods
    }
    return [];
  };

  const hasResults = filteredBlocks.length > 0;
  const isSearching = searchQuery.trim() || filterType !== 'all';

  return (
    <div className={`search-filter-container ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="search-filter-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="header-left">
          <span className="header-icon">🔍</span>
          <span className="header-title">Search & Filter</span>
          {isSearching && (
            <span className="results-count">
              {filteredBlocks.length} result{filteredBlocks.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <button className="expand-toggle">
          {isExpanded ? '🔽' : '▶️'}
        </button>
      </div>

      {isExpanded && (
        <div className="search-filter-content">
          <div className="search-controls">
            <div className="search-input-container">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search blocks by name, path, description..."
                className="search-input"
              />
              {searchQuery && (
                <button
                  className="clear-search"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="filter-container">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | BlockType['type'])}
                className="filter-select"
              >
                <option value="all">All Types</option>
                {Object.entries(blockTypeLabels).map(([type, label]) => (
                  <option key={type} value={type}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="search-results">
            {!hasResults && isSearching ? (
              <div className="no-results">
                <div className="no-results-icon">🔍</div>
                <div className="no-results-text">
                  <p>No blocks found</p>
                  <small>Try adjusting your search or filter criteria</small>
                </div>
              </div>
            ) : (
              <div className="results-list">
                {filteredBlocks.map(block => (
                  <div
                    key={block.id}
                    className={`result-item ${selectedBlock === block.id ? 'selected' : ''}`}
                    onClick={() => onBlockSelect(block.id)}
                  >
                    <div className="result-header">
                      <span className="result-icon">
                        {blockTypeIcons[block.type]}
                      </span>
                      <div className="result-info">
                        <div className="result-title">{block.title}</div>
                        <div className="result-type">{blockTypeLabels[block.type]}</div>
                      </div>
                      {block.type === 'info' && (
                        <span className="required-indicator">Required</span>
                      )}
                    </div>
                    
                    <div className="result-preview">
                      {getBlockPreview(block)}
                    </div>

                    {getBlockMethods(block).length > 0 && (
                      <div className="result-methods">
                        {getBlockMethods(block).map(method => (
                          <span key={method} className={`method-tag method-${method}`}>
                            {method.toUpperCase()}
                          </span>
                        ))}
                        {block.data.methods && block.data.methods.length > 3 && (
                          <span className="more-methods">
                            +{block.data.methods.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {isSearching && hasResults && (
            <div className="search-footer">
              <button
                className="clear-all-button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterType('all');
                }}
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchAndFilter;