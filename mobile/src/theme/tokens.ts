/**
 * AUTO-GENERATED FROM shared/tokens.json - DO NOT EDIT DIRECTLY!
 * To modify tokens, edit shared/tokens.json and run 'npm run gen:tokens'
 */

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

export const SHARED_TOKENS = {
  "theme": {
    "light": {
      "bgPage": "#f1f1f1",
      "bgSurface": "#ffffff",
      "bgCard": "#ffffff",
      "bgCardHover": "#fafafa",
      "bgCardRead": "#f9f9f9",
      "bgSubtle": "rgba(0, 0, 0, 0.04)",
      "bgSubtleHover": "rgba(0, 0, 0, 0.08)",
      "bgInput": "#ffffff",
      "bgOverlay": "rgba(0, 0, 0, 0.6)",
      "bgModal": "#ffffff",
      "borderSubtle": "rgba(0, 0, 0, 0.08)",
      "borderMuted": "rgba(0, 0, 0, 0.14)",
      "borderEmphasized": "#d4d4d4",
      "textPrimary": "#000000",
      "textSecondary": "#474747",
      "textMuted": "#737373",
      "textDisabled": "#919191",
      "statusSuccess": "#0B991F",
      "statusWarning": "#e2b623",
      "statusError": "#c9303a",
      "statusInfo": "#0171E3",
      "statusBar": "dark-content"
    },
    "dark": {
      "bgPage": "#1b1b1b",
      "bgSurface": "#222222",
      "bgCard": "#222222",
      "bgCardHover": "#262626",
      "bgCardRead": "#1c1c1c",
      "bgSubtle": "rgba(255, 255, 255, 0.06)",
      "bgSubtleHover": "rgba(255, 255, 255, 0.10)",
      "bgInput": "#1b1b1b",
      "bgOverlay": "rgba(0, 0, 0, 0.8)",
      "bgModal": "#222222",
      "borderSubtle": "rgba(255, 255, 255, 0.08)",
      "borderMuted": "rgba(255, 255, 255, 0.14)",
      "borderEmphasized": "#525252",
      "textPrimary": "#ffffff",
      "textSecondary": "#9e9e9e",
      "textMuted": "#666666",
      "textDisabled": "#525252",
      "statusSuccess": "#64af4c",
      "statusWarning": "#ffce2f",
      "statusError": "#ff705d",
      "statusInfo": "#5aa0f8",
      "statusBar": "light-content"
    }
  },
  "palettes": {
    "orange": {
      "name": "暖橙 (Astryx Orange)",
      "light": {
        "primary": "#EB6E00",
        "hover": "#d66100",
        "subtle": "rgba(235, 110, 0, 0.12)",
        "border": "rgba(235, 110, 0, 0.3)",
        "contrast": "#ffffff"
      },
      "dark": {
        "primary": "#EB6E00",
        "hover": "#FF7A1A",
        "subtle": "rgba(235, 110, 0, 0.18)",
        "border": "rgba(235, 110, 0, 0.4)",
        "contrast": "#ffffff"
      }
    },
    "blue": {
      "name": "电光蓝 (Tech Blue)",
      "light": {
        "primary": "#0171E3",
        "hover": "#0056b3",
        "subtle": "rgba(1, 113, 227, 0.12)",
        "border": "rgba(1, 113, 227, 0.3)",
        "contrast": "#ffffff"
      },
      "dark": {
        "primary": "#0171E3",
        "hover": "#5aa0f8",
        "subtle": "rgba(1, 113, 227, 0.20)",
        "border": "rgba(90, 160, 248, 0.4)",
        "contrast": "#ffffff"
      }
    },
    "purple": {
      "name": "极光紫 (Aurora Violet)",
      "light": {
        "primary": "#6B1EFD",
        "hover": "#5312cf",
        "subtle": "rgba(107, 30, 253, 0.12)",
        "border": "rgba(107, 30, 253, 0.3)",
        "contrast": "#ffffff"
      },
      "dark": {
        "primary": "#8d4eff",
        "hover": "#a777ff",
        "subtle": "rgba(141, 78, 255, 0.22)",
        "border": "rgba(167, 119, 255, 0.4)",
        "contrast": "#ffffff"
      }
    },
    "green": {
      "name": "翡翠绿 (Emerald Green)",
      "light": {
        "primary": "#0B991F",
        "hover": "#087317",
        "subtle": "rgba(11, 153, 31, 0.12)",
        "border": "rgba(11, 153, 31, 0.3)",
        "contrast": "#ffffff"
      },
      "dark": {
        "primary": "#22c55e",
        "hover": "#4ade80",
        "subtle": "rgba(34, 197, 94, 0.20)",
        "border": "rgba(74, 222, 128, 0.4)",
        "contrast": "#ffffff"
      }
    },
    "monochrome": {
      "name": "极简黑白 (Monochrome)",
      "light": {
        "primary": "#1b1b1b",
        "hover": "#000000",
        "subtle": "rgba(0, 0, 0, 0.08)",
        "border": "rgba(0, 0, 0, 0.2)",
        "contrast": "#ffffff"
      },
      "dark": {
        "primary": "#f1f1f1",
        "hover": "#ffffff",
        "subtle": "rgba(255, 255, 255, 0.14)",
        "border": "rgba(255, 255, 255, 0.3)",
        "contrast": "#111111"
      }
    }
  }
} as const;

export function getThemeTokens(isDark: boolean, palette: ColorPalette = 'orange'): ThemeTokens {
  const themeBase = isDark ? SHARED_TOKENS.theme.dark : SHARED_TOKENS.theme.light;
  const paletteSet = SHARED_TOKENS.palettes[palette] || SHARED_TOKENS.palettes.orange;
  const paletteTheme = isDark ? paletteSet.dark : paletteSet.light;

  return {
    isDark,
    bgPage: themeBase.bgPage,
    bgSurface: themeBase.bgSurface,
    bgCard: themeBase.bgCard,
    bgCardRead: themeBase.bgCardRead,
    bgSubtle: themeBase.bgSubtle,
    bgInput: themeBase.bgInput,
    borderSubtle: themeBase.borderSubtle,
    borderMuted: themeBase.borderMuted,
    textPrimary: themeBase.textPrimary,
    textSecondary: themeBase.textSecondary,
    textMuted: themeBase.textMuted,
    accent: paletteTheme.primary,
    accentHover: paletteTheme.hover,
    accentSubtle: paletteTheme.subtle,
    accentContrast: paletteTheme.contrast,
    statusBar: themeBase.statusBar as 'light-content' | 'dark-content',
    statusSuccess: themeBase.statusSuccess,
    statusWarning: themeBase.statusWarning,
    statusError: themeBase.statusError,
    statusInfo: themeBase.statusInfo,
  };
}
