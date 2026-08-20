// Generates a minimal but valid single-page PDF with a text line,
// used to test PDF text extraction in /api/analyze.
const fs = require('node:fs');
const path = require('node:path');

const content =
  'BT\n' +
  '/F1 24 Tf\n' +
  '100 700 Td\n' +
  '(Hello Resume PDF) Tj\n' +
  'ET\n';

const objs = [
  '<< /Type /Catalog /Pages 2 0 R >>',
  '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
  `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
];

let pdf = '%PDF-1.4\n';
const offsets = [];
objs.forEach((body, i) => {
  offsets.push(Buffer.byteLength(pdf));
  pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
});
const xrefStart = Buffer.byteLength(pdf);
pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
for (const off of offsets) {
  pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
}
pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

const out = path.join(__dirname, 'test-resume.pdf');
fs.writeFileSync(out, pdf);
console.log('Created', out, `(${Buffer.byteLength(pdf)} bytes)`);