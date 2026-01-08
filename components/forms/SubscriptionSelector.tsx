import React, { useState, useRef, useEffect } from 'react';
import { SUBSCRIPTION_APPS, SUBSCRIPTION_CATEGORIES, OTHER_APP, SubscriptionApp } from '../../subscriptionApps';
import { useTheme } from '../../contexts/ThemeContext';
import { Search, ChevronDown, X } from 'lucide-react';

interface SubscriptionSelectorProps {
    value: string;
    onChange: (app: SubscriptionApp | null) => void;
    onCustomNameChange?: (name: string) => void;
    customName?: string;
}

export const SubscriptionSelector: React.FC<SubscriptionSelectorProps> = ({
    value,
    onChange,
    onCustomNameChange,
    customName = ''
}) => {
    const { theme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
    const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Find selected app
    const selectedApp = value === 'other'
        ? OTHER_APP
        : SUBSCRIPTION_APPS.find(app => app.id === value) || null;

    // Filter apps
    const filteredApps = SUBSCRIPTION_APPS.filter(app => {
        const matchesSearch = app.name.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategory === 'Todos' || app.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (app: SubscriptionApp) => {
        onChange(app);
        setIsOpen(false);
        setSearch('');
    };

    const handleImageError = (appId: string) => {
        setImageErrors(prev => new Set(prev).add(appId));
    };

    const renderAppIcon = (app: SubscriptionApp) => {
        if (!app.icon || imageErrors.has(app.id)) {
            // Fallback: colored circle with first letter
            return (
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: app.color }}
                >
                    {app.name.charAt(0).toUpperCase()}
                </div>
            );
        }
        return (
            <img
                src={app.icon}
                alt={app.name}
                className="w-8 h-8 object-contain"
                onError={() => handleImageError(app.id)}
            />
        );
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Selector Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full ${theme.colors.bgSecondary} border ${theme.colors.border} rounded-xl px-4 py-3 ${theme.colors.textPrimary} flex items-center justify-between gap-3 transition-all hover:border-purple-500 focus:ring-2 focus:ring-purple-500`}
            >
                {selectedApp ? (
                    <div className="flex items-center gap-3">
                        {renderAppIcon(selectedApp)}
                        <span className="font-medium">
                            {selectedApp.id === 'other' ? (customName || 'Otro (Personalizado)') : selectedApp.name}
                        </span>
                    </div>
                ) : (
                    <span className={theme.colors.textMuted}>Selecciona una suscripción...</span>
                )}
                <ChevronDown size={20} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Custom Name Input (when "Other" is selected) */}
            {selectedApp?.id === 'other' && (
                <div className="mt-3">
                    <input
                        type="text"
                        value={customName}
                        onChange={(e) => onCustomNameChange?.(e.target.value)}
                        placeholder="Nombre de la suscripción..."
                        className={`w-full ${theme.colors.bgSecondary} border ${theme.colors.border} rounded-xl px-4 py-3 ${theme.colors.textPrimary} focus:ring-2 focus:ring-purple-500`}
                    />
                </div>
            )}

            {/* Dropdown */}
            {isOpen && (
                <div className={`absolute z-50 mt-2 w-full ${theme.colors.bgCard} border ${theme.colors.border} rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2`}>
                    {/* Search */}
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                        <div className="relative">
                            <Search size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.colors.textMuted}`} />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar app..."
                                className={`w-full ${theme.colors.bgSecondary} border ${theme.colors.border} rounded-lg pl-10 pr-4 py-2 ${theme.colors.textPrimary} text-sm focus:ring-2 focus:ring-purple-500`}
                                autoFocus
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${theme.colors.textMuted} hover:${theme.colors.textPrimary}`}
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="p-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                        <div className="flex gap-1 min-w-max">
                            {SUBSCRIPTION_CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${selectedCategory === cat
                                            ? 'bg-purple-500 text-white'
                                            : `${theme.colors.bgSecondary} ${theme.colors.textMuted} hover:${theme.colors.textPrimary}`
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Apps Grid */}
                    <div className="max-h-64 overflow-y-auto p-2">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {filteredApps.map(app => (
                                <button
                                    key={app.id}
                                    type="button"
                                    onClick={() => handleSelect(app)}
                                    className={`flex items-center gap-2 p-2 rounded-lg transition-all ${value === app.id
                                            ? 'bg-purple-500/20 border border-purple-500'
                                            : `${theme.colors.bgSecondary} hover:bg-purple-500/10 border border-transparent`
                                        }`}
                                >
                                    {renderAppIcon(app)}
                                    <span className={`text-xs font-medium ${theme.colors.textPrimary} truncate`}>
                                        {app.name}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {filteredApps.length === 0 && (
                            <div className={`p-4 text-center ${theme.colors.textMuted}`}>
                                No se encontraron apps
                            </div>
                        )}
                    </div>

                    {/* Other Option */}
                    <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={() => handleSelect(OTHER_APP)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${value === 'other'
                                    ? 'bg-gray-500/20 border border-gray-500'
                                    : `${theme.colors.bgSecondary} hover:bg-gray-500/10`
                                }`}
                        >
                            <div className="w-8 h-8 rounded-lg bg-gray-500 flex items-center justify-center text-white font-bold">
                                +
                            </div>
                            <span className={`font-medium ${theme.colors.textPrimary}`}>Otro (Personalizado)</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
