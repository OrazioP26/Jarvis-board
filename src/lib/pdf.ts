import fs from 'fs/promises';
import path from 'path';
import PDFDocument from 'pdfkit';

export async function writeSimplePdf(params: {
  outPath: string;
  title: string;
  content: string;
}) {
  await fs.mkdir(path.dirname(params.outPath), { recursive: true });

  const doc = new PDFDocument({
    size: 'LETTER',
    margins: { top: 54, bottom: 54, left: 54, right: 54 },
  });

  const chunks: Buffer[] = [];
  doc.on('data', (c) => chunks.push(Buffer.from(c)));

  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  doc.fontSize(18).text(params.title, { underline: true });
  doc.moveDown();
  doc.fontSize(11).text(params.content || '', { lineGap: 2 });
  doc.end();

  const buf = await done;
  await fs.writeFile(params.outPath, buf);
  return { bytes: buf.length };
}
