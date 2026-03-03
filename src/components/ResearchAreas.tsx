import React from 'react';
import { Settings2, FlaskConical, Download } from 'lucide-react';

export function ResearchAreas() {
  return (
    <div className="py-20 bg-white/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">What it does</h2>
          <p className="text-lg text-gray-600">Three things, done well</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <ResearchCard
            icon={<Settings2 className="h-6 w-6 text-orange-600" />}
            title="Compare models"
            description="Pick any two AI models and put them in the same scenario. See how GPT and Claude respond to each other's arguments, reasoning, and creative choices."
            bgColor="bg-orange-100"
          />
          <ResearchCard
            icon={<FlaskConical className="h-6 w-6 text-sky-600" />}
            title="Run experiments"
            description="Set prompts, temperature, and turn counts. Run the same setup multiple times for reproducible results. Control delays between responses."
            bgColor="bg-sky-100"
          />
          <ResearchCard
            icon={<Download className="h-6 w-6 text-orange-600" />}
            title="Export everything"
            description="Download full conversation logs as CSV — including word counts, response times, model settings, and message content — ready for analysis."
            bgColor="bg-orange-100"
          />
        </div>
      </div>
    </div>
  );
}

interface ResearchCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  bgColor: string;
}

function ResearchCard({ icon, title, description, bgColor }: ResearchCardProps) {
  return (
    <div className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all">
      <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
