import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: "What is AI2AI-Chat?",
    a: "A free tool that puts two AI models in conversation with each other. You configure each model independently — provider, version, system prompt, temperature — then watch them converse and export the results. No coding required.",
  },
  {
    q: "Is it free?",
    a: "Yes. The platform is free. You bring your own API keys from OpenAI, Anthropic, Google, or Mistral and pay only those providers for the tokens you use.",
  },
  {
    q: "Which models are supported?",
    a: "GPT-4o and variants (OpenAI), Claude 3 / 3.5 (Anthropic), Gemini 1.5 Pro and Flash (Google), and Mistral Large / Medium / Small.",
  },
  {
    q: "Are my API keys safe?",
    a: "Keys are stored only in your browser's local storage — they are never sent to our servers. They are automatically cleared when you sign out.",
  },
  {
    q: "Is conversation data stored?",
    a: "By default, conversations are saved to your account so you can review them in the history panel. You can disable this per session with the 'Save to history' toggle in the app.",
  },
  {
    q: "Can I export the data?",
    a: "Yes. Download conversations as CSV (message content, word counts, response times, model settings, timestamps) or as plain text. Screenshot export is also available.",
  },
  {
    q: "What is auto-interact mode?",
    a: "The two AIs automatically take turns responding to each other up to a configured turn limit. Disable it to trigger each response manually.",
  },
  {
    q: "What is repetition mode?",
    a: "Runs the same conversation from scratch N times in sequence. Each run is saved separately and labelled in the export — useful for collecting multiple varied responses to the same prompt.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left text-gray-800 font-medium hover:text-orange-600 transition-colors gap-4"
      >
        <span>{q}</span>
        <ChevronDown
          className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <p className="pb-4 text-gray-600 text-sm leading-relaxed">{a}</p>
      )}
    </div>
  );
}

export function FAQ() {
  return (
    <div className="py-10 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">FAQ</h2>
        <div className="bg-white rounded-xl border border-gray-200 px-6">
          {faqs.map((item) => (
            <FAQItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </div>
    </div>
  );
}
