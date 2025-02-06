import React, { useState } from 'react';
import { validateModelConfig } from '../lib/validation';
import { generateResponse } from '../lib/api/conversation';
import type { AIModel, Message, ChatConfig } from '../types';
import { Header } from './Header';
import { ErrorDisplay } from './ErrorDisplay';
import { ChatPanel } from './ChatPanel';
import { AIConfigPanel } from './AIConfigPanel';

interface ResearchInterfaceProps {
  onSignOut: () => Promise<void>;
  onBack: () => void;
}

export function ResearchInterface({ onSignOut, onBack }: ResearchInterfaceProps) {
  const [showSettings, setShowSettings] = useState(true);
  const [model1, setModel1] = useState<AIModel>('gpt4');
  const [model2, setModel2] = useState<AIModel>('gpt4');
  const [apiKey1, setApiKey1] = useState('');
  const [apiKey2, setApiKey2] = useState('');
  const [orgId1, setOrgId1] = useState('');
  const [orgId2, setOrgId2] = useState('');
  const [modelVersion1, setModelVersion1] = useState('gpt-4-0125-preview');
  const [modelVersion2, setModelVersion2] = useState('gpt-4-0125-preview');
  const [temperature1, setTemperature1] = useState(0.7);
  const [temperature2, setTemperature2] = useState(0.7);
  const [maxTokens1, setMaxTokens1] = useState(2000);
  const [maxTokens2, setMaxTokens2] = useState(2000);
  const [systemPrompt1, setSystemPrompt1] = useState('You are a helpful AI assistant with expertise in science and technology.');
  const [systemPrompt2, setSystemPrompt2] = useState('You are a creative AI assistant with expertise in arts and humanities.');
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [autoInteract, setAutoInteract] = useState(false);
  const [interactionCount, setInteractionCount] = useState(0);
  const MAX_INTERACTIONS = 5;

  const validateConfigs = () => {
    const errors1 = validateModelConfig(model1, {
      apiKey: apiKey1,
      temperature: temperature1,
      maxTokens: maxTokens1
    });
    
    const errors2 = validateModelConfig(model2, {
      apiKey: apiKey2,
      temperature: temperature2,
      maxTokens: maxTokens2
    });
    
    const allErrors = [...errors1, ...errors2];
    setErrors(allErrors);
    return allErrors.length === 0;
  };

  const generateAIResponse = async (
    config: ChatConfig,
    currentMessages: Message[],
    isFirstAI: boolean
  ) => {
    try {
      const response = await generateResponse(config, currentMessages);
      setMessages(prev => [...prev, response]);
      
      if (autoInteract && interactionCount < MAX_INTERACTIONS) {
        setInteractionCount(prev => prev + 1);
        const otherConfig = isFirstAI ? {
          model: model2,
          apiKey: apiKey2,
          orgId: orgId2,
          modelVersion: modelVersion2,
          temperature: temperature2,
          maxTokens: maxTokens2,
          systemPrompt: systemPrompt2
        } : {
          model: model1,
          apiKey: apiKey1,
          orgId: orgId1,
          modelVersion: modelVersion1,
          temperature: temperature1,
          maxTokens: maxTokens1,
          systemPrompt: systemPrompt1
        };
        
        setTimeout(() => {
          generateAIResponse(otherConfig, [...currentMessages, response], !isFirstAI);
        }, 1000);
      }
      
      return response;
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'An unknown error occurred']);
      return null;
    }
  };

  const handleSendMessage = async () => {
    if (!validateConfigs() || !userInput.trim()) return;

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

    try {
      const config1: ChatConfig = {
        model: model1,
        apiKey: apiKey1,
        orgId: orgId1,
        modelVersion: modelVersion1,
        temperature: temperature1,
        maxTokens: maxTokens1,
        systemPrompt: systemPrompt1
      };

      const allMessages = [
        { id: 'system1', role: 'system' as const, content: systemPrompt1, timestamp: Date.now() },
        ...messages,
        newUserMessage
      ];

      await generateAIResponse(config1, allMessages, true);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'An unknown error occurred']);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header
        onBack={onBack}
        onSignOut={onSignOut}
        onToggleSettings={() => setShowSettings(!showSettings)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          {showSettings && (
            <div className="w-96">
              <AIConfigPanel
                title="AI #1 Configuration"
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

          <div className="flex-1 flex flex-col gap-6">
            <ErrorDisplay errors={errors} />
            <ChatPanel
              messages={messages}
              isLoading={isLoading}
              userInput={userInput}
              onUserInputChange={setUserInput}
              onSendMessage={handleSendMessage}
              autoInteract={autoInteract}
              onAutoInteractChange={setAutoInteract}
              maxInteractions={MAX_INTERACTIONS}
            />
          </div>

          {showSettings && (
            <div className="w-96">
              <AIConfigPanel
                title="AI #2 Configuration"
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