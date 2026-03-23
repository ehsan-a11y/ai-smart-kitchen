import { Clock, ChefHat, Flame, Users, ArrowRight, Loader } from 'lucide-react'

const DIFFICULTY_COLORS = {
  Easy: 'text-green-400 bg-green-400/10 border-green-400/30',
  Medium: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  Hard: 'text-red-400 bg-red-400/10 border-red-400/30'
}

const CUISINE_EMOJIS = {
  Italian: '🍝', Mexican: '🌮', Chinese: '🥢', Indian: '🍛',
  American: '🍔', French: '🥐', Japanese: '🍱', Mediterranean: '🫒',
  Thai: '🍜', Greek: '🫕', default: '🍽️'
}

export default function RecipeSuggestions({ recipes, loading, onSelect, ingredients }) {
  if (!loading && recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="text-6xl mb-4 animate-float">👨‍🍳</div>
        <h3 className="text-xl font-semibold text-white mb-2">Ready to Cook?</h3>
        <p className="text-slate-400 text-sm max-w-xs">
          Add your available ingredients on the left, then click <span className="text-amber-400 font-medium">Find My Recipes</span> to discover what you can make!
        </p>
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          {['🥗 Salads', '🍲 Soups', '🍳 Mains'].map(item => (
            <div key={item} className="bg-slate-800/50 border border-slate-700 rounded-xl p-3">
              <p className="text-sm text-slate-400">{item}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (loading && recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">🍳</div>
        </div>
        <div className="text-center">
          <p className="text-white font-medium">Chef Claude is thinking...</p>
          <p className="text-slate-400 text-sm mt-1">Analyzing your {ingredients.length} ingredients</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-white">
            {loading ? 'Discovering Recipes...' : `${recipes.length} Recipe${recipes.length !== 1 ? 's' : ''} Found`}
          </h2>
          <p className="text-xs text-slate-400">
            {loading ? 'Chef Claude is analyzing your ingredients' : 'Choose a recipe to start cooking'}
          </p>
        </div>
        {loading && <Loader size={16} className="text-amber-400 animate-spin flex-shrink-0" />}
      </div>

      {/* Recipe cards */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {recipes.map((recipe, i) => (
          <RecipeCard
            key={recipe.id || i}
            recipe={recipe}
            onSelect={onSelect}
            index={i}
          />
        ))}
        {loading && recipes.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse" />
            <span className="text-sm text-slate-400 typing-cursor">Chef is finding more recipes</span>
          </div>
        )}
      </div>
    </div>
  )
}

function RecipeCard({ recipe, onSelect, index }) {
  const emoji = CUISINE_EMOJIS[recipe.cuisine] || CUISINE_EMOJIS.default
  const diffClass = DIFFICULTY_COLORS[recipe.difficulty] || DIFFICULTY_COLORS.Easy

  return (
    <div
      className="glow-card bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 cursor-pointer group"
      onClick={() => onSelect(recipe)}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-white text-sm leading-snug group-hover:text-amber-300 transition-colors">
              {recipe.name}
            </h3>
            <ArrowRight size={15} className="text-slate-500 group-hover:text-amber-400 flex-shrink-0 mt-0.5 transition-colors group-hover:translate-x-1 duration-200" />
          </div>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{recipe.description}</p>

          {/* Metadata row */}
          <div className="flex items-center gap-3 mt-2.5 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Clock size={11} className="text-slate-500" />
              {recipe.time}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Flame size={11} className="text-slate-500" />
              {recipe.calories || '—'}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-md border font-medium ${diffClass}`}>
              {recipe.difficulty}
            </span>
            <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded-md">
              {recipe.cuisine}
            </span>
          </div>

          {/* Ingredients used */}
          {recipe.ingredients_used?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {recipe.ingredients_used.slice(0, 5).map(ing => (
                <span key={ing} className="text-xs px-1.5 py-0.5 bg-green-400/10 border border-green-400/20 text-green-400 rounded-md">
                  ✓ {ing}
                </span>
              ))}
              {recipe.ingredients_used.length > 5 && (
                <span className="text-xs text-slate-500">+{recipe.ingredients_used.length - 5} more</span>
              )}
            </div>
          )}

          {/* Missing ingredients */}
          {recipe.missing_ingredients?.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {recipe.missing_ingredients.slice(0, 3).map(ing => (
                <span key={ing} className="text-xs px-1.5 py-0.5 bg-orange-400/10 border border-orange-400/20 text-orange-400 rounded-md">
                  + {ing}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
