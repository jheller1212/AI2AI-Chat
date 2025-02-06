import React from 'react';
import { Send } from 'lucide-react';
import { ConversationDisplay } from './ConversationDisplay';
import { Message } from '../types';

interface ChatPanelProps {
  messages: Message[];
  isLoading: boolean;
  userInput: string;
  onUserInputChange: (value: string) => void;
  onSendMessage: () => void;
  autoInteract: boolean;
  onAutoInteractChange: (value: boolean) => void;
  maxInteractions: number;
}

export function ChatPanel({
  messages,
  isLoading,
  userInput,
  onUserInputChange,
  onSendMessage,
  autoInteract,
  onAutoInteractChange,
  maxInteractions
}: ChatPanelProps) {
  return (
    <div className="flex-1 bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        <ConversationDisplay messages={messages} isLoading={isLoading} />
      </div>

      <div className="p-4 border-t">
        <div className="flex gap-4">
          <input
            type="text"
            value={userInput}
            onChange={(e) => onUserInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSendMessage();
              }
            }}
            placeholder="Type your message..."
            className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button
            onClick={onSendMessage}
            disabled={isLoading || !userInput.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            Send
          </button>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <input
            type="checkbox"
            id="autoInteract"
            checked={autoInteract}
            onChange={(e) => onAutoInteractChange(e.target.checked)}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="autoInteract" className="text-sm text-gray-600">
            Allow AIs to interact automatically (max {maxInteractions} turns)
          </label>
        </div>
      </div>
    </div>
  );
}