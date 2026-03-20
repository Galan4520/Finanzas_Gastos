export type ThemeName = 'yunai';

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
  'yunai': {
    name: 'YUNAI',
    id: 'yunai',
    colors: {
      bgPrimary: 'bg-white',
      bgSecondary: 'bg-yn-neutral-50',
      bgCard: 'bg-white',
      bgCardHover: 'bg-yn-neutral-50',

      textPrimary: 'text-yn-neutral-900',
      textSecondary: 'text-yn-neutral-700',
      textMuted: 'text-yn-neutral-500',

      border: 'border-yn-neutral-200',
      borderLight: 'border-yn-neutral-100',

      primary: 'bg-yn-primary-500',
      primaryHover: 'hover:bg-yn-primary-700',
      primaryLight: 'bg-yn-primary-500/10',
      primaryDark: 'bg-yn-primary-700',

      success: 'bg-yn-success-500',
      successLight: 'bg-yn-success-50',
      warning: 'bg-yn-warning-500',
      warningLight: 'bg-yn-warning-50',
      danger: 'bg-yn-error-500',
      dangerLight: 'bg-yn-error-50',
      info: 'bg-yn-sec1-500',
      infoLight: 'bg-yn-sec1-50',

      gradientPrimary: 'bg-gradient-to-r from-yn-primary-500 to-yn-primary-700',
      gradientSecondary: 'bg-gradient-to-br from-yn-neutral-50 via-white to-yn-primary-500/10',
    }
  }
};

export const getTheme = (themeName: ThemeName): Theme => {
  return themes[themeName] || themes['yunai'];
};

export const getTextColor = (_themeName: ThemeName) => ({
  primary: 'text-yn-primary-500',
  secondary: 'text-yn-primary-700',
  accent: 'text-yn-sec1-500'
});
