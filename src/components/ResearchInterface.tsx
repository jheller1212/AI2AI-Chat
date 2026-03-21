import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { validateModelConfig } from '../lib/validation';
import { generateResponse } from '../lib/api/conversation';
import { supabase } from '../lib/supabase';
import { loadVault } from '../lib/apiKeyVault';
import { hashString } from '../lib/hash';
import type { AIModel, Message, ChatConfig } from '../types';
import { X } from 'lucide-react';
import { Header } from './Header';
import { ErrorDisplay } from './ErrorDisplay';
import { ChatPanel } from './ChatPanel';
import { ScenarioCards } from './ScenarioCards';
import type { Scenario } from './ScenarioCards';
import { AIConfigPanel } from './AIConfigPanel';
import { UserSettings } from './UserSettings';
import { ConversationHistory } from './ConversationHistory';
import { ExperimentsPanel, type Experiment } from './ExperimentsPanel';
import { OnboardingTour, shouldAutoShowTour, incrementTourCount, resetTourDismissed } from './OnboardingTour';

import { WorkshopBanner } from './WorkshopBanner';
import { WorkshopAdmin } from './WorkshopAdmin';
import { AdminDashboard } from './AdminDashboard';
import type { WorkshopData } from '../App';

interface ResearchInterfaceProps {
  onSignOut: () => Promise<void>;
  onBack: () => void;
  user: User;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  // SPEC-02: participant/session context from URL params
  sessionId?: string;
  conditionLabel?: string;
  // SPEC-06: pre-parsed shared config payload from ?cfg= URL param
  sharedConfig?: Record<string, unknown>;
  workshopData?: WorkshopData | null;
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

// Helper to safely pull a string out of a sharedConfig object.
function sc(cfg: Record<string, unknown> | undefined, key: string): string | undefined {
  const v = cfg?.[key];
  return typeof v === 'string' ? v : undefined;
}
function scNum(cfg: Record<string, unknown> | undefined, key: string): number | undefined {
  const v = cfg?.[key];
  return typeof v === 'number' ? v : undefined;
}
function scBool(cfg: Record<string, unknown> | undefined, key: string): boolean | undefined {
  const v = cfg?.[key];
  return typeof v === 'boolean' ? v : undefined;
}

export function ResearchInterface({
  onSignOut, onBack, user, isDarkMode, onToggleDarkMode,
  sessionId, conditionLabel, sharedConfig, workshopData,
}: ResearchInterfaceProps) {
  const saved = loadSettings();

  const [showSettings, setShowSettings] = useState(true);
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showExperiments, setShowExperiments] = useState(false);
  const [showWorkshopAdmin, setShowWorkshopAdmin] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [showTour, setShowTour] = useState(() => {
    const show = shouldAutoShowTour();
    if (show) incrementTourCount();
    return show;
  });

  // SPEC-01: currently loaded experiment
  const [currentExperimentId, setCurrentExperimentId] = useState<string | null>(null);
  const [currentExperimentName, setCurrentExperimentName] = useState<string>('');

  // SPEC-01: save experiment dialog state
  const [showSaveExperiment, setShowSaveExperiment] = useState(false);
  const [saveExpName, setSaveExpName] = useState('');
  const [saveExpCondition, setSaveExpCondition] = useState('');
  const [saveExpDesc, setSaveExpDesc] = useState('');
  const [savingExp, setSavingExp] = useState(false);

