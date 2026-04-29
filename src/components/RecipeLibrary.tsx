import React, { useState } from 'react';
import { Recipe, useRecipeLibrary } from '../hooks/useRecipeLibrary';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from './ui/SortableItem';
import { AVAILABLE_ICONS } from '../hooks/useDoughCalculator';

interface RecipeLibraryProps {
  recipeLib: ReturnType<typeof useRecipeLibrary>;
  showPrices: boolean;
  currency: 'GBP' | 'USD' | 'EUR';
  formatPrice: (amount: number) => string;
  darkMode?: boolean;
}

export default function RecipeLibrary({ recipeLib, showPrices, currency, formatPrice, darkMode = false }: RecipeLibraryProps) {
  const [expandedRecipeIds, setExpandedRecipeIds] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRecipe, setNewRecipe] = useState<Omit<Recipe, 'id'>>({ name: '', icon: 'menu_book', numServings: 1, ingredients: [] });
  const [newIngredient, setNewIngredient] = useState({ name: '', weight: 0, pricePerKg: 0 });

  // Derived dark-mode colour tokens
  const dm = {
    cardBg:        darkMode ? '#1B2C46' : '#fff',
    cardBgActive:  '#192F4D',                          // expanded always navy
    cardBorder:    darkMode ? '#2A4068' : '#192F4D',
    surfaceBg:     darkMode ? '#0E1A2C' : '#F4F1EA',
    inputBg:       darkMode ? '#0F1C30' : '#fff',
    inputBorder:   darkMode ? '#2A4068' : '#E0DDD6',
    inputColor:    darkMode ? '#EAF0FA' : '#192F4D',
    textPrimary:   darkMode ? '#EAF0FA' : '#192F4D',
    textSecondary: darkMode ? '#A9B7CC' : '#4A5B73',
    dragHandle:    darkMode ? 'rgba(169,183,204,0.5)' : '#4A5B73',
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const toggleRecipe = (id: string) => {
    setExpandedRecipeIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = recipeLib.recipes.findIndex(r => r.id === active.id);
      const newIndex = recipeLib.recipes.findIndex(r => r.id === over.id);
      recipeLib.reorderRecipes(oldIndex, newIndex);
    }
  };

  const handleIngredientDragEnd = (recipeId: string, event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const recipe = recipeLib.recipes.find(r => r.id === recipeId);
      if (recipe) {
        const oldIndex = recipe.ingredients.findIndex(i => i.id === active.id);
        const newIndex = recipe.ingredients.findIndex(i => i.id === over.id);
        recipeLib.reorderRecipeIngredients(recipeId, oldIndex, newIndex);
      }
    }
  };

  const handleAddRecipe = () => {
    if (newRecipe.name) {
      recipeLib.addRecipe(newRecipe);
      setNewRecipe({ name: '', icon: 'menu_book', numServings: 1, ingredients: [] });
      setShowAddForm(false);
    }
  };

  const handleAddIngredient = (recipeId: string) => {
    if (newIngredient.name && newIngredient.weight > 0) {
      recipeLib.addIngredientToRecipe(recipeId, newIngredient);
      setNewIngredient({ name: '', weight: 0, pricePerKg: 0 });
    }
  };

  return (
    <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={recipeLib.recipes.map(r => r.id)} strategy={verticalListSortingStrategy}>
            {recipeLib.recipes.map(recipe => {
              const isExpanded = expandedRecipeIds.includes(recipe.id);
              const bg = isExpanded ? dm.cardBgActive : dm.cardBg;
              const nameColor = isExpanded ? '#fff' : dm.textPrimary;
              const subColor = isExpanded ? '#D9A043' : dm.textSecondary;
              return (
                <SortableItem key={recipe.id} id={recipe.id}>
                  {(dragHandleProps) => (
                    <div style={{ background: bg, border: `2px solid ${dm.cardBorder}`, borderRadius: '12px', padding: '1rem', transition: 'all 0.2s', position: 'relative' }}>

                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                        {/* Drag handle */}
                        <div {...dragHandleProps} style={{ cursor: 'grab', color: isExpanded ? 'rgba(255,255,255,0.5)' : dm.dragHandle, paddingTop: '2px', flexShrink: 0 }}>
                          <span className="material-symbols-outlined">drag_indicator</span>
                        </div>

                        {/* Icon */}
                        <div onClick={() => toggleRecipe(recipe.id)} style={{ width: '48px', height: '48px', borderRadius: '50%', background: isExpanded ? '#D9A043' : '#192F4D', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: isExpanded ? '#192F4D' : '#fff' }}>{recipe.icon}</span>
                        </div>

                        {/* Name + actions */}
                        <div style={{ flex: 1, minWidth: 0 }} onClick={() => toggleRecipe(recipe.id)}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                            <h4 style={{ fontFamily: "'Dallas PS', sans-serif", fontWeight: '700', fontSize: '1rem', color: nameColor, margin: 0, cursor: 'pointer' }}>{recipe.name}</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                              <button onClick={() => recipeLib.exportSingleRecipe(recipe)} title="Export Recipe" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: isExpanded ? 'rgba(255,255,255,0.7)' : dm.textSecondary }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>download</span>
                              </button>
                              <button onClick={() => recipeLib.removeRecipe(recipe.id)} title="Delete Recipe" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: isExpanded ? 'rgba(255,255,255,0.7)' : dm.textSecondary }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>close</span>
                              </button>
                            </div>
                          </div>
                          <span style={{ fontFamily: "'Dallas PS', sans-serif", fontWeight: '600', fontSize: '0.875rem', color: subColor }}>{recipe.numServings} servings</span>
                        </div>
                      </div>

                      {isExpanded && (
                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                          <div style={{ marginBottom: '1rem' }}>
                            <label style={{ fontSize: '0.75rem', color: '#D9A043', textTransform: 'uppercase', fontWeight: '700' }}>Scale (Servings)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                              <button onClick={() => recipeLib.updateRecipeServings(recipe.id, Math.max(1, recipe.numServings - 1))} style={{ background: dm.inputBg, border: `1px solid ${dm.inputBorder}`, borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}><span className="material-symbols-outlined" style={{ fontSize: '1rem', color: '#D9A043' }}>remove</span></button>
                              <input type="number" value={recipe.numServings} onChange={(e) => recipeLib.updateRecipeServings(recipe.id, parseInt(e.target.value) || 1)} style={{ width: '60px', textAlign: 'center', background: dm.inputBg, border: `1px solid ${dm.inputBorder}`, borderRadius: '4px', padding: '4px', fontFamily: "'Dallas PS', sans-serif", fontWeight: '700', fontSize: '1rem', color: dm.inputColor }} />
                              <button onClick={() => recipeLib.updateRecipeServings(recipe.id, recipe.numServings + 1)} style={{ background: dm.inputBg, border: `1px solid ${dm.inputBorder}`, borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}><span className="material-symbols-outlined" style={{ fontSize: '1rem', color: '#D9A043' }}>add</span></button>
                            </div>
                          </div>

                          <div style={{ marginBottom: '0.5rem' }}><span style={{ fontSize: '0.75rem', color: '#D9A043', textTransform: 'uppercase', fontWeight: '700' }}>Ingredients</span></div>

                          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleIngredientDragEnd(recipe.id, e)}>
                            <SortableContext items={recipe.ingredients.map(i => i.id)} strategy={verticalListSortingStrategy}>
                              {recipe.ingredients.map(ing => (
                                <SortableItem key={ing.id} id={ing.id}>
                                  {(ingDragHandleProps) => (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem', padding: '0.25rem', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', flexWrap: 'wrap' }}>
                                      <div {...ingDragHandleProps} style={{ cursor: 'grab', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>drag_indicator</span>
                                      </div>
                                      <span style={{ color: '#fff', fontSize: '0.75rem', flex: '1 1 80px', fontWeight: '600' }}>{ing.name}</span>
                                      <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <input type="number" value={ing.weight} onChange={(e) => recipeLib.updateRecipeIngredient(recipe.id, ing.id, 'weight', parseFloat(e.target.value) || 0)} style={{ width: '55px', textAlign: 'right', background: dm.inputBg, border: `1px solid ${dm.inputBorder}`, borderRadius: '4px', padding: '4px', fontSize: '0.8rem', color: dm.inputColor }} />
                                        <span style={{ color: '#fff', fontSize: '0.7rem', marginLeft: '2px' }}>g</span>
                                      </div>
                                      {showPrices && (
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                          <span style={{ color: '#D9A043', fontSize: '0.65rem', fontWeight: '700' }}>£</span>
                                          <input type="number" value={ing.pricePerKg} onChange={(e) => recipeLib.updateRecipeIngredient(recipe.id, ing.id, 'pricePerKg', parseFloat(e.target.value) || 0)} style={{ width: '45px', textAlign: 'right', background: dm.inputBg, border: `1px solid ${dm.inputBorder}`, borderRadius: '4px', padding: '4px', fontSize: '0.7rem', color: dm.inputColor }} />
                                        </div>
                                      )}
                                      <button onClick={() => recipeLib.removeIngredientFromRecipe(recipe.id, ing.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FF9800', padding: '2px', display: 'flex' }}><span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>close</span></button>
                                    </div>
                                  )}
                                </SortableItem>
                              ))}
                            </SortableContext>
                          </DndContext>

                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                            <input type="text" placeholder="Ingredient name" value={newIngredient.name} onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })} style={{ flex: '1 1 100px', background: dm.inputBg, border: `1px solid ${dm.inputBorder}`, borderRadius: '8px', padding: '10px 12px', fontSize: '0.9rem', color: dm.inputColor }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <input type="number" placeholder="g" value={newIngredient.weight || ''} onChange={(e) => setNewIngredient({ ...newIngredient, weight: parseFloat(e.target.value) || 0 })} style={{ width: '70px', background: dm.inputBg, border: `1px solid ${dm.inputBorder}`, borderRadius: '8px', padding: '10px', fontSize: '0.9rem', color: dm.inputColor, textAlign: 'right' }} />
                              <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: '600' }}>g</span>
                            </div>
                            <button onClick={() => handleAddIngredient(recipe.id)} style={{ background: '#D9A043', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', color: '#192F4D', fontWeight: '700', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>Add</button>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                            <span style={{ color: '#fff', fontSize: '0.875rem' }}>Total: {recipe.ingredients.reduce((sum, i) => sum + i.weight * recipe.numServings, 0)}g</span>
                            {showPrices && <span style={{ color: '#D9A043', fontWeight: '700', fontSize: '0.875rem' }}>{formatPrice(recipe.ingredients.reduce((sum, i) => sum + (i.weight * recipe.numServings / 1000) * i.pricePerKg, 0))}</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </SortableItem>
              );
            })}
          </SortableContext>
        </DndContext>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button className="action-btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowAddForm(true)}>
          <span className="material-symbols-outlined">add</span><span>Create New Recipe</span>
        </button>
        <label htmlFor="import-recipe" className="action-btn" style={{ flex: 1, justifyContent: 'center', cursor: 'pointer' }}>
          <span className="material-symbols-outlined">upload</span><span>Import JSON Recipe</span>
        </label>
        <input type="file" id="import-recipe" accept=".json" style={{ display: 'none' }} onChange={(e) => { if (e.target.files?.[0]) recipeLib.importSingleRecipe(e.target.files[0]) }} />
      </div>

      {showAddForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: dm.surfaceBg, borderRadius: '12px', padding: '2rem', maxWidth: '400px', width: '90%', border: `2px solid ${dm.cardBorder}` }}>
            <h3 style={{ fontFamily: "'Dallas PS', sans-serif", fontWeight: '900', fontSize: '1.5rem', color: dm.textPrimary, marginBottom: '1rem' }}>Create New Recipe</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.75rem', color: dm.textSecondary, textTransform: 'uppercase', fontWeight: '700' }}>Name</label>
              <input type="text" value={newRecipe.name} onChange={(e) => setNewRecipe({ ...newRecipe, name: e.target.value })} style={{ width: '100%', background: dm.inputBg, border: `1px solid ${dm.inputBorder}`, borderRadius: '8px', padding: '12px', fontSize: '1rem', fontFamily: "'Dallas PS', sans-serif", color: dm.inputColor, boxSizing: 'border-box' }} placeholder="e.g. Focaccia Base" />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.75rem', color: dm.textSecondary, textTransform: 'uppercase', fontWeight: '700' }}>Icon</label>
              <select value={newRecipe.icon} onChange={(e) => setNewRecipe({ ...newRecipe, icon: e.target.value })} style={{ width: '100%', background: dm.inputBg, border: `1px solid ${dm.inputBorder}`, borderRadius: '8px', padding: '12px', fontSize: '1rem', fontFamily: "'Dallas PS', sans-serif", color: dm.inputColor }}>
                {AVAILABLE_ICONS.map(icon => (
                  <option key={icon.value} value={icon.value}>{icon.label}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="action-btn" onClick={() => setShowAddForm(false)}>Cancel</button>
              <button className="action-btn action-btn-primary" onClick={handleAddRecipe} disabled={!newRecipe.name}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
