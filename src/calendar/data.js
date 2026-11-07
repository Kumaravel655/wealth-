// Statutory due dates for FY 2026-27 plus the pure logic the calendar runs on.
// No DOM or React here, so scripts/check-calendar.mjs can run it under plain Node.
// Dates are 'YYYY-MM-DD' strings throughout: comparing strings avoids timezone drift.
// To extend or correct a date, edit the row below; next year means new rules, not new code paths.

export const FY = { label: 'FY 2026-27', start: '2026-04-01', end: '2027-03-31', checked: '7 November 2026' };
export const CATEGORIES = ['GST', 'TDS/TCS', 'PF/ESI', 'Income Tax', 'Company Law', 'Other'];
export const AGM_DEFAULT = '2026-09-30';

const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const pad = (n) => String(n).padStart(2, '0');

export const FY_MONTHS = Array.from({ length: 12 }, (_, i) => {
  const m = (3 + i) % 12, y = i < 9 ? 2026 : 2027;
  return { i, y, m, key: `${y}-${pad(m + 1)}`, short: SHORT[m], full: `${FULL[m]} ${y}`, label: `${SHORT[m]} ’${String(y).slice(2)}` };
});

const QUARTERS = [
  { tag: 'Q4 FY 25-26', period: 'Q4 FY 2025-26', range: 'Jan–Mar 2026', next: 'Q1 FY 2026-27' },
  { tag: 'Q1 FY 26-27', period: 'Q1 FY 2026-27', range: 'Apr–Jun 2026', next: 'Q2 FY 2026-27' },
  { tag: 'Q2 FY 26-27', period: 'Q2 FY 2026-27', range: 'Jul–Sep 2026', next: 'Q3 FY 2026-27' },
  { tag: 'Q3 FY 26-27', period: 'Q3 FY 2026-27', range: 'Oct–Dec 2026', next: 'Q4 FY 2026-27' },
];

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const add = (rows, d, n, p, c, extra) => rows.push({ id: `${slug(n)}-${d}`, d, n, p, c, ...extra });

function monthlyRows() {
  const rows = [];
  FY_MONTHS.forEach((mo, i) => {
    const on = (day) => `${mo.key}-${pad(day)}`;
    const before = new Date(Date.UTC(mo.y, mo.m - 1, 1));
    const period = `${FULL[before.getUTCMonth()]} ${before.getUTCFullYear()}`;
    const q = i % 3 === 0 ? QUARTERS[i / 3] : null;

    // March TDS is due on 30 April (below), so April's 7th carries TCS only.
    add(rows, on(7), i === 0 ? 'TCS payment' : 'TDS & TCS payment', period, 'TDS/TCS');
    add(rows, on(10), 'GSTR-7 / GSTR-8', period, 'GST');
    add(rows, on(11), 'GSTR-1 (monthly)', period, 'GST');
    add(rows, on(13), 'GSTR-5 / GSTR-6', period, 'GST');
    add(rows, on(13), q ? `GSTR-1 ${q.tag} (QRMP)` : 'IFF (QRMP)', q ? q.range : period, 'GST');
    add(rows, on(15), 'PF & ESI payment', period, 'PF/ESI');
    if (i === 0) {
      add(rows, on(20), 'GSTR-5A (monthly)', period, 'GST');
      add(rows, on(21), 'GSTR-3B (monthly)', period, 'GST');
    } else add(rows, on(20), 'GSTR-3B / GSTR-5A (monthly)', period, 'GST');

    if (q) {
      add(rows, on(18), 'CMP-08', q.period, 'GST');
      add(rows, on(22), `GSTR-3B ${q.tag} (QRMP Group A)`, q.period, 'GST');
      add(rows, on(24), `GSTR-3B ${q.tag} (QRMP Group B)`, q.period, 'GST');
      const last = new Date(Date.UTC(mo.y, mo.m + 1, 0)).getUTCDate();
      add(rows, on(last), 'QRMP election window closes', `${q.next} (opt in or out: 1–${last} ${mo.short})`, 'GST');
    } else add(rows, on(25), 'PMT-06 (QRMP)', period, 'GST');
  });
  return rows;
}