  // Bot configs — sharedConfig (from URL) overrides saved (localStorage).
  const [model1, setModel1] = useState<AIModel>((sc(sharedConfig, 'm1') as AIModel) ?? saved?.model1 ?? 'gpt4');
  const [model2, setModel2] = useState<AIModel>((sc(sharedConfig, 'm2') as AIModel) ?? saved?.model2 ?? 'gpt4');
  const [apiKey1, setApiKey1] = useState<string>(() => {
    if (saved?.apiKey1) return saved.apiKey1;
    return loadVault()[saved?.model1 ?? 'gpt4'] ?? '';
  });
  const [apiKey2, setApiKey2] = useState<string>(() => {
    if (saved?.apiKey2) return saved.apiKey2;
    return loadVault()[saved?.model2 ?? 'gpt4'] ?? '';
  });
  const [orgId1, setOrgId1] = useState<string>(saved?.orgId1 ?? '');
  const [orgId2, setOrgId2] = useState<string>(saved?.orgId2 ?? '');
  const [modelVersion1, setModelVersion1] = useState<string>(sc(sharedConfig, 'mv1') ?? saved?.modelVersion1 ?? 'gpt-4o');
  const [modelVersion2, setModelVersion2] = useState<string>(sc(sharedConfig, 'mv2') ?? saved?.modelVersion2 ?? 'gpt-4o');
  const [temperature1, setTemperature1] = useState<number>(scNum(sharedConfig, 't1') ?? saved?.temperature1 ?? 0.7);
  const [temperature2, setTemperature2] = useState<number>(scNum(sharedConfig, 't2') ?? saved?.temperature2 ?? 0.7);
  const [maxTokens1, setMaxTokens1] = useState<number>(scNum(sharedConfig, 'mt1') ?? saved?.maxTokens1 ?? 2000);
  const [maxTokens2, setMaxTokens2] = useState<number>(scNum(sharedConfig, 'mt2') ?? saved?.maxTokens2 ?? 2000);
  const [botName1, setBotName1] = useState<string>(sc(sharedConfig, 'n1') ?? saved?.botName1 ?? 'AI #1');
  const [botName2, setBotName2] = useState<string>(sc(sharedConfig, 'n2') ?? saved?.botName2 ?? 'AI #2');
  const [systemPrompt1, setSystemPrompt1] = useState<string>(
    sc(sharedConfig, 'sp1') ?? saved?.systemPrompt1 ?? 'You are a helpful AI assistant with expertise in science and technology.'
  );
  const [systemPrompt2, setSystemPrompt2] = useState<string>(
    sc(sharedConfig, 'sp2') ?? saved?.systemPrompt2 ?? 'You are a creative AI assistant with expertise in arts and humanities.'
  );
  const [responseDelay, setResponseDelay] = useState<number>(scNum(sharedConfig, 'rd') ?? saved?.responseDelay ?? 1);
  const [delayVariance, setDelayVariance] = useState<boolean>(scBool(sharedConfig, 'dv') ?? saved?.delayVariance ?? false);
  const [maxInteractions, setMaxInteractions] = useState<number>(scNum(sharedConfig, 'mi') ?? saved?.maxInteractions ?? 10);
  const [repetitionCount, setRepetitionCount] = useState<number>(scNum(sharedConfig, 'rc') ?? saved?.repetitionCount ?? 1);
  const [bubbleColor1, setBubbleColor1] = useState<string>(sc(sharedConfig, 'bc1') ?? saved?.bubbleColor1 ?? '#EEF2FF');
  const [bubbleColor2, setBubbleColor2] = useState<string>(sc(sharedConfig, 'bc2') ?? saved?.bubbleColor2 ?? '#ECFDF5');
  const [textColor1, setTextColor1] = useState<string>(sc(sharedConfig, 'tc1') ?? saved?.textColor1 ?? '#312E81');
  const [textColor2, setTextColor2] = useState<string>(sc(sharedConfig, 'tc2') ?? saved?.textColor2 ?? '#064E3B');

  // SPEC-03: role asymmetry
  const [botMode, setBotMode] = useState<'symmetric' | 'asymmetric'>(
    (sc(sharedConfig, 'bm') as 'symmetric' | 'asymmetric') ?? saved?.botMode ?? 'symmetric'
  );
  const [openingMessage, setOpeningMessage] = useState<string>(sc(sharedConfig, 'om') ?? saved?.openingMessage ?? '');

  // SPEC-04: keyword stopping
  const [stopKeywords, setStopKeywords] = useState<string>(sc(sharedConfig, 'sk') ?? saved?.stopKeywords ?? '');

  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [autoInteract, setAutoInteract] = useState(saved?.autoInteract ?? true);
  const [saveHistory, setSaveHistory] = useState<boolean>(saved?.saveHistory ?? true);
  const [interactionCount, setInteractionCount] = useState(0);
  const [repetitionCurrent, setRepetitionCurrent] = useState(0);

  // SPEC-04: track stopping trigger per conversation (conversationId → trigger string)
  const [stoppingTriggers, setStoppingTriggers] = useState<Record<string, string>>({});

