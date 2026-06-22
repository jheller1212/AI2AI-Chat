import React, { useState } from 'react';
import { AIModel } from '../types';
import { Info } from 'lucide-react';
import { ApiKeyInstructions } from './ApiKeyInstructions';
import { InfoTooltip } from './InfoTooltip';
import { MaskedKeyInput } from './MaskedKeyInput';
import { loadVault } from '../lib/apiKeyVault';
import { PROVIDER_MODELS, supportsTemperature } from '../lib/models';

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

const PROVIDER_LABELS: Record<AIModel, string> = {
  gpt4: 'OpenAI',
  claude: 'Anthropic Claude',
  gemini: 'Google Gemini',
  mistral: 'Mistral',
};

const API_KEY_PLACEHOLDERS: Record<AIModel, string> = {
  gpt4: 'sk-...',
  claude: 'sk-ant-...',
  gemini: 'AIza...',
  mistral: 'Your Mistral API key',
};

const API_KEY_INSTRUCTIONS: Record<AIModel, { url: string; label: string; steps: string[] }> = {
  gpt4: {
    url: 'https://platform.openai.com/api-keys',
    label: 'platform.openai.com',
    steps: ['Sign in or create an account', 'Go to API keys', 'Create new secret key'],
  },
  claude: {
    url: 'https://console.anthropic.com/settings/keys',
    label: 'console.anthropic.com',
    steps: ['Sign in or create an account', 'Go to API keys', 'Create new key'],
  },
  gemini: {
    url: 'https://aistudio.google.com/app/apikey',
    label: 'aistudio.google.com',
    steps: ['Sign in with Google', 'Click "Get API key"', 'Create API key'],
  },
  mistral: {
    url: 'https://console.mistral.ai/api-keys/',
    label: 'console.mistral.ai',
    steps: ['Sign in or create an account', 'Go to API keys', 'Create new key'],
  },
};

export function ModelConfig({
  label: _label,
  model,
  onModelChange,
  apiKey,
  onApiKeyChange,
  orgId: _orgId,
  onOrgIdChange: _onOrgIdChange,
  modelVersion,
  onModelVersionChange,
  temperature,
  onTemperatureChange,
  maxTokens,
  onMaxTokensChange,
  disabled = false
}: ModelConfigProps) {
  const [showInstructions, setShowInstructions] = useState(false);

  const versions = PROVIDER_MODELS[model];
  const currentMax = versions.find(v => v.id === modelVersion)?.maxTokens ?? 8192;

  const handleProviderChange = (newModel: AIModel) => {
    onModelChange(newModel);
    const firstVersion = PROVIDER_MODELS[newModel][0];
    onModelVersionChange(firstVersion.id);
    onMaxTokensChange(Math.min(maxTokens, firstVersion.maxTokens));
    const vaultKey = loadVault()[newModel];
    if (vaultKey) onApiKeyChange(vaultKey);
  };

  return (
    <div className={`space-y-3 ${disabled ? 'opacity-50' : ''}`}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">AI Provider</label>
        <select
          value={model}
          onChange={(e) => handleProviderChange(e.target.value as AIModel)}
          className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          disabled={disabled}
        >
          {(Object.keys(PROVIDER_LABELS) as AIModel[]).map((m) => (
            <option key={m} value={m}>{PROVIDER_LABELS[m]}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">API Key</label>
          <button
            type="button"
            className="inline-flex items-center px-3 py-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-colors"
            onClick={() => setShowInstructions(true)}
            disabled={disabled}
          >
            <Info className="w-3.5 h-3.5 mr-1" />
            How to get key
          </button>
        </div>
        <MaskedKeyInput
          value={apiKey}
          onChange={onApiKeyChange}
          className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          placeholder={API_KEY_PLACEHOLDERS[model]}
          disabled={disabled}
        />
        <p className="text-[11px] text-gray-400 dark:text-gray-500">Encrypted · persists across sessions</p>
      </div>

      {/* Organization ID removed — it causes silent failures with direct browser API calls */}

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Model</label>
        <select
          value={modelVersion}
          onChange={(e) => {
            onModelVersionChange(e.target.value);
            const v = versions.find(v => v.id === e.target.value);
            if (v) onMaxTokensChange(Math.min(maxTokens, v.maxTokens));
          }}
          className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          disabled={disabled}
        >
          {versions.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Temperature ({temperature})</label>
          <InfoTooltip text="Controls how random the AI's output is. 0 = deterministic and focused (always picks the most likely word). Higher values produce more varied, creative responses. Values above 1 can become incoherent." />
        </div>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={temperature}
          onChange={(e) => onTemperatureChange(Number(e.target.value))}
          aria-label={`Temperature: ${temperature}`}
          className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          disabled={disabled}
        />
        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>Focused</span>
          <span>Creative</span>
        </div>
        {!supportsTemperature(modelVersion) && (
          <p className="text-[11px] text-amber-600 dark:text-amber-400">
            This model (Opus 4.7+) ignores temperature — it uses adaptive reasoning, so this setting won't affect its output.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Max Tokens (max: {currentMax.toLocaleString()})</label>
          <InfoTooltip text="The maximum number of tokens (roughly ¾ of a word each) the AI can generate per response. Higher values allow longer replies but cost more and take longer. Keep it lower to get concise answers." />
        </div>
        <input
          type="number"
          min="1"
          max={currentMax}
          value={maxTokens}
          onChange={(e) => {
            const v = Number(e.target.value);
            onMaxTokensChange(Math.max(1, Math.min(v, currentMax)));
          }}
          className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          disabled={disabled}
        />
      </div>

      <ApiKeyInstructions
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        instructions={API_KEY_INSTRUCTIONS[model]}
        modelName={PROVIDER_LABELS[model]}
      />
    </div>
  );
}
