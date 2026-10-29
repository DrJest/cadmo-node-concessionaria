import { join } from 'node:path';
import fs from 'node:fs/promises';

const FILE = join(import.meta.dirname, '..', 'db', 'brands.json');

export async function getAll(page, pageSize, order) {
  // tutti i brand, eventualmente paginati
  const contentBuf = await fs.readFile(FILE);
  const content = contentBuf.toString('utf-8');
  try {
    const brands = JSON.parse(content);
    if(!Array.isArray(brands)) return [];
    return brands; // todo: applicare dimensione pagina e ordinamento
  }
  catch(e) {
    console.error(e);
    return [];
  }
}