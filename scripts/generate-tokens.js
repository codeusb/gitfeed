#!/usr/bin/env node
/**
 * Single Source of Truth Token Generator for GitFeed
 * Reads shared/tokens.json and compiles:
 * 1. web/src/styles/tokens.css (CSS Custom Properties)
 * 2. mobile/src/theme/tokens.ts (React Native Theme Object)
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const sharedTokensPath = path.join(rootDir, 'shared', 'tokens.json');
const webCssPath = path.join(rootDir, 'web', 'src', 'styles', 'tokens.css');
const mobileTsPath = path.join(rootDir, 'mobile', 'src', 'theme', 'tokens.ts');

const tokens = JSON.parse(fs.readFileSync(sharedTokensPath, 'utf-8'));

// -------------------------------------------------------------
// 1. Generate Web CSS (tokens.css)
// -------------------------------------------------------------
function camelToKebab(str) {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}

function generateWebCss() {
  const light = tokens.theme.light;
  const dark = tokens.theme.dark;
  const defaultPalette = tokens.palettes.orange;

  let css = `/* ==========================================================================
   AUTO-GENERATED FROM shared/tokens.json - DO NOT EDIT DIRECTLY!
   To modify tokens, edit shared/tokens.json and run 'npm run gen:tokens'
   ========================================================================== */

:root {
  /* Surfaces & Backgrounds (Light Mode) */
  --bg-page: ${light.bgPage};
  --bg-surface: ${light.bgSurface};
  --bg-card: ${light.bgCard};
  --bg-card-hover: ${light.bgCardHover};
  --bg-card-read: ${light.bgCardRead};
  --bg-subtle: ${light.bgSubtle};
  --bg-subtle-hover: ${light.bgSubtleHover};
  --bg-input: ${light.bgInput};
  --bg-overlay: ${light.bgOverlay};
  --bg-modal: ${light.bgModal};

  /* Borders & Dividers */
  --border-subtle: ${light.borderSubtle};
  --border-muted: ${light.borderMuted};
  --border-emphasized: ${light.borderEmphasized};

  /* Typography */
  --text-primary: ${light.textPrimary};
  --text-secondary: ${light.textSecondary};
  --text-muted: ${light.textMuted};
  --text-disabled: ${light.textDisabled};

  /* Semantic Feedback */
  --status-success: ${light.statusSuccess};
  --status-warning: ${light.statusWarning};
  --status-error: ${light.statusError};
  --status-info: ${light.statusInfo};

  /* Default Brand Accent: Orange */
  --accent-primary: ${defaultPalette.light.primary};
  --accent-hover: ${defaultPalette.light.hover};
  --accent-subtle: ${defaultPalette.light.subtle};
  --accent-border: ${defaultPalette.light.border};
  --accent-contrast: ${defaultPalette.light.contrast};
}

.dark, [data-theme="dark"] {
  /* Surfaces & Backgrounds (Dark Mode) */
  --bg-page: ${dark.bgPage};
  --bg-surface: ${dark.bgSurface};
  --bg-card: ${dark.bgCard};
  --bg-card-hover: ${dark.bgCardHover};
  --bg-card-read: ${dark.bgCardRead};
  --bg-subtle: ${dark.bgSubtle};
  --bg-subtle-hover: ${dark.bgSubtleHover};
  --bg-input: ${dark.bgInput};
  --bg-overlay: ${dark.bgOverlay};
  --bg-modal: ${dark.bgModal};

  /* Borders & Dividers */
  --border-subtle: ${dark.borderSubtle};
  --border-muted: ${dark.borderMuted};
  --border-emphasized: ${dark.borderEmphasized};

  /* Typography */
  --text-primary: ${dark.textPrimary};
  --text-secondary: ${dark.textSecondary};
  --text-muted: ${dark.textMuted};
  --text-disabled: ${dark.textDisabled};

  /* Semantic Feedback */
  --status-success: ${dark.statusSuccess};
  --status-warning: ${dark.statusWarning};
  --status-error: ${dark.statusError};
  --status-info: ${dark.statusInfo};

  /* Default Brand Accent: Orange */
  --accent-primary: ${defaultPalette.dark.primary};
  --accent-hover: ${defaultPalette.dark.hover};
  --accent-subtle: ${defaultPalette.dark.subtle};
  --accent-border: ${defaultPalette.dark.border};
  --accent-contrast: ${defaultPalette.dark.contrast};
}

/* ==========================================================================
   Extensible Accent Palette Token Sets (Data Attributes)
   ========================================================================== */
`;

  for (const [key, palette] of Object.entries(tokens.palettes)) {
    css += `
/* ${palette.name} */
[data-palette="${key}"] {
  --accent-primary: ${palette.light.primary};
  --accent-hover: ${palette.light.hover};
  --accent-subtle: ${palette.light.subtle};
  --accent-border: ${palette.light.border};
  --accent-contrast: ${palette.light.contrast};
}
.dark[data-palette="${key}"], [data-palette="${key}"].dark, [data-palette="${key}"] .dark {
  --accent-primary: ${palette.dark.primary};
  --accent-hover: ${palette.dark.hover};
  --accent-subtle: ${palette.dark.subtle};
  --accent-border: ${palette.dark.border};
  --accent-contrast: ${palette.dark.contrast};
}
`;
  }

  return css;
}

// -------------------------------------------------------------
// 2. Generate Mobile TypeScript (tokens.ts)
// -------------------------------------------------------------
function generateMobileTs() {
  const paletteKeys = Object.keys(tokens.palettes);
  const paletteUnion = paletteKeys.map((k) => `'${k}'`).join(' | ');

  const ts = `/**
 * AUTO-GENERATED FROM shared/tokens.json - DO NOT EDIT DIRECTLY!
 * To modify tokens, edit shared/tokens.json and run 'npm run gen:tokens'
 */

export type ThemeMode = 'dark' | 'light' | 'system';
export type ColorPalette = ${paletteUnion};

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

export const SHARED_TOKENS = ${JSON.stringify(tokens, null, 2)} as const;

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
`;

  return ts;
}

// -------------------------------------------------------------
// Write Files
// -------------------------------------------------------------
console.log('🔄 Compiling design tokens from shared/tokens.json...');

fs.writeFileSync(webCssPath, generateWebCss(), 'utf-8');
console.log(`✅ Generated Web CSS: ${path.relative(rootDir, webCssPath)}`);

fs.writeFileSync(mobileTsPath, generateMobileTs(), 'utf-8');
console.log(`✅ Generated Mobile TS: ${path.relative(rootDir, mobileTsPath)}`);

console.log('🎉 Token synchronization complete!');
