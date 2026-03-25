import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const DIST = path.join(__dirname, 'dist');

const app = express();

app.use(express.static(DIST));

app.use((_req, res) => {
  res.sendFile(path.join(DIST, 'index.html'));
});

app.listen(PORT, () => console.log(`porta ${PORT}`));
