import React from 'react';
import { Bot, FlaskConical } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center">
      <div className="relative">
        <FlaskConical className="h-8 w-8 text-orange-500" />
        <Bot className="h-4 w-4 text-sky-500 absolute -bottom-1 -right-1" />
      </div>
      <span className="ml-2 text-xl font-bold bg-gradient-to-r from-orange-500 to-sky-500 text-transparent bg-clip-text">
        AI2AI-Chat
      </span>
      <span className="ml-2 text-sm text-gray-600">Research Platform</span>
    </div>
  );
}
