import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export default function handler(req, res) {
  const { person } = req.query;
  if (!person) return res.status(400).json({ error: 'No person specified' });

  const filePath = path.join(process.cwd(), 'data', `${person}.csv`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  const csvString = fs.readFileSync(filePath, 'utf8');
  const records = parse(csvString, { columns: true, skip_empty_lines: true });
  const headers = records.length > 0 ? Object.keys(records[0]) : [];
  res.status(200).json({ headers, rows: records });
}
