import { useState, useCallback, useMemo } from 'react'

export type IngredientType = 'flour' | 'liquid' | 'salt' | 'fat' | 'extras'

export interface Ingredient {
  id: string
  name: string
  weight: number
  pricePerKg: number
  type: IngredientType
}

const DEFAULT_INGREDIENTS: Ingredient[] = [
  { id: '1', name: 'Bread Flour', weight: 500, pricePerKg: 1.5, type: 'flour' },
  { id: '2', name: 'Water', weight: 325, pricePerKg: 0, type: 'liquid' },
  { id: '3', name: 'Salt', weight: 10, pricePerKg: 0.8, type: 'salt' },
  { id: '4', name: 'Olive Oil', weight: 15, pricePerKg: 12, type: 'fat' },
  { id: '5', name: 'Yeast', weight: 3, pricePerKg: 20, type: 'extras' },
  { id: '6', name: 'Sugar', weight: 5, pricePerKg: 1, type: 'extras' },
]

const CURRENCY_RATES: Record<string, number> = {
  GBP: 1,
  USD: 1.27,
  EUR: 1.17,
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: '£',
  USD: '$',
  EUR: '€',
}

export interface ToppingIngredient {
  id: string
  name: string
  weight: number
  pricePerKg: number
}

export interface MenuItem {
  id: string
  name: string
  icon: string
  numServings: number
  ingredients: ToppingIngredient[]
}

const DEFAULT_MENU_ITEMS: MenuItem[] = [
  {
    id: '1',
    name: "Za'atar",
    icon: 'grass',
    numServings: 2,
    ingredients: [
      { id: '1', name: "Za'atar Blend", weight: 100, pricePerKg: 25 },
      { id: '2', name: 'Extra Sumac', weight: 10, pricePerKg: 15 },
      { id: '3', name: 'Sesame Seeds', weight: 20, pricePerKg: 8 },
      { id: '4', name: 'Olive Oil', weight: 130, pricePerKg: 12 },
    ],
  },
  {
    id: '2',
    name: 'Cheese',
    icon: 'egg_alt',
    numServings: 2,
    ingredients: [
      { id: '1', name: 'Akawi', weight: 320, pricePerKg: 9 },
      { id: '2', name: 'Mozzarella', weight: 240, pricePerKg: 6 },
      { id: '3', name: 'Feta', weight: 240, pricePerKg: 7.5 },
    ],
  },
  {
    id: '3',
    name: 'Meat',
    icon: 'restaurant',
    numServings: 2,
    ingredients: [
      { id: '1', name: 'Ground Beef/Lamb', weight: 400, pricePerKg: 7.5 },
      { id: '2', name: 'Onion', weight: 160, pricePerKg: 0.75 },
      { id: '3', name: 'Tomato', weight: 120, pricePerKg: 1 },
      { id: '4', name: 'Seven Spices', weight: 4, pricePerKg: 15 },
      { id: '5', name: 'Salt', weight: 4, pricePerKg: 0.8 },
      { id: '6', name: 'Black Pepper', weight: 2.4, pricePerKg: 10 },
      { id: '7', name: 'Pomegranate Molasses', weight: 12, pricePerKg: 5 },
      { id: '8', name: 'Tahini', weight: 8, pricePerKg: 3.75 },
    ],
  },
  {
    id: '4',
    name: 'Pizza',
    icon: 'local_pizza',
    numServings: 2,
    ingredients: [
      { id: '1', name: 'Tomato Sauce', weight: 200, pricePerKg: 3 },
      { id: '2', name: 'Mozzarella', weight: 320, pricePerKg: 6 },
      { id: '3', name: 'Olive Oil', weight: 30, pricePerKg: 12 },
    ],
  },
]

export const AVAILABLE_ICONS = [
  { value: 'grass', label: 'Grass' },
  { value: 'eco', label: 'Leaf' },
  { value: 'egg_alt', label: 'Cheese' },
  { value: 'restaurant', label: 'Meat' },
  { value: 'cake', label: 'Sweet' },
  { value: 'local_pizza', label: 'Pizza' },
  { value: 'local_fire_department', label: 'Spicy' },
  { value: 'spa', label: 'Herbs' },
  { value: 'free_breakfast', label: 'Breakfast' },
  { value: 'nutrition', label: 'Fruit' },
  { value: 'bakery_dining', label: 'Bread' },
  { value: 'lunch_dining', label: 'Sandwich' },
  { value: 'icecream', label: 'Frozen' },
  { value: 'set_meal', label: 'Meal' },
]

