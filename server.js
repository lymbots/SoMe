// server.js

import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'  // anbefalet import måde

const app = express()
app.use(cors())

const port = 3001; // Porten serveren kører på
app.get('/api/getData', (req, res) => {
  const person = req.query.person;
  if (!person) return res.status(400).json({ error: 'No person specified' });

  const filePath = path.resolve('./data', `${person}.csv`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  const csvString = fs.readFileSync(filePath, 'utf8');
  const records = parse(csvString, { columns: true, skip_empty_lines: true });
  const headers = records.length > 0 ? Object.keys(records[0]) : [];
  res.json({ headers, rows: records });
});

app.get('/api/persons', (req, res) => {
  const dataDir = path.resolve('./data');
  try {
    const files = fs.readdirSync(dataDir)
      .filter(f => f.endsWith('.csv'))
      .map(f => f.replace(/\.csv$/, ''));
    res.json({ persons: files });
  } catch (err) {
    res.status(500).json({ error: 'Could not read data directory' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
