// Files people can take away. jsPDF and the Excel writer are dynamic imports, so a phone that only
// reads the calendar never downloads them.
import { FY, fmtDate, fmtDMY, statusText, buildICS, FY_MONTHS, CATEGORIES } from './data.js';

const SITE = 'thewealthbridge.in/compliance-calendar';
const NAVY = '#102A56';
const STATUS_INK = { ov: '#B42318', cr: '#B54708', ur: '#93640A', up: '#175CD3', ok: '#475467' };
// Same order and values as --cc-c1..6 in calendar.css (validated light palette).
const CAT_INK = Object.fromEntries(CATEGORIES.map((c, i) => [c, ['#2563EB', '#E8590C', '#0E9F8E', '#7C3AED', '#A17F00', '#D6336C'][i]]));

function save(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
}

export async function excelBlob(rows) {
  const { default: writeXlsxFile } = await import('write-excel-file/browser');
  const head = ['Due date', 'Compliance', 'Period', 'Category', 'Status'].map((value) => ({ value, fontWeight: 'bold' }));
  const body = rows.map((r) => [fmtDMY(r.d), r.n, r.p, r.c, statusText(r.left)].map((value) => ({ value })));
  return writeXlsxFile([head, ...body], {
    columns: [12, 48, 40, 14, 14].map((width) => ({ width })),
    sheet: 'Compliance FY 2026-27',
  }).toBlob();
}
export async function exportExcel(rows) {
  save(await excelBlob(rows), 'Compliance-Calendar-FY2026-27.xlsx');
}

async function pdfDoc(title, count) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.setFillColor(NAVY).rect(0, 0, 297, 16, 'F');
  doc.setFont('helvetica', 'bold').setFontSize(12).setTextColor('#FFFFFF').text(title, 12, 10.5);
  doc.setFont('helvetica', 'normal').setFontSize(8);
  doc.text(`Wealth Bridge  |  ${count} deadline${count === 1 ? '' : 's'}  |  ${fmtDate(new Date().toISOString().slice(0, 10))}`, 285, 10.5, { align: 'right' });
  return doc;
}
function pageFooters(doc) {
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i += 1) {
    doc.setPage(i).setFontSize(7.5).setTextColor('#5D6B82');
    doc.text(`${SITE}  |  Verify against official CBDT, CBIC and MCA notifications`, 12, 203);
    doc.text(`Page ${i} of ${n}`, 285, 203, { align: 'right' });
  }
}
// jsPDF's core fonts are WinAnsi: en dashes survive, the middle dot and curly quotes need replacing.
const safe = (s) => s.replace(/·/g, '|').replace(/[’‘]/g, "'");

export async function pdfBlob(rows, title = `Compliance calendar ${FY.label}`) {
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = await pdfDoc(title, rows.length);
  autoTable(doc, {
    startY: 20,
    margin: { left: 12, right: 12, bottom: 12 },
    head: [['Due date', 'Compliance', 'Period', 'Category', 'Status']],
    body: rows.map((r) => [fmtDMY(r.d), safe(r.n), safe(r.p), r.c, statusText(r.left)]),
    styles: { fontSize: 8.5, cellPadding: 2, textColor: '#344054', lineColor: '#DCE5F2', lineWidth: 0.1 },
    headStyles: { fillColor: '#E3EDFB', textColor: NAVY, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: '#F7FAFF' },
    columnStyles: { 0: { cellWidth: 24 }, 3: { cellWidth: 26 }, 4: { cellWidth: 26 } },
  });
  pageFooters(doc);
  return doc.output('blob');
}
export async function exportPDF(rows, title, name = 'Compliance-Calendar-FY2026-27.pdf') {
  save(await pdfBlob(rows, title), name);
}

export function exportICS(rows, settings) {
  save(new Blob([buildICS(rows, settings)], { type: 'text/calendar;charset=utf-8' }), 'Compliance-Calendar-FY2026-27.ics');
}

// ---- Images are drawn on a canvas so they look the same in every theme and need no extra library. ----
const SANS = 'Manrope, Arial, sans-serif';

