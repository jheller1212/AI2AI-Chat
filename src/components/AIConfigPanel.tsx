import React from 'react';
import { Bot } from 'lucide-react';
import { ModelConfig } from './ModelConfig';
import { AIModel } from '../types';

interface AIConfigPanelProps {
  title: string;
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
      <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
        <Bot className="w-5 h-5" />
        {title}
      </h2>
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
        <label className="block text-sm font-medium text-gray-700 mb-2">
          System Prompt
        </label>
        <textarea
          value={systemPrompt}
          onChange={(e) => onSystemPromptChange(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md min-h-[100px]"
          placeholder="Enter system prompt..."
        />
      </div>
    </div>
  );
}