import React from 'react';
import { Send, Download } from 'lucide-react';
import { ConversationDisplay } from './ConversationDisplay';
import { Message, AIModel } from '../types';

interface ChatPanelProps {
  messages: Message[];
  isLoading: boolean;
  userInput: string;
  onUserInputChange: (value: string) => void;
  onSendMessage: () => void;
  autoInteract: boolean;
  onAutoInteractChange: (value: boolean) => void;
  interactionCount: number;
  maxInteractions: number;
  responseDelay: number;
  onResponseDelayChange: (seconds: number) => void;
  onExport?: () => void;
  botName1: string;
  botName2: string;
  model1: AIModel;
}

export function ChatPanel({
  messages,
  isLoading,
  userInput,
  onUserInputChange,
  onSendMessage,
  autoInteract,
  onAutoInteractChange,
  interactionCount,
  maxInteractions,
  responseDelay,
  onResponseDelayChange,
  onExport,
  botName1,
  botName2,
  model1
}: ChatPanelProps) {
  return (
    <div className="flex-1 bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span className="font-medium text-indigo-700">{botName1}</span>
          <span>vs</span>
          <span className="font-medium text-emerald-700">{botName2}</span>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && autoInteract && (
            <span className="text-xs text-gray-400 tabular-nums">
              Turn {interactionCount + 1} / {maxInteractions}
            </span>
          )}
          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <ConversationDisplay
          messages={messages}
          isLoading={isLoading}
          botName1={botName1}
          botName2={botName2}
          model1={model1}
        />
      </div>

      <div className="p-4 border-t space-y-3">
        <div className="flex gap-3">
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
            disabled={isLoading}
            placeholder="Type your opening message…"
            className="flex-1 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={onSendMessage}
            disabled={isLoading || !userInput.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {isLoading ? 'Thinking…' : 'Send'}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoInteract}
              onChange={(e) => onAutoInteractChange(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            Auto-interact (max {maxInteractions} turns)
          </label>

          {autoInteract && (
            <label className="flex items-center gap-2">
              Delay:
              <input
                type="number"
                min="0"
                max="30"
                step="0.5"
                value={responseDelay}
                onChange={(e) => onResponseDelayChange(Number(e.target.value))}
                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              sec
            </label>
          )}
        </div>
      </div>
    </div>
  );
}
