import React, { useState, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Layout, BlockEditor, YamlViewer } from './components';
import NotificationProvider from './components/Common/Notifications/NotificationProvider';
import NotificationContainer from './components/Common/Notifications/NotificationContainer';
import AISuggestionPanel from './components/Common/AISuggestionPanel';
import { useAISuggestions } from './hooks/useAISuggestions';
import OpenAIAssistant from './utils/openAIAssistant';
import { YamlGenerator } from './utils';
import { BlockType } from './types/openapi';
import './styles/index.css';

// Inner component that uses the notification context
function AppInner() {
  const [blocks, setBlocks] = useState<BlockType[]>([
    {
      id: 'info-default',
      type: 'info',
      title: 'API Information',
      expanded: true,
      data: {
        title: 'My API',
        version: '1.0.0',
        description: 'API created with Proshmandovoshniy'
      }
    }
  ]);
  
  const [selectedBlock, setSelectedBlock] = useState<string | null>('info-default');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [aiPanelVisible, setAiPanelVisible] = useState(false);
  const [openAIToken, setOpenAIToken] = useState<string>('');

  // Generate YAML from current blocks
  const yamlContent = YamlGenerator.generateFromBlocks(blocks);

  // Create OpenAI assistant when token is available
  const openAIAssistant = useMemo(() => {
    if (!openAIToken) return null;
    return new OpenAIAssistant({ apiKey: openAIToken });
  }, [openAIToken]);

  // Handle YAML changes from AI suggestions
  const handleYamlChange = useCallback((newYamlContent: string) => {
    try {
      const importedBlocks = YamlGenerator.parseYamlToBlocks(newYamlContent);
      if (importedBlocks.length > 0) {
        setBlocks(importedBlocks);
      }
    } catch (error) {
      console.error('Failed to update blocks from AI suggestion:', error);
    }
  }, []);

  // Initialize AI suggestions hook
  const {
    suggestions,
    isAnalyzing,
    acceptSuggestion,
    rejectSuggestion,
    refreshSuggestions,
    clearAllSuggestions
  } = useAISuggestions(yamlContent, handleYamlChange, {
    debounceMs: 1500,
    maxSuggestions: 8,
    enableAutoAnalysis: true,
    assistant: openAIAssistant
  });

  const handleThemeToggle = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  const handleBlockSelect = useCallback((blockId: string) => {
    setSelectedBlock(blockId);
  }, []);

  const handleBlockUpdate = useCallback((blockId: string, updates: any) => {
    setBlocks(prev => prev.map(block => {
      if (block.id === blockId) {
        // Если обновляется expanded, то это изменение самого блока
        if ('expanded' in updates && Object.keys(updates).length === 1) {
          return { ...block, expanded: updates.expanded };
        }
        // Иначе это обновление данных блока
        return { 
          ...block, 
          data: { ...block.data, ...updates }
        };
      }
      return block;
    }));
  }, []);

  const handleBlockAdd = useCallback((type: BlockType['type']) => {
    const newBlock: BlockType = {
      id: uuidv4(),
      type,
      title: getDefaultTitle(type),
      expanded: true,
      data: getDefaultData(type)
    };
    
    setBlocks(prev => [...prev, newBlock]);
    setSelectedBlock(newBlock.id);
  }, []);

  const handleApplyTemplate = useCallback((templateBlocks: Omit<BlockType, 'id'>[]) => {
    const newBlocks: BlockType[] = templateBlocks.map(block => ({
      ...block,
      id: uuidv4()
    }));
    
    setBlocks(newBlocks);
    if (newBlocks.length > 0) {
      setSelectedBlock(newBlocks[0].id);
    }
  }, []);

  const handleBlockDelete = useCallback((blockId: string) => {
    setBlocks(prev => prev.filter(block => block.id !== blockId));
    if (selectedBlock === blockId) {
      setSelectedBlock(null);
    }
  }, [selectedBlock]);

  const handleYamlImport = useCallback((yamlContent: string) => {
    try {
      const importedBlocks = YamlGenerator.parseYamlToBlocks(yamlContent);
      if (importedBlocks.length > 0) {
        setBlocks(importedBlocks);
        setSelectedBlock(importedBlocks[0].id);
      }
    } catch (error) {
      console.error('Failed to import YAML:', error);
      // TODO: Show error message to user
    }
  }, []);

  const handleYamlExport = useCallback(() => {
    // TODO: Add export functionality (e.g., save to file, copy to clipboard)
    console.log('Export YAML:', yamlContent);
  }, [yamlContent]);

  return (
    <>
      <Layout 
        theme={theme} 
        onThemeToggle={handleThemeToggle}
        onTokenChange={setOpenAIToken}
      >
        <BlockEditor
          blocks={blocks}
          selectedBlock={selectedBlock}
          onBlockSelect={handleBlockSelect}
          onBlockUpdate={handleBlockUpdate}
          onBlockAdd={handleBlockAdd}
          onBlockDelete={handleBlockDelete}
          onApplyTemplate={handleApplyTemplate}
        />
        
        <YamlViewer
          yamlContent={yamlContent}
          onImport={handleYamlImport}
          onExport={handleYamlExport}
        />
      </Layout>
      
      <AISuggestionPanel
        suggestions={suggestions}
        onAcceptSuggestion={acceptSuggestion}
        onRejectSuggestion={rejectSuggestion}
        isVisible={aiPanelVisible}
        onToggle={() => setAiPanelVisible(!aiPanelVisible)}
        isProcessing={isAnalyzing}
      />
      
      <NotificationContainer />
    </>
  );
}

function getDefaultTitle(type: BlockType['type']): string {
  switch (type) {
    case 'info': return 'API Information';
    case 'server': return 'New Server';
    case 'path': return 'New Path';
    case 'component': return 'New Component';
    case 'security': return 'New Security Scheme';
    case 'tag': return 'New Tag';
    default: return 'New Block';
  }
}

function getDefaultData(type: BlockType['type']): any {
  switch (type) {
    case 'info':
      return {
        title: 'My API',
        version: '1.0.0',
        description: ''
      };
    case 'server':
      return {
        url: 'https://api.example.com',
        description: ''
      };
    case 'path':
      return {
        path: '/example',
        summary: '',
        description: '',
        methods: ['get']
      };
    case 'tag':
      return {
        name: 'example',
        description: ''
      };
    default:
      return {};
  }
}

// Main App component with NotificationProvider wrapper
function App() {
  return (
    <NotificationProvider>
      <AppInner />
    </NotificationProvider>
  );
}

export default App;