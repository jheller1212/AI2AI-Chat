import React from 'react';
import { Message, AIModel } from '../types';
import { Bot, User } from 'lucide-react';

interface ConversationDisplayProps {
  messages: Message[];
  isLoading?: boolean;
  botName1: string;
  botName2: string;
  model1: AIModel;
  bubbleColor1: string;
  bubbleColor2: string;
  textColor1: string;
  textColor2: string;
}

function estimateTokens(wordCount: number) {
  return Math.ceil(wordCount * 1.33);
}

function TokenBadge({ wordCount }: { wordCount: number }) {
  const tokens = estimateTokens(wordCount);
  return (
    <div className="relative group inline-flex items-center">
      <span className="text-xs cursor-help underline decoration-dotted" style={{ color: 'inherit', opacity: 0.6 }}>
        ~{tokens} tokens
      </span>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none text-center leading-relaxed">
        Estimated token count (~{wordCount} words × 1.33).
        <br />
        For exact counts use{' '}
        <span className="underline">platform.openai.com/tokenizer</span>
      </div>
    </div>
  );
}

export function ConversationDisplay({
  messages,
  isLoading = false,
  botName1,
  botName2,
  model1,
  bubbleColor1,
  bubbleColor2,
  textColor1,
  textColor2,
}: ConversationDisplayProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const visible = messages.filter(m => m.role !== 'system' && !m.hidden);

  if (visible.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Bot className="w-12 h-12 mb-3" />
        <p className="text-sm">Send a message (or leave blank) to start the conversation.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {visible.map((message) => {
        const isUser = message.role === 'user';
        const isBot1 = message.role === 'assistant' && message.model === model1;
        const label = isUser ? 'You' : (isBot1 ? botName1 : botName2);

        if (isUser) {
          return (
            <div
              key={message.id}
              className="flex flex-col gap-2 p-4 rounded-xl shadow-sm bg-white border border-gray-200 mr-12"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-700">{label}</span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
            </div>
          );
        }

        const bgColor = isBot1 ? bubbleColor1 : bubbleColor2;
        const fgColor = isBot1 ? textColor1 : textColor2;

        return (
          <div
            key={message.id}
            className={`flex flex-col gap-2 p-4 rounded-xl shadow-sm ${isBot1 ? 'ml-12' : 'mr-12'}`}
            style={{ backgroundColor: bgColor }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4" style={{ color: fgColor, opacity: 0.7 }} />
                <span className="text-sm font-semibold" style={{ color: fgColor }}>{label}</span>
              </div>
              <span className="text-xs" style={{ color: fgColor, opacity: 0.5 }}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: fgColor }}>{message.content}</p>
            {message.wordCount != null && message.timeTaken != null && (
              <div className="flex gap-3 pt-1" style={{ color: fgColor }}>
                <span className="text-xs" style={{ opacity: 0.5 }}>{message.wordCount} words</span>
                <span className="text-xs" style={{ opacity: 0.5 }}>{(message.timeTaken / 1000).toFixed(2)}s</span>
                <TokenBadge wordCount={message.wordCount} />
              </div>
            )}
          </div>
        );
      })}

      {isLoading && (
        <div className="flex items-center gap-2 ml-12 text-sm text-gray-400">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          Generating…
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
