import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';

const TOUR_KEY = 'ai2ai_tour_done';
const SPOTLIGHT_PADDING = 10;
const TOOLTIP_WIDTH = 310;

interface TourStep {
  target: string | null;
  title: string;
  description: string;
  side?: 'left' | 'right' | 'bottom' | 'top';
}

const STEPS: TourStep[] = [
  {
    target: null,
    title: 'Welcome to AI2AI Chat',
    description: "You're about to run conversations between two AI models. This quick tour walks you through the app — takes less than a minute.",
  },
  {
    target: '[data-tour="bot1-panel"]',
    title: 'Configure Bot 1',
    description: 'Choose a provider (OpenAI, Claude, Gemini, or Mistral), paste your API key, pick a model version, and write a system prompt to define this bot\'s personality or role. On mobile, tap the Settings icon in the header to open the config panels.',
    side: 'right',
  },
  {
    target: '[data-tour="bot2-panel"]',
    title: 'Configure Bot 2',
    description: 'Set up the second bot as the other side of the debate or discussion. For the most interesting conversations, give it a contrasting system prompt. Both bots are configured in the same Settings panel on mobile.',
    side: 'left',
  },
  {
    target: '[data-tour="chat-input"]',
    title: 'Start the Conversation',
    description: 'Type an opening topic or question and press Send. You can also leave it blank — the bots will start talking based on their system prompts alone.',
    side: 'top',
  },
  {
    target: '[data-tour="chat-controls"]',
    title: 'Control the Flow',
    description: 'Toggle auto-interact to let the bots reply to each other automatically. Set how many messages each bot sends, add a delay between responses, and repeat the same conversation multiple times to collect varied outputs for research.',
    side: 'top',
  },
  {
    target: '[data-tour="chat-tabs"]',
    title: 'Chat View & Data View',
    description: 'Watch the live conversation in the Chat tab. Switch to Data for real-time metrics — response times, word counts, and per-message model info. Use the Export button to download a .txt transcript or .csv file for analysis.',
    side: 'bottom',
  },
  {
    target: null,
    title: "You're all set!",
    description: "Configure your two bots and fire off your first AI-to-AI conversation. Your sessions are saved automatically — access them any time from the History button in the top bar.",
  },
];

interface ContentProps {
  step: number;
  total: number;
  title: string;
  description: string;
  isFirst: boolean;
  isLast: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSkip: () => void;
}

