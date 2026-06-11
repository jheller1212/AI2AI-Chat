import React from 'react';
import { Settings2, Zap, Download } from 'lucide-react';
import { FadeUp } from './FadeUp';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}

const features: Feature[] = [
  {
    icon: <Settings2 className="h-6 w-6 text-white" />,
    title: 'Configure & compare',
    description:
      'Pick any two AI models, give each its own role and system prompt, then watch them interact. Compare how GPT, Claude, Gemini, or Mistral handle the same scenario.',
    gradient: 'from-orange-500 to-orange-600',
  },
  {
    icon: <Zap className="h-6 w-6 text-white" />,
    title: 'Start in seconds',
    description:
      'Choose a built-in scenario — comedy roast, B2B negotiation, therapy session — or create your own. Pre-filled prompts mean you can start running experiments in seconds.',
    gradient: 'from-sky-500 to-sky-600',
  },
  {
    icon: <Download className="h-6 w-6 text-white" />,
    title: 'Export everything',
    description:
      'Download full conversation logs as CSV — word counts, response times, model settings, and message content — ready for analysis, reporting, or sharing with your team.',
    gradient: 'from-orange-500 to-sky-500',
  },
];

export function ResearchAreas() {
  return (
    <section className="py-20 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeUp className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600 mb-2">Features</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">What it does</h2>
        </FadeUp>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <FadeUp
              key={f.title}
              delay={0.1 + i * 0.1}
              className="group relative p-7 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-5 shadow-md`}>
                {f.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-600 leading-relaxed">{f.description}</p>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
