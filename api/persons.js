import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    const files = fs.readdirSync(dataDir)
      .filter(f => f.endsWith('.csv'))
      .map(f => f.replace(/\.csv$/, ''));
    res.status(200).json({ persons: files });
  } catch (err) {
    res.status(500).json({ error: 'Could not read data directory' });
  }
}
