export type ThemeMode = 'dark' | 'light' | 'system';
export type ColorPalette = 'orange' | 'blue' | 'purple' | 'green' | 'monochrome';

export interface ThemeTokens {
  isDark: boolean;
  bgPage: string;
  bgSurface: string;
  bgCard: string;
  bgCardRead: string;
  bgSubtle: string;
  bgInput: string;
  borderSubtle: string;
  borderMuted: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentHover: string;
  accentSubtle: string;
  accentContrast: string;
  statusBar: 'light-content' | 'dark-content';
  statusSuccess: string;
  statusWarning: string;
  statusError: string;
  statusInfo: string;
}

const PALETTE_COLORS: Record<ColorPalette, { light: string; dark: string; subtleLight: string; subtleDark: string }> = {
  orange: {
    light: '#EB6E00',
    dark: '#EB6E00',
    subtleLight: 'rgba(235, 110, 0, 0.12)',
    subtleDark: 'rgba(235, 110, 0, 0.18)',
  },
  blue: {
    light: '#0171E3',
    dark: '#0171E3',
    subtleLight: 'rgba(1, 113, 227, 0.12)',
    subtleDark: 'rgba(1, 113, 227, 0.20)',
  },
  purple: {
    light: '#6B1EFD',
    dark: '#8d4eff',
    subtleLight: 'rgba(107, 30, 253, 0.12)',
    subtleDark: 'rgba(141, 78, 255, 0.22)',
  },
  green: {
    light: '#0B991F',
    dark: '#22c55e',
    subtleLight: 'rgba(11, 153, 31, 0.12)',
    subtleDark: 'rgba(34, 197, 94, 0.20)',
  },
  monochrome: {
    light: '#1b1b1b',
    dark: '#f1f1f1',
    subtleLight: 'rgba(0, 0, 0, 0.08)',
    subtleDark: 'rgba(255, 255, 255, 0.14)',
  },
};

export function getThemeTokens(isDark: boolean, palette: ColorPalette = 'orange'): ThemeTokens {
  const p = PALETTE_COLORS[palette] || PALETTE_COLORS.orange;

  if (isDark) {
    return {
      isDark: true,
      bgPage: '#1b1b1b',
      bgSurface: '#222222',
      bgCard: '#222222',
      bgCardRead: '#1c1c1c',
      bgSubtle: 'rgba(255, 255, 255, 0.08)',
      bgInput: '#1b1b1b',
      borderSubtle: 'rgba(255, 255, 255, 0.08)',
      borderMuted: 'rgba(255, 255, 255, 0.14)',
      textPrimary: '#ffffff',
      textSecondary: '#9e9e9e',
      textMuted: '#666666',
      accent: p.dark,
      accentHover: palette === 'monochrome' ? '#ffffff' : '#FF7A1A',
      accentSubtle: p.subtleDark,
      accentContrast: palette === 'monochrome' ? '#111111' : '#ffffff',
      statusBar: 'light-content',
      statusSuccess: '#64af4c',
      statusWarning: '#ffce2f',
      statusError: '#ff705d',
      statusInfo: '#5aa0f8',
    };
  }

  // Light Mode
  return {
    isDark: false,
    bgPage: '#f1f1f1',
    bgSurface: '#ffffff',
    bgCard: '#ffffff',
    bgCardRead: '#f9f9f9',
    bgSubtle: 'rgba(0, 0, 0, 0.05)',
    bgInput: '#ffffff',
    borderSubtle: 'rgba(0, 0, 0, 0.08)',
    borderMuted: 'rgba(0, 0, 0, 0.14)',
    textPrimary: '#000000',
    textSecondary: '#474747',
    textMuted: '#888888',
    accent: p.light,
    accentHover: palette === 'monochrome' ? '#000000' : '#d66100',
    accentSubtle: p.subtleLight,
    accentContrast: '#ffffff',
    statusBar: 'dark-content',
    statusSuccess: '#0B991F',
    statusWarning: '#e2b623',
    statusError: '#c9303a',
    statusInfo: '#0171E3',
  };
}
