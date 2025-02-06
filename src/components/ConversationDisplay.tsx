import React from 'react';
import { Message } from '../types';
import { Bot, User } from 'lucide-react';

interface ConversationDisplayProps {
  messages: Message[];
  isLoading?: boolean;
}

export function ConversationDisplay({ messages, isLoading = false }: ConversationDisplayProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg text-gray-500">
        <Bot className="w-12 h-12 mb-4 text-gray-400" />
        <p className="text-center">Start a conversation with the AI bots.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-lg max-h-[500px] overflow-y-auto">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex flex-col gap-2 p-4 rounded-lg shadow-sm transition-all ${
            message.role === 'user' 
              ? 'bg-white mr-12'
              : message.role === 'assistant'
              ? 'bg-indigo-50 ml-12'
              : 'bg-gray-100'
          }`}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {message.role === 'user' ? (
                <User className="w-4 h-4 text-gray-600" />
              ) : (
                <Bot className="w-4 h-4 text-gray-600" />
              )}
              <span className="font-medium text-gray-700">
                {message.role === 'user' ? 'You' : message.role === 'assistant' ? `AI ${message.model}` : 'System'}
              </span>
            </div>
            <span className="text-sm text-gray-500">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <p className="text-gray-800 whitespace-pre-wrap">{message.content}</p>
          {message.wordCount && message.timeTaken && (
            <div className="flex gap-4 text-sm text-gray-500">
              <span>{message.wordCount} words</span>
              <span>{(message.timeTaken / 1000).toFixed(2)}s</span>
            </div>
          )}
        </div>
      ))}
      {isLoading && (
        <div className="flex justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}