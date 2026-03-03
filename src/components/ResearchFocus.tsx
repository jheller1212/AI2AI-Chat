import React from 'react';

interface FocusPoint {
  title: string;
  points: string[];
  dotColor: string;
}

const focusAreas: FocusPoint[] = [
  {
    title: "Questions worth asking",
    points: [
      "Which model takes the conversational lead — and does it depend on the topic?",
      "Does rephrasing a system prompt meaningfully change the outcome?",
      "How do GPT-4 and Claude differ when reasoning through the same ethical dilemma?"
    ],
    dotColor: "bg-orange-500"
  },
  {
    title: "Controls at your fingertips",
    points: [
      "Independent system prompts, temperature, and max tokens per model",
      "Auto-interact with configurable delays and turn limits",
      "Repetition mode — run the same setup N times for statistical comparison"
    ],
    dotColor: "bg-sky-500"
  }
];

export function ResearchFocus() {
  return (
    <div className="py-20 bg-gradient-to-r from-orange-50 to-sky-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">What people use it for</h2>
          <p className="text-lg text-gray-600">From quick curiosity to structured research</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {focusAreas.map((area) => (
            <div key={area.title} className="bg-white p-8 rounded-xl shadow-md">
              <h3 className="text-2xl font-semibold mb-4">{area.title}</h3>
              <ul className="space-y-4">
                {area.points.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0">
                      <div className={`w-2 h-2 ${area.dotColor} rounded-full`}></div>
                    </div>
                    <p className="text-gray-600">{point}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
