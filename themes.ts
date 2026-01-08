export type ThemeName = 'light-premium' | 'blue-corporate';

export interface Theme {
  name: string;
  id: ThemeName;
  colors: {
    // Backgrounds
    bgPrimary: string;
    bgSecondary: string;
    bgCard: string;
    bgCardHover: string;

    // Text
    textPrimary: string;
    textSecondary: string;
    textMuted: string;

    // Borders
    border: string;
    borderLight: string;

    // Accent colors
    primary: string;
    primaryHover: string;
    primaryLight: string;
    primaryDark: string;

    // Status colors
    success: string;
    successLight: string;
    warning: string;
    warningLight: string;
    danger: string;
    dangerLight: string;
    info: string;
    infoLight: string;

    // Gradients
    gradientPrimary: string;
    gradientSecondary: string;
  };
}

export const themes: Record<ThemeName, Theme> = {
  'light-premium': {
    name: 'Claro Premium',
    id: 'light-premium',
    colors: {
      // Backgrounds - Blanco y grises claros
      bgPrimary: 'bg-white',
      bgSecondary: 'bg-gray-50',
      bgCard: 'bg-white',
      bgCardHover: 'bg-gray-50',

      // Text
      textPrimary: 'text-gray-900',
      textSecondary: 'text-gray-700',
      textMuted: 'text-gray-500',

      // Borders
      border: 'border-gray-200',
      borderLight: 'border-gray-100',

      // Accent - Verde esmeralda
      primary: 'bg-emerald-600',
      primaryHover: 'hover:bg-emerald-700',
      primaryLight: 'bg-emerald-50',
      primaryDark: 'bg-emerald-700',

      // Status
      success: 'bg-emerald-600',
      successLight: 'bg-emerald-50',
      warning: 'bg-amber-500',
      warningLight: 'bg-amber-50',
      danger: 'bg-rose-600',
      dangerLight: 'bg-rose-50',
      info: 'bg-blue-600',
      infoLight: 'bg-blue-50',

      // Gradients
      gradientPrimary: 'bg-gradient-to-r from-emerald-600 to-teal-600',
      gradientSecondary: 'bg-gradient-to-br from-gray-50 via-white to-emerald-50/30',
    }
  },
  'blue-corporate': {
    name: 'Azul Corporativo',
    id: 'blue-corporate',
    colors: {
      // Backgrounds - Blanco y grises con tinte azul
      bgPrimary: 'bg-white',
      bgSecondary: 'bg-slate-50',
      bgCard: 'bg-white',
      bgCardHover: 'bg-slate-50',

      // Text
      textPrimary: 'text-slate-900',
      textSecondary: 'text-slate-700',
      textMuted: 'text-slate-500',

      // Borders
      border: 'border-slate-200',
      borderLight: 'border-slate-100',

      // Accent - Azul corporativo
      primary: 'bg-blue-600',
      primaryHover: 'hover:bg-blue-700',
      primaryLight: 'bg-blue-50',
      primaryDark: 'bg-blue-700',

      // Status
      success: 'bg-emerald-600',
      successLight: 'bg-emerald-50',
      warning: 'bg-amber-500',
      warningLight: 'bg-amber-50',
      danger: 'bg-rose-600',
      dangerLight: 'bg-rose-50',
      info: 'bg-blue-600',
      infoLight: 'bg-blue-50',

      // Gradients
      gradientPrimary: 'bg-gradient-to-r from-blue-600 to-cyan-600',
      gradientSecondary: 'bg-gradient-to-br from-slate-50 via-white to-blue-50/30',
    }
  }
};

export const getTheme = (themeName: ThemeName): Theme => {
  return themes[themeName] || themes['light-premium'];
};

// Text color variants for each theme
export const getTextColor = (themeName: ThemeName) => {
  const textColors: Record<ThemeName, { primary: string; secondary: string; accent: string }> = {
    'light-premium': {
      primary: 'text-emerald-600',
      secondary: 'text-emerald-700',
      accent: 'text-teal-600'
    },
    'blue-corporate': {
      primary: 'text-blue-600',
      secondary: 'text-blue-700',
      accent: 'text-cyan-600'
    }
  };
  return textColors[themeName];
};
