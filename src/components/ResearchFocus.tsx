import React from 'react';
import { FlaskConical, Briefcase, BookOpen } from 'lucide-react';
import { FadeUp } from './FadeUp';

interface UseCaseColumn {
  icon: React.ReactNode;
  title: string;
  points: string[];
  iconBg: string;
  dotColor: string;
}

const columns: UseCaseColumn[] = [
  {
    icon: <FlaskConical className="h-5 w-5 text-white" />,
    title: 'Research & academia',
    points: [
      'Compare how models reason through ethical dilemmas or logical puzzles',
      'Test whether rephrasing a system prompt meaningfully changes the outcome',
      'Run the same setup N times for statistical comparison across models',
    ],
    iconBg: 'bg-gradient-to-br from-orange-500 to-orange-600',
    dotColor: 'bg-orange-500',
  },
  {
    icon: <Briefcase className="h-5 w-5 text-white" />,
    title: 'Business & strategy',
    points: [
      'Simulate sales negotiations to find the most effective AI-driven pitch',
      'Stress-test customer service scripts before deploying them',
      'Brainstorm product ideas by letting two AI perspectives challenge each other',
    ],
    iconBg: 'bg-gradient-to-br from-sky-500 to-sky-600',
    dotColor: 'bg-sky-500',
  },
  {
    icon: <BookOpen className="h-5 w-5 text-white" />,
    title: 'Education & learning',
    points: [
      'Teach students how different AI models reason through the same problem',
      'Let learners observe AI behaviour in negotiation, therapy, or debate scenarios',
      'Share experiment configs via URL so an entire group starts from the same setup',
    ],
    iconBg: 'bg-gradient-to-br from-orange-500 to-sky-500',
    dotColor: 'bg-gradient-to-r from-orange-500 to-sky-500',
  },
];

export function ResearchFocus() {
  return (
    <section className="py-20 sm:py-24 bg-gradient-to-b from-orange-50 to-sky-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeUp className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600 mb-2">Use cases</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">What people use it for</h2>
        </FadeUp>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((col, i) => (
            <FadeUp
              key={col.title}
              delay={0.1 + i * 0.1}
              className="bg-white p-7 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl ${col.iconBg} flex items-center justify-center shadow-md flex-shrink-0`}>
                  {col.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{col.title}</h3>
              </div>
              <ul className="space-y-3">
                {col.points.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${col.dotColor}`} />
                    <p className="text-gray-600 leading-relaxed">{point}</p>
                  </li>
                ))}
              </ul>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
