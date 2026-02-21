import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Tag, X } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHouse, faBolt, faUtensils, faCar, faHeartPulse,
  faGraduationCap, faGamepad, faShirt, faSpa, faMobile,
  faGift, faPlane, faDog, faEllipsis, faBriefcase, faLaptop,
  faChartLine, faBuilding, faStar, faCoins, faTag,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../contexts/ThemeContext';

// ── Category metadata ─────────────────────────────────────────────
interface CatMeta { icon: any; color: string; bg: string; custom?: boolean }

const GASTOS_META: Record<string, CatMeta> = {
  '🏠 Vivienda':        { icon: faHouse,        color: '#10b981', bg: 'bg-emerald-500/15' },
  '💡 Servicios':       { icon: faBolt,         color: '#eab308', bg: 'bg-yellow-500/15'  },
  '🍕 Alimentación':    { icon: faUtensils,      color: '#f97316', bg: 'bg-orange-500/15' },
  '🚗 Transporte':      { icon: faCar,           color: '#3b82f6', bg: 'bg-blue-500/15'   },
  '💊 Salud':           { icon: faHeartPulse,    color: '#ef4444', bg: 'bg-red-500/15'    },
  '📚 Educación':       { icon: faGraduationCap, color: '#6366f1', bg: 'bg-indigo-500/15' },
  '🎮 Entretenimiento': { icon: faGamepad,       color: '#a855f7', bg: 'bg-purple-500/15' },
  '👕 Ropa':            { icon: faShirt,         color: '#0ea5e9', bg: 'bg-sky-500/15'    },
  '💅 Cuidado Personal':{ icon: faSpa,           color: '#ec4899', bg: 'bg-pink-500/15'   },
  '📱 Tecnología':      { icon: faMobile,        color: '#64748b', bg: 'bg-slate-500/15'  },
  '🎁 Regalos':         { icon: faGift,          color: '#f43f5e', bg: 'bg-rose-500/15'   },
  '✈️ Viajes':          { icon: faPlane,         color: '#14b8a6', bg: 'bg-teal-500/15'   },
  '🐕 Mascotas':        { icon: faDog,           color: '#d97706', bg: 'bg-amber-500/15'  },
  '💳 Otros':           { icon: faEllipsis,      color: '#94a3b8', bg: 'bg-slate-400/15'  },
};

const INGRESOS_META: Record<string, CatMeta> = {
  '💼 Salario':     { icon: faBriefcase,  color: '#10b981', bg: 'bg-emerald-500/15' },
  '💻 Freelance':   { icon: faLaptop,     color: '#3b82f6', bg: 'bg-blue-500/15'   },
  '📈 Inversiones': { icon: faChartLine,  color: '#6366f1', bg: 'bg-indigo-500/15' },
  '🏦 Intereses':   { icon: faBuilding,   color: '#eab308', bg: 'bg-yellow-500/15' },
  '🎁 Bonos':       { icon: faStar,       color: '#f97316', bg: 'bg-orange-500/15' },
  '🏠 Rentas':      { icon: faHouse,      color: '#14b8a6', bg: 'bg-teal-500/15'   },
  '💰 Otros':       { icon: faCoins,      color: '#94a3b8', bg: 'bg-slate-400/15'  },
};

// Custom category colors cycle
const CUSTOM_COLORS = [
  { color: '#8b5cf6', bg: 'bg-violet-500/15' },
  { color: '#06b6d4', bg: 'bg-cyan-500/15' },
  { color: '#84cc16', bg: 'bg-lime-500/15' },
  { color: '#f59e0b', bg: 'bg-amber-500/15' },
  { color: '#e879f9', bg: 'bg-fuchsia-500/15' },
  { color: '#34d399', bg: 'bg-emerald-400/15' },
  { color: '#fb923c', bg: 'bg-orange-400/15' },
  { color: '#60a5fa', bg: 'bg-blue-400/15' },
];

const cleanLabel = (cat: string) =>
  cat.replace(/^[\u{1F300}-\u{1FFFF}💡💊💅💳💻📚📱📈🏦🎁🎮👕✈️🐕🏠💼💰🚗🍕]/u, '').trim();

function getMeta(cat: string, tipo: 'gasto' | 'ingreso', customList: string[]): CatMeta {
  const map = tipo === 'gasto' ? GASTOS_META : INGRESOS_META;
  if (map[cat]) return map[cat];
  // Custom category: assign a color based on its index
  const idx = customList.indexOf(cat);
  const palette = CUSTOM_COLORS[(idx >= 0 ? idx : 0) % CUSTOM_COLORS.length];
  return { icon: faTag, color: palette.color, bg: palette.bg, custom: true };
}

// ── Props ─────────────────────────────────────────────────────────
interface CategoryPickerProps {
  value: string;
  onChange: (cat: string) => void;
  categories: string[];           // default categories
  customCategories?: string[];    // user-created categories
  tipo: 'gasto' | 'ingreso';
  required?: boolean;
  onAddCustomCategory?: (cat: string) => void;
  onRemoveCustomCategory?: (cat: string) => void;
}

