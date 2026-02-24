import React, { useState } from 'react';
import { RealEstateInvestment, RealEstateProperty } from '../types';
import { formatCurrency, formatCompact } from '../utils/format';
import { Home, Search, Filter, Plus, TrendingUp, MapPin, Maximize2, BedDouble, Bath, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getTextColor } from '../themes';

interface AssetsViewProps {
  realEstateInvestments: RealEstateInvestment[];
  availableProperties?: RealEstateProperty[];
  onAddProperty: (property: RealEstateInvestment) => void;
  onBuyProperty?: (property: RealEstateProperty) => void;
  notify?: (msg: string, type: 'success' | 'error') => void;
}

// Componente de Carrusel de Imágenes
const ImageCarousel: React.FC<{ imagenes: string[], titulo: string, theme: any }> = ({ imagenes, titulo, theme }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!imagenes || imagenes.length === 0) {
    return (
      <div className={`h-48 ${theme.colors.gradientPrimary} flex items-center justify-center`}>
        <Home size={48} className="text-white/50" />
      </div>
    );
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % imagenes.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + imagenes.length) % imagenes.length);
  };

  return (
    <div className="relative h-48 group">
      <img
        src={imagenes[currentIndex]}
        alt={`${titulo} - Imagen ${currentIndex + 1}`}
        className="w-full h-full object-cover"
      />

      {/* Contador de imágenes */}
      {imagenes.length > 1 && (
        <>
          <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
            {currentIndex + 1} / {imagenes.length}
          </div>

          {/* Botones de navegación */}
          <button
            onClick={(e) => { e.stopPropagation(); prevImage(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Imagen anterior"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); nextImage(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Siguiente imagen"
          >
            <ChevronRight size={20} />
          </button>

          {/* Indicadores de puntos */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {imagenes.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentIndex
                    ? 'bg-white w-6'
                    : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Ir a imagen ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export const AssetsView: React.FC<AssetsViewProps> = ({
  realEstateInvestments,
  availableProperties = [],
  onAddProperty,
  onBuyProperty,
  notify
}) => {
  const { theme, currentTheme } = useTheme();
  const textColors = getTextColor(currentTheme);
  const [activeSubTab, setActiveSubTab] = useState<'propiedades' | 'explorar'>('propiedades');
  const [showAddForm, setShowAddForm] = useState(false);

  // Filters for catalog
  const [searchTerm, setSearchTerm] = useState('');
  const [filterZona, setFilterZona] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [maxPrecio, setMaxPrecio] = useState<number | undefined>();

  // Calculate metrics
  const totalInversion = realEstateInvestments.reduce((sum, inv) => sum + Number(inv.valor_compra), 0);
  const totalValorActual = realEstateInvestments.reduce((sum, inv) => sum + Number(inv.valor_actual), 0);
  const totalRentaMensual = realEstateInvestments
    .filter(inv => inv.genera_renta)
    .reduce((sum, inv) => sum + Number(inv.renta_mensual || 0), 0);
  const plusvalia = totalValorActual - totalInversion;
  const porcentajePlusvalia = totalInversion > 0 ? ((plusvalia / totalInversion) * 100) : 0;

  // Filter available properties
  const filteredProperties = availableProperties.filter(prop => {
    if (searchTerm && !prop.titulo.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !prop.zona.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filterZona && prop.zona !== filterZona) return false;
    if (filterTipo && prop.tipo !== filterTipo) return false;
    if (maxPrecio && prop.precio > maxPrecio) return false;
    return true;
  });

  // Get unique zones from available properties
  const uniqueZones = Array.from(new Set(availableProperties.map(p => p.zona))).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className={`text-2xl font-bold ${theme.colors.textPrimary}`}>Activos Inmobiliarios</h2>
          <p className={`${theme.colors.textMuted} text-sm`}>Administra tu patrimonio inmobiliario</p>
        </div>
      </div>

      {/* Summary Cards */}
      {realEstateInvestments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`${theme.colors.bgCard} p-4 rounded-xl border ${theme.colors.border}`}>
            <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Inversión Total</p>
            <p className={`text-lg sm:text-2xl font-mono font-bold truncate ${theme.colors.textPrimary}`}>
              {formatCompact(totalInversion)}
            </p>
          </div>

          <div className={`${theme.colors.bgCard} p-4 rounded-xl border ${theme.colors.border}`}>
            <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Valor Actual</p>
            <p className={`text-lg sm:text-2xl font-mono font-bold truncate ${theme.colors.textPrimary}`}>
              {formatCompact(totalValorActual)}
            </p>
          </div>

          <div className={`${theme.colors.bgCard} p-4 rounded-xl border ${theme.colors.border}`}>
            <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Plusvalía</p>
            <div className="flex items-center gap-2">
              <p className={`text-lg sm:text-2xl font-mono font-bold truncate ${plusvalia >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {plusvalia >= 0 ? '+' : ''}{formatCompact(plusvalia)}
              </p>
              {plusvalia !== 0 && (
                <span className={`text-xs font-bold ${plusvalia >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  ({porcentajePlusvalia > 0 ? '+' : ''}{porcentajePlusvalia.toFixed(1)}%)
                </span>
              )}
            </div>
          </div>

          <div className={`${theme.colors.bgCard} p-4 rounded-xl border ${theme.colors.border}`}>
            <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Renta Mensual</p>
            <p className={`text-lg sm:text-2xl font-mono font-bold truncate ${totalRentaMensual > 0 ? 'text-emerald-500' : theme.colors.textPrimary}`}>
              {formatCompact(totalRentaMensual)}
            </p>
          </div>
        </div>
      )}

      {/* Subtabs */}
      <div className={`flex gap-2 border-b ${theme.colors.border}`}>
        <button
          onClick={() => setActiveSubTab('propiedades')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeSubTab === 'propiedades'
              ? `${textColors.primary} border-current`
              : `${theme.colors.textMuted} border-transparent hover:${theme.colors.textSecondary}`
          }`}
        >
          Mis Propiedades ({realEstateInvestments.length})
        </button>
        <button
          onClick={() => setActiveSubTab('explorar')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeSubTab === 'explorar'
              ? `${textColors.primary} border-current`
              : `${theme.colors.textMuted} border-transparent hover:${theme.colors.textSecondary}`
          }`}
        >
          Explorar ({availableProperties.length})
        </button>
      </div>

      {/* Content */}
      {activeSubTab === 'propiedades' ? (
        <div className="space-y-4">
          {/* Add Property Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddForm(true)}
              className={`${theme.colors.primary} hover:${theme.colors.primaryHover} text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg transition-all flex items-center gap-2`}
            >
              <Plus size={16} />
              Agregar Propiedad
            </button>
          </div>

          {/* Properties List */}
          {realEstateInvestments.length === 0 ? (
            <div className={`${theme.colors.bgCard} p-12 rounded-xl border ${theme.colors.border} text-center`}>
              <Home size={48} className={`${theme.colors.textMuted} mx-auto mb-4`} />
              <p className={`${theme.colors.textMuted} mb-4`}>No tienes propiedades registradas</p>
              <button
                onClick={() => setShowAddForm(true)}
                className={`${theme.colors.primary} hover:${theme.colors.primaryHover} text-white px-6 py-2 rounded-lg text-sm font-bold transition-all`}
              >
                Agregar Primera Propiedad
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {realEstateInvestments.map(inv => {
                const plusvalia = Number(inv.valor_actual) - Number(inv.valor_compra);
                const porcentaje = ((plusvalia / Number(inv.valor_compra)) * 100);

                return (
                  <div key={inv.id} className={`${theme.colors.bgCard} p-5 rounded-xl border ${theme.colors.border} hover:shadow-lg transition-all`}>
                    <div className="flex items-start gap-3 mb-4">
                      <div className={`p-3 rounded-xl ${theme.colors.gradientPrimary}`}>
                        <Home size={24} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-lg font-semibold ${theme.colors.textPrimary} mb-1`}>{inv.nombre}</h3>
                        <p className={`text-xs ${theme.colors.textMuted}`}>{inv.tipo}</p>
                      </div>
                      {inv.genera_renta && (
                        <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded font-bold">
                          GENERA RENTA
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Valor de Compra</p>
                        <p className={`text-sm font-mono font-bold ${theme.colors.textPrimary}`}>
                          {formatCurrency(inv.valor_compra)}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Valor Actual</p>
                        <p className={`text-sm font-mono font-bold ${theme.colors.textPrimary}`}>
                          {formatCurrency(inv.valor_actual)}
                        </p>
                      </div>
                    </div>

                    <div className={`p-3 rounded-lg ${plusvalia >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${theme.colors.textMuted}`}>Plusvalía</span>
                        <div className="text-right">
                          <p className={`text-sm font-mono font-bold ${plusvalia >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {plusvalia >= 0 ? '+' : ''}{formatCurrency(plusvalia)}
                          </p>
                          <p className={`text-xs font-semibold ${plusvalia >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            ({porcentaje > 0 ? '+' : ''}{porcentaje.toFixed(1)}%)
                          </p>
                        </div>
                      </div>
                    </div>

                    {inv.genera_renta && inv.renta_mensual && (
                      <div className={`mt-3 p-3 rounded-lg ${theme.colors.bgSecondary}`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs ${theme.colors.textMuted}`}>Renta Mensual</span>
                          <p className="text-sm font-mono font-bold text-emerald-500">
                            {formatCurrency(inv.renta_mensual)}/mes
                          </p>
                        </div>
                      </div>
                    )}

                    {inv.notas && (
                      <div className="mt-3">
                        <p className={`text-xs ${theme.colors.textMuted}`}>{inv.notas}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Explorar Propiedades */
        <div className="space-y-4">
          {/* Filters */}
          <div className={`${theme.colors.bgCard} p-4 rounded-xl border ${theme.colors.border}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search size={18} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme.colors.textMuted}`} />
                <input
                  type="text"
                  placeholder="Buscar por título o zona..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 ${theme.colors.bgSecondary} border ${theme.colors.border} rounded-lg ${theme.colors.textPrimary} text-sm focus:outline-none focus:ring-2 focus:ring-current`}
                />
              </div>

              <select
                value={filterZona}
                onChange={(e) => setFilterZona(e.target.value)}
                className={`px-4 py-2 ${theme.colors.bgSecondary} border ${theme.colors.border} rounded-lg ${theme.colors.textPrimary} text-sm focus:outline-none focus:ring-2 focus:ring-current`}
              >
                <option value="">Todas las zonas</option>
                {uniqueZones.map(zona => (
                  <option key={zona} value={zona}>{zona}</option>
                ))}
              </select>

              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className={`px-4 py-2 ${theme.colors.bgSecondary} border ${theme.colors.border} rounded-lg ${theme.colors.textPrimary} text-sm focus:outline-none focus:ring-2 focus:ring-current`}
              >
                <option value="">Todos los tipos</option>
                <option value="Casa">Casa</option>
                <option value="Departamento">Departamento</option>
                <option value="Terreno">Terreno</option>
                <option value="Local Comercial">Local Comercial</option>
                <option value="Otro">Otro</option>
              </select>

              <input
                type="number"
                placeholder="Precio máximo"
                value={maxPrecio || ''}
                onChange={(e) => setMaxPrecio(e.target.value ? Number(e.target.value) : undefined)}
                className={`px-4 py-2 ${theme.colors.bgSecondary} border ${theme.colors.border} rounded-lg ${theme.colors.textPrimary} text-sm focus:outline-none focus:ring-2 focus:ring-current`}
              />
            </div>
          </div>

          {/* Properties Catalog */}
          {filteredProperties.length === 0 ? (
            <div className={`${theme.colors.bgCard} p-12 rounded-xl border ${theme.colors.border} text-center`}>
              <Search size={48} className={`${theme.colors.textMuted} mx-auto mb-4`} />
              <p className={`${theme.colors.textMuted}`}>
                {availableProperties.length === 0
                  ? 'No hay propiedades disponibles en el catálogo'
                  : 'No se encontraron propiedades con los filtros aplicados'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProperties.map(prop => (
                <div key={prop.id} className={`${theme.colors.bgCard} rounded-xl border ${theme.colors.border} overflow-hidden hover:shadow-lg transition-all`}>
                  {/* Carrusel de imágenes */}
                  <ImageCarousel
                    imagenes={prop.imagenes || (prop.url_imagen ? [prop.url_imagen] : [])}
                    titulo={prop.titulo}
                    theme={theme}
                  />

                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className={`text-lg font-semibold ${theme.colors.textPrimary} flex-1`}>{prop.titulo}</h3>
                      <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded font-bold">
                        {prop.tipo}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 mb-3">
                      <MapPin size={14} className={theme.colors.textMuted} />
                      <p className={`text-sm ${theme.colors.textMuted}`}>{prop.zona}</p>
                    </div>

                    <div className="flex items-center gap-3 mb-3 text-sm">
                      {prop.area_m2 && (
                        <div className="flex items-center gap-1">
                          <Maximize2 size={14} className={theme.colors.textMuted} />
                          <span className={theme.colors.textSecondary}>{prop.area_m2}m²</span>
                        </div>
                      )}
                      {prop.dormitorios && (
                        <div className="flex items-center gap-1">
                          <BedDouble size={14} className={theme.colors.textMuted} />
                          <span className={theme.colors.textSecondary}>{prop.dormitorios}</span>
                        </div>
                      )}
                      {prop.banos && (
                        <div className="flex items-center gap-1">
                          <Bath size={14} className={theme.colors.textMuted} />
                          <span className={theme.colors.textSecondary}>{prop.banos}</span>
                        </div>
                      )}
                    </div>

                    {prop.descripcion && (
                      <p className={`text-xs ${theme.colors.textMuted} mb-3 line-clamp-2`}>{prop.descripcion}</p>
                    )}

                    <div className="flex items-end justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Precio</p>
                        <p className={`text-xl font-mono font-bold ${theme.colors.textPrimary}`}>
                          {formatCurrency(prop.precio)}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (onBuyProperty) {
                            onBuyProperty(prop);
                          } else {
                            notify?.('Funcionalidad de compra próximamente', 'success');
                          }
                        }}
                        className={`${theme.colors.primary} hover:${theme.colors.primaryHover} text-white px-4 py-2 rounded-lg text-sm font-bold transition-all`}
                      >
                        Ver Detalles
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
