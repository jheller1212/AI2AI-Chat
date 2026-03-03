import React, { useRef, useState } from 'react';
import { Send, Download, Camera, RotateCcw, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react';
import html2canvas from 'html2canvas';
import { ConversationDisplay } from './ConversationDisplay';
import { Message, AIModel } from '../types';

interface ChatPanelProps {
  messages: Message[];
  isLoading: boolean;
  userInput: string;
  onUserInputChange: (value: string) => void;
  onSendMessage: () => void;
  autoInteract: boolean;
  onAutoInteractChange: (value: boolean) => void;
  interactionCount: number;
  maxInteractions: number;
  onMaxInteractionsChange: (n: number) => void;
  responseDelay: number;
  onResponseDelayChange: (seconds: number) => void;
  delayVariance: boolean;
  onDelayVarianceChange: (v: boolean) => void;
  repetitionCount: number;
  onRepetitionCountChange: (n: number) => void;
  repetitionCurrent: number;
  onExportTxt?: () => void;
  onExportCsv?: () => void;
  onResetChat?: () => void;
  botName1: string;
  botName2: string;
  model1: AIModel;
  bubbleColor1: string;
  bubbleColor2: string;
  textColor1: string;
  textColor2: string;
}

export function ChatPanel({
  messages,
  isLoading,
  userInput,
  onUserInputChange,
  onSendMessage,
  autoInteract,
  onAutoInteractChange,
  interactionCount,
  maxInteractions,
  onMaxInteractionsChange,
  responseDelay,
  onResponseDelayChange,
  delayVariance,
  onDelayVarianceChange,
  repetitionCount,
  onRepetitionCountChange,
  repetitionCurrent,
  onExportTxt,
  onExportCsv,
  onResetChat,
  botName1,
  botName2,
  model1,
  bubbleColor1,
  bubbleColor2,
  textColor1,
  textColor2,
}: ChatPanelProps) {
  const conversationRef = useRef<HTMLDivElement>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [screenshotting, setScreenshotting] = useState(false);

  const handleScreenshot = async () => {
    if (!conversationRef.current) return;
    setScreenshotting(true);
    setShowExportMenu(false);
    try {
      const canvas = await html2canvas(conversationRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        scrollY: -window.scrollY,
      });
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai2ai-conversation-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
      });
    } catch (e) {
      console.error('Screenshot failed:', e);
    } finally {
      setScreenshotting(false);
    }
  };

  const hasMessages = onExportTxt != null;

  return (
    <div className="flex-1 bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span className="font-medium" style={{ color: textColor1 !== '#312E81' ? textColor1 : '#4338CA' }}>{botName1}</span>
          <span className="text-gray-400">vs</span>
          <span className="font-medium" style={{ color: textColor2 !== '#064E3B' ? textColor2 : '#047857' }}>{botName2}</span>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && autoInteract && (
            <span className="text-xs text-gray-400 tabular-nums">
              {repetitionCount > 1 && `Run ${repetitionCurrent + 1}/${repetitionCount} · `}
              Turn {interactionCount + 1}/{maxInteractions}
            </span>
          )}

          {onResetChat && (
            <button
              onClick={onResetChat}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:text-red-600 border border-gray-300 hover:border-red-300 rounded-lg hover:bg-red-50 transition-colors"
              title="Clear chat display (data kept in history)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}

          {/* Export dropdown */}
          {hasMessages && (
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export
                <ChevronDown className="w-3 h-3" />
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 z-10 overflow-hidden">
                  <button
                    onClick={() => { onExportTxt?.(); setShowExportMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    <FileText className="w-3.5 h-3.5 text-gray-400" />
                    Download .txt
                  </button>
                  <button
                    onClick={() => { onExportCsv?.(); setShowExportMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-gray-400" />
                    Download .csv
                  </button>
                  <button
                    onClick={handleScreenshot}
                    disabled={screenshotting}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Camera className="w-3.5 h-3.5 text-gray-400" />
                    {screenshotting ? 'Capturing…' : 'Screenshot (.png)'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Conversation area */}
      <div className="flex-1 overflow-y-auto p-4" ref={conversationRef}>
        <ConversationDisplay
          messages={messages}
          isLoading={isLoading}
          botName1={botName1}
          botName2={botName2}
          model1={model1}
          bubbleColor1={bubbleColor1}
          bubbleColor2={bubbleColor2}
          textColor1={textColor1}
          textColor2={textColor2}
        />
      </div>

      {/* Input area */}
      <div className="p-4 border-t space-y-3">
        <div className="flex gap-3">
          <input
            type="text"
            value={userInput}
            onChange={(e) => onUserInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSendMessage();
              }
            }}
            disabled={isLoading}
            placeholder="Opening message (optional — leave blank to let system prompts guide the AIs)"
            className="flex-1 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={onSendMessage}
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {isLoading ? 'Thinking…' : 'Send'}
          </button>
        </div>

        {/* Controls row */}
        <div className="flex flex-wrap items-start gap-x-6 gap-y-3 text-sm text-gray-600">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoInteract}
              onChange={(e) => onAutoInteractChange(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            Auto-interact
          </label>

          {autoInteract && (
            <>
              {/* Max turns */}
              <label className="flex items-center gap-2">
                <span className="text-gray-500">Max turns</span>
                <input
                  type="number"
                  min="1"
                  max="50"
                  step="1"
                  value={maxInteractions}
                  onChange={(e) => onMaxInteractionsChange(Math.max(1, Number(e.target.value)))}
                  className="w-14 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </label>

              {/* Delay slider */}
              <label className="flex items-center gap-2">
                <span className="text-gray-500">Delay</span>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="0.5"
                  value={responseDelay}
                  onChange={(e) => onResponseDelayChange(Number(e.target.value))}
                  className="w-24 accent-indigo-600"
                />
                <span className="tabular-nums w-10 text-right">{responseDelay}s</span>
              </label>

              {/* Length-based variance */}
              <label className="flex items-center gap-2 cursor-pointer" title="Adds extra delay proportional to message length (simulates reading time)">
                <input
                  type="checkbox"
                  checked={delayVariance}
                  onChange={(e) => onDelayVarianceChange(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-gray-500">Length-based delay</span>
              </label>

              {/* Repetitions */}
              <label className="flex items-center gap-2">
                <span className="text-gray-500">Repeat</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  value={repetitionCount}
                  onChange={(e) => onRepetitionCountChange(Math.max(1, Number(e.target.value)))}
                  className="w-14 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <span className="text-gray-500">conversations</span>
              </label>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
