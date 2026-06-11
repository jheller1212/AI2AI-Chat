import React from 'react';
import { Bot } from 'lucide-react';

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center">
      <div className="relative flex items-center">
        <Bot className={`h-7 w-7 ${light ? 'text-orange-400' : 'text-orange-500'}`} />
        <Bot className={`h-7 w-7 -ml-2 ${light ? 'text-sky-400' : 'text-sky-500'}`} />
      </div>
      <span className={`ml-2 text-xl font-heading font-bold ${light ? 'text-white' : 'text-lab-heading dark:text-white'}`}>
        AI2AI-Chat
      </span>
      <span className={`ml-2 text-xs font-medium tracking-wide uppercase ${light ? 'text-white/70' : 'text-lab-body dark:text-gray-400'}`}>
        for Research
      </span>
    </div>
  );
}
