// utils/getProblems.ts
import fs from 'fs';
import path from 'path';

export function getProblems() {
  const dataPath = path.join(process.cwd(), 'src/data', 'problems.json');
  const raw = fs.readFileSync(dataPath, 'utf-8');
  return JSON.parse(raw);
}
