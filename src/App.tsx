import { useState, useEffect } from 'react'
import { useDoughCalculator } from './hooks/useDoughCalculator'

type Tab = 'dough' | 'toppings' | 'summary'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dough')
  const [showPrices, setShowPrices] = useState(false)
  const [currency, setCurrency] = useState<'GBP' | 'USD' | 'EUR'>('GBP')
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('edeina-dark-mode') === 'true'
    }
    return false
  })

  useEffect(() => {
    localStorage.setItem('edeina-dark-mode', String(darkMode))
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  const [shareDropdownOpen, setShareDropdownOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const doughCalc = useDoughCalculator(showPrices, currency)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const recipe = params.get('r')
    if (recipe) {
      const ok = doughCalc.loadFromURL(recipe)
      if (ok) showToast('Recipe loaded from shared link')
    }
  }, [])

  const currencySymbols: Record<string, string> = {
    GBP: '£',
    USD: '$',
    EUR: '€',
  }

  const handleShare = () => {
    const recipeText = generateFormattedRecipe()
    navigator.clipboard.writeText(recipeText)
    setShareDropdownOpen(false)
    showToast('Recipe text copied!')
  }

  const handleShareURL = () => {
    const state = {
      i: doughCalc.ingredients.map(ing => ({ n: ing.name, w: ing.weight, t: ing.type, p: ing.pricePerKg })),
      b: doughCalc.numBalls,
      bw: doughCalc.ballWeight,
      m: doughCalc.menuItems.filter(m => m.numServings > 0).map(item => ({
        n: item.name,
        ic: item.icon,
        s: item.numServings,
        i: item.ingredients.map(ing => ({ n: ing.name, w: ing.weight, p: ing.pricePerKg }))
      }))
    }
    const json = JSON.stringify(state)
    const encoded = btoa(unescape(encodeURIComponent(json)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    const url = `${window.location.origin}${window.location.pathname}?r=${encoded}`
    navigator.clipboard.writeText(url)
    setShareDropdownOpen(false)
    showToast('Recipe URL copied!')
  }

  const handlePrint = () => {
    window.print()
  }

  const generateFormattedRecipe = () => {
    let text = `🍞 EDEINA DOUGH RECIPE\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
    text += `📊 YIELD: ${doughCalc.numBalls} dough balls @ ${doughCalc.ballWeight}g each\n\n`
    
    text += `🥖 BASE DOUGH (${doughCalc.targetOutput}g total)\n`
    doughCalc.ingredients.forEach(ing => {
      text += `  ${ing.name}: ${doughCalc.getScaledWeight(ing.weight)}g\n`
    })
    
    if (doughCalc.menuItems.filter(m => m.numServings > 0).length > 0) {
      text += `\n🍕 TOPPINGS\n`
      doughCalc.menuItems.filter(m => m.numServings > 0).forEach(item => {
        text += `  ${item.name} × ${item.numServings}\n`
        item.ingredients.forEach(ing => {
          text += `    • ${ing.name}: ${ing.weight * item.numServings}g\n`
        })
      })
    }
    
    text += `\n📈 BAKER'S PERCENTAGES\n`
    text += `  Hydration: ${doughCalc.hydration.toFixed(1)}%\n`
    text += `  Salt: ${doughCalc.saltPercent.toFixed(1)}%\n`
    text += `  Fat: ${doughCalc.oilPercent.toFixed(1)}%\n`
    text += `  Extras: ${doughCalc.extrasPercent.toFixed(1)}%\n`
    
    return text
  }

  return (
    <>
      {/* Top Navigation */}
      <header className="top-nav">
        <div className="top-nav-inner">
          <div className="nav-logo">
            <img src="/EDEINA_vector_horizontal.svg" alt="EDEINA" />
          </div>
          <nav className="nav-links">
            <span className={`nav-link ${activeTab === 'dough' ? 'active' : ''}`} onClick={() => setActiveTab('dough')}>Dough</span>
            <span className={`nav-link ${activeTab === 'toppings' ? 'active' : ''}`} onClick={() => setActiveTab('toppings')}>Toppings</span>
            <span className={`nav-link ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>Summary</span>
            <button onClick={() => setShowPrices(!showPrices)} style={{ border: 'none', background: showPrices ? '#192F4D' : '#D9A043', cursor: 'pointer', padding: '6px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ color: showPrices ? '#D9A043' : '#192F4D', fontSize: '1.25rem' }}>payments</span>
            </button>
            {showPrices && (
              <select value={currency} onChange={(e) => setCurrency(e.target.value as any)} style={{ background: '#D9A043', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '0.8rem', fontFamily: "'Dallas PS', sans-serif", fontWeight: '700', color: '#192F4D', cursor: 'pointer', outline: 'none' }}>
                <option value="GBP">£/kg</option>
                <option value="USD">$/kg</option>
                <option value="EUR">€/kg</option>
              </select>
            )}
            <button onClick={() => setDarkMode(!darkMode)} title={darkMode ? 'Light Mode' : 'Dark Mode'} style={{ border: 'none', background: darkMode ? '#D9A043' : '#192F4D', cursor: 'pointer', padding: '6px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ color: darkMode ? '#192F4D' : '#fff', fontSize: '1.25rem' }}>{darkMode ? 'light_mode' : 'dark_mode'}</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="space-y-2">
            <span className="hero-badge">Precision Baking</span>
            <h2 className="hero-title">
              {activeTab === 'dough' && 'Dough Calculator'}
              {activeTab === 'toppings' && 'Toppings'}
              {activeTab === 'summary' && 'Summary'}
            </h2>
          </div>
          <div className="action-row">
            <div style={{ position: 'relative' }}>
              <button className="action-btn" onClick={() => setShareDropdownOpen(!shareDropdownOpen)}><span className="material-symbols-outlined">share</span><span>Share</span><span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_drop_down</span></button>
              {shareDropdownOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', background: '#fff', border: '1px solid #E0DDD6', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 100, minWidth: '180px' }}>
                  <button onClick={handleShare} style={{ width: '100%', padding: '10px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Dallas PS', sans-serif", fontWeight: '600', fontSize: '0.875rem', color: '#192F4D' }}><span className="material-symbols-outlined">content_copy</span>Copy Text</button>
                  <button onClick={handleShareURL} style={{ width: '100%', padding: '10px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Dallas PS', sans-serif", fontWeight: '600', fontSize: '0.875rem', color: '#192F4D' }}><span className="material-symbols-outlined">link</span>Copy URL</button>
                </div>
              )}
            </div>
            <button className="action-btn" onClick={doughCalc.exportRecipe} title="Save recipe to file"><span className="material-symbols-outlined">download</span><span>Save</span></button>
            <input type="file" accept=".json" onChange={(e) => { if (e.target.files?.[0]) doughCalc.importRecipe(e.target.files[0]) }} style={{ display: 'none' }} id="load-file" />
            <label htmlFor="load-file" className="action-btn" style={{ cursor: 'pointer' }} title="Load recipe from file"><span className="material-symbols-outlined">upload</span><span>Load</span></label>
            <button className="action-btn print-btn" onClick={handlePrint}><span className="material-symbols-outlined">print</span><span>Print</span></button>
          </div>
        </section>

        {/* DOUGH TAB */}
        {activeTab === 'dough' && (
          <div className="content-grid">
            <div className="md:col-span-7 space-y-0">
              <div className="ingredient-card">
                <h3 className="card-title"><span className="card-title-line"></span>Base Recipe (for {doughCalc.numBalls} balls)</h3>
                <div className="space-y-1">
                  {doughCalc.ingredients.map((ingredient) => {
                    const typeColors: Record<string, string> = { 
                      flour: '#192F4D', 
                      liquid: '#2A9D8F', 
                      salt: '#8B8B8B', 
                      fat: '#D9A043', 
                      extras: '#5C6B3D' 
                    }
                    return (
                      <div key={ingredient.id} className="ingredient-row" style={{ position: 'relative' }}>
                        <label className="ingredient-label">
                          <span className="ingredient-name" style={{ fontWeight: '700', fontSize: '1.1rem' }}>
                            {ingredient.name}
                          </span>
                          <span onClick={() => { const types = ['flour', 'liquid', 'salt', 'fat', 'extras'] as const; const idx = types.indexOf(ingredient.type); doughCalc.updateIngredient(ingredient.id, 'type', types[(idx + 1) % types.length]) }} style={{ cursor: 'pointer', background: typeColors[ingredient.type], color: '#fff', padding: '2px 10px', borderRadius: '12px', fontSize: '0.7rem', fontFamily: "'Dallas PS', sans-serif", fontWeight: '600', textTransform: 'uppercase', display: 'inline-block', marginTop: '4px' }}>{ingredient.type}</span>
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          <div className="ingredient-input-wrapper">
                            <input className="ingredient-input" type="number" value={ingredient.weight} min={0} onChange={(e) => doughCalc.updateIngredient(ingredient.id, 'weight', parseFloat(e.target.value) || 0)} />
                            <span className="ingredient-unit">g</span>
                          </div>
                          {doughCalc.showPrices && (
                            <div className="ingredient-input-wrapper" style={{ width: '5rem' }}>
                              <span style={{ position: 'absolute', left: '0.5rem', fontFamily: "'Dallas PS', sans-serif", fontWeight: '700', fontSize: '0.65rem', color: '#D9A043', pointerEvents: 'none' }}>{currencySymbols[currency]}/kg</span>
                              <input className="ingredient-input" style={{ width: '100%', paddingLeft: '1.1rem' }} type="number" value={ingredient.pricePerKg} min={0} step={0.1} placeholder="0" onChange={(e) => doughCalc.updateIngredient(ingredient.id, 'pricePerKg', parseFloat(e.target.value) || 0)} />
                            </div>
                          )}
                          <button onClick={() => doughCalc.removeIngredient(ingredient.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: '#4A5B73', opacity: 0.6 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>delete</span>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                  {!doughCalc.showAddForm ? (
                    <button className="action-btn mt-4" style={{ background: '#F4F1EA' }} onClick={() => doughCalc.setShowAddForm(true)}><span className="material-symbols-outlined">add</span><span>Add Ingredient</span></button>
                  ) : (
                    <div className="p-4 bg-[#F4F1EA] rounded-lg border border-[#E0DDD6] mt-4">
                      <div className="flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-[120px]">
                          <label className="block text-xs font-bold uppercase tracking-widest text-[#4A5B73] mb-1">Name</label>
                          <input type="text" className="ingredient-input" style={{ width: '100%', fontSize: '0.9rem' }} placeholder="Ingredient Name" value={doughCalc.newIngredient.name} onChange={(e) => doughCalc.setNewIngredient({ ...doughCalc.newIngredient, name: e.target.value })} />
                        </div>
                        <div className="w-28">
                          <label className="block text-xs font-bold uppercase tracking-widest text-[#4A5B73] mb-1">Type</label>
                          <select value={doughCalc.newIngredient.type} onChange={(e) => doughCalc.setNewIngredient({ ...doughCalc.newIngredient, type: e.target.value as any })} style={{ width: '100%', background: '#fff', border: '1px solid #E0DDD6', borderRadius: '4px', padding: '8px', fontSize: '0.875rem', fontFamily: "'Dallas PS', sans-serif", color: '#192F4D' }}>
                            <option value="flour">Flour</option><option value="liquid">Liquid</option><option value="salt">Salt</option><option value="fat">Fat</option><option value="extras">Extras</option>
                          </select>
                        </div>
                        <div className="w-24">
                          <label className="block text-xs font-bold uppercase tracking-widest text-[#4A5B73] mb-1">Weight (g)</label>
                          <input type="number" className="ingredient-input" style={{ width: '100%', fontSize: '0.9rem' }} placeholder="0" min={0} value={doughCalc.newIngredient.weight || ''} onChange={(e) => doughCalc.setNewIngredient({ ...doughCalc.newIngredient, weight: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <button className="action-btn action-btn-primary" onClick={doughCalc.addIngredient}><span>Add</span></button>
                        <button className="action-btn" onClick={() => doughCalc.setShowAddForm(false)}><span>Cancel</span></button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ marginTop: '1.5rem', background: '#F4F1EA', border: '2px solid #192F4D', borderRadius: '12px', padding: '1.5rem', boxShadow: '4px 4px 0 #192F4D' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <h3 style={{ fontFamily: "'Dallas PS', sans-serif", fontWeight: '800', fontSize: '1.5rem', color: '#192F4D', margin: 0 }}>Recipe</h3>
                  <span style={{ fontFamily: "'Dallas PS', sans-serif", fontWeight: '600', fontSize: '0.875rem', color: '#4A5B73', background: '#fff', padding: '4px 12px', borderRadius: '20px', border: '1px solid #E0DDD6' }}>{doughCalc.numBalls} × {doughCalc.ballWeight}g</span>
                </div>
                <div className="space-y-1">
                  {doughCalc.ingredients.map((ingredient) => {
                    const scaledWeight = doughCalc.getScaledWeight(ingredient.weight)
                    const pct = doughCalc.flourWeight > 0 ? ((ingredient.weight / doughCalc.flourWeight) * 100).toFixed(1) : '0'
                    return (
                      <div key={ingredient.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px dashed #E0DDD6' }}>
                        <div>
                          <span style={{ fontFamily: "'Dallas PS', sans-serif", fontWeight: '700', fontSize: '1rem', color: '#192F4D' }}>{ingredient.name}</span>
                          <span style={{ marginLeft: '8px', fontFamily: "'Dallas PS', sans-serif", fontWeight: '500', fontSize: '0.85rem', color: '#D9A043' }}>({pct}%)</span>
                        </div>
                        <span style={{ fontFamily: "'Dallas PS', sans-serif", fontWeight: '700', fontSize: '1rem', color: '#192F4D' }}>{scaledWeight}g</span>
                      </div>
                    )
                  })}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0 0.5rem', marginTop: '0.5rem', borderTop: '2px solid #192F4D' }}>
                    <span style={{ fontFamily: "'Dallas PS', sans-serif", fontWeight: '900', fontSize: '1.25rem', color: '#192F4D' }}>Total</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontFamily: "'Dallas PS', sans-serif", fontWeight: '900', fontSize: '1.25rem', color: '#192F4D' }}>{doughCalc.targetOutput}g</span>
                      {doughCalc.showPrices && <span style={{ fontFamily: "'Dallas PS', sans-serif", fontWeight: '700', fontSize: '1rem', color: '#D9A043' }}>{doughCalc.formatPrice(doughCalc.totalCost)}</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed #E0DDD6', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: "'Dallas PS', sans-serif", fontWeight: '600', fontSize: '0.85rem', color: '#4A5B73' }}>Hydration: <strong style={{ color: '#192F4D' }}>{doughCalc.hydration.toFixed(1)}%</strong></span>
                  <span style={{ fontFamily: "'Dallas PS', sans-serif", fontWeight: '600', fontSize: '0.85rem', color: '#4A5B73' }}>Salt: <strong style={{ color: '#192F4D' }}>{doughCalc.saltPercent.toFixed(1)}%</strong></span>
                  <span style={{ fontFamily: "'Dallas PS', sans-serif", fontWeight: '600', fontSize: '0.85rem', color: '#4A5B73' }}>Fat: <strong style={{ color: '#192F4D' }}>{doughCalc.oilPercent.toFixed(1)}%</strong></span>
                  <span style={{ fontFamily: "'Dallas PS', sans-serif", fontWeight: '600', fontSize: '0.85rem', color: '#4A5B73' }}>Extras: <strong style={{ color: '#192F4D' }}>{doughCalc.extrasPercent.toFixed(1)}%</strong></span>
                </div>
              </div>
            </div>
            <div className="md:col-span-5 sidebar">
              <div className="batch-card">
                <h3 className="batch-card-title"><span className="material-symbols-outlined">apps</span>Batch Configuration</h3>
                <div className="space-y-4">
                  <div className="batch-control">
                    <label className="batch-control-label">Number of Dough Balls</label>
                    <div className="batch-number-display">
                      <button className="batch-btn" onClick={() => doughCalc.setNumBalls(Math.max(1, doughCalc.numBalls - 1))}><span className="material-symbols-outlined">remove</span></button>
                      <span className="batch-number">{doughCalc.numBalls}</span>
                      <button className="batch-btn" onClick={() => doughCalc.setNumBalls(doughCalc.numBalls + 1)}><span className="material-symbols-outlined">add</span></button>
                    </div>
                  </div>
                  <div className="batch-control">
                    <label className="batch-control-label">Target Ball Weight (g)</label>
                    <div className="batch-input-wrapper">
                      <input className="batch-input" type="number" value={doughCalc.ballWeight} onChange={(e) => doughCalc.setBallWeight(parseInt(e.target.value) || 50)} />
                      <span className="batch-input-unit">g</span>
                    </div>
                  </div>
                  <button className={`action-btn w-full ${doughCalc.divideBatches ? 'active' : ''}`} onClick={() => { doughCalc.setDivideBatches(!doughCalc.divideBatches); if (!doughCalc.divideBatches) doughCalc.setNumBatches(2); else doughCalc.setNumBatches(1) }}>
                    <span className="material-symbols-outlined">call_split</span>
                    <span>Divide into Batches</span>
                  </button>
                  {doughCalc.divideBatches && (
                    <div className="batch-control" style={{ marginTop: '0.75rem' }}>
                      <label className="batch-control-label">Number of Batches</label>
                      <div className="batch-number-display">
                        <button className="batch-btn" onClick={() => doughCalc.setNumBatches(Math.max(1, doughCalc.numBatches - 1))}><span className="material-symbols-outlined">remove</span></button>
                        <span className="batch-number">{doughCalc.numBatches}</span>
                        <button className="batch-btn" onClick={() => doughCalc.setNumBatches(doughCalc.numBatches + 1)}><span className="material-symbols-outlined">add</span></button>
                      </div>
                    </div>
                  )}
                  <div className="batch-split" style={{ marginTop: '0.75rem', display: doughCalc.divideBatches ? 'flex' : 'none' }}>
                    <div className="batch-split-icon"><span className="material-symbols-outlined">call_split</span></div>
                    <div><h5 className="batch-split-title">Per Batch</h5><p className="batch-split-sub">{doughCalc.targetPerBatch}g × {doughCalc.numBatches} = {doughCalc.targetOutput}g total</p></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TOPPINGS TAB */}
        {activeTab === 'toppings' && (
          <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem' }}>
            {doughCalc.servingsMismatch && (
              <div style={{ background: '#FFF3E0', border: '1px solid #FF9800', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ color: '#FF9800', fontSize: '1.25rem' }}>warning</span>
                <span style={{ fontFamily: "'Dallas PS', sans-serif", fontWeight: '600', color: '#E65100', fontSize: '0.875rem' }}>Topping servings ({doughCalc.totalToppingServings}) don't match dough balls ({doughCalc.numBalls})</span>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {doughCalc.menuItems.map((menuItem) => (
                <div key={menuItem.id} onClick={() => doughCalc.toggleMenuItem(menuItem.id)} style={{ background: doughCalc.expandedMenuItemIds.includes(menuItem.id) ? '#192F4D' : '#fff', border: '2px solid #192F4D', borderRadius: '12px', padding: '1rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: doughCalc.expandedMenuItemIds.includes(menuItem.id) ? '#D9A043' : '#192F4D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: doughCalc.expandedMenuItemIds.includes(menuItem.id) ? '#192F4D' : '#fff' }}>{menuItem.icon}</span>
                    </div>
                    <div>
                      <h4 style={{ fontFamily: "'Dallas PS', sans-serif", fontWeight: '700', fontSize: '1rem', color: doughCalc.expandedMenuItemIds.includes(menuItem.id) ? '#fff' : '#192F4D', margin: 0 }}>{menuItem.name}</h4>
                      <span style={{ fontFamily: "'Dallas PS', sans-serif", fontWeight: '600', fontSize: '0.875rem', color: doughCalc.expandedMenuItemIds.includes(menuItem.id) ? '#D9A043' : '#4A5B73' }}>{menuItem.numServings} servings</span>
                    </div>
                  </div>
                  {doughCalc.expandedMenuItemIds.includes(menuItem.id) && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '0.75rem', color: '#D9A043', textTransform: 'uppercase', fontWeight: '700' }}>Number of Servings</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                          <button onClick={(e) => { e.stopPropagation(); doughCalc.updateMenuItemServings(menuItem.id, Math.max(1, menuItem.numServings - 1)) }} style={{ background: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}><span className="material-symbols-outlined" style={{ fontSize: '1rem', color: '#192F4D' }}>remove</span></button>
                          <input type="number" value={menuItem.numServings} onChange={(e) => { e.stopPropagation(); doughCalc.updateMenuItemServings(menuItem.id, parseInt(e.target.value) || 1) }} onClick={(e) => e.stopPropagation()} style={{ width: '60px', textAlign: 'center', background: '#fff', border: '1px solid #E0DDD6', borderRadius: '4px', padding: '4px', fontFamily: "'Dallas PS', sans-serif", fontWeight: '700', fontSize: '1rem' }} />
                          <button onClick={(e) => { e.stopPropagation(); doughCalc.updateMenuItemServings(menuItem.id, menuItem.numServings + 1) }} style={{ background: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}><span className="material-symbols-outlined" style={{ fontSize: '1rem', color: '#192F4D' }}>add</span></button>
                        </div>
                      </div>
                      <div style={{ marginBottom: '0.5rem' }}><span style={{ fontSize: '0.75rem', color: '#D9A043', textTransform: 'uppercase', fontWeight: '700' }}>Ingredients</span></div>
                      {menuItem.ingredients.map((ing) => (
                        <div key={ing.id} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem', padding: '0.25rem', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', flexWrap: 'wrap' }}>
                          <span style={{ color: '#fff', fontSize: '0.75rem', flex: '1 1 80px', fontWeight: '600' }}>{ing.name}</span>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <input type="number" value={ing.weight} onChange={(e) => { e.stopPropagation(); doughCalc.updateMenuItemIngredient(menuItem.id, ing.id, 'weight', parseFloat(e.target.value) || 0) }} onClick={(e) => e.stopPropagation()} style={{ width: '55px', textAlign: 'right', background: '#fff', border: '1px solid #E0DDD6', borderRadius: '4px', padding: '4px', fontSize: '0.8rem' }} />
                            <span style={{ color: '#fff', fontSize: '0.7rem', marginLeft: '2px' }}>g</span>
                          </div>
                          {doughCalc.showPrices && (
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span style={{ color: '#D9A043', fontSize: '0.65rem', fontWeight: '700' }}>£</span>
                              <input type="number" value={ing.pricePerKg} onChange={(e) => { e.stopPropagation(); doughCalc.updateMenuItemIngredient(menuItem.id, ing.id, 'pricePerKg', parseFloat(e.target.value) || 0) }} onClick={(e) => e.stopPropagation()} style={{ width: '45px', textAlign: 'right', background: '#fff', border: '1px solid #E0DDD6', borderRadius: '4px', padding: '4px', fontSize: '0.7rem' }} />
                            </div>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); doughCalc.removeIngredientFromMenuItem(menuItem.id, ing.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FF9800', padding: '2px', display: 'flex' }}><span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>close</span></button>
                        </div>
                      ))}
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                        <input type="text" placeholder="Ingredient name" value={doughCalc.newMenuItemIngredient.name} onChange={(e) => doughCalc.setNewMenuItemIngredient({ ...doughCalc.newMenuItemIngredient, name: e.target.value })} onClick={(e) => e.stopPropagation()} style={{ flex: '1 1 100px', background: '#fff', border: '1px solid #E0DDD6', borderRadius: '8px', padding: '10px 12px', fontSize: '0.9rem', color: '#192F4D' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input type="number" placeholder="g" value={doughCalc.newMenuItemIngredient.weight || ''} onChange={(e) => doughCalc.setNewMenuItemIngredient({ ...doughCalc.newMenuItemIngredient, weight: parseFloat(e.target.value) || 0 })} onClick={(e) => e.stopPropagation()} style={{ width: '70px', background: '#fff', border: '1px solid #E0DDD6', borderRadius: '8px', padding: '10px', fontSize: '0.9rem', color: '#192F4D', textAlign: 'right' }} />
                          <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: '600' }}>g</span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); doughCalc.addIngredientToMenuItem(menuItem.id) }} style={{ background: '#D9A043', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', color: '#192F4D', fontWeight: '700', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>Add</button>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                        <span style={{ color: '#fff', fontSize: '0.875rem' }}>Total: {menuItem.ingredients.reduce((sum, i) => sum + i.weight * menuItem.numServings, 0)}g</span>
                        {doughCalc.showPrices && <span style={{ color: '#D9A043', fontWeight: '700', fontSize: '0.875rem' }}>{doughCalc.formatPrice(menuItem.ingredients.reduce((sum, i) => sum + (i.weight * menuItem.numServings / 1000) * i.pricePerKg, 0))}</span>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button className="action-btn" style={{ background: '#F4F1EA', width: '100%', justifyContent: 'center' }} onClick={() => doughCalc.setShowAddMenuItemForm(true)}>
              <span className="material-symbols-outlined">add</span><span>Add Menu Item</span>
            </button>
            {doughCalc.showAddMenuItemForm && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                <div style={{ background: '#F4F1EA', borderRadius: '12px', padding: '2rem', maxWidth: '400px', width: '90%', border: '2px solid #192F4D' }}>
                  <h3 style={{ fontFamily: "'Dallas PS', sans-serif", fontWeight: '900', fontSize: '1.5rem', color: '#192F4D', marginBottom: '1rem' }}>Add Menu Item</h3>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.75rem', color: '#4A5B73', textTransform: 'uppercase', fontWeight: '700' }}>Name</label>
                    <input type="text" value={doughCalc.newMenuItem.name} onChange={(e) => doughCalc.setNewMenuItem({ ...doughCalc.newMenuItem, name: e.target.value })} style={{ width: '100%', background: '#fff', border: '1px solid #E0DDD6', borderRadius: '8px', padding: '12px', fontSize: '1rem', fontFamily: "'Dallas PS', sans-serif" }} placeholder="Menu Item Name" />
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.75rem', color: '#4A5B73', textTransform: 'uppercase', fontWeight: '700' }}>Icon</label>
                    <select value={doughCalc.newMenuItem.icon} onChange={(e) => doughCalc.setNewMenuItem({ ...doughCalc.newMenuItem, icon: e.target.value })} style={{ width: '100%', background: '#fff', border: '1px solid #E0DDD6', borderRadius: '8px', padding: '12px', fontSize: '1rem', fontFamily: "'Dallas PS', sans-serif" }}>
                      <option value="grass">Grass</option><option value="eco">Leaf</option><option value="egg_alt">Cheese</option><option value="restaurant">Meat</option><option value="cake">Sweet</option><option value="local_pizza">Pizza</option><option value="local_fire_department">Spicy</option><option value="spa">Herbs</option><option value="free_breakfast">Breakfast</option><option value="nutrition">Fruit</option><option value="bakery_dining">Bread</option><option value="lunch_dining">Sandwich</option><option value="icecream">Frozen</option><option value="set_meal">Meal</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button className="action-btn" onClick={() => doughCalc.setShowAddMenuItemForm(false)}>Cancel</button>
                    <button className="action-btn action-btn-primary" onClick={doughCalc.addMenuItem} disabled={!doughCalc.newMenuItem.name}>Add</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUMMARY TAB */}
        {activeTab === 'summary' && (
          <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem' }}>
            <div style={{ background: '#F4F1EA', border: '2px solid #192F4D', borderRadius: '12px', padding: '1.5rem', boxShadow: '4px 4px 0 #192F4D' }}>
              <h3 style={{ fontFamily: "'Dallas PS', sans-serif", fontWeight: '900', fontSize: '1.5rem', color: '#192F4D', marginBottom: '1rem' }}>Summary & Shopping List</h3>
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.75rem', color: '#4A5B73', textTransform: 'uppercase', fontWeight: '700', marginBottom: '0.5rem' }}>Production Overview</h4>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <div style={{ background: '#fff', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #E0DDD6' }}>
                    <span style={{ color: '#4A5B73', fontSize: '0.75rem' }}>Dough</span>
                    <p style={{ fontFamily: "'Dallas PS', sans-serif", fontWeight: '700', fontSize: '1.25rem', color: '#192F4D' }}>{doughCalc.numBalls} balls</p>
                  </div>
                  {doughCalc.menuItems.filter(m => m.numServings > 0).map(item => (
                    <div key={item.id} style={{ background: '#fff', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #E0DDD6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="material-symbols-outlined" style={{ color: '#D9A043', fontSize: '1.25rem' }}>{item.icon}</span>
                      <div><span style={{ color: '#4A5B73', fontSize: '0.75rem' }}>{item.name}</span><p style={{ fontFamily: "'Dallas PS', sans-serif", fontWeight: '700', fontSize: '1.25rem', color: '#192F4D' }}>{item.numServings}</p></div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ borderTop: '2px solid #192F4D', paddingTop: '1rem', marginTop: '1rem' }}>
                <h4 style={{ fontSize: '0.75rem', color: '#4A5B73', textTransform: 'uppercase', fontWeight: '700', marginBottom: '0.5rem' }}>Combined Ingredients (Shopping List)</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
                  <thead><tr style={{ background: '#192F4D' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fff', fontFamily: "'Dallas PS', sans-serif", fontWeight: '700', fontSize: '0.75rem' }}>Ingredient</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', color: '#fff', fontFamily: "'Dallas PS', sans-serif", fontWeight: '700', fontSize: '0.75rem' }}>Total Amount</th>
                    {doughCalc.showPrices && <th style={{ padding: '0.75rem', textAlign: 'right', color: '#fff', fontFamily: "'Dallas PS', sans-serif", fontWeight: '700', fontSize: '0.75rem' }}>Cost</th>}
                  </tr></thead>
                  <tbody>
                    {Object.entries(doughCalc.allIngredientsSummary).map(([name, data]) => (
                      <tr key={name} style={{ borderBottom: '1px solid #E0DDD6' }}>
                        <td style={{ padding: '0.75rem', color: '#192F4D', fontFamily: "'Dallas PS', sans-serif", fontWeight: '600' }}>{name}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', color: '#192F4D', fontFamily: "'Dallas PS', sans-serif", fontWeight: '700' }}>{Math.round(data.weight)}g</td>
                        {doughCalc.showPrices && <td style={{ padding: '0.75rem', textAlign: 'right', color: '#D9A043', fontFamily: "'Dallas PS', sans-serif", fontWeight: '700' }}>{doughCalc.formatPrice(data.cost)}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', padding: '1rem', background: '#192F4D', borderRadius: '8px' }}>
                <span style={{ color: '#fff', fontFamily: "'Dallas PS', sans-serif", fontWeight: '900', fontSize: '1rem' }}>Grand Total</span>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <span style={{ color: '#fff', fontFamily: "'Dallas PS', sans-serif", fontWeight: '700' }}>{Object.values(doughCalc.allIngredientsSummary).reduce((sum, i) => sum + i.weight, 0)}g</span>
                  {doughCalc.showPrices && <span style={{ color: '#D9A043', fontFamily: "'Dallas PS', sans-serif", fontWeight: '900', fontSize: '1rem' }}>{doughCalc.formatPrice(Object.values(doughCalc.allIngredientsSummary).reduce((sum, i) => sum + i.cost, 0))}</span>}
                </div>
              </div>
              <div style={{ borderTop: '2px solid #192F4D', paddingTop: '1rem', marginTop: '1rem' }}>
                <h4 style={{ fontSize: '0.75rem', color: '#4A5B73', textTransform: 'uppercase', fontWeight: '700', marginBottom: '0.5rem' }}>Dough Stats</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                  <div style={{ background: '#fff', padding: '0.5rem', borderRadius: '4px', textAlign: 'center' }}><span style={{ color: '#4A5B73', fontSize: '0.7rem' }}>Hydration</span><p style={{ color: '#192F4D', fontWeight: '700' }}>{doughCalc.hydration.toFixed(1)}%</p></div>
                  <div style={{ background: '#fff', padding: '0.5rem', borderRadius: '4px', textAlign: 'center' }}><span style={{ color: '#4A5B73', fontSize: '0.7rem' }}>Salt</span><p style={{ color: '#192F4D', fontWeight: '700' }}>{doughCalc.saltPercent.toFixed(1)}%</p></div>
                  <div style={{ background: '#fff', padding: '0.5rem', borderRadius: '4px', textAlign: 'center' }}><span style={{ color: '#4A5B73', fontSize: '0.7rem' }}>Fat</span><p style={{ color: '#192F4D', fontWeight: '700' }}>{doughCalc.oilPercent.toFixed(1)}%</p></div>
                  <div style={{ background: '#fff', padding: '0.5rem', borderRadius: '4px', textAlign: 'center' }}><span style={{ color: '#4A5B73', fontSize: '0.7rem' }}>Extras</span><p style={{ color: '#192F4D', fontWeight: '700' }}>{doughCalc.extrasPercent.toFixed(1)}%</p></div>
                </div>
              </div>
              {doughCalc.showPrices && (
                <div style={{ borderTop: '2px solid #192F4D', paddingTop: '1rem', marginTop: '1rem' }}>
                  <h4 style={{ fontSize: '0.75rem', color: '#4A5B73', textTransform: 'uppercase', fontWeight: '700', marginBottom: '0.5rem' }}>Cost Breakdown</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                    <div style={{ background: '#fff', padding: '0.75rem', borderRadius: '4px', textAlign: 'center' }}><span style={{ color: '#4A5B73', fontSize: '0.7rem' }}>Dough</span><p style={{ color: '#D9A043', fontWeight: '900' }}>{doughCalc.formatPrice(doughCalc.totalCost)}</p></div>
                    <div style={{ background: '#fff', padding: '0.75rem', borderRadius: '4px', textAlign: 'center' }}><span style={{ color: '#4A5B73', fontSize: '0.7rem' }}>Toppings</span><p style={{ color: '#D9A043', fontWeight: '900' }}>{doughCalc.formatPrice(doughCalc.totalToppingCost)}</p></div>
                    <div style={{ background: '#D9A043', padding: '0.75rem', borderRadius: '4px', textAlign: 'center' }}><span style={{ color: '#fff', fontSize: '0.7rem' }}>Total</span><p style={{ color: '#fff', fontWeight: '900' }}>{doughCalc.formatPrice(doughCalc.totalCost + doughCalc.totalToppingCost)}</p></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Mobile Navigation */}
      <nav className="mobile-nav">
        <span className={`mobile-nav-link ${activeTab === 'dough' ? 'active' : ''}`} onClick={() => setActiveTab('dough')}><span className="material-symbols-outlined">format_color_fill</span><span>Dough</span></span>
        <span className={`mobile-nav-link ${activeTab === 'toppings' ? 'active' : ''}`} onClick={() => setActiveTab('toppings')}><span className="material-symbols-outlined">set_meal</span><span>Toppings</span></span>
        <span className={`mobile-nav-link ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}><span className="material-symbols-outlined">analytics</span><span>Summary</span></span>
        <span className={`mobile-nav-link ${showPrices ? 'active' : ''}`} onClick={() => setShowPrices(!showPrices)}><span className="material-symbols-outlined">payments</span><span>Pricing</span></span>
      </nav>

      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '5rem', left: '50%', transform: 'translateX(-50%)',
          background: '#192F4D', color: '#fff', padding: '0.75rem 1.5rem',
          borderRadius: '8px', fontFamily: "'Dallas PS', sans-serif",
          fontWeight: '600', fontSize: '0.875rem', zIndex: 200,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)', display: 'flex',
          alignItems: 'center', gap: '0.5rem',
          animation: 'toast-in 0.3s ease'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', color: '#D9A043' }}>check_circle</span>
          {toast}
        </div>
      )}
    </>
  )
}

export default App