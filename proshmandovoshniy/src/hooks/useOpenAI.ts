import { useState, useEffect, useCallback } from 'react';
import OpenAIAssistant, { OpenAIConfig } from '../utils/openAIAssistant';

interface UseOpenAIReturn { 
  apiKey: string; 
  isConnected: boolean | undefined; 
  assistant: OpenAIAssistant | null; 
  usage: { 
    requests: number; 
    tokens: number; 
 }; 
  setApiKey: (key: string) => void; 
  testConnection: () => Promise<boolean>; 
  clearUsage: () => void; 
 } 

const STORAGE_KEY = 'openai_api_key'; 
const USAGE_STORAGE_KEY = 'openai_usage'; 

export const useOpenAI = (): UseOpenAIReturn => {
const [apiKey, setApiKeyState] = useState<string>('');
const [isConnected, setIsConnected] = useState<boolean | undefined>(undefined);
const [assistant, setAssistant] = useState<OpenAIAssistant | null>(null);
const [usage, setUsage] = useState({ requests: 0, tokens: 0 });

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem(STORAGE_KEY);
    if (savedKey) {
      try {
        // Decrypt or decode if needed in the future
        const decodedKey = atob(savedKey); // Basic base64 encoding for minimal obfuscation
        setApiKeyState(decodedKey);
      } catch (err) {
        console.warn('Failed to decode saved API key');
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    // Load usage from localStorage
    const savedUsage = localStorage.getItem(USAGE_STORAGE_KEY);
    if (savedUsage) {
      try {
        setUsage(JSON.parse(savedUsage));
      } catch (err) {
        console.warn('Failed to parse saved usage data');
      }
    }
  }, []);

  // Create assistant when API key changes
  useEffect(() => {
    if (apiKey) {
      const config: OpenAIConfig = {
        apiKey,
        model: 'gpt-4o-mini',
        temperature: 0.3
      };
      setAssistant(new OpenAIAssistant(config));
      setIsConnected(undefined); // Reset connection status
    } else {
      setAssistant(null);
      setIsConnected(undefined);
    }
  }, [apiKey]);

  // Save usage to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(usage));
  }, [usage]);

  const setApiKey = useCallback((key: string) => {
    setApiKeyState(key);
    
    if (key) {
      try {
        // Basic base64 encoding for minimal obfuscation
        const encodedKey = btoa(key);
        localStorage.setItem(STORAGE_KEY, encodedKey);
        console.log('API Key saved successfully');
      } catch (err) {
        console.error('Failed to save API key:', err);
      }
    } else {
      localStorage.removeItem(STORAGE_KEY);
      console.log('API Key removed');
    }
  }, []);

  const testConnection = useCallback(async (): Promise<boolean> => {
    if (!assistant) {
      console.error('No API Key - Please configure your OpenAI API key first');
      return false;
    }

    try {
      // Test with a simple request
      const testSpec = {
        openapi: '3.0.3',
        info: {
          title: 'Test API',
          version: '1.0.0'
        },
        paths: {}
      };

      const testContext = {
        spec: testSpec,
        recentChanges: ['Test connection'],
        lastModifiedSection: 'info'
      };

      // Make a minimal request to test the connection
      await assistant.analyzePotentialSuggestions(testContext);
      
      setIsConnected(true);
      setUsage(prev => ({ 
        requests: prev.requests + 1, 
        tokens: prev.tokens + 100 // Estimated tokens for test
      }));
      
      console.log('Connection successful - OpenAI API is working correctly');
      return true;
    } catch (err: any) {
      setIsConnected(false);
      
      let errorMessage = 'Unknown error occurred';
      if (err.message.includes('401')) {
        errorMessage = 'Invalid API key. Please check your OpenAI API key.';
      } else if (err.message.includes('429')) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (err.message.includes('insufficient_quota')) {
        errorMessage = 'Insufficient quota. Please check your OpenAI billing.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      console.error('Connection failed:', errorMessage);
      return false;
    }
  }, [assistant]);

  const clearUsage = useCallback(() => {
    setUsage({ requests: 0, tokens: 0 });
    localStorage.removeItem(USAGE_STORAGE_KEY);
    console.log('Usage statistics have been reset');
  }, []);

  // Track usage when making actual requests
  const trackUsage = useCallback((tokens: number) => {
    setUsage(prev => ({
      requests: prev.requests + 1,
      tokens: prev.tokens + tokens
    }));
  }, []);

  // Enhance assistant with usage tracking
  useEffect(() => {
    if (assistant) {
      const originalAnalyze = assistant.analyzePotentialSuggestions.bind(assistant);
      assistant.analyzePotentialSuggestions = async (context) => {
        const result = await originalAnalyze(context);
        trackUsage(500); // Estimated tokens per analysis
        return result;
      };
    }
  }, [assistant, trackUsage]);

  return {
    apiKey,
    isConnected,
    assistant,
    usage,
    setApiKey,
    testConnection,
    clearUsage
  };
};

export default useOpenAI;