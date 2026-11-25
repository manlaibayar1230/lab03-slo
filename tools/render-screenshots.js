// results/*.txt доторх k6 summary хэсгийг терминал маягийн HTML болгож,
// Microsoft Edge headless ашиглан screenshots/*.png зураг гаргана.
// Ажиллуулах: node tools/render-screenshots.js
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const resultsDir = path.join(root, 'results');
const outDir = path.join(root, 'screenshots');
const tmpDir = path.join(require('os').tmpdir(), 'k6-shots');
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(tmpDir, { recursive: true });

const EDGE = process.env.EDGE ||
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

for (const file of fs.readdirSync(resultsDir).filter((f) => f.endsWith('.txt') && f !== 'k6-version.txt')) {
  const text = fs.readFileSync(path.join(resultsDir, file), 'utf8').replace(/\r/g, '');
  const lines = text.split('\n');
  // Summary нь THRESHOLDS эсвэл TOTAL RESULTS гарчгаас эхэлнэ
  let start = lines.findIndex((l) => /█ THRESHOLDS/.test(l));
  if (start < 0) start = lines.findIndex((l) => /█ TOTAL RESULTS/.test(l));
  if (start < 0) { console.warn('summary олдсонгүй:', file); continue; }
  // Төгсгөлийн "running (...)" мөр ба алдааны мөрүүдийг оруулна
  const body = lines.slice(start).join('\n').replace(/\n{3,}/g, '\n\n').trimEnd();
  const header = `$ k6 run ...   # ${file}`;
  const html = `<!doctype html><meta charset="utf-8"><style>
    body{margin:0;background:#1e1e1e;}
    pre{margin:0;padding:20px 24px;color:#d4d4d4;font:14px/1.35 Consolas,'Cascadia Mono',monospace;white-space:pre;}
    .h{color:#6a9955}
  </style><pre><span class="h">${esc(header)}</span>\n\n${esc(body)}</pre>`;
  const htmlPath = path.join(tmpDir, file.replace(/\.txt$/, '.html'));
  fs.writeFileSync(htmlPath, html, 'utf8');
  const nLines = body.split('\n').length + 3;
  const width = Math.max(900, Math.min(1500, Math.max(...body.split('\n').map((l) => l.length)) * 8 + 60));
  const height = nLines * 19 + 50;
  const png = path.join(outDir, file.replace(/\.txt$/, '.png'));
  execFileSync(EDGE, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
    `--user-data-dir=${path.join(tmpDir, 'profile')}`,
    `--window-size=${width},${height}`,
    `--screenshot=${png}`,
    'file:///' + htmlPath.split(path.sep).join('/'),
  ], { stdio: 'ignore' });
  console.log('->', path.relative(root, png));
}
