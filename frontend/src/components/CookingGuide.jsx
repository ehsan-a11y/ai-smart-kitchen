import { Clock, ChevronLeft, ChevronRight, CheckCircle2, Circle, Timer, Lightbulb, Loader, ArrowLeft } from 'lucide-react'

const ANIMATION_ICONS = {
  chop: '🔪', slice: '🔪', dice: '🔪',
  stir: '🥄', cook: '🥄',
  boil: '💧', simmer: '💧',
  fry: '🍳', saute: '🍳',
  mix: '🥣', whisk: '🥣', blend: '🥣',
  bake: '🔥', roast: '🔥',
  pour: '🫗', add: '🫗',
  plate: '🍽️', serve: '🍽️',
  season: '🧂', salt: '🧂',
  heat: '🔥', wash: '🚿', cool: '❄️',
  idle: '👨‍🍳'
}

export default function CookingGuide({ overview, steps, currentStep, loading, error, onStepSelect, onBack }) {
  const totalSteps = steps.length
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0
  const step = steps[currentStep]
  const canPrev = currentStep > 0
  const canNext = currentStep < totalSteps - 1

  if (error) {
    const isCredits = error.toLowerCase().includes('credit') || error.toLowerCase().includes('balance')
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 gap-4">
        <div className="text-5xl">😔</div>
        <div>
          <h3 className="text-lg font-semibold text-red-400 mb-2">Couldn't load cooking guide</h3>
          <p className="text-slate-400 text-sm max-w-sm leading-relaxed">{error}</p>
        </div>
        {isCredits && (
          <a
            href="https://console.anthropic.com/settings/billing"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-medium hover:bg-amber-500/20 transition-colors"
          >
            💳 Add Credits at console.anthropic.com →
          </a>
        )}
        <button onClick={onBack} className="px-4 py-2 rounded-xl bg-slate-700 border border-slate-600 text-slate-300 text-sm hover:bg-slate-600 transition-colors">
          ← Back to Recipes
        </button>
      </div>
    )
  }

  if (loading && !overview) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-green-500/20 border-t-green-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">📋</div>
        </div>
        <div className="text-center">
          <p className="text-white font-medium">Preparing your guide...</p>
          <p className="text-slate-400 text-sm mt-1">Chef Claude is writing your recipe steps</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Back button + header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-all"
        >
          <ArrowLeft size={15} />
        </button>
        {overview && (
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-white text-sm truncate">{overview.name}</h2>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Clock size={11} />{overview.total_time}</span>
              <span>•</span>
              <span>{overview.servings} servings</span>
              <span>•</span>
              <span>{totalSteps} steps</span>
            </div>
          </div>
        )}
        {loading && <Loader size={14} className="text-green-400 animate-spin flex-shrink-0" />}
      </div>

      {/* Progress bar */}
      {totalSteps > 0 && (
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span>Step {currentStep + 1} of {totalSteps}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="progress-fill h-full rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Current step - hero */}
      {step && (
        <div className="step-active border border-green-500/30 rounded-xl p-4 flex-shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center text-lg flex-shrink-0">
              {ANIMATION_ICONS[step.animation] || '👨‍🍳'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-green-400 uppercase tracking-wide">Step {step.step}</span>
                {step.duration && (
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Timer size={10} />{step.duration}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-white text-sm mb-1">{step.title}</h3>
              <p className="text-slate-300 text-sm leading-relaxed">{step.instruction}</p>
              {step.tip && (
                <div className="mt-2.5 flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                  <Lightbulb size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-300">{step.tip}</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-green-500/20">
            <button
              onClick={() => canPrev && onStepSelect(currentStep - 1)}
              disabled={!canPrev}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800 border border-slate-700 hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={14} /> Prev
            </button>

            {/* Step dots */}
            <div className="flex gap-1.5">
              {steps.slice(0, Math.min(steps.length, 10)).map((_, i) => (
                <button
                  key={i}
                  onClick={() => onStepSelect(i)}
                  className={`rounded-full transition-all ${i === currentStep ? 'w-4 h-2 bg-green-400' : i < currentStep ? 'w-2 h-2 bg-green-600' : 'w-2 h-2 bg-slate-600'}`}
                />
              ))}
            </div>

            {canNext ? (
              <button
                onClick={() => onStepSelect(currentStep + 1)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-green-600 hover:bg-green-500 transition-all"
              >
                Next <ChevronRight size={14} />
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-green-400 bg-green-400/10 border border-green-400/30">
                <CheckCircle2 size={14} /> Done!
              </div>
            )}
          </div>
        </div>
      )}

      {/* All steps list */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-2">All Steps</p>
        {steps.map((s, i) => (
          <button
            key={i}
            onClick={() => onStepSelect(i)}
            className={`w-full text-left rounded-xl px-3 py-2.5 flex items-center gap-3 transition-all border
              ${i === currentStep
                ? 'bg-green-500/10 border-green-500/30'
                : i < currentStep
                ? 'bg-slate-800/40 border-slate-700/40 opacity-70'
                : 'bg-slate-800/30 border-slate-700/30 hover:border-slate-600'
              }`}
          >
            {i < currentStep ? (
              <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
            ) : i === currentStep ? (
              <div className="w-4 h-4 rounded-full bg-green-500 flex-shrink-0 animate-pulse" />
            ) : (
              <Circle size={16} className="text-slate-600 flex-shrink-0" />
            )}
            <span className={`text-xs flex-1 truncate ${i === currentStep ? 'text-green-300 font-medium' : i < currentStep ? 'text-slate-500 line-through' : 'text-slate-400'}`}>
              {s.step}. {s.title}
            </span>
            <span className="text-xs">{ANIMATION_ICONS[s.animation] || ''}</span>
          </button>
        ))}
        {loading && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800/30 border border-slate-700/30">
            <div className="w-4 h-4 rounded-full border-2 border-green-500/30 border-t-green-500 animate-spin flex-shrink-0" />
            <span className="text-xs text-slate-500">Loading more steps...</span>
          </div>
        )}
      </div>
    </div>
  )
}
