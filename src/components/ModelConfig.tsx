import React, { useState } from 'react';
import { AIModel } from '../types';
import { Info } from 'lucide-react';
import { ApiKeyInstructions } from './ApiKeyInstructions';

interface ModelConfigProps {
  label: string;
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
  disabled?: boolean;
}

const MODEL_VERSIONS = [
  // GPT-4 Models
  { id: 'gpt-4-0125-preview', name: 'GPT-4 Turbo Preview', maxTokens: 128000 },
  { id: 'gpt-4-1106-preview', name: 'GPT-4 Turbo (Latest)', maxTokens: 128000 },
  { id: 'gpt-4', name: 'GPT-4', maxTokens: 8192 },
  { id: 'gpt-4-32k', name: 'GPT-4 32K', maxTokens: 32768 },
  // GPT-3.5 Models
  { id: 'gpt-3.5-turbo-0125', name: 'GPT-3.5 Turbo (Latest)', maxTokens: 16384 },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', maxTokens: 4096 },
  { id: 'gpt-3.5-turbo-16k', name: 'GPT-3.5 Turbo 16K', maxTokens: 16384 }
];

export function ModelConfig({
  label,
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
  disabled = false
}: ModelConfigProps) {
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <div className={`space-y-6 ${disabled ? 'opacity-50' : ''}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">API Key</label>
          <button
            type="button"
            className="inline-flex items-center px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-500 hover:bg-indigo-50 rounded-full transition-colors"
            onClick={() => setShowInstructions(true)}
            disabled={disabled}
          >
            <Info className="w-4 h-4 mr-1.5" />
            How to get API key
          </button>
        </div>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          placeholder="Enter OpenAI API key"
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Organization ID (Optional)</label>
        <input
          type="text"
          value={orgId}
          onChange={(e) => onOrgIdChange(e.target.value)}
          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          placeholder="Enter OpenAI organization ID"
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Model Version</label>
        <select
          value={modelVersion}
          onChange={(e) => {
            onModelVersionChange(e.target.value);
            const selectedVersion = MODEL_VERSIONS.find(v => v.id === e.target.value);
            if (selectedVersion) {
              onMaxTokensChange(Math.min(maxTokens, selectedVersion.maxTokens));
            }
          }}
          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          disabled={disabled}
        >
          {MODEL_VERSIONS.map((version) => (
            <option key={version.id} value={version.id}>
              {version.name} (max {version.maxTokens.toLocaleString()} tokens)
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Temperature ({temperature})
        </label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={temperature}
          onChange={(e) => onTemperatureChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Max Tokens (max: {MODEL_VERSIONS.find(v => v.id === modelVersion)?.maxTokens.toLocaleString()})
        </label>
        <input
          type="number"
          min="1"
          max={MODEL_VERSIONS.find(v => v.id === modelVersion)?.maxTokens || 32000}
          value={maxTokens}
          onChange={(e) => onMaxTokensChange(Number(e.target.value))}
          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          disabled={disabled}
        />
      </div>

      <ApiKeyInstructions
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        instructions="1. Go to platform.openai.com\n2. Sign up/Login\n3. Go to API keys section\n4. Create new secret key"
        modelName="OpenAI"
      />
    </div>
  );
}