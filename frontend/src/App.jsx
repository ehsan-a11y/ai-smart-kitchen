import { useState, useCallback } from 'react'
import IngredientPanel from './components/IngredientPanel'
import RecipeSuggestions from './components/RecipeSuggestions'
import CookingGuide from './components/CookingGuide'
import Kitchen3D from './components/Kitchen3D'

function parseNDJSON(text) {
  const results = []
  for (const line of text.split('\n')) {
    const t = line.trim()
    if (!t || !t.startsWith('{')) continue
    try { results.push(JSON.parse(t)) } catch {}
  }
  return results
}

function revealOneByOne(items, setter, delayMs = 180) {
  items.forEach((item, i) => {
    setTimeout(() => setter(prev => {
      if (prev.some(p => JSON.stringify(p) === JSON.stringify(item))) return prev
      return [...prev, item]
    }), i * delayMs)
  })
}

// Pull a human-friendly message out of an API error string
function parseErrorMessage(errStr) {
  try {
    // Try to extract nested Anthropic error message
    const match = errStr.match(/"message":"([^"]+)"/)
    if (match) return match[1]
  } catch {}
  return errStr
}

export default function App() {
  const [ingredients, setIngredients] = useState([])
  const [recipes, setRecipes] = useState([])
  const [recipesLoading, setRecipesLoading] = useState(false)
  const [recipesError, setRecipesError] = useState(null)

  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [overview, setOverview] = useState(null)
  const [steps, setSteps] = useState([])
  const [currentStep, setCurrentStep] = useState(0)
  const [guideLoading, setGuideLoading] = useState(false)
  const [guideError, setGuideError] = useState(null)

  const [view, setView] = useState('recipes')

  const addIngredient = useCallback(ing => setIngredients(prev => [...prev, ing]), [])
  const removeIngredient = useCallback(ing => setIngredients(prev => prev.filter(i => i !== ing)), [])

  // ── Recipe suggestions ──────────────────────────────────────────────
  const analyzeIngredients = useCallback(async () => {
    if (ingredients.length < 2) return
    setRecipes([])
    setRecipesError(null)
    setRecipesLoading(true)
    setSelectedRecipe(null)
    setView('recipes')

    try {
      const res = await fetch('/api/suggest-recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients })
      })
      const data = await res.json()

      if (data.error) {
        setRecipesError(parseErrorMessage(data.error))
      } else if (data.text) {
        const parsed = parseNDJSON(data.text).filter(r => r.id && r.name)
        if (parsed.length === 0) {
          setRecipesError('Chef Claude returned an unexpected format. Please try again.')
        } else {
          revealOneByOne(parsed, setRecipes, 220)
        }
      } else {
        setRecipesError('No response from Chef Claude. Please try again.')
      }
    } catch (err) {
      setRecipesError(`Network error: ${err.message}`)
    }
    setRecipesLoading(false)
  }, [ingredients])

  // ── Cooking guide ───────────────────────────────────────────────────
  const startCooking = useCallback(async (recipe) => {
    setSelectedRecipe(recipe)
    setOverview(null)
    setSteps([])
    setCurrentStep(0)
    setGuideError(null)
    setGuideLoading(true)
    setView('cooking')

    try {
      const res = await fetch('/api/cooking-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipe_name: recipe.name, ingredients, servings: 2 })
      })
      const data = await res.json()

      if (data.error) {
        setGuideError(parseErrorMessage(data.error))
      } else if (data.text) {
        const objs = parseNDJSON(data.text)
        const ov = objs.find(o => o.type === 'overview')
        const ss = objs.filter(o => o.type === 'step' && o.step && o.instruction)
        if (ov) setOverview(ov)
        if (ss.length === 0) {
          setGuideError('Chef Claude returned an unexpected format. Please try again.')
        } else {
          revealOneByOne(ss, setSteps, 120)
        }
      } else {
        setGuideError('No response from Chef Claude. Please try again.')
      }
    } catch (err) {
      setGuideError(`Network error: ${err.message}`)
    }
    setGuideLoading(false)
  }, [ingredients])

  const currentAnimation = view === 'cooking' && steps[currentStep]
    ? steps[currentStep].animation || 'idle'
    : 'idle'

  const handleBack = () => { setView('recipes'); setSelectedRecipe(null); setGuideError(null) }

  return (
    <div className="min-h-screen bg-kitchen-dark flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* ── Top bar ────────────────────────────────────────────── */}
      <header className="border-b border-slate-800/80 px-6 py-3 flex items-center justify-between backdrop-blur-sm sticky top-0 z-10 bg-kitchen-dark/90">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🍳</div>
          <div>
            <h1 className="text-lg font-bold gradient-text tracking-tight">AI Smart Kitchen</h1>
            <p className="text-xs text-slate-500">Powered by Claude AI Chef</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {view === 'cooking' && selectedRecipe && (
            <div className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-medium">
              🍽️ Cooking: {selectedRecipe.name}
            </div>
          )}
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        </div>
      </header>

      {/* ── Main layout ────────────────────────────────────────── */}
      <main className="flex-1 flex overflow-hidden" style={{ height: 'calc(100vh - 57px)' }}>

        {/* Left — Ingredients */}
        <aside className="w-72 flex-shrink-0 border-r border-slate-800 p-4 overflow-y-auto bg-slate-900/30">
          <IngredientPanel
            ingredients={ingredients}
            onAdd={addIngredient}
            onRemove={removeIngredient}
            onAnalyze={analyzeIngredients}
            loading={recipesLoading}
          />
        </aside>

        {/* Center — Recipes / Guide */}
        <div className="flex-1 min-w-0 border-r border-slate-800 p-5 overflow-hidden flex flex-col">
          {view === 'recipes' ? (
            <RecipeSuggestions
              recipes={recipes}
              loading={recipesLoading}
              error={recipesError}
              onSelect={startCooking}
              onRetry={analyzeIngredients}
              ingredients={ingredients}
            />
          ) : (
            <CookingGuide
              overview={overview}
              steps={steps}
              currentStep={currentStep}
              loading={guideLoading}
              error={guideError}
              onStepSelect={setCurrentStep}
              onBack={handleBack}
            />
          )}
        </div>

        {/* Right — 3D Kitchen */}
        <aside className="w-[420px] flex-shrink-0 p-4 flex flex-col gap-3 bg-slate-900/20">
          <div className="flex-1 min-h-0">
            <Kitchen3D animationType={currentAnimation} ingredients={ingredients} />
          </div>

          {view === 'cooking' && steps[currentStep] && (
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex-shrink-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-white">Step {steps[currentStep].step}:</span>
                <span className="text-sm text-green-400">{steps[currentStep].title}</span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2">{steps[currentStep].instruction}</p>
              {steps[currentStep].duration && (
                <div className="mt-1.5 text-xs text-amber-400">⏱️ {steps[currentStep].duration}</div>
              )}
            </div>
          )}

          {view === 'recipes' && (
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3 flex-shrink-0 text-center">
              <p className="text-xs text-slate-500">
                {ingredients.length > 0
                  ? <><span className="text-amber-400">🥗 Ingredients ready!</span> Click Find My Recipes.</>
                  : 'Add ingredients to see your kitchen come alive ✨'}
              </p>
            </div>
          )}
        </aside>
      </main>
    </div>
  )
}