function wrap(ctx, text, width, maxLines = 2) {
  const lines = [];
  let line = '';
  text.split(' ').forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > width && line) { lines.push(line); line = word; } else line = next;
  });
  lines.push(line);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/\s+\S*$/, '')}…`;
  }
  return lines;
}

function frame(w, h, title, sub) {
  const canvas = document.createElement('canvas');
  canvas.width = w * 2;
  canvas.height = h * 2;
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, 0, w, 96);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `700 30px ${SANS}`;
  ctx.fillText(title, 40, 50);
  ctx.fillStyle = '#C3D2EC';
  ctx.font = `500 16px ${SANS}`;
  ctx.fillText(sub, 40, 76);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `700 18px ${SANS}`;
  ctx.fillText('Wealth Bridge', w - 40, 50);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#5D6B82';
  ctx.font = `500 14px ${SANS}`;
  ctx.fillText(`${SITE}  ·  +91 86677 53901`, 40, h - 24);
  return { canvas, ctx };
}

export async function monthCanvas(rows, label) {
  await document.fonts.ready;
  const W = 1080;
  const probe = document.createElement('canvas').getContext('2d');
  probe.font = `700 19px ${SANS}`;
  const nameLines = rows.map((r) => wrap(probe, r.n, 620));
  const rowH = nameLines.map((l) => 42 + l.length * 25);
  const H = 96 + 24 + rowH.reduce((a, b) => a + b, 0) + 72;
  const { canvas, ctx } = frame(W, H, `Compliance calendar: ${label}`, `${rows.length} deadline${rows.length === 1 ? '' : 's'}`);
  let y = 120;
  rows.forEach((r, i) => {
    ctx.fillStyle = CAT_INK[r.c] || CAT_INK.Other;
    ctx.fillRect(40, y + 10, 5, rowH[i] - 20);
    ctx.fillStyle = NAVY;
    ctx.font = `800 21px ${SANS}`;
    ctx.fillText(fmtDate(r.d, { day: '2-digit', month: 'short' }), 60, y + 36);
    ctx.font = `700 19px ${SANS}`;
    nameLines[i].forEach((line, l) => ctx.fillText(line, 180, y + 32 + l * 25));
    ctx.fillStyle = '#475467';
    ctx.font = `500 15px ${SANS}`;
    ctx.fillText(wrap(ctx, `${r.p} · ${r.c}`, 620, 1)[0], 180, y + 29 + nameLines[i].length * 25);
    ctx.textAlign = 'right';
    ctx.fillStyle = STATUS_INK[r.st];
    ctx.font = `700 17px ${SANS}`;
    ctx.fillText(statusText(r.left), W - 40, y + 36);
    ctx.textAlign = 'left';
    y += rowH[i];
    ctx.fillStyle = '#DCE5F2';
    ctx.fillRect(40, y - 1, W - 80, 1);
  });
  return canvas;
}

export async function calendarCanvas(rows, monthKey) {
  await document.fonts.ready;
  const mo = FY_MONTHS.find((m) => m.key === monthKey);
  const [y, m] = monthKey.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const W = 1280, CW = (W - 80) / 7, CH = 176;
  const weeks = Math.ceil((first + days) / 7);
  const H = 96 + 44 + weeks * CH + 72;
  const inMonth = rows.filter((r) => r.d.startsWith(monthKey));
  const { canvas, ctx } = frame(W, H, `Compliance calendar: ${mo ? mo.full : monthKey}`, `${inMonth.length} deadline${inMonth.length === 1 ? '' : 's'}`);
  ctx.font = `700 15px ${SANS}`;
  ctx.fillStyle = '#475467';
  ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach((d, i) => ctx.fillText(d, 40 + i * CW + 10, 128));
  for (let day = 1; day <= days; day += 1) {
    const cell = first + day - 1;
    const x = 40 + (cell % 7) * CW, top = 140 + Math.floor(cell / 7) * CH;
    const iso = `${monthKey}-${String(day).padStart(2, '0')}`;
    const items = inMonth.filter((r) => r.d === iso);
    if (cell % 7 === 0 || cell % 7 === 6) { ctx.fillStyle = '#F7FAFF'; ctx.fillRect(x, top, CW, CH); }
    ctx.strokeStyle = '#DCE5F2';
    ctx.strokeRect(x, top, CW, CH);
    ctx.fillStyle = NAVY;
    ctx.font = `700 16px ${SANS}`;
    ctx.fillText(String(day), x + 10, top + 24);
    items.slice(0, 4).forEach((r, i) => {
      const ey = top + 34 + i * 34;
      ctx.fillStyle = CAT_INK[r.c] || CAT_INK.Other;
      ctx.fillRect(x + 8, ey, 4, 30);
      ctx.fillStyle = '#344054';
      ctx.font = `600 12px ${SANS}`;
      wrap(ctx, r.n, CW - 26).forEach((l, n) => ctx.fillText(l, x + 17, ey + 12 + n * 15));
    });
    if (items.length > 4) {
      ctx.fillStyle = '#475467';
      ctx.font = `700 12px ${SANS}`;
      ctx.fillText(`+${items.length - 4} more`, x + CW - 62, top + 24);
    }
  }
  return canvas;
}

export const canvasBlob = (canvas) => new Promise((resolve) => { canvas.toBlob(resolve, 'image/jpeg', 0.9); });

export async function saveCanvas(canvas, name) {
  save(await canvasBlob(canvas), name);
}

export async function canvasPDF(canvas, name) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const fit = Math.min(277 / canvas.width, 190 / canvas.height);
  const w = canvas.width * fit, h = canvas.height * fit;
  doc.addImage(canvas.toDataURL('image/jpeg', 0.9), 'JPEG', (297 - w) / 2, 10, w, h);
  doc.save(name);
}

// Phones can hand the file straight to WhatsApp through the share sheet. Desktop browsers cannot
// attach to wa.me, so there the chat opens first (keeping the user gesture) and the file downloads.
export async function shareOrWhatsApp(text, makeFile) {
  if (navigator.canShare) {
    const file = await makeFile();
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text });
      } catch (e) {
        if (e.name !== 'AbortError') throw e;
      }
      return;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    save(file, file.name);
    return;
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  const file = await makeFile();
  save(file, file.name);
}