export function useDoughCalculator(showPrices: boolean, currency: 'GBP' | 'USD' | 'EUR') {
  const [ingredients, setIngredients] = useState<Ingredient[]>(DEFAULT_INGREDIENTS)
  const [numBalls, setNumBalls] = useState(8)
  const [ballWeight, setBallWeight] = useState(107)
  const [numBatches, setNumBatches] = useState(1)
  const [divideBatches, setDivideBatches] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newIngredient, setNewIngredient] = useState({ name: '', weight: 0, pricePerKg: 0, type: 'extras' as IngredientType })
  
  // Menu items state (toppings with menu items)
  const [menuItems, setMenuItems] = useState<MenuItem[]>(DEFAULT_MENU_ITEMS)
  const [expandedMenuItemIds, setExpandedMenuItemIds] = useState<string[]>([])
  const [showAddMenuItemForm, setShowAddMenuItemForm] = useState(false)
  const [newMenuItem, setNewMenuItem] = useState({ name: '', icon: 'grass', numServings: 2, ingredients: [] as ToppingIngredient[] })
  const [newMenuItemIngredient, setNewMenuItemIngredient] = useState({ name: '', weight: 0, pricePerKg: 0 })

  const toggleMenuItem = (id: string) => {
    setExpandedMenuItemIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  // Sync menu items servings with dough balls - distribute evenly
  const syncMenuItemsServings = (doughBallCount: number) => {
    setMenuItems(prev => {
      if (prev.length === 0) return prev
      const perItem = Math.floor(doughBallCount / prev.length)
      const remainder = doughBallCount % prev.length
      return prev.map((item, index) => ({
        ...item,
        numServings: index < remainder ? perItem + 1 : perItem
      }))
    })
  }

  // Update menu item servings
  const updateMenuItemServings = (id: string, count: number) => {
    setMenuItems(prev => prev.map(item => 
      item.id === id ? { ...item, numServings: count } : item
    ))
  }

  // Update menu item name/icon
  const updateMenuItem = (id: string, field: keyof MenuItem, value: string | number) => {
    setMenuItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  // Add ingredient to menu item
  const addIngredientToMenuItem = (menuItemId: string) => {
    if (newMenuItemIngredient.name && newMenuItemIngredient.weight > 0) {
      setMenuItems(prev => prev.map(item => {
        if (item.id === menuItemId) {
          return {
            ...item,
            ingredients: [...item.ingredients, { ...newMenuItemIngredient, id: Date.now().toString() }]
          }
        }
        return item
      }))
      setNewMenuItemIngredient({ name: '', weight: 0, pricePerKg: 0 })
    }
  }

  // Update ingredient in menu item
  const updateMenuItemIngredient = (menuItemId: string, ingredientId: string, field: keyof ToppingIngredient, value: string | number) => {
    setMenuItems(prev => prev.map(item => {
      if (item.id === menuItemId) {
        return {
          ...item,
          ingredients: item.ingredients.map(ing => 
            ing.id === ingredientId ? { ...ing, [field]: value } : ing
          )
        }
      }
      return item
    }))
  }

  // Remove ingredient from menu item
  const removeIngredientFromMenuItem = (menuItemId: string, ingredientId: string) => {
    setMenuItems(prev => prev.map(item => {
      if (item.id === menuItemId) {
        return {
          ...item,
          ingredients: item.ingredients.filter(ing => ing.id !== ingredientId)
        }
      }
      return item
    }))
  }

  // Remove menu item
  const removeMenuItem = (id: string) => {
    setMenuItems(prev => prev.filter(item => item.id !== id))
  }

  // Add new menu item
  const addMenuItem = () => {
    if (newMenuItem.name) {
      const id = Date.now().toString()
      setMenuItems(prev => [...prev, { 
        ...newMenuItem, 
        id, 
        ingredients: [] 
      }])
      setNewMenuItem({ name: '', icon: 'grass', numServings: numBalls, ingredients: [] })
      setShowAddMenuItemForm(false)
    }
  }

  // Total toppings calculated
  const totalToppingServings = menuItems.reduce((sum, item) => sum + item.numServings, 0)
  const servingsMismatch = totalToppingServings !== numBalls

  // Summary calculations
  const getScaledToppingWeight = (weight: number, numServings: number) => Math.round(weight * numServings)
  
  const getMenuItemCost = (menuItem: MenuItem) => {
    return menuItem.ingredients.reduce((sum, ing) => 
      sum + (getScaledToppingWeight(ing.weight, menuItem.numServings) / 1000) * ing.pricePerKg, 0
    )
  }

const totalToppingCost = menuItems.reduce((sum, item) => sum + getMenuItemCost(item), 0)

  // Total weight of all ingredients (moved up for use in allIngredientsSummary)
  const totalWeight = ingredients.reduce((sum, ing) => sum + ing.weight, 0)

  // Combined ingredients for summary
  const allIngredientsSummary = useMemo(() => {
    const summary: Record<string, { weight: number; cost: number; source: string }> = {}
    // Add dough ingredients (scaled)
    ingredients.forEach(ing => {
      const weight = Math.round(ing.weight * (totalWeight > 0 ? (numBalls * ballWeight) / totalWeight : 1))
      const cost = showPrices ? (weight / 1000) * ing.pricePerKg : 0
      summary[ing.name] = {
        weight: (summary[ing.name]?.weight || 0) + weight,
        cost: (summary[ing.name]?.cost || 0) + cost,
        source: 'dough'
      }
    })
    // Add topping ingredients
    menuItems.forEach(item => {
      item.ingredients.forEach(ing => {
        const weight = getScaledToppingWeight(ing.weight, item.numServings)
        const cost = showPrices ? (weight / 1000) * ing.pricePerKg : 0
        const existing = summary[ing.name]
        summary[ing.name] = { 
          weight: (existing?.weight || 0) + weight,
          cost: (existing?.cost || 0) + cost,
          source: existing ? 'both' : 'topping'
        }
      })
    })
    return summary
  }, [ingredients, menuItems, showPrices, numBalls, ballWeight, totalWeight])

  // Target output based on balls and ball weight
  const targetOutput = numBalls * ballWeight
  
  // How much to scale each ingredient to match target
  const scalingFactor = totalWeight > 0 ? targetOutput / totalWeight : 1
  
  // Scaled amounts for each ingredient (what you'd actually use)
  const getScaledWeight = (weight: number) => Math.round(weight * scalingFactor)

  // Cost of scaled recipe (what you'd actually produce)
  const totalCost = ingredients.reduce((sum, ing) => sum + (getScaledWeight(ing.weight) / 1000) * ing.pricePerKg, 0)

  // Find flour weight for baker's percentages
  const flourWeight = useMemo(() => {
    const flour = ingredients.find(i => i.type === 'flour')
    return flour ? flour.weight : (ingredients[0]?.weight || 1)
  }, [ingredients])

  // Ingredient type aggregations
  const liquidWeight = ingredients.filter(i => i.type === 'liquid').reduce((sum, i) => sum + i.weight, 0)
  const saltWeight = ingredients.filter(i => i.type === 'salt').reduce((sum, i) => sum + i.weight, 0)
  const fatWeight = ingredients.filter(i => i.type === 'fat').reduce((sum, i) => sum + i.weight, 0)
  const extrasWeight = ingredients.filter(i => i.type === 'extras').reduce((sum, i) => sum + i.weight, 0)

  // Baker's percentages based on flour
  const hydration = flourWeight > 0 ? (liquidWeight / flourWeight) * 100 : 0
  const saltPercent = flourWeight > 0 ? (saltWeight / flourWeight) * 100 : 0
  const oilPercent = flourWeight > 0 ? (fatWeight / flourWeight) * 100 : 0
  const extrasPercent = flourWeight > 0 ? (extrasWeight / flourWeight) * 100 : 0

  // Per batch calculations
  const eachBatchWeight = Math.round(totalWeight / numBatches)
  const targetPerBatch = Math.round(targetOutput / numBatches)

  const formatPrice = useCallback((amount: number) => {
    const converted = amount * CURRENCY_RATES[currency]
    return `${CURRENCY_SYMBOLS[currency]}${converted.toFixed(2)}`
  }, [currency])

  const updateIngredient = (id: string, field: keyof Ingredient, value: string | number) => {
    setIngredients(prev => prev.map(ing => 
      ing.id === id ? { ...ing, [field]: value } : ing
    ))
  }

  const removeIngredient = (id: string) => {
    setIngredients(prev => prev.filter(ing => ing.id !== id))
  }

  const addIngredient = () => {
    if (newIngredient.name && newIngredient.weight > 0) {
      const id = Date.now().toString()
      setIngredients(prev => [...prev, { ...newIngredient, id }])
      setNewIngredient({ name: '', weight: 0, pricePerKg: 0, type: 'extras' })
      setShowAddForm(false)
    }
  }

  // Reset ball weight to match total recipe
  const matchRecipe = () => {
    if (numBalls > 0) {
      setBallWeight(Math.round(totalWeight / numBalls))
    }
  }

  return {
    ingredients,
    setIngredients,
    numBalls,
    setNumBalls,
    ballWeight,
    setBallWeight,
    numBatches,
    setNumBatches,
    divideBatches,
    setDivideBatches,
    totalWeight,
    totalCost,
    hydration,
    saltPercent,
    oilPercent,
    extrasPercent,
    scalingFactor,
    targetOutput,
    eachBatchWeight,
    targetPerBatch,
    getScaledWeight,
    flourWeight,
    matchRecipe,
    formatPrice,
    showPrices,
    showAddForm,
    setShowAddForm,
    newIngredient,
    setNewIngredient,
    addIngredient,
    updateIngredient,
    removeIngredient,
    menuItems,
    setMenuItems,
    expandedMenuItemIds,
    toggleMenuItem,
    updateMenuItemServings,
    updateMenuItem,
    addIngredientToMenuItem,
    updateMenuItemIngredient,
    removeIngredientFromMenuItem,
    removeMenuItem,
    addMenuItem,
    showAddMenuItemForm,
    setShowAddMenuItemForm,
    newMenuItem,
    setNewMenuItem,
    newMenuItemIngredient,
    setNewMenuItemIngredient,
    totalToppingServings,
    servingsMismatch,
    totalToppingCost,
    allIngredientsSummary,
    syncMenuItemsServings,
    // Save/Load functionality
    saveRecipe: () => {
      const recipe = {
        ingredients,
        numBalls,
        ballWeight,
        numBatches,
        divideBatches,
        menuItems,
      }
      localStorage.setItem('edeina-recipe', JSON.stringify(recipe))
    },
    loadRecipe: () => {
      const saved = localStorage.getItem('edeina-recipe')
      if (saved) {
        const recipe = JSON.parse(saved)
        if (recipe.ingredients) setIngredients(recipe.ingredients)
        if (recipe.numBalls !== undefined) setNumBalls(recipe.numBalls)
        if (recipe.ballWeight !== undefined) setBallWeight(recipe.ballWeight)
        if (recipe.numBatches !== undefined) setNumBatches(recipe.numBatches)
        if (recipe.divideBatches !== undefined) setDivideBatches(recipe.divideBatches)
        if (recipe.menuItems) setMenuItems(recipe.menuItems)
      }
    },
    exportRecipe: () => {
      const recipe = {
        ingredients,
        numBalls,
        ballWeight,
        numBatches,
        divideBatches,
        menuItems,
      }
      const blob = new Blob([JSON.stringify(recipe, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `edeina-recipe-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    },
    importRecipe: (file: File) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const recipe = JSON.parse(e.target?.result as string)
          if (recipe.ingredients) setIngredients(recipe.ingredients)
          if (recipe.numBalls !== undefined) setNumBalls(recipe.numBalls)
          if (recipe.ballWeight !== undefined) setBallWeight(recipe.ballWeight)
          if (recipe.numBatches !== undefined) setNumBatches(recipe.numBatches)
          if (recipe.divideBatches !== undefined) setDivideBatches(recipe.divideBatches)
          if (recipe.menuItems) setMenuItems(recipe.menuItems)
        } catch {
          alert('Invalid file format')
        }
      }
      reader.readAsText(file)
    },
    loadFromURL: (encoded: string) => {
      try {
        // Reverse URL-safe base64 (handle both new url-safe and legacy + / = encodings)
        let b64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
        const pad = b64.length % 4
        if (pad) b64 += '='.repeat(4 - pad)
        const json = decodeURIComponent(escape(atob(b64)))
        const state = JSON.parse(json)
        if (state.i) {
          setIngredients(state.i.map((ing: any, idx: number) => ({
            id: String(idx + 1),
            name: ing.n,
            weight: ing.w,
            type: ing.t || 'extras',
            pricePerKg: ing.p || 0,
          })))
        }
        if (state.b !== undefined) setNumBalls(state.b)
        if (state.bw !== undefined) setBallWeight(state.bw)
        if (state.m && state.m.length > 0) {
          setMenuItems(prev => {
            const updated = [...prev]
            state.m.forEach((shared: any) => {
              const existing = updated.find(m => m.name === shared.n)
              if (existing) {
                existing.numServings = shared.s
                if (shared.i) {
                  existing.ingredients = shared.i.map((ing: any, idx: number) => ({
                    id: String(idx + 1),
                    name: ing.n,
                    weight: ing.w,
                    pricePerKg: ing.p || 0,
                  }))
                }
              } else {
                updated.push({
                  id: crypto.randomUUID(),
                  name: shared.n,
                  icon: shared.ic || 'grass',
                  numServings: shared.s,
                  ingredients: (shared.i || []).map((ing: any, idx: number) => ({
                    id: String(idx + 1),
                    name: ing.n,
                    weight: ing.w,
                    pricePerKg: ing.p || 0,
                  })),
                })
              }
            })
            return updated
          })
        }
        // Keep the ?r= param in the URL so reloads & bookmarks restore the recipe
        return true
      } catch {
        return false
      }
    },
  }
}
