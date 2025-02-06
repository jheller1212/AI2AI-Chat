import React from 'react';
import { X, ShieldAlert } from 'lucide-react';

interface ApiKeyInstructionsProps {
  isOpen: boolean;
  onClose: () => void;
  instructions: string;
  modelName: string;
}

export function ApiKeyInstructions({ isOpen, onClose, instructions, modelName }: ApiKeyInstructionsProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            How to get {modelName} API Key
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          {/* Security Notice */}
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ShieldAlert className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Security Notice</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Never share your API keys with anyone</li>
                    <li>API keys are stored locally in your browser only</li>
                    <li>We do not collect, store, or transmit your API keys</li>
                    <li>Treat your API keys like passwords</li>
                    <li>Regularly rotate your API keys for better security</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <ol className="space-y-3">
            {instructions.split('\n').map((step, index) => (
              <li key={index} className="flex items-start">
                <span className="flex items-center justify-center w-6 h-6 bg-indigo-100 rounded-full text-indigo-600 text-sm font-medium mr-3">
                  {index + 1}
                </span>
                <span className="text-gray-600">{step.substring(step.indexOf('.') + 2)}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="p-4 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}