function TourContent({ step, total, title, description, isFirst, isLast, onPrev, onNext, onSkip }: ContentProps) {
  return (
    <>
      {/* Progress + skip */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === step
                  ? 'w-5 bg-indigo-600'
                  : i < step
                  ? 'w-1.5 bg-indigo-300'
                  : 'w-1.5 bg-gray-200 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>
        {!isLast && (
          <button
            onClick={onSkip}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            Skip tour
          </button>
        )}
      </div>

      {isLast && (
        <div className="flex justify-center py-1">
          <CheckCircle className="w-12 h-12 text-emerald-500" />
        </div>
      )}

      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white text-base leading-snug">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1.5 leading-relaxed">{description}</p>
      </div>

      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onPrev}
          disabled={isFirst}
          className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 disabled:opacity-0 disabled:pointer-events-none transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg font-medium transition-colors"
        >
          {isLast ? 'Get started' : 'Next'}
          {!isLast && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </>
  );
}

interface OnboardingTourProps {
  onComplete: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [measuring, setMeasuring] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const currentStep = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  const computeTooltipPos = useCallback((r: DOMRect, side?: TourStep['side']): { top: number; left: number; width: number } => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const sp = SPOTLIGHT_PADDING;
    const tw = Math.min(TOOLTIP_WIDTH, vw - 16); // never wider than viewport
    const th = 220; // estimated tooltip height

    const spLeft = r.left - sp;
    const spTop = r.top - sp;
    const spRight = r.right + sp;
    const spBottom = r.bottom + sp;

    const gap = 14;

    if (side === 'right' || (!side && spRight + tw + gap < vw)) {
      return {
        left: spRight + gap,
        top: Math.min(Math.max(spTop + (r.height + sp * 2) / 2 - th / 2, 8), vh - th - 8),
        width: tw,
      };
    }
    if (side === 'left' || (!side && spLeft - tw - gap > 0)) {
      return {
        left: spLeft - tw - gap,
        top: Math.min(Math.max(spTop + (r.height + sp * 2) / 2 - th / 2, 8), vh - th - 8),
        width: tw,
      };
    }
    if (side === 'top' || (!side && spTop - th - gap > 0)) {
      return {
        left: Math.min(Math.max(r.left, 8), vw - tw - 8),
        top: spTop - th - gap,
        width: tw,
      };
    }
    // Default: below
    return {
      left: Math.min(Math.max(r.left, 8), vw - tw - 8),
      top: spBottom + gap,
      width: tw,
    };
  }, []);

  const measureTarget = useCallback(() => {
    if (!currentStep.target) {
      setRect(null);
      setTooltipPos(null);
      setMeasuring(false);
      return;
    }
    setMeasuring(true);
    const timer = setTimeout(() => {
      const el = document.querySelector(currentStep.target!);
      const r = el ? el.getBoundingClientRect() : null;
      // Treat hidden elements (display:none → zero dimensions) same as missing
      if (r && r.width > 0 && r.height > 0) {
        setRect(r);
        setTooltipPos(computeTooltipPos(r, currentStep.side));
      } else {
        setRect(null);
        setTooltipPos(null);
      }
      setMeasuring(false);
    }, 80);
    return timer;
  }, [currentStep, computeTooltipPos]);

  useEffect(() => {
    const timer = measureTarget();
    const handleResize = () => {
      const el = currentStep.target ? document.querySelector(currentStep.target) : null;
      const r = el ? el.getBoundingClientRect() : null;
      if (r && r.width > 0 && r.height > 0) {
        setRect(r);
        setTooltipPos(computeTooltipPos(r, currentStep.side));
      } else {
        setRect(null);
        setTooltipPos(null);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [measureTarget, currentStep, computeTooltipPos]);

  const handleDone = () => {
    localStorage.setItem(TOUR_KEY, '1');
    onComplete();
  };

  const handleNext = () => {
    if (isLast) handleDone();
    else setStep(s => s + 1);
  };

  const handlePrev = () => {
    if (!isFirst) setStep(s => s - 1);
  };

  const hasSpotlight = !!rect && !measuring;
  const isModal = !currentStep.target || (!hasSpotlight && !measuring);

  const contentProps: ContentProps = {
    step,
    total: STEPS.length,
    title: currentStep.title,
    description: currentStep.description,
    isFirst,
    isLast,
    onPrev: handlePrev,
    onNext: handleNext,
    onSkip: handleDone,
  };

  return (
    <>
      {/* Backdrop */}
      {hasSpotlight ? (
        // Transparent click-blocker — dark effect comes from spotlight box-shadow
        <div className="fixed inset-0 z-[1000]" />
      ) : isModal ? (
        // Solid backdrop for modal steps
        <div className="fixed inset-0 z-[1000] bg-black/70" />
      ) : null}

      {/* Spotlight cutout */}
      {hasSpotlight && rect && (
        <div
          style={{
            position: 'fixed',
            top: rect.top - SPOTLIGHT_PADDING,
            left: rect.left - SPOTLIGHT_PADDING,
            width: rect.width + SPOTLIGHT_PADDING * 2,
            height: rect.height + SPOTLIGHT_PADDING * 2,
            borderRadius: 10,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.72)',
            zIndex: 1001,
            pointerEvents: 'none',
            transition: 'top 0.2s ease, left 0.2s ease, width 0.2s ease, height 0.2s ease',
          }}
        />
      )}

      {/* Tooltip next to spotlight */}
      {hasSpotlight && tooltipPos && (
        <div
          style={{
            position: 'fixed',
            top: tooltipPos.top,
            left: tooltipPos.left,
            width: tooltipPos.width,
            zIndex: 1002,
          }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 p-5 space-y-3"
        >
          <TourContent {...contentProps} />
        </div>
      )}

      {/* Centered modal for null-target steps */}
      {isModal && !measuring && (
        <div className="fixed inset-0 z-[1002] flex items-center justify-center p-4 pointer-events-none">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 p-8 max-w-sm w-full space-y-4 pointer-events-auto">
            <TourContent {...contentProps} />
          </div>
        </div>
      )}
    </>
  );
}
