import { useState, useRef, useEffect, useCallback } from 'react';
import { generateResponse } from '../lib/api/conversation';
import type { WaitStatus } from '../lib/api/conversation';
import { supabase } from '../lib/supabase';
import { trackEvent } from '../lib/analytics';
import { APIError } from '../lib/api/types';
import type { AIModel, Message, ChatConfig } from '../types';

interface ConversationEngineOptions {
  // Bot config
  model1: AIModel;
  model2: AIModel;
  apiKey1: string;
  apiKey2: string;
  orgId1: string;
  orgId2: string;
  modelVersion1: string;
  modelVersion2: string;
  temperature1: number;
  temperature2: number;
  maxTokens1: number;
  maxTokens2: number;
  botName1: string;
  botName2: string;
  systemPrompt1: string;
  systemPrompt2: string;
  // Settings
  autoInteract: boolean;
  maxInteractions: number;
  responseDelay: number;
  delayVariance: boolean;
  repetitionCount: number;
  stopKeywords: string;
  saveHistory: boolean;
  botMode: 'symmetric' | 'asymmetric';
  startingBot: 'a' | 'b';
  openingMessage: string;
  chatMode: boolean;
  // Context
  userId: string;
  currentExperimentId: string | null;
  // Callbacks
  buildEffectivePrompt: (basePrompt: string, botSlot: 1 | 2) => string;
  validateConfigs: (setErrors: (errors: string[]) => void) => boolean;
}

