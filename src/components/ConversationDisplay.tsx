import React from 'react';
import { Message, AIModel } from '../types';
import { Bot, User } from 'lucide-react';

interface ConversationDisplayProps {
  messages: Message[];
  isLoading?: boolean;
  botName1: string;
  botName2: string;
  model1: AIModel;
}

export function ConversationDisplay({
  messages,
  isLoading = false,
  botName1,
  botName2,
  model1
}: ConversationDisplayProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Bot className="w-12 h-12 mb-3" />
        <p className="text-sm">Send a message to start the conversation.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {messages.filter(m => m.role !== 'system').map((message) => {
        const isUser = message.role === 'user';
        const isBot1 = message.role === 'assistant' && message.model === model1;
        const label = isUser ? 'You' : (isBot1 ? botName1 : botName2);

        return (
          <div
            key={message.id}
            className={`flex flex-col gap-2 p-4 rounded-xl shadow-sm ${
              isUser
                ? 'bg-white border border-gray-200 mr-12'
                : isBot1
                ? 'bg-indigo-50 border border-indigo-100 ml-12'
                : 'bg-emerald-50 border border-emerald-100 mr-12'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isUser ? (
                  <User className="w-4 h-4 text-gray-500" />
                ) : (
                  <Bot className={`w-4 h-4 ${isBot1 ? 'text-indigo-600' : 'text-emerald-600'}`} />
                )}
                <span className={`text-sm font-semibold ${
                  isUser ? 'text-gray-700' : isBot1 ? 'text-indigo-700' : 'text-emerald-700'
                }`}>
                  {label}
                </span>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
            {message.wordCount != null && message.timeTaken != null && (
              <div className="flex gap-3 text-xs text-gray-400 pt-1">
                <span>{message.wordCount} words</span>
                <span>{(message.timeTaken / 1000).toFixed(2)}s</span>
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
