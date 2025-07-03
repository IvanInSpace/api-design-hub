import React, { useCallback } from 'react';
import OpenAISettings from './OpenAISettings';
import { useNotifications } from './Notifications/NotificationProvider';

interface OpenAISettingsWrapperProps {
  apiKey: string;
  onApiKeyChange: (apiKey: string) => void;
  onTest?: () => Promise<boolean>;
  isConnected?: boolean;
  usage?: {
    requests: number;
    tokens: number;
  };
}

const OpenAISettingsWrapper: React.FC<OpenAISettingsWrapperProps> = ({
  apiKey,
  onApiKeyChange,
  onTest,
  isConnected,
  usage
}) => {
  const { success, error } = useNotifications();

  const handleApiKeyChange = useCallback((key: string) => {
    onApiKeyChange(key);
    if (key) {
      success('API Key saved', 'OpenAI API key has been saved securely');
    } else {
      success('API Key removed', 'OpenAI API key has been removed');
    }
  }, [onApiKeyChange, success]);

  const handleTest = useCallback(async (): Promise<boolean> => {
    if (!onTest) {
      error('No test function', 'Test function is not available');
      return false;
    }

    try {
      const result = await onTest();
      if (result) {
        success('Connection successful', 'OpenAI API is working correctly');
      } else {
        error('Connection failed', 'Failed to connect to OpenAI API');
      }
      return result;
    } catch (err: any) {
      let errorMessage = 'Unknown error occurred';
      if (err.message?.includes('401')) {
        errorMessage = 'Invalid API key. Please check your OpenAI API key.';
      } else if (err.message?.includes('429')) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (err.message?.includes('insufficient_quota')) {
        errorMessage = 'Insufficient quota. Please check your OpenAI billing.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      error('Connection failed', errorMessage);
      return false;
    }
  }, [onTest, success, error]);

  return (
    <OpenAISettings
      apiKey={apiKey}
      onApiKeyChange={handleApiKeyChange}
      onTest={handleTest}
      isConnected={isConnected}
      usage={usage}
    />
  );
};

export default OpenAISettingsWrapper;