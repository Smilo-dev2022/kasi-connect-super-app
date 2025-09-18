export type ColorMode = 'light' | 'dark';

export interface Theme {
  colors: {
    background: string;
    surface: string;
    textPrimary: string;
    textSecondary: string;
    primary: string;
    success: string;
    warning: string;
    danger: string;
    border: string;
    tabBar: string;
    tabIconActive: string;
    tabIconInactive: string;
    bubbleOutgoing: string;
    bubbleIncoming: string;
  };
  spacing: (factor: number) => number;
  radius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  typography: {
    fontFamily: string;
    sizes: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
    };
    weights: {
      regular: '400' | '500' | '600' | '700';
      medium: '400' | '500' | '600' | '700';
      semibold: '400' | '500' | '600' | '700';
      bold: '400' | '500' | '600' | '700';
    };
  };
}

const spacingBase = 8;

export const lightTheme: Theme = {
  colors: {
    background: '#FFFFFF',
    surface: '#F6F7F9',
    textPrimary: '#11181C',
    textSecondary: '#687076',
    primary: '#128C7E',
    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',
    border: '#E5E7EB',
    tabBar: '#FFFFFF',
    tabIconActive: '#128C7E',
    tabIconInactive: '#94A3B8',
    bubbleOutgoing: '#DCF8C6',
    bubbleIncoming: '#FFFFFF',
  },
  spacing: (f) => f * spacingBase,
  radius: { sm: 8, md: 12, lg: 16, xl: 24 },
  typography: {
    fontFamily: 'System',
    sizes: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 },
    weights: { regular: '400', medium: '500', semibold: '600', bold: '700' },
  },
};

export const darkTheme: Theme = {
  colors: {
    background: '#000000',
    surface: '#111315',
    textPrimary: '#E6E8EB',
    textSecondary: '#9BA1A6',
    primary: '#25D366',
    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',
    border: '#1F2327',
    tabBar: '#0B0C0D',
    tabIconActive: '#25D366',
    tabIconInactive: '#64748B',
    bubbleOutgoing: '#054640',
    bubbleIncoming: '#111315',
  },
  spacing: (f) => f * spacingBase,
  radius: { sm: 8, md: 12, lg: 16, xl: 24 },
  typography: {
    fontFamily: 'System',
    sizes: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 },
    weights: { regular: '400', medium: '500', semibold: '600', bold: '700' },
  },
};

