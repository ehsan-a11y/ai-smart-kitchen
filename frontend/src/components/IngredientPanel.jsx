import { useState } from 'react'
import { Plus, X, ChefHat, Search, Sparkles } from 'lucide-react'

const SUGGESTIONS = [
  'Chicken', 'Pasta', 'Tomatoes', 'Garlic', 'Onion', 'Eggs', 'Butter',
  'Cheese', 'Rice', 'Broccoli', 'Spinach', 'Salmon', 'Beef', 'Potatoes',
  'Mushrooms', 'Bell Pepper', 'Lemon', 'Olive Oil', 'Cream', 'Flour'
]

export default function IngredientPanel({ ingredients, onAdd, onRemove, onAnalyze, loading }) {
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const filtered = SUGGESTIONS.filter(s =>
    s.toLowerCase().includes(input.toLowerCase()) &&
    !ingredients.some(i => i.toLowerCase() === s.toLowerCase())
  ).slice(0, 6)

  const handleAdd = (val) => {
    const v = (val || input).trim()
    if (v && !ingredients.some(i => i.toLowerCase() === v.toLowerCase())) {
      onAdd(v)
      setInput('')
      setShowSuggestions(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter') handleAdd()
    if (e.key === 'Escape') setShowSuggestions(false)
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
          <ChefHat size={20} className="text-white" />
        </div>
        <div>
          <h2 className="font-bold text-lg text-white">My Ingredients</h2>
          <p className="text-xs text-slate-400">Add what you have in your kitchen</p>
        </div>
      </div>

      {/* Input */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={input}
              onChange={e => { setInput(e.target.value); setShowSuggestions(true) }}
              onKeyDown={handleKey}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Search ingredient..."
              className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60 transition-colors"
            />
          </div>
          <button
            onClick={() => handleAdd()}
            disabled={!input.trim()}
            className="w-10 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-lg shadow-amber-500/20"
          >
            <Plus size={18} className="text-white" />
          </button>
        </div>

        {/* Autocomplete */}
        {showSuggestions && filtered.length > 0 && input && (
          <div className="absolute top-full mt-1 left-0 right-10 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden z-20 shadow-xl">
            {filtered.map(s => (
              <button
                key={s}
                onMouseDown={() => handleAdd(s)}
                className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick-add chips */}
      <div>
        <p className="text-xs text-slate-500 mb-2">Quick add:</p>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.filter(s => !ingredients.some(i => i.toLowerCase() === s.toLowerCase())).slice(0, 8).map(s => (
            <button
              key={s}
              onClick={() => handleAdd(s)}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:border-amber-500/40 hover:text-amber-400 transition-all"
            >
              + {s}
            </button>
          ))}
        </div>
      </div>

      {/* Ingredients list */}
      <div className="flex-1 overflow-y-auto">
        {ingredients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <div className="text-3xl mb-2">🥗</div>
            <p className="text-slate-500 text-sm">No ingredients yet</p>
            <p className="text-slate-600 text-xs">Add some to get recipe suggestions</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {ingredients.map(ing => (
              <div key={ing} className="ingredient-tag flex items-center gap-1.5 px-3 py-1.5 rounded-lg">
                <span className="text-sm text-slate-200">{ing}</span>
                <button
                  onClick={() => onRemove(ing)}
                  className="text-slate-500 hover:text-red-400 transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Count */}
      {ingredients.length > 0 && (
        <p className="text-xs text-slate-500 text-center">
          {ingredients.length} ingredient{ingredients.length !== 1 ? 's' : ''} added
        </p>
      )}

      {/* Analyze button */}
      <button
        onClick={onAnalyze}
        disabled={ingredients.length < 2 || loading}
        className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all
          bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500
          disabled:opacity-40 disabled:cursor-not-allowed
          shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40
          text-white"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Finding Recipes...
          </>
        ) : (
          <>
            <Sparkles size={16} />
            Find My Recipes
          </>
        )}
      </button>
    </div>
  )
}
