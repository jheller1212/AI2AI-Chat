import React from 'react';
import { Brain, Microscope, LineChart } from 'lucide-react';

export function ResearchAreas() {
  return (
    <div className="py-20 bg-white/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Research Areas</h2>
          <p className="text-lg text-gray-600">Explore fundamental questions in AI interaction</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <ResearchCard
            icon={<Brain className="h-6 w-6 text-indigo-600" />}
            title="Cognitive Science"
            description="Study reasoning patterns, knowledge representation, and information processing between different AI models."
            bgColor="bg-indigo-100"
          />
          <ResearchCard
            icon={<Microscope className="h-6 w-6 text-indigo-600" />}
            title="Empirical Analysis"
            description="Conduct controlled experiments on AI interactions with detailed metrics and reproducible results."
            bgColor="bg-gradient-to-br from-indigo-100 to-emerald-100"
          />
          <ResearchCard
            icon={<LineChart className="h-6 w-6 text-emerald-600" />}
            title="Data Collection"
            description="Gather comprehensive interaction data for academic publication, including response patterns and behavioral metrics."
            bgColor="bg-emerald-100"
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