const ONE_OFF = [
  ['2026-04-30', 'TDS payment (March)', 'March 2026', 'TDS/TCS'],
  ['2026-05-15', 'TCS return Q4', 'FY 2025-26', 'TDS/TCS'],
  ['2026-05-30', 'TCS certificate Q4', 'FY 2025-26', 'TDS/TCS'],
  ['2026-05-31', 'TDS return Q4', 'FY 2025-26', 'TDS/TCS'],
  ['2026-06-15', 'TDS certificate Q4', 'FY 2025-26', 'TDS/TCS'],
  ['2026-07-31', 'TDS & TCS return Q1', 'TY 2026-27', 'TDS/TCS'],
  ['2026-08-15', 'TDS & TCS certificate Q1', 'TY 2026-27', 'TDS/TCS'],
  ['2026-10-31', 'TDS & TCS return Q2', 'TY 2026-27', 'TDS/TCS'],
  ['2026-11-15', 'TDS & TCS certificate Q2', 'TY 2026-27', 'TDS/TCS'],
  ['2027-01-31', 'TDS & TCS return Q3', 'TY 2026-27', 'TDS/TCS'],
  ['2027-02-15', 'TDS & TCS certificate Q3', 'TY 2026-27', 'TDS/TCS'],

  ['2026-06-15', 'Advance tax, 1st instalment', 'TY 2026-27 · at least 15% of tax liability', 'Income Tax'],
  ['2026-09-15', 'Advance tax, 2nd instalment', 'TY 2026-27 · cumulative 45% of tax liability', 'Income Tax'],
  ['2026-12-15', 'Advance tax, 3rd instalment', 'TY 2026-27 · cumulative 75% of tax liability', 'Income Tax'],
  ['2027-03-15', 'Advance tax, 4th instalment', 'TY 2026-27 · 100% of tax liability', 'Income Tax'],
  ['2026-07-31', 'ITR, non-audit (no business income)', 'AY 2026-27', 'Income Tax'],
  ['2026-08-31', 'ITR, non-audit (business income, or partner of a non-audit firm)', 'AY 2026-27', 'Income Tax'],
  ['2026-10-21', 'Tax audit report', 'AY 2026-27 · extended by CBDT Circular 07/2026', 'Income Tax'],
  ['2026-10-31', 'Transfer pricing audit report', 'AY 2026-27', 'Income Tax'],
  ['2026-11-21', 'ITR, audit cases', 'AY 2026-27 · extended by CBDT Circular 07/2026', 'Income Tax'],
  ['2026-11-30', 'ITR, transfer pricing cases', 'AY 2026-27', 'Income Tax'],
  ['2026-12-31', 'Belated ITR', 'AY 2026-27', 'Income Tax'],
  ['2027-03-31', 'Revised ITR', 'AY 2026-27', 'Income Tax'],

  ['2026-06-30', 'GSTR-4', 'FY 2025-26', 'GST'],
  ['2026-12-31', 'GSTR-9 / GSTR-9C', 'FY 2025-26', 'GST'],
  ['2026-06-30', 'Equalisation levy statement', 'FY 2025-26', 'Other'],

  ['2026-04-30', 'MSME Form I (half-yearly)', 'Oct 2025–Mar 2026 outstanding payments', 'Company Law'],
  ['2026-10-31', 'MSME Form I (half-yearly)', 'Apr–Sep 2026 outstanding payments', 'Company Law'],
  ['2026-05-30', 'LLP Form 11, annual return', 'FY 2025-26', 'Company Law'],
  ['2026-10-30', 'LLP Form 8, accounts and solvency', 'FY 2025-26', 'Company Law'],
];

// `agm` is days after the AGM; withAgm() below turns it into a real date.
const AGM_ROWS = [
  { id: 'agm', n: 'AGM', p: 'FY 2025-26 (listed and unlisted)', c: 'Company Law', agm: 0 },
  { id: 'agm-adt1', n: 'ADT-1, auditor appointment', p: 'Within 15 days of AGM', c: 'Company Law', agm: 15 },
  { id: 'agm-aoc4', n: 'AOC-4, financial statements', p: 'Within 30 days of AGM', c: 'Company Law', agm: 30 },
  { id: 'agm-mgt7', n: 'MGT-7 / 7A, annual return', p: 'Within 60 days of AGM', c: 'Company Law', agm: 60 },
];

export const BASE_ROWS = (() => {
  const rows = monthlyRows();
  ONE_OFF.forEach(([d, n, p, c]) => add(rows, d, n, p, c));
  return rows;
})();

export const addDays = (iso, n) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
export const withAgm = (agmDate) => [...BASE_ROWS, ...AGM_ROWS.map((r) => ({ ...r, d: addDays(agmDate, r.agm) }))];

