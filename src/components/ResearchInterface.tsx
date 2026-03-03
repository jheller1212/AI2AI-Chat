import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { validateModelConfig } from '../lib/validation';
import { generateResponse } from '../lib/api/conversation';
import { supabase } from '../lib/supabase';
import type { AIModel, Message, ChatConfig } from '../types';
import { Header } from './Header';
import { ErrorDisplay } from './ErrorDisplay';
import { ChatPanel } from './ChatPanel';
import { AIConfigPanel } from './AIConfigPanel';
import { UserSettings } from './UserSettings';
import { ConversationHistory } from './ConversationHistory';

interface ResearchInterfaceProps {
  onSignOut: () => Promise<void>;
  onBack: () => void;
  user: User;
}

const STORAGE_KEY = 'ai2ai_settings';

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function ResearchInterface({ onSignOut, onBack, user }: ResearchInterfaceProps) {
  const saved = loadSettings();

  const [showSettings, setShowSettings] = useState(true);
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [model1, setModel1] = useState<AIModel>(saved?.model1 ?? 'gpt4');
  const [model2, setModel2] = useState<AIModel>(saved?.model2 ?? 'gpt4');
  const [apiKey1, setApiKey1] = useState<string>(saved?.apiKey1 ?? '');
  const [apiKey2, setApiKey2] = useState<string>(saved?.apiKey2 ?? '');
  const [orgId1, setOrgId1] = useState<string>(saved?.orgId1 ?? '');
  const [orgId2, setOrgId2] = useState<string>(saved?.orgId2 ?? '');
  const [modelVersion1, setModelVersion1] = useState<string>(saved?.modelVersion1 ?? 'gpt-4o');
  const [modelVersion2, setModelVersion2] = useState<string>(saved?.modelVersion2 ?? 'gpt-4o');
  const [temperature1, setTemperature1] = useState<number>(saved?.temperature1 ?? 0.7);
  const [temperature2, setTemperature2] = useState<number>(saved?.temperature2 ?? 0.7);
  const [maxTokens1, setMaxTokens1] = useState<number>(saved?.maxTokens1 ?? 2000);
  const [maxTokens2, setMaxTokens2] = useState<number>(saved?.maxTokens2 ?? 2000);
  const [botName1, setBotName1] = useState<string>(saved?.botName1 ?? 'AI #1');
  const [botName2, setBotName2] = useState<string>(saved?.botName2 ?? 'AI #2');
  const [systemPrompt1, setSystemPrompt1] = useState<string>(
    saved?.systemPrompt1 ?? 'You are a helpful AI assistant with expertise in science and technology.'
  );
  const [systemPrompt2, setSystemPrompt2] = useState<string>(
    saved?.systemPrompt2 ?? 'You are a creative AI assistant with expertise in arts and humanities.'
  );
  const [responseDelay, setResponseDelay] = useState<number>(saved?.responseDelay ?? 1);

  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [autoInteract, setAutoInteract] = useState(false);
  const [interactionCount, setInteractionCount] = useState(0);
  const MAX_INTERACTIONS = 5;

  // Refs so the recursive auto-interact chain reads the latest values, not stale closures
  const autoInteractRef = useRef(autoInteract);
  useEffect(() => { autoInteractRef.current = autoInteract; }, [autoInteract]);

  const pendingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cancel any pending auto-interact timeout on unmount
  useEffect(() => {
    return () => {
      if (pendingTimeoutRef.current) clearTimeout(pendingTimeoutRef.current);
    };
  }, []);

  // Persist settings to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      model1, model2, apiKey1, apiKey2, orgId1, orgId2,
      modelVersion1, modelVersion2, temperature1, temperature2,
      maxTokens1, maxTokens2, botName1, botName2,
      systemPrompt1, systemPrompt2, responseDelay
    }));
  }, [model1, model2, apiKey1, apiKey2, orgId1, orgId2,
      modelVersion1, modelVersion2, temperature1, temperature2,
      maxTokens1, maxTokens2, botName1, botName2,
      systemPrompt1, systemPrompt2, responseDelay]);

  const validateConfigs = () => {
    const e1 = validateModelConfig(model1, { apiKey: apiKey1, temperature: temperature1, maxTokens: maxTokens1 });
    const e2 = validateModelConfig(model2, { apiKey: apiKey2, temperature: temperature2, maxTokens: maxTokens2 });
    const all = [...e1, ...e2];
    setErrors(all);
    return all.length === 0;
  };

  const saveMessageToDb = (conversationId: string, msg: Message, role: string, modelLabel: string) => {
    supabase.from('messages').insert({
      conversation_id: conversationId,
      role,
      model: modelLabel,
      content: msg.content,
      word_count: msg.wordCount ?? 0,
      time_taken: msg.timeTaken ?? 0
    }).then(({ error }) => {
      if (error) console.error('Failed to save message:', error.message);
    });
  };

  const generateAIResponse = useCallback(async (
    config: ChatConfig,
    currentMessages: Message[],
    isFirstAI: boolean,
    conversationId: string | null,
    currentCount: number
  ): Promise<Message | null> => {
    try {
      const response = await generateResponse(config, currentMessages);
      setMessages(prev => [...prev, response]);

      if (conversationId) {
        saveMessageToDb(conversationId, response, 'assistant', isFirstAI ? botName1 : botName2);
      }

      // Read from ref so toggling auto-interact off mid-chain takes effect immediately
      if (autoInteractRef.current && currentCount < MAX_INTERACTIONS) {
        const otherConfig: ChatConfig = isFirstAI ? {
          model: model2, apiKey: apiKey2, orgId: orgId2,
          modelVersion: modelVersion2, temperature: temperature2,
          maxTokens: maxTokens2, systemPrompt: systemPrompt2
        } : {
          model: model1, apiKey: apiKey1, orgId: orgId1,
          modelVersion: modelVersion1, temperature: temperature1,
          maxTokens: maxTokens1, systemPrompt: systemPrompt1
        };

        pendingTimeoutRef.current = setTimeout(() => {
          setInteractionCount(currentCount + 1);
          generateAIResponse(otherConfig, [...currentMessages, response], !isFirstAI, conversationId, currentCount + 1);
        }, responseDelay * 1000);
      } else {
        setIsLoading(false);
      }

      return response;
    } catch (error) {
      const msg = error instanceof Error
        ? (error.name === 'AbortError' ? 'Request timed out. Please try again.' : error.message)
        : 'An unknown error occurred';
      setErrors([msg]);
      setIsLoading(false);
      return null;
    }
  }, [botName1, botName2, model1, model2, apiKey1, apiKey2, orgId1, orgId2,
      modelVersion1, modelVersion2, temperature1, temperature2,
      maxTokens1, maxTokens2, systemPrompt1, systemPrompt2, responseDelay]);

  const handleSendMessage = async () => {
    if (!validateConfigs() || !userInput.trim() || isLoading) return;

    // Cancel any in-flight auto-interact chain before starting a new one
    if (pendingTimeoutRef.current) {
      clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }

    const newUserMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userInput.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setUserInput('');
    setIsLoading(true);
    setInteractionCount(0);
    setErrors([]);

    // Create conversation record with title = first 80 chars of user message
    let conversationId: string | null = null;
    const { data, error: convErr } = await supabase.from('conversations').insert({
      user_id: user.id,
      title: newUserMessage.content.slice(0, 80),
      model1_type: model1, model1_version: modelVersion1,
      model1_temperature: temperature1, model1_max_tokens: maxTokens1,
      model2_type: model2, model2_version: modelVersion2,
      model2_temperature: temperature2, model2_max_tokens: maxTokens2,
      interaction_limit: MAX_INTERACTIONS
    }).select('id').single();

    if (convErr) {
      console.error('Failed to create conversation:', convErr.message);
    } else if (data) {
      conversationId = data.id;
      supabase.from('messages').insert({
        conversation_id: conversationId,
        role: 'user',
        model: 'User',
        content: newUserMessage.content,
        word_count: newUserMessage.content.split(/\s+/).filter(Boolean).length
      }).then(({ error }) => {
        if (error) console.error('Failed to save user message:', error.message);
      });
    }

    try {
      const config1: ChatConfig = {
        model: model1, apiKey: apiKey1, orgId: orgId1,
        modelVersion: modelVersion1, temperature: temperature1,
        maxTokens: maxTokens1, systemPrompt: systemPrompt1
      };

      const allMessages: Message[] = [
        { id: 'sys1', role: 'system', content: systemPrompt1, timestamp: Date.now() },
        ...messages,
        newUserMessage
      ];

      await generateAIResponse(config1, allMessages, true, conversationId, 0);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'An unknown error occurred']);
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const lines = messages.map(m => {
      const label = m.role === 'user' ? 'User' : (m.model === model1 ? botName1 : botName2);
      return `[${label}]\n${m.content}`;
    });
    const blob = new Blob([lines.join('\n\n---\n\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai2ai-conversation-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header
        onBack={onBack}
        onSignOut={onSignOut}
        onToggleSettings={() => setShowSettings(!showSettings)}
        onOpenUserSettings={() => setShowUserSettings(true)}
        onOpenHistory={() => setShowHistory(true)}
        user={user}
      />

      {showUserSettings && (
        <UserSettings user={user} onClose={() => setShowUserSettings(false)} />
      )}

      {showHistory && (
        <ConversationHistory
          userId={user.id}
          onClose={() => setShowHistory(false)}
          onLoad={(loaded) => setMessages(loaded)}
        />
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          {showSettings && (
            <div className="hidden lg:block w-96 flex-shrink-0">
              <AIConfigPanel
                title={botName1}
                onTitleChange={setBotName1}
                model={model1}
                onModelChange={setModel1}
                apiKey={apiKey1}
                onApiKeyChange={setApiKey1}
                orgId={orgId1}
                onOrgIdChange={setOrgId1}
                modelVersion={modelVersion1}
                onModelVersionChange={setModelVersion1}
                temperature={temperature1}
                onTemperatureChange={setTemperature1}
                maxTokens={maxTokens1}
                onMaxTokensChange={setMaxTokens1}
                systemPrompt={systemPrompt1}
                onSystemPromptChange={setSystemPrompt1}
              />
            </div>
          )}

          <div className="flex-1 flex flex-col gap-4 min-w-0">
            <ErrorDisplay errors={errors} onClear={() => setErrors([])} />
            <ChatPanel
              messages={messages}
              isLoading={isLoading}
              userInput={userInput}
              onUserInputChange={setUserInput}
              onSendMessage={handleSendMessage}
              autoInteract={autoInteract}
              onAutoInteractChange={setAutoInteract}
              interactionCount={interactionCount}
              maxInteractions={MAX_INTERACTIONS}
              responseDelay={responseDelay}
              onResponseDelayChange={setResponseDelay}
              onExport={messages.length > 0 ? handleExport : undefined}
              botName1={botName1}
              botName2={botName2}
              model1={model1}
            />
          </div>

          {showSettings && (
            <div className="hidden lg:block w-96 flex-shrink-0">
              <AIConfigPanel
                title={botName2}
                onTitleChange={setBotName2}
                model={model2}
                onModelChange={setModel2}
                apiKey={apiKey2}
                onApiKeyChange={setApiKey2}
                orgId={orgId2}
                onOrgIdChange={setOrgId2}
                modelVersion={modelVersion2}
                onModelVersionChange={setModelVersion2}
                temperature={temperature2}
                onTemperatureChange={setTemperature2}
                maxTokens={maxTokens2}
                onMaxTokensChange={setMaxTokens2}
                systemPrompt={systemPrompt2}
                onSystemPromptChange={setSystemPrompt2}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
