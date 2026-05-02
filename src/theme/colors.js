// ── Zabroad brand gradient palette (from zabroad-website) ────────────────────
// Orange #F4A227 · Blue #3B8BF7 · Teal #28D99E
// These are exported so components can pass them directly to LinearGradient.
export const BRAND = {
  orange: '#F4A227',
  blue:   '#3B8BF7',
  teal:   '#28D99E',
  red:    '#E85555',
  purple: '#A855F7',
  cyan:   '#06B6D4',
  pink:   '#EC4899',
};

// Primary gradient: orange → blue (main CTA gradient, matches website hero)
export const G_PRIMARY  = [BRAND.orange, BRAND.blue];
// Secondary gradient: blue → teal (used on chips, tags, icons)
export const G_SECONDARY = [BRAND.blue, BRAND.teal];
// Full brand gradient: orange → blue → teal
export const G_FULL     = [BRAND.orange, BRAND.blue, BRAND.teal];
// Subtle warm gradient for card highlights
export const G_WARM     = [BRAND.orange, '#F97316'];
// Success/green gradient
export const G_SUCCESS  = [BRAND.teal, '#22C55E'];


export const darkColors = {
  bg:       '#0A0E1A',
  nav:      '#121827',
  card:     '#1A2236',
  card2:    '#1E2A42',
  card3:    '#223050',
  // Primary accent → brand blue
  vivid:    '#3B8BF7',
  vivid2:   '#5DA3FF',
  vividD:   'rgba(59,139,247,0.15)',
  vividG:   'rgba(59,139,247,0.28)',
  // Gold → brand orange
  gold:     '#F4A227',
  goldD:    'rgba(244,162,39,0.14)',
  // Teal → brand teal
  teal:     '#28D99E',
  tealD:    'rgba(40,217,158,0.13)',
  // Supporting colors
  blue:     '#3B8BF7',
  blueD:    'rgba(59,139,247,0.12)',
  green:    '#28D99E',
  greenD:   'rgba(40,217,158,0.12)',
  purple:   '#A855F7',
  purpleD:  'rgba(168,85,247,0.12)',
  red:      '#E85555',
  redD:     'rgba(232,85,85,0.12)',
  cream:    '#EEF2FF',
  c60:      'rgba(238,242,255,0.65)',
  c35:      'rgba(238,242,255,0.38)',
  c15:      'rgba(238,242,255,0.10)',
  border:   'rgba(255,255,255,0.07)',
  border2:  'rgba(255,255,255,0.13)',
};

export const lightColors = {
  bg:       '#F5F7FF',
  nav:      '#FFFFFF',
  card:     '#FFFFFF',
  card2:    '#EEF1FA',
  card3:    '#E4E8F5',
  // Primary accent → brand blue
  vivid:    '#3B8BF7',
  vivid2:   '#5DA3FF',
  vividD:   'rgba(59,139,247,0.10)',
  vividG:   'rgba(59,139,247,0.20)',
  // Gold → brand orange
  gold:     '#F4A227',
  goldD:    'rgba(244,162,39,0.12)',
  // Teal → brand teal
  teal:     '#28D99E',
  tealD:    'rgba(40,217,158,0.12)',
  // Supporting colors
  blue:     '#3B8BF7',
  blueD:    'rgba(59,139,247,0.10)',
  green:    '#28D99E',
  greenD:   'rgba(40,217,158,0.10)',
  purple:   '#A855F7',
  purpleD:  'rgba(168,85,247,0.10)',
  red:      '#E85555',
  redD:     'rgba(232,85,85,0.10)',
  cream:    '#12142A',
  c60:      'rgba(18,20,42,0.65)',
  c35:      'rgba(18,20,42,0.42)',
  c15:      'rgba(18,20,42,0.08)',
  border:   'rgba(18,20,42,0.08)',
  border2:  'rgba(18,20,42,0.14)',
};

// Legacy default export — kept so any old direct import still works
export const C = darkColors;
