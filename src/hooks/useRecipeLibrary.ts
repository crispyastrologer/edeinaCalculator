import { useState, useEffect } from 'react'
import { ToppingIngredient } from './useDoughCalculator'

export interface Recipe {
  id: string
  name: string
  icon: string
  numServings: number
  ingredients: ToppingIngredient[]
}

const DEFAULT_RECIPES: Recipe[] = [
  {
    id: 'rec-1',
    name: "Za'atar",
    icon: 'grass',
    numServings: 2,
    ingredients: [
      { id: 'ing-1', name: "Za'atar Blend", weight: 100, pricePerKg: 25 },
      { id: 'ing-2', name: 'Extra Sumac', weight: 10, pricePerKg: 15 },
      { id: 'ing-3', name: 'Sesame Seeds', weight: 20, pricePerKg: 8 },
      { id: 'ing-4', name: 'Olive Oil', weight: 130, pricePerKg: 12 },
    ],
  },
  {
    id: 'rec-2',
    name: 'Cheese',
    icon: 'egg_alt',
    numServings: 2,
    ingredients: [
      { id: 'ing-1', name: 'Akawi', weight: 320, pricePerKg: 9 },
      { id: 'ing-2', name: 'Mozzarella', weight: 240, pricePerKg: 6 },
      { id: 'ing-3', name: 'Feta', weight: 240, pricePerKg: 7.5 },
    ],
  },
  {
    id: 'rec-3',
    name: 'Meat',
    icon: 'restaurant',
    numServings: 2,
    ingredients: [
      { id: 'ing-1', name: 'Ground Beef/Lamb', weight: 400, pricePerKg: 7.5 },
      { id: 'ing-2', name: 'Onion', weight: 160, pricePerKg: 0.75 },
      { id: 'ing-3', name: 'Tomato', weight: 120, pricePerKg: 1 },
      { id: 'ing-4', name: 'Seven Spices', weight: 4, pricePerKg: 15 },
      { id: 'ing-5', name: 'Salt', weight: 4, pricePerKg: 0.8 },
      { id: 'ing-6', name: 'Black Pepper', weight: 2.4, pricePerKg: 10 },
      { id: 'ing-7', name: 'Pomegranate Molasses', weight: 12, pricePerKg: 5 },
      { id: 'ing-8', name: 'Tahini', weight: 8, pricePerKg: 3.75 },
    ],
  },
  {
    id: 'rec-4',
    name: 'Pizza',
    icon: 'local_pizza',
    numServings: 2,
    ingredients: [
      { id: 'ing-1', name: 'Tomato Sauce', weight: 200, pricePerKg: 3 },
      { id: 'ing-2', name: 'Mozzarella', weight: 320, pricePerKg: 6 },
      { id: 'ing-3', name: 'Olive Oil', weight: 30, pricePerKg: 12 },
    ],
  },
]

export function useRecipeLibrary() {
  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('edeina-recipes-v2')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error("Failed to parse recipes", e)
        }
      }
    }
    return DEFAULT_RECIPES
  })

  // Save to local storage whenever recipes change
  useEffect(() => {
    localStorage.setItem('edeina-recipes-v2', JSON.stringify(recipes))
  }, [recipes])

  const addRecipe = (recipe: Omit<Recipe, 'id'>) => {
    const id = Date.now().toString()
    setRecipes(prev => [...prev, { ...recipe, id }])
  }

  const updateRecipe = (id: string, updates: Partial<Recipe>) => {
    setRecipes(prev => prev.map(recipe => 
      recipe.id === id ? { ...recipe, ...updates } : recipe
    ))
  }

  const removeRecipe = (id: string) => {
    setRecipes(prev => prev.filter(recipe => recipe.id !== id))
  }

  const updateRecipeServings = (id: string, numServings: number) => {
    setRecipes(prev => prev.map(recipe => 
      recipe.id === id ? { ...recipe, numServings } : recipe
    ))
  }

  const addIngredientToRecipe = (recipeId: string, ingredient: Omit<ToppingIngredient, 'id'>) => {
    setRecipes(prev => prev.map(recipe => {
      if (recipe.id === recipeId) {
        return {
          ...recipe,
          ingredients: [...recipe.ingredients, { ...ingredient, id: Date.now().toString() }]
        }
      }
      return recipe
    }))
  }

  const updateRecipeIngredient = (recipeId: string, ingredientId: string, field: keyof ToppingIngredient, value: string | number) => {
    setRecipes(prev => prev.map(recipe => {
      if (recipe.id === recipeId) {
        return {
          ...recipe,
          ingredients: recipe.ingredients.map(ing => 
            ing.id === ingredientId ? { ...ing, [field]: value } : ing
          )
        }
      }
      return recipe
    }))
  }

  const removeIngredientFromRecipe = (recipeId: string, ingredientId: string) => {
    setRecipes(prev => prev.map(recipe => {
      if (recipe.id === recipeId) {
        return {
          ...recipe,
          ingredients: recipe.ingredients.filter(ing => ing.id !== ingredientId)
        }
      }
      return recipe
    }))
  }

  const exportSingleRecipe = (recipe: Recipe) => {
    const blob = new Blob([JSON.stringify(recipe, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `edeina-recipe-${recipe.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importSingleRecipe = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const recipe = JSON.parse(e.target?.result as string) as Recipe
        if (recipe && recipe.name && recipe.ingredients) {
          // ensure new ID on import
          const id = Date.now().toString()
          setRecipes(prev => [...prev, { ...recipe, id }])
        } else {
          alert('Invalid recipe format')
        }
      } catch {
        alert('Invalid file format')
      }
    }
    reader.readAsText(file)
  }

  // Allow reordering
  const reorderRecipes = (oldIndex: number, newIndex: number) => {
    setRecipes(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(oldIndex, 1);
      result.splice(newIndex, 0, removed);
      return result;
    })
  }

  const reorderRecipeIngredients = (recipeId: string, oldIndex: number, newIndex: number) => {
    setRecipes(prev => prev.map(recipe => {
      if (recipe.id === recipeId) {
        const result = Array.from(recipe.ingredients);
        const [removed] = result.splice(oldIndex, 1);
        result.splice(newIndex, 0, removed);
        return { ...recipe, ingredients: result };
      }
      return recipe;
    }))
  }

  return {
    recipes,
    setRecipes,
    addRecipe,
    updateRecipe,
    removeRecipe,
    updateRecipeServings,
    addIngredientToRecipe,
    updateRecipeIngredient,
    removeIngredientFromRecipe,
    exportSingleRecipe,
    importSingleRecipe,
    reorderRecipes,
    reorderRecipeIngredients
  }
}