export function localISO(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export const daysUntil = (iso, today) => Math.round((Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 864e5);

// Five bands: overdue, within 3 days, within 7, within 30, later.
export const statusOf = (n) => (n < 0 ? 'ov' : n <= 3 ? 'cr' : n <= 7 ? 'ur' : n <= 30 ? 'up' : 'ok');
export const STATUS_NAME = { ov: 'Overdue', cr: 'Critical', ur: 'Urgent', up: 'Upcoming', ok: 'On track' };
export function statusText(n) {
  if (n === 0) return 'Due today';
  return n < 0 ? `${-n}d overdue` : `${n}d left`;
}
export const decorate = (rows, today) => rows.map((r) => {
  const left = daysUntil(r.d, today);
  return { ...r, left, st: statusOf(left) };
});

export const STATUS_FILTERS = {
  overdue: (r) => r.st === 'ov',
  urgent: (r) => r.st === 'cr' || r.st === 'ur',
  upcoming: (r) => r.st === 'cr' || r.st === 'ur' || r.st === 'up',
};

export function filterRows(rows, { month, cat, search, status }) {
  const q = (search || '').trim().toLowerCase();
  return rows
    .filter((r) => (!month || r.d.startsWith(month))
      && (!cat || cat === 'All' || r.c === cat)
      && (!status || STATUS_FILTERS[status](r))
      && (!q || `${r.n} ${r.p} ${r.c}`.toLowerCase().includes(q)))
    .sort((a, b) => a.d.localeCompare(b.d) || a.n.localeCompare(b.n));
}

export function fmtDate(iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IN', { ...opts, timeZone: 'UTC' });
}
export const fmtDMY = (iso) => iso.split('-').reverse().join('/');

// Message text. Kept here so the same wording reaches WhatsApp, clipboard and tests.
export const WA_DEFAULTS = {
  greeting: 'Dear Client,',
  closing: 'Kindly ensure timely compliance. Reach out if you need help with this filing.',
  signature: 'Wealth Bridge Tax & Business Consultants\n+91 86677 53901',
};
const dueLine = (n) => (n === 0 ? 'Due *today*' : n > 0 ? `Due in *${n} day${n === 1 ? '' : 's'}*` : `*Overdue by ${-n} day${n === -1 ? '' : 's'}*`);

export function reminderText(r, s) {
  return `${s.greeting}\n\nA reminder for the following compliance:\n\n*${r.n}*\nPeriod: ${r.p}\nDue date: *${fmtDate(r.d, { day: 'numeric', month: 'long', year: 'numeric' })}*\nStatus: ${dueLine(r.left)}\n\n${s.closing}\n\n${s.signature}`;
}
export function copyText(r) {
  const due = r.left === 0 ? 'Due today' : r.left > 0 ? `Due in ${r.left} day${r.left === 1 ? '' : 's'}` : `Overdue by ${-r.left} day${r.left === -1 ? '' : 's'}`;
  return `${r.n} | ${r.p} | Due date: ${fmtDate(r.d)} | ${r.c} | ${due}`;
}
export function monthText(label, count, s) {
  return `*Compliance calendar: ${label}*\n\n${count} deadline${count === 1 ? '' : 's'} in ${label}. The list is attached.\n\n${s.signature}`;
}

export function gcalUrl(r) {
  const start = r.d.replaceAll('-', ''), end = addDays(r.d, 1).replaceAll('-', '');
  const q = new URLSearchParams({
    action: 'TEMPLATE', text: `${r.n} [${r.c}]`, dates: `${start}/${end}`,
    details: `Period: ${r.p}\nCategory: ${r.c}\nSource: thewealthbridge.in/compliance-calendar/`,
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}

// RFC 5545: CRLF endings, TEXT escaping, and lines folded at 75 octets.
const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
function fold(line) {
  const enc = new TextEncoder();
  const out = [];
  let cur = '', size = 0;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    if (size + n > (out.length ? 74 : 75)) { out.push(cur); cur = ''; size = 0; }
    cur += ch; size += n;
  }
  out.push(cur);
  return out.join('\r\n ');
}
export function buildICS(rows, { reminderOn, reminderDays }, now = new Date()) {
  const stamp = now.toISOString().replace(/[-:]|\.\d{3}/g, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Wealth Bridge//Compliance Calendar FY 2026-27//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'X-WR-CALNAME:Compliance Calendar FY 2026-27', 'X-WR-TIMEZONE:Asia/Kolkata'];
  rows.forEach((r) => {
    lines.push('BEGIN:VEVENT', `UID:${r.id}@thewealthbridge.in`, `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${r.d.replaceAll('-', '')}`, `DTEND;VALUE=DATE:${addDays(r.d, 1).replaceAll('-', '')}`,
      `SUMMARY:${esc(`${r.n} [${r.c}]`)}`, `DESCRIPTION:${esc(`Period: ${r.p}\nCategory: ${r.c}`)}`,
      'URL:https://thewealthbridge.in/compliance-calendar/', `CATEGORIES:${esc(r.c)}`);
    if (reminderOn && reminderDays > 0) lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(`Reminder: ${r.n}`)}`, `TRIGGER:-P${reminderDays}D`, 'END:VALARM');
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return `${lines.map(fold).join('\r\n')}\r\n`;
}
