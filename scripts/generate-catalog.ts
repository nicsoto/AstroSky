/**
 * Script para generar el catálogo de estrellas descargando la base de datos HYG.
 * 
 * Uso:
 *   npx ts-node scripts/generate-catalog.ts
 * 
 * Descarga el catálogo HYG v3 de GitHub y genera:
 *   - src/data/catalogs/stars.json (estrellas filtradas por magnitud)
 *   - src/data/catalogs/constellations.json (líneas de constelaciones)
 * 
 * Para desarrollo, se incluyen catálogos pre-generados con las estrellas
 * más brillantes y las constelaciones principales.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const HYG_URL = 'https://raw.githubusercontent.com/astronexus/HYG-Database/master/hyg/v3/hyg_v37.csv';
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'data', 'catalogs');
const MAG_LIMIT = 6.5;

interface StarRow {
  id: string;
  hip: string;
  hd: string;
  hr: string;
  proper: string;
  ra: string;
  dec: string;
  mag: string;
  ci: string;
  spect: string;
  dist: string;
  con: string;
  bayer: string;
  flam: string;
  lum: string;
}

function downloadFile(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res: any) => {
      let data = '';
      res.on('data', (chunk: string) => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function parseCSV(csv: string): StarRow[] {
  const lines = csv.split('\n');
  const headers = lines[0].split(',');
  const rows: StarRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length < headers.length) continue;
    
    const row: any = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = values[idx]?.trim() || '';
    });
    rows.push(row);
  }
  
  return rows;
}

async function main() {
  console.log('Descargando catálogo HYG...');
  const csv = await downloadFile(HYG_URL);
  console.log(`Descargado. Parseando...`);
  
  const allStars = parseCSV(csv);
  console.log(`Total de estrellas en HYG: ${allStars.length}`);
  
  const filtered = allStars
    .filter(s => {
      const mag = parseFloat(s.mag);
      return !isNaN(mag) && mag <= MAG_LIMIT && s.ra && s.dec;
    })
    .map(s => ({
      id: `star_${s.hip || s.hd || s.id}`,
      hip: s.hip ? parseInt(s.hip) : undefined,
      hd: s.hd ? parseInt(s.hd) : undefined,
      name: s.proper || s.bayer || `HIP ${s.hip}`,
      proper: s.proper || undefined,
      bayer: s.bayer || undefined,
      ra: parseFloat(s.ra),
      dec: parseFloat(s.dec),
      magnitude: parseFloat(s.mag),
      ci: parseFloat(s.ci) || 0,
      spectralType: s.spect || undefined,
      distance: s.dist ? parseFloat(s.dist) * 3.26156 : undefined, // parsecs a light years
      luminosity: s.lum ? parseFloat(s.lum) : undefined,
      constellation: s.con || undefined,
    }))
    .sort((a, b) => a.magnitude - b.magnitude);
  
  console.log(`Estrellas con magnitud ≤ ${MAG_LIMIT}: ${filtered.length}`);
  
  // Asegurar directorio
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  
  // Guardar
  const outputPath = path.join(OUTPUT_DIR, 'stars-full.json');
  fs.writeFileSync(outputPath, JSON.stringify(filtered, null, 2));
  console.log(`Catálogo guardado en: ${outputPath}`);
  console.log(`Tamaño: ${(fs.statSync(outputPath).size / 1024).toFixed(0)} KB`);
}

main().catch(console.error);
