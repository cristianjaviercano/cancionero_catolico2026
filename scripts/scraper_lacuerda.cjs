const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUTPUT_DIR = path.resolve(__dirname, '../../cancioneros_liturgicos/canciones_nuevas');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function fetchUrl(url) {
  // Use curl with realistic user agent
  const cmd = `curl -s -L -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" "${url}"`;
  return execSync(cmd, { maxBuffer: 10 * 1024 * 1024 }).toString();
}

function cleanHtmlToMonospace(html) {
  // Extract <div id=t_body><PRE>...</PRE></div>
  const preMatch = html.match(/<div id=t_body><PRE>([\s\S]*?)<\/PRE>/i);
  if (!preMatch) {
    throw new Error('No se encontró el bloque <PRE> con acordes en la página.');
  }

  let content = preMatch[1];

  // Remove <A> and </A> tags (chords are inside <A>SOL</A>)
  content = content.replace(/<A>/gi, '').replace(/<\/A>/gi, '');
  // Remove <div></div> markers
  content = content.replace(/<div><\/div>/gi, '');
  // Decode HTML entities
  content = content.replace(/&nbsp;/g, ' ')
                   .replace(/&amp;/g, '&')
                   .replace(/&lt;/g, '<')
                   .replace(/&gt;/g, '>')
                   .replace(/&quot;/g, '"');

  return content.trim();
}

function extractMetadata(html, fallbackUrl) {
  // Extract title
  let title = '';
  const titleMatch = html.match(/orola\s*=\s*'([^']+)'/i) || html.match(/<TITLE>(.*?)(?:,|\:|\-)/i);
  if (titleMatch) {
    title = titleMatch[1].trim();
  }

  // Extract slug from URL
  const slug = fallbackUrl.split('/').pop().replace(/\.shtml|\.html/g, '');

  if (!title) {
    title = slug.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  return { title, slug };
}

function scrapeSong(url) {
  console.log(`\n📥 Descargando: ${url}`);
  try {
    const html = fetchUrl(url);
    const { title, slug } = extractMetadata(html, url);
    const chordsBody = cleanHtmlToMonospace(html);

    ensureDir(OUTPUT_DIR);
    const targetPath = path.join(OUTPUT_DIR, `${slug}.md`);

    const fileContent = `\n\`\`\`\n${chordsBody}\n\`\`\`\n`;
    fs.writeFileSync(targetPath, fileContent, 'utf8');

    console.log(`✅ Guardado con éxito:`);
    console.log(`   Título: "${title}"`);
    console.log(`   Archivo: ${path.relative(process.cwd(), targetPath)}`);
    return { title, slug, targetPath };
  } catch (err) {
    console.error(`❌ Error al procesar ${url}:`, err.message);
    return null;
  }
}

// Main execution
const urls = process.argv.slice(2);

if (urls.length === 0) {
  console.log('Modo de uso:');
  console.log('  node scripts/scraper_lacuerda.cjs <URL_1> <URL_2> ...');
  console.log('\nEjemplo:');
  console.log('  node scripts/scraper_lacuerda.cjs https://acordes.lacuerda.net/mus_catolica/a_edificar_la_iglesia.shtml');
  process.exit(1);
}

console.log(`🚀 Iniciando Web Scraping de ${urls.length} canción(es)...`);
urls.forEach(url => scrapeSong(url.trim()));
console.log('\n✨ Proceso de scraping finalizado.');