// ── Component ─────────────────────────────────────────────────────
export const CategoryPicker: React.FC<CategoryPickerProps> = ({
  value, onChange, categories, customCategories = [], tipo, required,
  onAddCustomCategory, onRemoveCustomCategory,
}) => {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const [newCat, setNewCat] = useState('');
  const [showNewInput, setShowNewInput] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Decide direction when opening
  const handleOpen = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUp(spaceBelow < 340);
    }
    setOpen(v => !v);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowNewInput(false);
        setNewCat('');
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const allCustom = customCategories;
  const selectedMeta = value ? getMeta(value, tipo, allCustom) : null;

  const handleSelect = (cat: string) => {
    onChange(cat);
    setOpen(false);
    setShowNewInput(false);
    setNewCat('');
  };

  const handleAddNew = () => {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed) || allCustom.includes(trimmed)) {
      handleSelect(trimmed);
      return;
    }
    onAddCustomCategory?.(trimmed);
    handleSelect(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddNew(); }
    if (e.key === 'Escape') { setShowNewInput(false); setNewCat(''); }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all
          ${theme.colors.bgSecondary} ${theme.colors.border}
          ${open ? 'ring-2 ring-indigo-500 border-indigo-500' : ''}
          ${!value && required ? 'border-dashed' : ''}`}
      >
        {selectedMeta && value ? (
          <>
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedMeta.bg}`}>
              <FontAwesomeIcon icon={selectedMeta.icon} style={{ color: selectedMeta.color }} className="text-sm" />
            </span>
            <span className={`flex-1 text-left text-sm font-medium ${theme.colors.textPrimary}`}>
              {cleanLabel(value)}
            </span>
          </>
        ) : (
          <span className={`flex-1 text-left text-sm ${theme.colors.textMuted}`}>Selecciona...</span>
        )}
        <ChevronDown
          size={16}
          className={`${theme.colors.textMuted} transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className={`absolute left-0 right-0 z-50 rounded-2xl border ${theme.colors.border} ${theme.colors.bgCard} shadow-xl
          ${openUp ? 'bottom-full mb-2' : 'top-full mt-2'}`}
        >
          {/* Scrollable grid area */}
          <div className="max-h-64 overflow-y-auto p-3 overscroll-contain">
            {/* Default categories */}
            <div className="grid grid-cols-4 gap-2">
              {categories.map(cat => {
                const meta = getMeta(cat, tipo, allCustom);
                const isSelected = cat === value;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleSelect(cat)}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all active:scale-95
                      ${isSelected ? theme.colors.bgSecondary : `hover:${theme.colors.bgSecondary}`}`}
                  >
                    <span
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${meta.bg}`}
                      style={isSelected ? { boxShadow: `0 0 0 2px ${meta.color}` } : {}}
                    >
                      <FontAwesomeIcon icon={meta.icon} style={{ color: meta.color }} />
                    </span>
                    <span
                      className={`text-[10px] leading-tight text-center font-medium line-clamp-2`}
                      style={{ color: isSelected ? meta.color : undefined }}
                    >
                      {isSelected
                        ? <strong>{cleanLabel(cat)}</strong>
                        : <span className={theme.colors.textMuted}>{cleanLabel(cat)}</span>
                      }
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom categories section */}
            {allCustom.length > 0 && (
              <>
                <div className={`flex items-center gap-2 my-2`}>
                  <div className={`flex-1 h-px ${theme.colors.border} bg-current opacity-20`} />
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${theme.colors.textMuted}`}>
                    Personalizadas
                  </span>
                  <div className={`flex-1 h-px ${theme.colors.border} bg-current opacity-20`} />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {allCustom.map((cat, idx) => {
                    const meta = getMeta(cat, tipo, allCustom);
                    const isSelected = cat === value;
                    return (
                      <div key={cat} className="relative group">
                        <button
                          type="button"
                          onClick={() => handleSelect(cat)}
                          className={`w-full flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all active:scale-95
                            ${isSelected ? theme.colors.bgSecondary : `hover:${theme.colors.bgSecondary}`}`}
                        >
                          <span
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${meta.bg}`}
                            style={isSelected ? { boxShadow: `0 0 0 2px ${meta.color}` } : {}}
                          >
                            <FontAwesomeIcon icon={faTag} style={{ color: meta.color }} />
                          </span>
                          <span
                            className={`text-[10px] leading-tight text-center font-medium line-clamp-2`}
                            style={{ color: isSelected ? meta.color : undefined }}
                          >
                            {isSelected ? <strong>{cat}</strong> : <span className={theme.colors.textMuted}>{cat}</span>}
                          </span>
                        </button>
                        {/* Remove button */}
                        {onRemoveCustomCategory && (
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); onRemoveCustomCategory(cat); }}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full items-center justify-center hidden group-hover:flex"
                          >
                            <X size={8} className="text-white" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Add custom category footer */}
          <div className={`border-t ${theme.colors.border} p-3`}>
            {showNewInput ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  type="text"
                  value={newCat}
                  onChange={e => setNewCat(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ej: Netflix, Gym, etc."
                  maxLength={30}
                  className={`flex-1 px-3 py-2 rounded-xl border ${theme.colors.border} ${theme.colors.bgSecondary} ${theme.colors.textPrimary} text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                />
                <button
                  type="button"
                  onClick={handleAddNew}
                  disabled={!newCat.trim()}
                  className="px-3 py-2 rounded-xl bg-indigo-500 text-white text-sm font-bold disabled:opacity-40"
                >
                  Agregar
                </button>
                <button
                  type="button"
                  onClick={() => { setShowNewInput(false); setNewCat(''); }}
                  className={`px-2 py-2 rounded-xl ${theme.colors.textMuted}`}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowNewInput(true)}
                className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed ${theme.colors.border} ${theme.colors.textMuted} hover:border-indigo-400 hover:text-indigo-400 transition-all text-sm`}
              >
                <Plus size={14} /> Nueva categoría
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