export function useConversationEngine(opts: ConversationEngineOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [interactionCount, setInteractionCount] = useState(0);
  const [repetitionCurrent, setRepetitionCurrent] = useState(0);
  const [stoppingTriggers, setStoppingTriggers] = useState<Record<string, string>>({});
  // Human-readable "waiting for capacity" message shown while a turn is queued
  // behind the per-browser request gate or sleeping through a rate-limit retry.
  const [waitStatus, setWaitStatus] = useState<string | null>(null);

  const describeWait = (w: WaitStatus): string | null => {
    if (!w) return null;
    if (w.kind === 'queued') return 'Many requests at once — your turn is queued…';
    return `High demand — the API is rate-limiting. Retrying in ${Math.max(1, Math.round(w.retryInMs / 1000))}s…`;
  };

  // Refs for latest values in async callbacks
  const autoInteractRef = useRef(opts.autoInteract);
  const maxInteractionsRef = useRef(opts.maxInteractions);
  const responseDelayRef = useRef(opts.responseDelay);
  const delayVarianceRef = useRef(opts.delayVariance);
  const repetitionCountRef = useRef(opts.repetitionCount);
  const repetitionCurrentRef = useRef(0);
  const stopKeywordsRef = useRef(opts.stopKeywords);
  const initialChainRef = useRef<{
    userMsg: string;
    allMessages: Message[];
    localConversationId: string;
    bot1StartsFirst: boolean;
  } | null>(null);
  const pendingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isStoppedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => { autoInteractRef.current = opts.autoInteract; }, [opts.autoInteract]);
  useEffect(() => { maxInteractionsRef.current = opts.maxInteractions; }, [opts.maxInteractions]);
  useEffect(() => { responseDelayRef.current = opts.responseDelay; }, [opts.responseDelay]);
  useEffect(() => { delayVarianceRef.current = opts.delayVariance; }, [opts.delayVariance]);
  useEffect(() => { repetitionCountRef.current = opts.repetitionCount; }, [opts.repetitionCount]);
  useEffect(() => { stopKeywordsRef.current = opts.stopKeywords; }, [opts.stopKeywords]);

  useEffect(() => {
    return () => {
      if (pendingTimeoutRef.current) clearTimeout(pendingTimeoutRef.current);
    };
  }, []);

  const saveMessageToDb = async (conversationId: string, msg: Message, role: string, modelLabel: string) => {
    if (msg.hidden || !opts.saveHistory) return;
    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      role,
      model: modelLabel,
      content: msg.content,
      word_count: msg.wordCount ?? 0,
      time_taken: msg.timeTaken ?? 0,
    });
    if (error) {
      setErrors(prev => [...prev, `Message not saved to history: ${error.message}`]);
    }
  };

  const createConversationRecord = async (title: string, id: string): Promise<string | null> => {
    if (!opts.saveHistory) return id;
    const row: Record<string, unknown> = {
      id,
      user_id: opts.userId,
      title: title.slice(0, 80) || '(Auto-started conversation)',
      model1_type: opts.model1, model1_version: opts.modelVersion1,
      model1_temperature: opts.temperature1, model1_max_tokens: opts.maxTokens1,
      model2_type: opts.model2, model2_version: opts.modelVersion2,
      model2_temperature: opts.temperature2, model2_max_tokens: opts.maxTokens2,
      interaction_limit: maxInteractionsRef.current,
    };
    if (opts.currentExperimentId) row.experiment_id = opts.currentExperimentId;
    const { data, error } = await supabase.from('conversations').insert(row).select('id').single();
    if (error) {
      setErrors(prev => [...prev, `History unavailable: ${error.message}`]);
      return null;
    }
    return data?.id ?? null;
  };

  // Persist the final stopping trigger on the conversation row and log a
  // completion event — both fire-and-forget, never blocking the chain.
  const finalizeConversation = (dbConversationId: string | null, trigger: string, turns: number) => {
    if (dbConversationId && opts.saveHistory) {
      supabase.from('conversations').update({ stopping_trigger: trigger }).eq('id', dbConversationId)
        .then(({ error }) => {
          if (error) console.warn(`stopping_trigger not saved: ${error.message}`);
        });
    }
    trackEvent(opts.userId, 'conversation_completed', { trigger, turns });
  };

  const generateAIResponse = useCallback(async (
    config: ChatConfig,
    currentMessages: Message[],
    isFirstAI: boolean,
    dbConversationId: string | null,
    localConversationId: string,
    currentCount: number,
    repetitionIndex: number,
    onChainComplete: (trigger: string) => void,
  ): Promise<void> => {
    try {
      const myBotIndex: 1 | 2 = isFirstAI ? 1 : 2;

      const remappedMessages = currentMessages.map(m => {
        if (m.role !== 'assistant') return m;
        return { ...m, role: (m.botIndex === myBotIndex ? 'assistant' : 'user') as const };
      });

      if (isStoppedRef.current) { setIsLoading(false); return; }

      const ac = new AbortController();
      abortControllerRef.current = ac;
      const response = await generateResponse(
        config, remappedMessages, ac.signal,
        (w) => setWaitStatus(describeWait(w)),
      );
      abortControllerRef.current = null;
      setWaitStatus(null);

      if (isStoppedRef.current) { setIsLoading(false); return; }

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
        await saveMessageToDb(dbConversationId, taggedResponse, 'assistant', isFirstAI ? opts.botName1 : opts.botName2);
      }

      // Check stop keywords
      const keywords = stopKeywordsRef.current.split(',').map(k => k.trim()).filter(Boolean);
      if (keywords.length > 0 && !isStoppedRef.current) {
        const lower = taggedResponse.content.toLowerCase();
        const matched = keywords.find(k => lower.includes(k.toLowerCase()));
        if (matched) {
          setStoppingTriggers(prev => ({ ...prev, [localConversationId]: `keyword:${matched}` }));
          finalizeConversation(dbConversationId, `keyword:${matched}`, currentCount + 1);
          onChainComplete(`keyword:${matched}`);
          return;
        }
      }

      if (autoInteractRef.current && currentCount < maxInteractionsRef.current - 1 && !isStoppedRef.current) {
        const otherConfig: ChatConfig = isFirstAI ? {
          model: opts.model2, apiKey: opts.apiKey2, orgId: opts.orgId2,
          modelVersion: opts.modelVersion2, temperature: opts.temperature2,
          maxTokens: opts.maxTokens2, systemPrompt: opts.buildEffectivePrompt(opts.systemPrompt2, 2),
        } : {
          model: opts.model1, apiKey: opts.apiKey1, orgId: opts.orgId1,
          modelVersion: opts.modelVersion1, temperature: opts.temperature1,
          maxTokens: opts.maxTokens1, systemPrompt: opts.buildEffectivePrompt(opts.systemPrompt1, 1),
        };

        const prevWords = taggedResponse.wordCount ?? 0;
        const computedDelay = delayVarianceRef.current
          ? (responseDelayRef.current + prevWords * 0.05) * 1000
          : responseDelayRef.current * 1000;

        pendingTimeoutRef.current = setTimeout(() => {
          setInteractionCount(currentCount + 1);
          generateAIResponse(
            otherConfig, [...currentMessages, taggedResponse], !isFirstAI,
            dbConversationId, localConversationId, currentCount + 1, repetitionIndex, onChainComplete,
          );
        }, computedDelay);
      } else if (!isStoppedRef.current) {
        setStoppingTriggers(prev => ({ ...prev, [localConversationId]: 'turn_count' }));
        finalizeConversation(dbConversationId, 'turn_count', currentCount + 1);
        onChainComplete('turn_count');
      }
      // If the user pressed Stop after the response arrived, fall through without
      // finalizing — handleStop already reset the loading state.
    } catch (error) {
      setWaitStatus(null);
      // Stop button aborts in-flight requests and retry waits — not an error to surface
      if (error instanceof Error && error.name === 'AbortError' && isStoppedRef.current) {
        setIsLoading(false);
        return;
      }
      trackEvent(opts.userId, 'provider_error', {
        provider: config.model,
        model: config.modelVersion,
        status: error instanceof APIError ? error.status : null,
        timeout: error instanceof Error && error.name === 'AbortError',
      });
      let msg = error instanceof Error
        ? (error.name === 'AbortError' ? 'Request timed out. Please try again.' : error.message)
        : 'An unknown error occurred';
      const providerNames: Record<string, string> = {
        gpt4: 'OpenAI', claude: 'Anthropic', gemini: 'Google Gemini', mistral: 'Mistral',
      };
      const who = providerNames[config.model] || 'provider';
      if (error instanceof APIError && (error.status === 401 || error.status === 403)) {
        msg = `The ${who} API key looks invalid or unauthorized (HTTP ${error.status}). Please double-check the key — it may be mistyped, expired, or lack access to this model — then update it and start again.`;
      } else if (error instanceof APIError && error.status === 429) {
        msg = `The ${who} API is rate-limiting requests (HTTP 429) — too many were sent too quickly. Wait a moment, then start again. In a workshop where many people share one API key this is common: lower "messages per bot" or add a response delay in Advanced Settings to ease the load.`;
      } else if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('network')) {
        msg += ' — Troubleshooting: (1) Is your API key copied correctly and complete? (2) Is the key still active and not expired? (3) Does your API account have available credits? (4) Check your browser console for CORS errors.';
      }
      setErrors([msg]);
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.botName1, opts.botName2, opts.model1, opts.model2, opts.apiKey1, opts.apiKey2,
      opts.orgId1, opts.orgId2, opts.modelVersion1, opts.modelVersion2,
      opts.temperature1, opts.temperature2, opts.maxTokens1, opts.maxTokens2,
      opts.systemPrompt1, opts.systemPrompt2, opts.userId, opts.buildEffectivePrompt]);

  const startChain = useCallback(async (
    userMsg: string,
    baseMessages: Message[],
    repetitionIndex: number,
    localConversationId: string,
    bot1StartsFirst: boolean,
  ) => {
    const dbConversationId = await createConversationRecord(userMsg, localConversationId);

    trackEvent(opts.userId, 'conversation_started', {
      provider1: opts.model1,
      provider2: opts.model2,
      model1: opts.modelVersion1,
      model2: opts.modelVersion2,
      bot_mode: opts.botMode,
      max_interactions: maxInteractionsRef.current,
      repetition: repetitionIndex,
      experiment_id: opts.currentExperimentId ?? null,
    });

    if (userMsg && dbConversationId) {
      const userMessage = baseMessages.find(m => m.role === 'user' && !m.hidden && m.content === userMsg);
      if (userMessage) {
        const { error: userMsgError } = await supabase.from('messages').insert({
          conversation_id: dbConversationId,
          role: 'user',
          model: 'User',
          content: userMsg,
          word_count: userMsg.split(/\s+/).filter(Boolean).length,
        });
        if (userMsgError) {
          setErrors(prev => [...prev, `Message not saved to history: ${userMsgError.message}`]);
        }
      }
    } else if (dbConversationId) {
      // Distinct-roles scripted opener: the chain starts from a pre-written
      // message authored by the starting bot — save it too, otherwise the
      // conversation is incomplete in history and bot attribution can't be
      // recovered on load. The opener may be from either bot depending on
      // startingBot, so save it under the matching bot name.
      const opener = baseMessages[baseMessages.length - 1];
      if (opener?.role === 'assistant' && (opener.botIndex === 1 || opener.botIndex === 2)) {
        await saveMessageToDb(dbConversationId, opener, 'assistant', opener.botIndex === 1 ? opts.botName1 : opts.botName2);
      }
    }

    const config1: ChatConfig = {
      model: opts.model1, apiKey: opts.apiKey1, orgId: opts.orgId1,
      modelVersion: opts.modelVersion1, temperature: opts.temperature1,
      maxTokens: opts.maxTokens1, systemPrompt: opts.buildEffectivePrompt(opts.systemPrompt1, 1),
    };
    const config2: ChatConfig = {
      model: opts.model2, apiKey: opts.apiKey2, orgId: opts.orgId2,
      modelVersion: opts.modelVersion2, temperature: opts.temperature2,
      maxTokens: opts.maxTokens2, systemPrompt: opts.buildEffectivePrompt(opts.systemPrompt2, 2),
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
              bot1StartsFirst,
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
      await generateAIResponse(config2, baseMessages, false, dbConversationId, localConversationId, 0, repetitionIndex, onChainComplete);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.model1, opts.model2, opts.apiKey1, opts.apiKey2, opts.orgId1, opts.orgId2,
      opts.modelVersion1, opts.modelVersion2, opts.temperature1, opts.temperature2,
      opts.maxTokens1, opts.maxTokens2, opts.systemPrompt1, opts.systemPrompt2,
      opts.botName1, opts.botName2, opts.botMode, opts.startingBot, opts.userId, opts.currentExperimentId,
      opts.buildEffectivePrompt, generateAIResponse]);

  const handleSendMessage = async (
    userInput: string,
    setCurrentView: (v: 'chat') => void,
  ) => {
    if (!opts.validateConfigs(setErrors) || isLoading) return;

    if (pendingTimeoutRef.current) {
      clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }

    isStoppedRef.current = false;
    setIsLoading(true);
    setCurrentView('chat');
    setInteractionCount(0);
    setRepetitionCurrent(0);
    repetitionCurrentRef.current = 0;
    setErrors([]);

    // Increment run count for the active experiment (atomic, server-side)
    if (opts.currentExperimentId) {
      supabase.rpc('increment_experiment_run_count', { exp_id: opts.currentExperimentId })
        .then(({ error }) => {
          if (error) {
            setErrors(prev => [...prev, `Experiment run count not updated: ${error.message}`]);
          }
        });
    }

    const localConversationId = crypto.randomUUID();

    // Whether bot 1 speaks first this run is driven by startingBot.
    const startingIsBot1 = opts.startingBot === 'a';

    // Distinct-roles (asymmetric) mode with a scripted opener.
    // The opener is authored by the STARTING bot; the OTHER bot speaks next.
    if (opts.botMode === 'asymmetric' && opts.openingMessage.trim()) {
      const opener: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: opts.openingMessage.trim(),
        timestamp: Date.now(),
        botIndex: startingIsBot1 ? 1 : 2,
        conversationId: localConversationId,
        wordCount: opts.openingMessage.trim().split(/\s+/).filter(Boolean).length,
        timeTaken: 0,
        modelVersion: startingIsBot1 ? opts.modelVersion1 : opts.modelVersion2,
        temperature: startingIsBot1 ? opts.temperature1 : opts.temperature2,
        systemPrompt: startingIsBot1 ? opts.systemPrompt1 : opts.systemPrompt2,
        repetitionNumber: 0,
      };

      setMessages(prev => [...prev, opener]);

      const allMessages: Message[] = [
        { id: 'sys1', role: 'system', content: opts.buildEffectivePrompt(opts.systemPrompt1, 1), timestamp: Date.now() },
        { id: 'sys2', role: 'system', content: opts.buildEffectivePrompt(opts.systemPrompt2, 2), timestamp: Date.now() },
        ...messages,
        opener,
      ];

      // After the opener the OTHER bot responds, so the next responder is bot 1
      // iff the starting bot was bot 2.
      const bot1StartsFirst = !startingIsBot1;
      initialChainRef.current = { userMsg: '', allMessages, localConversationId, bot1StartsFirst };

      try {
        await startChain('', allMessages, 0, localConversationId, bot1StartsFirst);
      } catch (error) {
        setErrors([error instanceof Error ? error.message : 'An unknown error occurred']);
        setIsLoading(false);
      }
      return;
    }

    // Symmetric mode — the starting bot is the first responder.
    const trimmed = userInput.trim();
    const newUserMessage: Message = trimmed
      ? { id: crypto.randomUUID(), role: 'user', content: trimmed, timestamp: Date.now() }
      : { id: crypto.randomUUID(), role: 'user', content: 'Please begin the conversation based on your instructions.', timestamp: Date.now(), hidden: true };

    setMessages(prev => [...prev, newUserMessage]);

    // Seed the STARTING bot's system prompt so it is in context for the first
    // turn. (Providers derive the system prompt solely from system-role
    // messages, not from per-call config.) When bot 1 starts this preserves the
    // original behavior of seeding sys1.
    const allMessages: Message[] = [
      startingIsBot1
        ? { id: 'sys1', role: 'system', content: opts.buildEffectivePrompt(opts.systemPrompt1, 1), timestamp: Date.now() }
        : { id: 'sys2', role: 'system', content: opts.buildEffectivePrompt(opts.systemPrompt2, 2), timestamp: Date.now() },
      ...messages,
      newUserMessage,
    ];

    initialChainRef.current = { userMsg: trimmed, allMessages, localConversationId, bot1StartsFirst: startingIsBot1 };

    try {
      await startChain(trimmed, allMessages, 0, localConversationId, startingIsBot1);
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
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setWaitStatus(null);
    setIsLoading(false);
  };

  const handleResetChat = () => {
    isStoppedRef.current = true;
    if (pendingTimeoutRef.current) {
      clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setMessages([]);
    setInteractionCount(0);
    setRepetitionCurrent(0);
    repetitionCurrentRef.current = 0;
    setIsLoading(false);
    setErrors([]);
    setStoppingTriggers({});
    setWaitStatus(null);
    initialChainRef.current = null;
    isStoppedRef.current = false;
  };

  return {
    messages, setMessages,
    isLoading,
    waitStatus,
    errors, setErrors,
    interactionCount,
    repetitionCurrent,
    stoppingTriggers,
    handleSendMessage,
    handleStop,
    handleResetChat,
  };
}
