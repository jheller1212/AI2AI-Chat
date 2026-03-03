import React from 'react';
import { Bot } from 'lucide-react';
import { ModelConfig } from './ModelConfig';
import { InfoTooltip } from './InfoTooltip';
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
  bubbleColor: string;
  onBubbleColorChange: (color: string) => void;
  textColor: string;
  onTextColorChange: (color: string) => void;
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
  bubbleColor,
  onBubbleColorChange,
  textColor,
  onTextColorChange,
}: AIConfigPanelProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Bot className="w-5 h-5 text-indigo-600 flex-shrink-0" />
        <div className="flex flex-col w-full">
          <label className="text-xs font-medium text-gray-500 mb-0.5">Bot name</label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            maxLength={50}
            className="text-base font-semibold text-gray-900 bg-transparent border-b border-gray-300 focus:border-indigo-500 focus:outline-none w-full"
            placeholder="Bot name"
          />
        </div>
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
        <div className="flex items-center gap-1.5 mb-2">
          <label className="text-sm font-medium text-gray-700">System Prompt</label>
          <InfoTooltip text="Instructions given to this AI at the start of every conversation. Use it to define the bot's persona, expertise, communication style, and any rules it should follow." />
        </div>
        <textarea
          value={systemPrompt}
          onChange={(e) => onSystemPromptChange(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md min-h-[100px] text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="Enter system prompt…"
        />
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-sm font-medium text-gray-700 mb-3">Message Appearance</p>
        <div className="flex gap-6">
          <label className="flex flex-col gap-1.5 text-xs text-gray-600">
            Bubble color
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bubbleColor}
                onChange={(e) => onBubbleColorChange(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-gray-200"
                title="Bubble background color"
              />
              <span className="font-mono text-gray-400">{bubbleColor}</span>
            </div>
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-gray-600">
            Text color
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={textColor}
                onChange={(e) => onTextColorChange(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-gray-200"
                title="Message text color"
              />
              <span className="font-mono text-gray-400">{textColor}</span>
            </div>
          </label>
        </div>
        <div
          className="mt-3 p-2 rounded text-xs"
          style={{ backgroundColor: bubbleColor, color: textColor }}
        >
          Preview: this is how messages will appear.
        </div>
      </div>
    </div>
  );
}