  // Check if user is a workshop organizer (server-side only)
  useEffect(() => {
    const checkOrganizer = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const resp = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/workshop-config`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ action: 'check-organizer' }),
          }
        );
        if (resp.ok) {
          const result = await resp.json();
          if (result?.isOrganizer) setIsOrganizer(true);
        }
      } catch { /* ignore */ }
    };
    checkOrganizer();
  }, [user.email]);

  // Workshop mode: apply scenario and model config on mount
  const workshopAppliedRef = useRef(false);
  useEffect(() => {
    if (!workshopData || workshopAppliedRef.current) return;
    workshopAppliedRef.current = true;

    if (workshopData.scenario) {
      const s = workshopData.scenario;
      if (s.botAPrompt) setSystemPrompt1(s.botAPrompt);
      if (s.botBPrompt) setSystemPrompt2(s.botBPrompt);
      if (s.sharedPrompt) setUserInput(s.sharedPrompt);
      if (s.stopKeywords) setStopKeywords(s.stopKeywords);
      if (s.botMode) setBotMode(s.botMode);
    }

    // Apply model config overrides if provided
    if (workshopData.config) {
      const c = workshopData.config;
      if (c.m1) setModel1(c.m1 as AIModel);
      if (c.m2) setModel2(c.m2 as AIModel);
      if (c.mv1) setModelVersion1(c.mv1 as string);
      if (c.mv2) setModelVersion2(c.mv2 as string);
      if (typeof c.t1 === 'number') setTemperature1(c.t1);
      if (typeof c.t2 === 'number') setTemperature2(c.t2);
      if (c.n1) setBotName1(c.n1 as string);
      if (c.n2) setBotName2(c.n2 as string);
    }

    // Set both bot API keys to the workshop key
    if (workshopData.apiKey) {
      setApiKey1(workshopData.apiKey);
      setApiKey2(workshopData.apiKey);
    }
  }, [workshopData]);

  // SPEC-06: share-link copied toast
  const [shareCopied, setShareCopied] = useState(false);

  // Refs so async callbacks always read the latest values
  const autoInteractRef = useRef(autoInteract);
  const maxInteractionsRef = useRef(maxInteractions);
  const responseDelayRef = useRef(responseDelay);
  const delayVarianceRef = useRef(delayVariance);
  const repetitionCountRef = useRef(repetitionCount);
  const repetitionCurrentRef = useRef(0);
  const stopKeywordsRef = useRef(stopKeywords);
  const initialChainRef = useRef<{
    userMsg: string;
    allMessages: Message[];
    localConversationId: string;
    bot1StartsFirst: boolean;
  } | null>(null);
  const pendingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isStoppedRef = useRef(false);

  useEffect(() => { autoInteractRef.current = autoInteract; }, [autoInteract]);
  useEffect(() => { maxInteractionsRef.current = maxInteractions; }, [maxInteractions]);
  useEffect(() => { responseDelayRef.current = responseDelay; }, [responseDelay]);
  useEffect(() => { delayVarianceRef.current = delayVariance; }, [delayVariance]);
  useEffect(() => { repetitionCountRef.current = repetitionCount; }, [repetitionCount]);
  useEffect(() => { stopKeywordsRef.current = stopKeywords; }, [stopKeywords]);

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
      autoInteract, maxInteractions, repetitionCount, saveHistory,
      bubbleColor1, bubbleColor2, textColor1, textColor2,
      botMode, openingMessage, stopKeywords,
    }));
  }, [model1, model2, apiKey1, apiKey2, orgId1, orgId2,
      modelVersion1, modelVersion2, temperature1, temperature2,
      maxTokens1, maxTokens2, botName1, botName2,
      systemPrompt1, systemPrompt2, responseDelay, delayVariance,
      autoInteract, maxInteractions, repetitionCount, saveHistory,
      bubbleColor1, bubbleColor2, textColor1, textColor2,
      botMode, openingMessage, stopKeywords]);

  const validateConfigs = () => {
    const e1 = validateModelConfig(model1, { apiKey: apiKey1, temperature: temperature1, maxTokens: maxTokens1 });
    const e2 = validateModelConfig(model2, { apiKey: apiKey2, temperature: temperature2, maxTokens: maxTokens2 });
    const all = [...e1, ...e2];
    setErrors(all);
    return all.length === 0;
  };

  const saveMessageToDb = (conversationId: string, msg: Message, role: string, modelLabel: string) => {
    if (msg.hidden || !saveHistory) return;
    supabase.from('messages').insert({
      conversation_id: conversationId,
      role,
      model: modelLabel,
      content: msg.content,
      word_count: msg.wordCount ?? 0,
      time_taken: msg.timeTaken ?? 0
    });
  };

  const createConversationRecord = async (title: string, id: string) => {
    if (!saveHistory) return id;
    const row: Record<string, unknown> = {
      id,
      user_id: user.id,
      title: title.slice(0, 80) || '(Auto-started conversation)',
      model1_type: model1, model1_version: modelVersion1,
      model1_temperature: temperature1, model1_max_tokens: maxTokens1,
      model2_type: model2, model2_version: modelVersion2,
      model2_temperature: temperature2, model2_max_tokens: maxTokens2,
      interaction_limit: maxInteractionsRef.current,
    };
    if (currentExperimentId) row.experiment_id = currentExperimentId;
    const { data, error } = await supabase.from('conversations').insert(row).select('id').single();

    if (error) {
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
    repetitionIndex: number,
    onChainComplete: (trigger: string) => void
  ): Promise<void> => {
    try {
      const myBotIndex: 1 | 2 = isFirstAI ? 1 : 2;

      // Remap roles from this bot's perspective:
      // - Own previous messages stay as 'assistant'
      // - The other bot's messages become 'user'
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
        repetitionNumber: repetitionIndex,
      };

      setMessages(prev => [...prev, taggedResponse]);

      if (dbConversationId) {
        saveMessageToDb(dbConversationId, taggedResponse, 'assistant', isFirstAI ? botName1 : botName2);
      }

      // SPEC-04: check stop keywords before scheduling next turn
      const keywords = stopKeywordsRef.current
        .split(',')
        .map(k => k.trim())
        .filter(Boolean);
      if (keywords.length > 0 && !isStoppedRef.current) {
        const lower = taggedResponse.content.toLowerCase();
        const matched = keywords.find(k => lower.includes(k.toLowerCase()));
        if (matched) {
          setStoppingTriggers(prev => ({ ...prev, [localConversationId]: `keyword:${matched}` }));
          onChainComplete(`keyword:${matched}`);
          return;
        }
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

        const prevWords = taggedResponse.wordCount ?? 0;
        const computedDelay = delayVarianceRef.current
          ? (responseDelayRef.current + prevWords * 0.05) * 1000
          : responseDelayRef.current * 1000;

        pendingTimeoutRef.current = setTimeout(() => {
          setInteractionCount(currentCount + 1);
          generateAIResponse(
            otherConfig, [...currentMessages, taggedResponse], !isFirstAI,
            dbConversationId, localConversationId, currentCount + 1, repetitionIndex, onChainComplete
          );
        }, computedDelay);
      } else {
        setStoppingTriggers(prev => ({ ...prev, [localConversationId]: 'turn_count' }));
        onChainComplete('turn_count');
      }
    } catch (error) {
      let msg = error instanceof Error
        ? (error.name === 'AbortError' ? 'Request timed out. Please try again.' : error.message)
        : 'An unknown error occurred';
      if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('network')) {
        msg += ' — Troubleshooting: (1) Is your API key copied correctly and complete? (2) Is the key still active and not expired? (3) Does your API account have available credits? (4) Check your browser console for CORS errors.';
      }
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
    localConversationId: string,
    bot1StartsFirst: boolean
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
        });
      }
    }

    const config1: ChatConfig = {
      model: model1, apiKey: apiKey1, orgId: orgId1,
      modelVersion: modelVersion1, temperature: temperature1,
      maxTokens: maxTokens1, systemPrompt: systemPrompt1
    };
    const config2: ChatConfig = {
      model: model2, apiKey: apiKey2, orgId: orgId2,
      modelVersion: modelVersion2, temperature: temperature2,
      maxTokens: maxTokens2, systemPrompt: systemPrompt2
    };

    const onChainComplete = (_trigger: string) => {
      const nextRepetition = repetitionIndex + 1;
      if (nextRepetition < repetitionCountRef.current) {
        repetitionCurrentRef.current = nextRepetition;
        setRepetitionCurrent(nextRepetition);
        setInteractionCount(0);
        pendingTimeoutRef.current = setTimeout(() => {
          if (initialChainRef.current) {
            startChain(
              initialChainRef.current.userMsg,
              initialChainRef.current.allMessages,
              nextRepetition,
              crypto.randomUUID(),
              bot1StartsFirst
            );
          }
        }, 1500);
      } else {
        setIsLoading(false);
        setRepetitionCurrent(0);
        repetitionCurrentRef.current = 0;
      }
    };

    if (bot1StartsFirst) {
      await generateAIResponse(config1, baseMessages, true, dbConversationId, localConversationId, 0, repetitionIndex, onChainComplete);
    } else {
      // SPEC-03 asymmetric: Bot B (Responder) generates first AI turn
      await generateAIResponse(config2, baseMessages, false, dbConversationId, localConversationId, 0, repetitionIndex, onChainComplete);
    }
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

    isStoppedRef.current = false;
    setUserInput('');
    setIsLoading(true);
    setInteractionCount(0);
    setRepetitionCurrent(0);
    repetitionCurrentRef.current = 0;
    setErrors([]);

    // SPEC-01: increment run count for the active experiment
    if (currentExperimentId) {
      supabase.from('experiments')
        .select('run_count')
        .eq('id', currentExperimentId)
        .single()
        .then(({ data }) => {
          if (data) {
            supabase.from('experiments')
              .update({ run_count: (data.run_count as number || 0) + 1, last_run_at: new Date().toISOString() })
              .eq('id', currentExperimentId);
          }
        });
    }

    const localConversationId = crypto.randomUUID();

    // SPEC-03: asymmetric mode with a scripted opener
    if (botMode === 'asymmetric' && openingMessage.trim()) {
      const opener: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: openingMessage.trim(),
        timestamp: Date.now(),
        botIndex: 1,
        conversationId: localConversationId,
        wordCount: openingMessage.trim().split(/\s+/).filter(Boolean).length,
        timeTaken: 0,
        modelVersion: modelVersion1,
        temperature: temperature1,
        systemPrompt: systemPrompt1,
        repetitionNumber: 0,
      };

      setMessages(prev => [...prev, opener]);

      const allMessages: Message[] = [
        { id: 'sys1', role: 'system', content: systemPrompt1, timestamp: Date.now() },
        { id: 'sys2', role: 'system', content: systemPrompt2, timestamp: Date.now() },
        ...messages,
        opener,
      ];

      initialChainRef.current = { userMsg: '', allMessages, localConversationId, bot1StartsFirst: false };

      try {
        await startChain('', allMessages, 0, localConversationId, false);
      } catch (error) {
        setErrors([error instanceof Error ? error.message : 'An unknown error occurred']);
        setIsLoading(false);
      }
      return;
    }

    // Symmetric mode (or asymmetric without a pre-scripted opener): existing flow
    const trimmed = userInput.trim();

    const newUserMessage: Message = trimmed
      ? { id: crypto.randomUUID(), role: 'user', content: trimmed, timestamp: Date.now() }
      : { id: crypto.randomUUID(), role: 'user', content: 'Please begin the conversation based on your instructions.', timestamp: Date.now(), hidden: true };

    setMessages(prev => [...prev, newUserMessage]);

    const allMessages: Message[] = [
      { id: 'sys1', role: 'system', content: systemPrompt1, timestamp: Date.now() },
      ...messages,
      newUserMessage
    ];

    initialChainRef.current = { userMsg: trimmed, allMessages, localConversationId, bot1StartsFirst: true };

    try {
      await startChain(trimmed, allMessages, 0, localConversationId, true);
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
  };

  const handleLoadScenario = (scenario: Scenario) => {
    setSystemPrompt1(scenario.botAPrompt);
    setSystemPrompt2(scenario.botBPrompt);
    setUserInput(scenario.sharedPrompt);
    setStopKeywords(scenario.stopKeywords);
    setBotMode(scenario.botMode);
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
    setStoppingTriggers({});
    initialChainRef.current = null;
  };

  // SPEC-01: load a saved experiment — applies all config values
  const handleLoadExperiment = useCallback((experiment: Experiment) => {
    const c = experiment.config;
    const s = (key: string) => typeof c[key] === 'string' ? String(c[key]) : undefined;
    const n = (key: string) => typeof c[key] === 'number' ? Number(c[key]) : undefined;
    const b = (key: string) => typeof c[key] === 'boolean' ? Boolean(c[key]) : undefined;

    if (s('m1')) setModel1(s('m1') as AIModel);
    if (s('mv1')) setModelVersion1(s('mv1')!);
    if (n('t1') !== undefined) setTemperature1(n('t1')!);
    if (n('mt1') !== undefined) setMaxTokens1(n('mt1')!);
    if (s('sp1') !== undefined) setSystemPrompt1(s('sp1')!);
    if (s('n1')) setBotName1(s('n1')!);
    if (s('m2')) setModel2(s('m2') as AIModel);
    if (s('mv2')) setModelVersion2(s('mv2')!);
    if (n('t2') !== undefined) setTemperature2(n('t2')!);
    if (n('mt2') !== undefined) setMaxTokens2(n('mt2')!);
    if (s('sp2') !== undefined) setSystemPrompt2(s('sp2')!);
    if (s('n2')) setBotName2(s('n2')!);
    if (n('mi') !== undefined) setMaxInteractions(n('mi')!);
    if (n('rd') !== undefined) setResponseDelay(n('rd')!);
    if (b('dv') !== undefined) setDelayVariance(b('dv')!);
    if (n('rc') !== undefined) setRepetitionCount(n('rc')!);
    if (s('bm')) setBotMode(s('bm') as 'symmetric' | 'asymmetric');
    if (s('om') !== undefined) setOpeningMessage(s('om')!);
    if (s('sk') !== undefined) setStopKeywords(s('sk')!);
    if (s('bc1')) setBubbleColor1(s('bc1')!);
    if (s('bc2')) setBubbleColor2(s('bc2')!);
    if (s('tc1')) setTextColor1(s('tc1')!);
    if (s('tc2')) setTextColor2(s('tc2')!);

    setCurrentExperimentId(experiment.id);
    setCurrentExperimentName(experiment.name);
  }, []);

  // SPEC-01: save current config as a named experiment
  const handleSaveExperimentConfirm = async () => {
    if (!saveExpName.trim()) return;
    setSavingExp(true);
    const config = {
      m1: model1, mv1: modelVersion1, t1: temperature1, mt1: maxTokens1, sp1: systemPrompt1, n1: botName1,
      m2: model2, mv2: modelVersion2, t2: temperature2, mt2: maxTokens2, sp2: systemPrompt2, n2: botName2,
      mi: maxInteractions, rd: responseDelay, dv: delayVariance, rc: repetitionCount,
      bm: botMode, om: openingMessage, sk: stopKeywords,
      bc1: bubbleColor1, bc2: bubbleColor2, tc1: textColor1, tc2: textColor2,
    };
    const { data, error } = await supabase.from('experiments').insert({
      user_id: user.id,
      name: saveExpName.trim(),
      condition_label: saveExpCondition.trim(),
      description: saveExpDesc.trim(),
      config,
    }).select('id').single();
    setSavingExp(false);
    if (!error && data) {
      setCurrentExperimentId(data.id as string);
      setCurrentExperimentName(saveExpName.trim());
    }
    setShowSaveExperiment(false);
    setSaveExpName('');
    setSaveExpCondition('');
    setSaveExpDesc('');
  };

  // SPEC-06: download config as JSON file
  const handleDownloadConfigJson = useCallback(() => {
    const payload = {
      m1: model1, mv1: modelVersion1, t1: temperature1, mt1: maxTokens1, sp1: systemPrompt1, n1: botName1,
      m2: model2, mv2: modelVersion2, t2: temperature2, mt2: maxTokens2, sp2: systemPrompt2, n2: botName2,
      mi: maxInteractions, rd: responseDelay, dv: delayVariance, rc: repetitionCount,
      bm: botMode, om: openingMessage, sk: stopKeywords,
      bc1: bubbleColor1, bc2: bubbleColor2, tc1: textColor1, tc2: textColor2,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai2ai-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [model1, modelVersion1, temperature1, maxTokens1, systemPrompt1, botName1,
      model2, modelVersion2, temperature2, maxTokens2, systemPrompt2, botName2,
      maxInteractions, responseDelay, delayVariance, repetitionCount,
      botMode, openingMessage, stopKeywords,
      bubbleColor1, bubbleColor2, textColor1, textColor2]);

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

  // SPEC-05: research-grade CSV export
  const handleExportCsv = () => {
    const csvField = (val: string) => {
      let s = String(val);
      if (s.match(/^[=+\-@]/)) s = `'${s}`;
      return `"${s.replace(/"/g, '""')}"`;
    };

    const visibleMessages = messages.filter(m => m.role !== 'system' && !m.hidden);

    // pre-compute final turn count per conversationId
    const finalTurnByConv: Record<string, number> = {};
    visibleMessages.forEach(m => {
      if (m.conversationId) finalTurnByConv[m.conversationId] = (finalTurnByConv[m.conversationId] ?? 0) + 1;
    });

    const headers = [
      'experiment_id', 'experiment_name',
      'session_id', 'condition_label', 'repetition_number',
      'conversation_id', 'timestamp', 'sender', 'bot_role',
      'system_prompt_hash', 'model', 'temperature',
      'content', 'words', 'response_time_ms',
      'stopping_trigger', 'final_turn_number',
    ];

    const rows = [headers];

    visibleMessages.forEach(m => {
      const label = m.role === 'user' ? 'User' : (m.botIndex === 1 ? botName1 : botName2);
      const fallbackPrompt = m.botIndex === 1 ? systemPrompt1 : m.botIndex === 2 ? systemPrompt2 : '';
      const fallbackModel  = m.botIndex === 1 ? modelVersion1  : m.botIndex === 2 ? modelVersion2  : '';
      const fallbackTemp   = m.botIndex === 1 ? temperature1   : m.botIndex === 2 ? temperature2   : '';

      // SPEC-05: bot_role (only meaningful in asymmetric mode)
      const botRole = botMode === 'asymmetric'
        ? (m.botIndex === 1 ? 'initiator' : m.botIndex === 2 ? 'responder' : '')
        : '';

      // SPEC-05: system_prompt_hash for version tracking
      const promptText = m.systemPrompt ?? fallbackPrompt;
      const promptHash = promptText ? hashString(promptText) : '';

      const convId = m.conversationId ?? '';

      rows.push([
        csvField(currentExperimentId ?? ''),
        csvField(currentExperimentName ?? ''),
        csvField(sessionId ?? ''),
        csvField(conditionLabel ?? ''),
        csvField(String(m.repetitionNumber ?? 0)),
        csvField(convId),
        csvField(new Date(m.timestamp).toISOString()),
        csvField(label),
        csvField(botRole),
        csvField(promptHash),
        csvField(m.modelVersion ?? String(fallbackModel)),
        csvField(String(m.temperature ?? fallbackTemp)),
        csvField(m.content),
        csvField(String(m.wordCount ?? '')),
        csvField(String(m.timeTaken ?? '')),
        csvField(stoppingTriggers[convId] ?? ''),
        csvField(String(finalTurnByConv[convId] ?? '')),
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

  // SPEC-06: copy a pre-configured share link to clipboard
  const handleShareConfig = useCallback(() => {
    const payload = {
      m1: model1, mv1: modelVersion1, t1: temperature1, mt1: maxTokens1,
      sp1: systemPrompt1, n1: botName1,
      m2: model2, mv2: modelVersion2, t2: temperature2, mt2: maxTokens2,
      sp2: systemPrompt2, n2: botName2,
      mi: maxInteractions, rd: responseDelay, dv: delayVariance, rc: repetitionCount,
      bm: botMode, om: openingMessage, sk: stopKeywords,
      bc1: bubbleColor1, bc2: bubbleColor2, tc1: textColor1, tc2: textColor2,
    };
    const encoded = btoa(JSON.stringify(payload));
    const url = `${window.location.origin}${window.location.pathname}?cfg=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    });
  }, [model1, modelVersion1, temperature1, maxTokens1, systemPrompt1, botName1,
      model2, modelVersion2, temperature2, maxTokens2, systemPrompt2, botName2,
      maxInteractions, responseDelay, delayVariance, repetitionCount,
      botMode, openingMessage, stopKeywords,
      bubbleColor1, bubbleColor2, textColor1, textColor2]);

  // Unique run tokens (conversationIds) for the current session, for survey entry
  const runTokens = [...new Set(
    messages.filter(m => m.conversationId).map(m => m.conversationId!)
  )];

  return (
    <div className="h-screen bg-gray-100 dark:bg-gray-950 flex flex-col overflow-hidden">
      {showTour && <OnboardingTour onComplete={() => setShowTour(false)} />}
      {workshopData && <WorkshopBanner name={workshopData.name} welcome={workshopData.welcome} />}
      <Header
        onBack={onBack}
        onSignOut={onSignOut}
        onToggleSettings={() => setShowSettings(!showSettings)}
        onOpenUserSettings={() => setShowUserSettings(true)}
        onOpenHistory={() => setShowHistory(true)}
        onOpenExperiments={() => setShowExperiments(true)}
        onOpenWorkshops={() => setShowWorkshopAdmin(true)}
        onOpenAdmin={() => setShowAdminDashboard(true)}
        isOrganizer={isOrganizer}
        user={user}
        isDarkMode={isDarkMode}
        onToggleDarkMode={onToggleDarkMode}
      />

      {showUserSettings && (
        <UserSettings
          user={user}
          onClose={() => setShowUserSettings(false)}
          onOpenHistory={() => { setShowUserSettings(false); setShowHistory(true); }}
          onDataDeleted={() => { setMessages([]); setShowUserSettings(false); }}
          onAccountDeleted={() => { onSignOut(); }}
          onRewatchTour={() => { resetTourDismissed(); incrementTourCount(); setShowTour(true); }}
        />
      )}

      {showWorkshopAdmin && (
        <WorkshopAdmin onClose={() => setShowWorkshopAdmin(false)} />
      )}

      {showAdminDashboard && (
        <AdminDashboard onClose={() => setShowAdminDashboard(false)} />
      )}

      {showHistory && (
        <ConversationHistory
          userId={user.id}
          onClose={() => setShowHistory(false)}
          onLoad={(loaded) => setMessages(loaded)}
        />
      )}

      {showExperiments && (
        <ExperimentsPanel
          userId={user.id}
          onClose={() => setShowExperiments(false)}
          onLoad={handleLoadExperiment}
        />
      )}

      {/* SPEC-01: save experiment dialog */}
      {showSaveExperiment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Save Experiment</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200 block mb-1">Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={saveExpName}
                  onChange={e => setSaveExpName(e.target.value)}
                  placeholder="e.g. Algorithm Aversion Study — Condition A"
                  autoFocus
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200 block mb-1">Condition label</label>
                <input
                  type="text"
                  value={saveExpCondition}
                  onChange={e => setSaveExpCondition(e.target.value)}
                  placeholder="e.g. Condition A"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200 block mb-1">Notes</label>
                <textarea
                  value={saveExpDesc}
                  onChange={e => setSaveExpDesc(e.target.value)}
                  placeholder="Pilot details, hypothesis, changes from last version…"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setShowSaveExperiment(false)}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveExperimentConfirm}
                disabled={!saveExpName.trim() || savingExp}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingExp ? 'Saving…' : 'Save experiment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile settings overlay */}
      {showSettings && (
        <div className="lg:hidden fixed inset-0 z-40 bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Bot Configuration</h2>
            <button
              onClick={() => setShowSettings(false)}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close settings"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
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
              userId={user.id}
              botSlot={1}
            />
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
              userId={user.id}
              botSlot={2}
            />
          </div>
        </div>
      )}

      <main className="flex-1 min-h-0 w-full px-4 sm:px-6 lg:px-8 py-6 overflow-hidden">
        <div className="flex gap-4 h-full min-h-0">
          {showSettings && (
            <div data-tour="bot1-panel" className="hidden lg:flex lg:flex-col w-88 flex-shrink-0 overflow-y-auto" style={{ width: '22rem' }}>
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
              saveHistory={saveHistory}
              onSaveHistoryChange={setSaveHistory}
              botName1={botName1}
              botName2={botName2}
              bubbleColor1={bubbleColor1}
              bubbleColor2={bubbleColor2}
              textColor1={textColor1}
              textColor2={textColor2}
              // Research features
              sessionId={sessionId}
              conditionLabel={conditionLabel}
              botMode={botMode}
              onBotModeChange={setBotMode}
              openingMessage={openingMessage}
              onOpeningMessageChange={setOpeningMessage}
              stopKeywords={stopKeywords}
              onStopKeywordsChange={setStopKeywords}
              onShareConfig={handleShareConfig}
              shareCopied={shareCopied}
              onSaveExperiment={() => setShowSaveExperiment(true)}
              onDownloadConfigJson={handleDownloadConfigJson}
              currentExperimentName={currentExperimentName || undefined}
              onDetachExperiment={currentExperimentId ? () => { setCurrentExperimentId(null); setCurrentExperimentName(''); } : undefined}
              runTokens={!isLoading && runTokens.length > 0 ? runTokens : undefined}
              scenarioCards={messages.length === 0 ? <ScenarioCards onSelect={handleLoadScenario} /> : undefined}
            />
          </div>

          {showSettings && (
            <div data-tour="bot2-panel" className="hidden lg:flex lg:flex-col flex-shrink-0 overflow-y-auto" style={{ width: '22rem' }}>
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
