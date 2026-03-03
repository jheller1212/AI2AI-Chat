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
  const [delayVariance, setDelayVariance] = useState<boolean>(saved?.delayVariance ?? false);
  const [maxInteractions, setMaxInteractions] = useState<number>(saved?.maxInteractions ?? 10);
  const [repetitionCount, setRepetitionCount] = useState<number>(saved?.repetitionCount ?? 1);
  const [bubbleColor1, setBubbleColor1] = useState<string>(saved?.bubbleColor1 ?? '#EEF2FF');
  const [bubbleColor2, setBubbleColor2] = useState<string>(saved?.bubbleColor2 ?? '#ECFDF5');
  const [textColor1, setTextColor1] = useState<string>(saved?.textColor1 ?? '#312E81');
  const [textColor2, setTextColor2] = useState<string>(saved?.textColor2 ?? '#064E3B');

  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [autoInteract, setAutoInteract] = useState(saved?.autoInteract ?? true);
  const [interactionCount, setInteractionCount] = useState(0);
  const [repetitionCurrent, setRepetitionCurrent] = useState(0);

  // Refs so async callbacks always read the latest values
  const autoInteractRef = useRef(autoInteract);
  const maxInteractionsRef = useRef(maxInteractions);
  const responseDelayRef = useRef(responseDelay);
  const delayVarianceRef = useRef(delayVariance);
  const repetitionCountRef = useRef(repetitionCount);
  const repetitionCurrentRef = useRef(0);
  const initialChainRef = useRef<{ userMsg: string; allMessages: Message[]; localConversationId: string } | null>(null);
  const pendingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isStoppedRef = useRef(false);

  useEffect(() => { autoInteractRef.current = autoInteract; }, [autoInteract]);
  useEffect(() => { maxInteractionsRef.current = maxInteractions; }, [maxInteractions]);
  useEffect(() => { responseDelayRef.current = responseDelay; }, [responseDelay]);
  useEffect(() => { delayVarianceRef.current = delayVariance; }, [delayVariance]);
  useEffect(() => { repetitionCountRef.current = repetitionCount; }, [repetitionCount]);

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
      systemPrompt1, systemPrompt2, responseDelay, delayVariance,
      autoInteract, maxInteractions, repetitionCount,
      bubbleColor1, bubbleColor2, textColor1, textColor2
    }));
  }, [model1, model2, apiKey1, apiKey2, orgId1, orgId2,
      modelVersion1, modelVersion2, temperature1, temperature2,
      maxTokens1, maxTokens2, botName1, botName2,
      systemPrompt1, systemPrompt2, responseDelay, delayVariance,
      autoInteract, maxInteractions, repetitionCount,
      bubbleColor1, bubbleColor2, textColor1, textColor2]);

  const validateConfigs = () => {
    const e1 = validateModelConfig(model1, { apiKey: apiKey1, temperature: temperature1, maxTokens: maxTokens1 });
    const e2 = validateModelConfig(model2, { apiKey: apiKey2, temperature: temperature2, maxTokens: maxTokens2 });
    const all = [...e1, ...e2];
    setErrors(all);
    return all.length === 0;
  };

  const saveMessageToDb = (conversationId: string, msg: Message, role: string, modelLabel: string) => {
    if (msg.hidden) return;
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

  const createConversationRecord = async (title: string, id: string) => {
    const { data, error } = await supabase.from('conversations').insert({
      id,
      user_id: user.id,
      title: title.slice(0, 80) || '(Auto-started conversation)',
      model1_type: model1, model1_version: modelVersion1,
      model1_temperature: temperature1, model1_max_tokens: maxTokens1,
      model2_type: model2, model2_version: modelVersion2,
      model2_temperature: temperature2, model2_max_tokens: maxTokens2,
      interaction_limit: maxInteractionsRef.current
    }).select('id').single();

    if (error) {
      console.error('Failed to create conversation:', error.message);
      setErrors(prev => [...prev, `History unavailable: ${error.message}`]);
      return null;
    }
    return data?.id ?? null;
  };

  const generateAIResponse = useCallback(async (
    config: ChatConfig,
    currentMessages: Message[],
    isFirstAI: boolean,
    dbConversationId: string | null,
    localConversationId: string,
    currentCount: number,
    onChainComplete: () => void
  ): Promise<void> => {
    try {
      const myBotIndex: 1 | 2 = isFirstAI ? 1 : 2;

      // Remap roles from this bot's perspective:
      // - This bot's own previous messages stay as 'assistant'
      // - The other bot's messages become 'user' (it is speaking TO this bot)
      // This ensures the conversation always ends with a 'user' message for APIs
      // that require strict user/assistant alternation (e.g. Anthropic Claude).
      const remappedMessages = currentMessages.map(m => {
        if (m.role !== 'assistant') return m;
        return { ...m, role: (m.botIndex === myBotIndex ? 'assistant' : 'user') as const };
      });

      const response = await generateResponse(config, remappedMessages);
      const taggedResponse: Message = {
        ...response,
        botIndex: myBotIndex,
        modelVersion: config.modelVersion,
        temperature: config.temperature,
        systemPrompt: config.systemPrompt,
        conversationId: localConversationId,
      };

      setMessages(prev => [...prev, taggedResponse]);

      if (dbConversationId) {
        saveMessageToDb(dbConversationId, taggedResponse, 'assistant', isFirstAI ? botName1 : botName2);
      }

      if (autoInteractRef.current && currentCount < maxInteractionsRef.current - 1 && !isStoppedRef.current) {
        const otherConfig: ChatConfig = isFirstAI ? {
          model: model2, apiKey: apiKey2, orgId: orgId2,
          modelVersion: modelVersion2, temperature: temperature2,
          maxTokens: maxTokens2, systemPrompt: systemPrompt2
        } : {
          model: model1, apiKey: apiKey1, orgId: orgId1,
          modelVersion: modelVersion1, temperature: temperature1,
          maxTokens: maxTokens1, systemPrompt: systemPrompt1
        };

        // Calculate delay: base + optional length-based variance (reading time estimate)
        const prevWords = taggedResponse.wordCount ?? 0;
        const computedDelay = delayVarianceRef.current
          ? (responseDelayRef.current + prevWords * 0.05) * 1000
          : responseDelayRef.current * 1000;

        pendingTimeoutRef.current = setTimeout(() => {
          setInteractionCount(currentCount + 1);
          // Pass original currentMessages + tagged response; remapping happens at next call
          generateAIResponse(otherConfig, [...currentMessages, taggedResponse], !isFirstAI, dbConversationId, localConversationId, currentCount + 1, onChainComplete);
        }, computedDelay);
      } else {
        onChainComplete();
      }
    } catch (error) {
      const msg = error instanceof Error
        ? (error.name === 'AbortError' ? 'Request timed out. Please try again.' : error.message)
        : 'An unknown error occurred';
      setErrors([msg]);
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botName1, botName2, model1, model2, apiKey1, apiKey2, orgId1, orgId2,
      modelVersion1, modelVersion2, temperature1, temperature2,
      maxTokens1, maxTokens2, systemPrompt1, systemPrompt2]);

  const startChain = useCallback(async (
    userMsg: string,
    baseMessages: Message[],
    repetitionIndex: number,
    localConversationId: string
  ) => {
    const dbConversationId = await createConversationRecord(userMsg, localConversationId);

    if (userMsg && dbConversationId) {
      const userMessage = baseMessages.find(m => m.role === 'user' && !m.hidden && m.content === userMsg);
      if (userMessage) {
        supabase.from('messages').insert({
          conversation_id: dbConversationId,
          role: 'user',
          model: 'User',
          content: userMsg,
          word_count: userMsg.split(/\s+/).filter(Boolean).length
        }).then(({ error }) => {
          if (error) console.error('Failed to save user message:', error.message);
        });
      }
    }

    const config1: ChatConfig = {
      model: model1, apiKey: apiKey1, orgId: orgId1,
      modelVersion: modelVersion1, temperature: temperature1,
      maxTokens: maxTokens1, systemPrompt: systemPrompt1
    };

    const onChainComplete = () => {
      const nextRepetition = repetitionIndex + 1;
      if (nextRepetition < repetitionCountRef.current) {
        repetitionCurrentRef.current = nextRepetition;
        setRepetitionCurrent(nextRepetition);
        setInteractionCount(0);
        // Short pause between repetitions, then start next chain
        pendingTimeoutRef.current = setTimeout(() => {
          if (initialChainRef.current) {
            // Each repetition gets its own UUID so DB records and CSV rows are
            // correctly grouped — reusing the same ID would cause a duplicate-key
            // error on Supabase and make repetitions indistinguishable in exports.
            startChain(initialChainRef.current.userMsg, initialChainRef.current.allMessages, nextRepetition, crypto.randomUUID());
          }
        }, 1500);
      } else {
        setIsLoading(false);
        setRepetitionCurrent(0);
        repetitionCurrentRef.current = 0;
      }
    };

    await generateAIResponse(config1, baseMessages, true, dbConversationId, localConversationId, 0, onChainComplete);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model1, model2, apiKey1, apiKey2, orgId1, orgId2,
      modelVersion1, modelVersion2, temperature1, temperature2,
      maxTokens1, maxTokens2, systemPrompt1, systemPrompt2, generateAIResponse]);

  const handleSendMessage = async () => {
    if (!validateConfigs() || isLoading) return;

    if (pendingTimeoutRef.current) {
      clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }

    const trimmed = userInput.trim();

    // If no opening message, inject a hidden synthetic user message so the API has a valid turn
    const newUserMessage: Message = trimmed
      ? { id: crypto.randomUUID(), role: 'user', content: trimmed, timestamp: Date.now() }
      : { id: crypto.randomUUID(), role: 'user', content: 'Please begin the conversation based on your instructions.', timestamp: Date.now(), hidden: true };

    isStoppedRef.current = false;
    setMessages(prev => [...prev, newUserMessage]);
    setUserInput('');
    setIsLoading(true);
    setInteractionCount(0);
    setRepetitionCurrent(0);
    repetitionCurrentRef.current = 0;
    setErrors([]);

    const allMessages: Message[] = [
      { id: 'sys1', role: 'system', content: systemPrompt1, timestamp: Date.now() },
      ...messages,
      newUserMessage
    ];

    const localConversationId = crypto.randomUUID();
    initialChainRef.current = { userMsg: trimmed, allMessages, localConversationId };

    try {
      await startChain(trimmed, allMessages, 0, localConversationId);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'An unknown error occurred']);
      setIsLoading(false);
    }
  };

  const handleStop = () => {
    isStoppedRef.current = true;
    if (pendingTimeoutRef.current) {
      clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }
    // isLoading will be set to false once the in-flight request resolves
  };

  const handleResetChat = () => {
    isStoppedRef.current = false;
    if (pendingTimeoutRef.current) {
      clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }
    setMessages([]);
    setInteractionCount(0);
    setRepetitionCurrent(0);
    repetitionCurrentRef.current = 0;
    setIsLoading(false);
    setErrors([]);
    initialChainRef.current = null;
  };

  const handleExportTxt = () => {
    const lines = messages
      .filter(m => m.role !== 'system' && !m.hidden)
      .map(m => {
        const label = m.role === 'user' ? 'User' : (m.botIndex === 1 ? botName1 : botName2);
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

  const handleExportCsv = () => {
    // Always wrap every field in double-quotes and escape inner quotes as "".
    // Also neutralise formula-injection characters (=, +, -, @) that spreadsheet
    // apps evaluate when they appear at the start of an unquoted cell value.
    const csvField = (val: string) => {
      let s = String(val);
      if (s.match(/^[=+\-@]/)) s = `'${s}`; // prefix to prevent formula execution
      return `"${s.replace(/"/g, '""')}"`;
    };

    const rows = [['conversation_id', 'timestamp', 'sender', 'prompt', 'model', 'temperature', 'role', 'content', 'words', 'response_time_ms']];
    messages
      .filter(m => m.role !== 'system' && !m.hidden)
      .forEach(m => {
        const label = m.role === 'user' ? 'User' : (m.botIndex === 1 ? botName1 : botName2);
        const fallbackPrompt = m.botIndex === 1 ? systemPrompt1 : m.botIndex === 2 ? systemPrompt2 : '';
        const fallbackModel = m.botIndex === 1 ? modelVersion1 : m.botIndex === 2 ? modelVersion2 : '';
        const fallbackTemp = m.botIndex === 1 ? temperature1 : m.botIndex === 2 ? temperature2 : '';
        rows.push([
          csvField(m.conversationId ?? ''),
          csvField(new Date(m.timestamp).toISOString()),
          csvField(label),
          csvField(m.systemPrompt ?? fallbackPrompt),
          csvField(m.modelVersion ?? fallbackModel),
          csvField(String(m.temperature ?? fallbackTemp)),
          csvField(m.role),
          csvField(m.content),
          csvField(String(m.wordCount ?? '')),
          csvField(String(m.timeTaken ?? ''))
        ]);
      });
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai2ai-conversation-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      <Header
        onBack={onBack}
        onSignOut={onSignOut}
        onToggleSettings={() => setShowSettings(!showSettings)}
        onOpenUserSettings={() => setShowUserSettings(true)}
        onOpenHistory={() => setShowHistory(true)}
        user={user}
      />

      {showUserSettings && (
        <UserSettings
          user={user}
          onClose={() => setShowUserSettings(false)}
          onOpenHistory={() => { setShowUserSettings(false); setShowHistory(true); }}
        />
      )}

      {showHistory && (
        <ConversationHistory
          userId={user.id}
          onClose={() => setShowHistory(false)}
          onLoad={(loaded) => setMessages(loaded)}
        />
      )}

      <main className="flex-1 min-h-0 w-full px-4 sm:px-6 lg:px-8 py-6 overflow-hidden">
        <div className="flex gap-4 h-full min-h-0">
          {showSettings && (
            <div className="hidden lg:flex lg:flex-col w-88 flex-shrink-0 overflow-y-auto" style={{ width: '22rem' }}>
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
                bubbleColor={bubbleColor1}
                onBubbleColorChange={setBubbleColor1}
                textColor={textColor1}
                onTextColorChange={setTextColor1}
              />
            </div>
          )}

          <div className="flex-1 flex flex-col gap-3 min-w-0 min-h-0">
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
              maxInteractions={maxInteractions}
              onMaxInteractionsChange={setMaxInteractions}
              responseDelay={responseDelay}
              onResponseDelayChange={setResponseDelay}
              delayVariance={delayVariance}
              onDelayVarianceChange={setDelayVariance}
              repetitionCount={repetitionCount}
              onRepetitionCountChange={setRepetitionCount}
              repetitionCurrent={repetitionCurrent}
              onExportTxt={messages.filter(m => !m.hidden && m.role !== 'system').length > 0 ? handleExportTxt : undefined}
              onExportCsv={messages.filter(m => !m.hidden && m.role !== 'system').length > 0 ? handleExportCsv : undefined}
              onResetChat={messages.length > 0 ? handleResetChat : undefined}
              onStop={isLoading ? handleStop : undefined}
              botName1={botName1}
              botName2={botName2}
              bubbleColor1={bubbleColor1}
              bubbleColor2={bubbleColor2}
              textColor1={textColor1}
              textColor2={textColor2}
            />
          </div>

          {showSettings && (
            <div className="hidden lg:flex lg:flex-col flex-shrink-0 overflow-y-auto" style={{ width: '22rem' }}>
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
                bubbleColor={bubbleColor2}
                onBubbleColorChange={setBubbleColor2}
                textColor={textColor2}
                onTextColorChange={setTextColor2}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
