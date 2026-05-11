// Design tokens — dark + light palettes share the same shape
export const DARK_COLORS = {
  bg:         '#0D0F14',
  bg2:        '#13161D',
  bg3:        '#1A1E28',
  surface:    '#1E2230',
  surface2:   '#252A3A',
  text:       '#F0F2F8',
  text2:      '#8B92A8',
  text3:      '#5A6070',
  green:      '#22C55E',
  greenDim:   'rgba(34,197,94,0.15)',
  red:        '#EF4444',
  redDim:     'rgba(239,68,68,0.15)',
  amber:      '#F59E0B',
  amberDim:   'rgba(245,158,11,0.15)',
  blue:       '#3B82F6',
  blueDim:    'rgba(59,130,246,0.15)',
  accent:     '#6366F1',
  accentDim:  'rgba(99,102,241,0.15)',
  accent2:    '#8B5CF6',
  border:     'rgba(255,255,255,0.07)',
  border2:    'rgba(255,255,255,0.12)',
  mapBg:      '#0E1117',
};

export const LIGHT_COLORS: typeof DARK_COLORS = {
  bg:         '#FFFFFF',
  bg2:        '#F4F5F8',
  bg3:        '#EBEDF2',
  surface:    '#FFFFFF',
  surface2:   '#F0F1F5',
  text:       '#0E1117',
  text2:      '#5A6070',
  text3:       '#9097A8',
  green:      '#16A34A',
  greenDim:   'rgba(22,163,74,0.10)',
  red:        '#DC2626',
  redDim:     'rgba(220,38,38,0.10)',
  amber:      '#D97706',
  amberDim:   'rgba(217,119,6,0.10)',
  blue:       '#2563EB',
  blueDim:    'rgba(37,99,235,0.10)',
  accent:     '#6366F1',
  accentDim:  'rgba(99,102,241,0.10)',
  accent2:    '#8B5CF6',
  border:     'rgba(0,0,0,0.08)',
  border2:    'rgba(0,0,0,0.14)',
  mapBg:      '#F4F5F8',
};

export type ThemeColors = typeof DARK_COLORS;

export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const Radius = { xs: 6, sm: 10, md: 16, lg: 20, full: 999 };

export const FontSize = {
  xs: 10, sm: 11, base: 12, md: 13, lg: 14,
  xl: 15, xxl: 16, h3: 18, h2: 20, h1: 22, display: 24,
};
