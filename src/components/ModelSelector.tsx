import React from 'react';
import { AIModel } from '../types';

interface ModelSelectorProps {
  label: string;
  value: AIModel;
  onChange: (model: AIModel) => void;
}

export function ModelSelector({ label, value, onChange }: ModelSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as AIModel)}
        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
      >
        <option value="gpt4">GPT-4 (OpenAI)</option>
        <option value="claude">Claude (Anthropic)</option>
        <option value="gemini">Gemini (Google)</option>
        <option value="mistral">Mistral</option>
      </select>
    </div>
  );
}
