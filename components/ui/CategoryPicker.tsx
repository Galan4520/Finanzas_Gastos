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
  '🏠 Vivienda':        { icon: faHouse,        color: '#00A750', bg: 'bg-yn-primary-500/15' },
  '💡 Servicios':       { icon: faBolt,         color: '#FED609', bg: 'bg-yn-sec2-500/15'  },
  '🍕 Alimentación':    { icon: faUtensils,      color: '#F6AC2E', bg: 'bg-yn-warning-400/15' },
  '🚗 Transporte':      { icon: faCar,           color: '#099AFE', bg: 'bg-yn-sec1-500/15'   },
  '💊 Salud':           { icon: faHeartPulse,    color: '#EF4444', bg: 'bg-yn-error-500/15'    },
  '📚 Educación':       { icon: faGraduationCap, color: '#014E83', bg: 'bg-yn-sec1-800/15' },
  '🎮 Entretenimiento': { icon: faGamepad,       color: '#016BAF', bg: 'bg-yn-sec1-700/15' },
  '👕 Ropa':            { icon: faShirt,         color: '#5BBCFE', bg: 'bg-yn-sec1-300/15'    },
  '💅 Cuidado Personal':{ icon: faSpa,           color: '#EE6060', bg: 'bg-yn-error-400/15'   },
  '📱 Tecnología':      { icon: faMobile,        color: '#6F7D75', bg: 'bg-yn-neutral-500/15'  },
  '🎁 Regalos':         { icon: faGift,          color: '#D91717', bg: 'bg-yn-error-600/15'   },
  '✈️ Viajes':          { icon: faPlane,         color: '#0E9540', bg: 'bg-yn-success-700/15'   },
  '🐕 Mascotas':        { icon: faDog,           color: '#D38B09', bg: 'bg-yn-warning-600/15'  },
  '💳 Otros':           { icon: faEllipsis,      color: '#96A39C', bg: 'bg-yn-neutral-400/15'  },
};

const INGRESOS_META: Record<string, CatMeta> = {
  '💼 Salario':     { icon: faBriefcase,  color: '#00A750', bg: 'bg-yn-primary-500/15' },
  '💻 Freelance':   { icon: faLaptop,     color: '#099AFE', bg: 'bg-yn-sec1-500/15'   },
  '📈 Inversiones': { icon: faChartLine,  color: '#014E83', bg: 'bg-yn-sec1-800/15' },
  '🏦 Intereses':   { icon: faBuilding,   color: '#FED609', bg: 'bg-yn-sec2-500/15' },
  '🎁 Bonos':       { icon: faStar,       color: '#F6AC2E', bg: 'bg-yn-warning-400/15' },
  '🏠 Rentas':      { icon: faHouse,      color: '#0E9540', bg: 'bg-yn-success-700/15'   },
  '💰 Otros':       { icon: faCoins,      color: '#96A39C', bg: 'bg-yn-neutral-400/15'  },
};

// Custom category colors cycle
const CUSTOM_COLORS = [
  { color: '#016BAF', bg: 'bg-yn-sec1-700/15' },
  { color: '#32ABFE', bg: 'bg-yn-sec1-400/15' },
  { color: '#15E060', bg: 'bg-yn-success-500/15' },
  { color: '#F59E0B', bg: 'bg-yn-warning-500/15' },
  { color: '#0182DA', bg: 'bg-yn-sec1-600/15' },
  { color: '#99ED8D', bg: 'bg-yn-primary-300/15' },
  { color: '#F8BA51', bg: 'bg-yn-warning-300/15' },
  { color: '#5BBCFE', bg: 'bg-yn-sec1-300/15' },
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
          ${open ? 'ring-2 ring-yn-sec1-500 border-yn-sec1-500' : ''}
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
                            className="absolute -top-1 -right-1 w-4 h-4 bg-yn-error-500 rounded-full items-center justify-center hidden group-hover:flex"
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
                  className={`flex-1 px-3 py-2 rounded-xl border ${theme.colors.border} ${theme.colors.bgSecondary} ${theme.colors.textPrimary} text-sm focus:outline-none focus:ring-2 focus:ring-yn-sec1-500`}
                />
                <button
                  type="button"
                  onClick={handleAddNew}
                  disabled={!newCat.trim()}
                  className="px-3 py-2 rounded-xl bg-yn-sec1-500 text-white text-sm font-bold disabled:opacity-40"
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
                className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed ${theme.colors.border} ${theme.colors.textMuted} hover:border-yn-sec1-400 hover:text-yn-sec1-400 transition-all text-sm`}
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
