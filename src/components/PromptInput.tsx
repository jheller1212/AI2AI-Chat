import React from 'react';

interface PromptInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function PromptInput({ label, value, onChange }: PromptInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 min-h-[100px]"
        placeholder="Enter prompt..."
      />
    </div>
  );
}