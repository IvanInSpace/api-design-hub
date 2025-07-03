import { useState, useEffect, useCallback, useRef } from 'react';
import OpenAIAssistant, { AISuggestion, AnalysisContext } from '../utils/openAIAssistant';
import * as yaml from 'js-yaml';
import { OpenAPISpec } from '../types/openapi';
import { useNotifications } from '../components/Common/Notifications/NotificationProvider';

interface UseAISuggestionsOptions {
  debounceMs?: number;
  maxSuggestions?: number;
  enableAutoAnalysis?: boolean;
  assistant?: OpenAIAssistant | null;
}

interface UseAISuggestionsReturn {
  suggestions: AISuggestion[];
  isAnalyzing: boolean;
  acceptSuggestion: (suggestion: AISuggestion) => void;
  rejectSuggestion: (suggestionId: string) => void;
  refreshSuggestions: () => void;
  clearAllSuggestions: () => void;
  analyzeManually: () => void; // Новый метод для ручного анализа
}

export const useAISuggestions = (
  yamlContent: string,
  onYamlChange: (newContent: string) => void,
  options: UseAISuggestionsOptions = {}
): UseAISuggestionsReturn => {
  const {
    debounceMs = 1000,
    maxSuggestions = 10,
    enableAutoAnalysis = false, // Изменили с true на false
    assistant
  } = options;

  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [rejectedSuggestionIds, setRejectedSuggestionIds] = useState<Set<string>>(new Set());
  const { warning } = useNotifications();
  
  const previousYamlRef = useRef<string>('');
  const analysisTimeoutRef = useRef<NodeJS.Timeout>();

  // Функция для анализа и генерации предложений
  const analyzeSuggestions = useCallback(async () => {
    if (!yamlContent.trim()) {
      setSuggestions([]);
      return;
    }

    if (!assistant) {
      warning('AI Assistant not configured', 'Please configure your OpenAI API key to get intelligent suggestions');
      setSuggestions([]);
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const spec = yaml.load(yamlContent) as OpenAPISpec;
      const recentChanges = OpenAIAssistant.detectRecentChanges(
        previousYamlRef.current,
        yamlContent
      );

      const context: AnalysisContext = {
        spec,
        recentChanges,
        lastModifiedSection: recentChanges[recentChanges.length - 1]
      };

      const newSuggestions = await assistant.analyzePotentialSuggestions(context);
      
      // Фильтруем отклоненные предложения и ограничиваем количество
      const filteredSuggestions = newSuggestions
        .filter(s => !rejectedSuggestionIds.has(s.id))
        .slice(0, maxSuggestions);

      setSuggestions(filteredSuggestions);
      previousYamlRef.current = yamlContent;
      
    } catch (error: any) {
      console.error('Error analyzing suggestions:', error);
      setSuggestions([]);
      
      if (error.message?.includes('API key')) {
        warning('OpenAI API Error', 'Please check your API key configuration');
      } else if (error.message?.includes('quota')) {
        warning('OpenAI Quota Exceeded', 'You have reached your OpenAI usage limit');
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [yamlContent, rejectedSuggestionIds, maxSuggestions, assistant, warning]);

  // Debounced анализ при изменении YAML
  useEffect(() => {
    if (!enableAutoAnalysis) return;

    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }

    analysisTimeoutRef.current = setTimeout(() => {
      analyzeSuggestions();
    }, debounceMs);

    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, [yamlContent, analyzeSuggestions, debounceMs, enableAutoAnalysis]);

  // Принять предложение
  const acceptSuggestion = useCallback((suggestion: AISuggestion) => {
    try {
      const newContent = applySuggestionToYaml(yamlContent, suggestion);
      onYamlChange(newContent);
      
      // Удаляем принятое предложение из списка
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
      
      // Добавляем в список отклоненных, чтобы не предлагать снова
      setRejectedSuggestionIds(prev => new Set([...prev, suggestion.id]));
      
    } catch (error) {
      console.error('Error applying suggestion:', error);
    }
  }, [yamlContent, onYamlChange]);

  // Отклонить предложение
  const rejectSuggestion = useCallback((suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    setRejectedSuggestionIds(prev => new Set([...prev, suggestionId]));
  }, []);

  // Принудительно обновить предложения
  const refreshSuggestions = useCallback(() => {
    setRejectedSuggestionIds(new Set());
    analyzeSuggestions();
  }, [analyzeSuggestions]);

  // Очистить все предложения
  const clearAllSuggestions = useCallback(() => {
    setSuggestions([]);
    setRejectedSuggestionIds(new Set());
  }, []);

  // Ручной анализ
  const analyzeManually = useCallback(() => {
    analyzeSuggestions();
  }, [analyzeSuggestions]);

  return {
    suggestions,
    isAnalyzing,
    acceptSuggestion,
    rejectSuggestion,
    refreshSuggestions,
    clearAllSuggestions,
    analyzeManually
  };
};

// Функция для применения предложения к YAML
function applySuggestionToYaml(yamlContent: string, suggestion: AISuggestion): string {
  try {
    const spec = yaml.load(yamlContent) as OpenAPISpec;
    const { insertPosition, yamlContent: suggestionYaml } = suggestion;
    
    // Парсим предложенный YAML
    const suggestionData = yaml.load(suggestionYaml);
    
    // Применяем предложение по пути
    const pathParts = insertPosition.path;
    let current: any = spec;
    
    // Навигируем к родительскому объекту
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
    
    // Вставляем или обновляем данные
    const lastPart = pathParts[pathParts.length - 1];
    
    if (suggestion.type === 'path' && typeof suggestionData === 'object') {
      // Для путей, добавляем все ключи из предложения
      Object.assign(current, suggestionData);
    } else if (suggestion.type === 'operation') {
      // Для операций, добавляем операцию к существующему пути
      if (!current[lastPart]) {
        current[lastPart] = {};
      }
      const operationData = suggestionData as any;
      Object.assign(current[lastPart], operationData);
    } else {
      // Для остальных типов, просто заменяем или создаем
      current[lastPart] = suggestionData;
    }
    
    // Конвертируем обратно в YAML
    return yaml.dump(spec, {
      indent: 2,
      lineWidth: 120,
      noRefs: true,
      sortKeys: false
    });
    
  } catch (error) {
    console.error('Error applying suggestion to YAML:', error);
    throw new Error('Failed to apply suggestion to YAML content');
  }
}

export default useAISuggestions;