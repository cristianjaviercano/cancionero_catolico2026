// Genera src/styles/vigilia.css: el modo oscuro (Vigilia) para las clases de Tailwind de superficies,
// textos y recuadros de color claros. Solo crea reglas para las clases que aparecen en src/.
// Volver a correr al agregar pantallas:
//   node scripts/generar_vigilia.cjs
// Los grises slate (interfaz oscura del modo ensayo) y los fondos stone-700…950 no se tocan.

const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '../src');
const OUT = path.join(SRC, 'styles/vigilia.css');

// Neutros (paleta cálida del estilo Misal)
const NEUTRAL = {
  bg: {
    white: 'var(--surface-color)',
    'stone-50': 'var(--surface-highlight)',
    'stone-100': '#24211e',
    'stone-150': '#292522',
    'stone-200': 'var(--surface-tonal)',
    'stone-300': '#3a3530',
  },
  text: {
    'stone-950': 'var(--text-primary)',
    'stone-900': 'var(--text-primary)',
    'stone-800': 'var(--text-primary)',
    'stone-700': '#e4ddd2',
    'stone-600': '#cfc6b9',
    'stone-500': 'var(--text-secondary)',
    'stone-400': '#8f857a',
  },
  border: {
    'stone-50': 'rgba(255, 255, 255, 0.06)',
    'stone-100': 'rgba(255, 255, 255, 0.06)',
    'stone-200': 'rgba(255, 255, 255, 0.09)',
    'stone-300': 'rgba(255, 255, 255, 0.14)',
  },
};

// Colores de acento: [tono 300 (texto claro), tono 400, tono 500 (base del tinte)]
const ACCENTS = {
  red: ['#f0a39b', 'var(--accent-color)', '#c9665b'],
  rose: ['#fda4af', '#fb7185', '#f43f5e'],
  orange: ['#fdba74', '#fb923c', '#f97316'],
  amber: ['#fcd34d', '#fbbf24', '#f59e0b'],
  yellow: ['#fde047', '#facc15', '#eab308'],
  emerald: ['#6ee7b7', '#34d399', '#10b981'],
  green: ['#86efac', '#4ade80', '#22c55e'],
  teal: ['#5eead4', '#2dd4bf', '#14b8a6'],
  sky: ['#7dd3fc', '#38bdf8', '#0ea5e9'],
  blue: ['#93c5fd', '#60a5fa', '#3b82f6'],
  indigo: ['#a5b4fc', '#818cf8', '#6366f1'],
  purple: ['#d8b4fe', '#c084fc', '#a855f7'],
};

function accentValue(kind, palette, shade) {
  const [light, mid, base] = ACCENTS[palette];
  if (kind === 'bg' && shade <= 100) return `color-mix(in srgb, ${base} 16%, var(--surface-color))`;
  if (kind === 'bg' && shade === 200) return `color-mix(in srgb, ${base} 26%, var(--surface-color))`;
  if (kind === 'text' && shade >= 700) return light;
  if (kind === 'text' && (shade === 500 || shade === 600)) return mid;
  if (kind === 'border' && shade <= 300) return `color-mix(in srgb, ${base} 38%, transparent)`;
  return null;
}

const VARIANTS = { '': '', 'hover:': ':hover', 'focus:': ':focus', 'active:': ':active', 'group-hover:': 'GROUP' };

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, files);
    else if (/\.(tsx|ts)$/.test(name)) files.push(full);
  }
  return files;
}

const escape = cls => cls.replace(/([:/\[\].])/g, '\\$1');
const palettes = Object.keys(ACCENTS).join('|');
const re = new RegExp(`(?<![\\w-])((?:hover:|focus:|active:|group-hover:)?(?:bg|text|border)-(?:white|stone-\\d+|(?:${palettes})-\\d+)(?:\\/\\d+)?)(?![\\w-])`, 'g');

const found = new Set();
for (const file of walk(SRC)) {
  for (const m of fs.readFileSync(file, 'utf8').matchAll(re)) found.add(m[1]);
}

const rules = [];
for (const cls of [...found].sort()) {
  const variant = Object.keys(VARIANTS).find(v => v && cls.startsWith(v)) ?? '';
  const base = cls.slice(variant.length);
  const m = base.match(/^(bg|text|border)-([a-z]+)(?:-(\d+))?(?:\/(\d+))?$/);
  if (!m) continue;
  const [, kind, palette, shadeRaw, alphaRaw] = m;
  const shade = shadeRaw ? Number(shadeRaw) : null;
  const alpha = alphaRaw ? Number(alphaRaw) : 100;
  let value = null;
  if (palette === 'white' || palette === 'stone') {
    value = NEUTRAL[kind][palette === 'white' ? 'white' : `stone-${shade}`] ?? null;
    // Velos blancos muy transparentes (bg-white/10) se usan sobre fondos oscuros: se dejan igual
    if (kind === 'bg' && palette === 'white' && alpha < 50) value = null;
  } else if (ACCENTS[palette] && shade !== null) {
    value = accentValue(kind, palette, shade);
  }
  if (!value) continue;
  if (alpha < 100) value = `color-mix(in oklab, ${value} ${alpha}%, transparent)`;
  const prop = kind === 'bg' ? 'background-color' : kind === 'text' ? 'color' : 'border-color';
  const pseudo = VARIANTS[variant];
  const selector = pseudo === 'GROUP'
    ? `body.stage-mode .group:hover .${escape(cls)}`
    : `body.stage-mode .${escape(cls)}${pseudo}`;
  rules.push(`${selector} { ${prop}: ${value}; }`);
}

const header = `/* Generado por scripts/generar_vigilia.cjs — no editar a mano.
   Modo Vigilia (oscuro): superficies, textos y recuadros de color claros de Tailwind pasan a la paleta oscura. */
`;
fs.writeFileSync(OUT, header + rules.join('\n') + '\n');
console.log(`vigilia.css: ${rules.length} reglas para ${found.size} clases encontradas`);
