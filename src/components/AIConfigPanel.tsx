import React from 'react';
import { Bot } from 'lucide-react';
import { ModelConfig } from './ModelConfig';
import { AIModel } from '../types';

interface AIConfigPanelProps {
  title: string;
  onTitleChange: (name: string) => void;
  model: AIModel;
  onModelChange: (model: AIModel) => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  orgId: string;
  onOrgIdChange: (id: string) => void;
  modelVersion: string;
  onModelVersionChange: (version: string) => void;
  temperature: number;
  onTemperatureChange: (temp: number) => void;
  maxTokens: number;
  onMaxTokensChange: (tokens: number) => void;
  systemPrompt: string;
  onSystemPromptChange: (prompt: string) => void;
}

export function AIConfigPanel({
  title,
  onTitleChange,
  model,
  onModelChange,
  apiKey,
  onApiKeyChange,
  orgId,
  onOrgIdChange,
  modelVersion,
  onModelVersionChange,
  temperature,
  onTemperatureChange,
  maxTokens,
  onMaxTokensChange,
  systemPrompt,
  onSystemPromptChange,
}: AIConfigPanelProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Bot className="w-5 h-5 text-indigo-600 flex-shrink-0" />
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          maxLength={50}
          className="text-lg font-medium text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-indigo-500 focus:outline-none w-full"
          placeholder="Bot name"
        />
      </div>
      <ModelConfig
        label="Model Settings"
        model={model}
        onModelChange={onModelChange}
        apiKey={apiKey}
        onApiKeyChange={onApiKeyChange}
        orgId={orgId}
        onOrgIdChange={onOrgIdChange}
        modelVersion={modelVersion}
        onModelVersionChange={onModelVersionChange}
        temperature={temperature}
        onTemperatureChange={onTemperatureChange}
        maxTokens={maxTokens}
        onMaxTokensChange={onMaxTokensChange}
      />
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">System Prompt</label>
        <textarea
          value={systemPrompt}
          onChange={(e) => onSystemPromptChange(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md min-h-[100px] text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="Enter system prompt…"
        />
      </div>
    </div>
  );
}
