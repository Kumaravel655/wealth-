// Self-check for the calendar's date logic: node scripts/check-calendar.mjs
import assert from 'node:assert/strict';
import { withAgm, decorate, filterRows, statusOf, statusText, buildICS, addDays, daysUntil, gcalUrl, reminderText, WA_DEFAULTS, FY_MONTHS, AGM_DEFAULT } from '../src/calendar/data.js';

const rows = withAgm(AGM_DEFAULT);
assert.equal(rows.length, 143);
assert.equal(new Set(rows.map((r) => r.id)).size, rows.length, 'ids must be unique: they are the .ics UIDs');
assert.deepEqual(FY_MONTHS.map((m) => rows.filter((r) => r.d.startsWith(m.key)).length), [14, 12, 12, 13, 10, 10, 18, 12, 11, 12, 9, 10]);

// Extended and Budget 2026 dates must not regress.
const due = (n) => rows.find((r) => r.n.startsWith(n)).d;
assert.equal(due('Tax audit report'), '2026-10-21');
assert.equal(due('ITR, audit cases'), '2026-11-21');
assert.equal(due('Revised ITR'), '2027-03-31');
assert.equal(due('GSTR-9 / GSTR-9C'), '2026-12-31');

// AGM offsets follow the date the user enters, across a month end.
const moved = withAgm('2026-08-20');
assert.equal(moved.find((r) => r.id === 'agm-adt1').d, '2026-09-04');
assert.equal(moved.find((r) => r.id === 'agm-aoc4').d, '2026-09-19');
assert.equal(moved.find((r) => r.id === 'agm-mgt7').d, '2026-10-19');

// Status bands, including the edges and the dates in between.
assert.deepEqual([-1, 0, 3, 4, 7, 8, 30, 31].map(statusOf), ['ov', 'cr', 'cr', 'ur', 'ur', 'up', 'up', 'ok']);
assert.equal(statusText(0), 'Due today');
assert.equal(statusText(-5), '5d overdue');
assert.equal(daysUntil('2027-01-01', '2026-12-31'), 1);
assert.equal(addDays('2027-02-28', 1), '2027-03-01');

// The tile count must equal what clicking the tile shows.
const live = decorate(rows, '2026-11-07');
assert.equal(filterRows(live, { status: 'overdue' }).length, 89);
assert.equal(filterRows(live, { status: 'urgent' }).length, 5);
assert.equal(filterRows(live, { status: 'upcoming' }).length, 13);
assert.equal(filterRows(live, { month: '2026-11' }).length, 12);
assert.equal(filterRows(live, { month: '2026-11', cat: 'GST' }).length, 6);
assert.equal(filterRows(live, { search: 'gstr-9' }).length, 1);
assert.ok(filterRows(live, { month: '2026-11' }).every((r, i, a) => !i || a[i - 1].d <= r.d));

// .ics: CRLF, 75-octet folds, escaped text, alarm only when asked for.
const ics = buildICS(rows, { reminderOn: true, reminderDays: 7 }, new Date('2026-11-07T00:00:00Z'));
assert.ok(ics.split('\r\n').every((l) => Buffer.byteLength(l) <= 75), 'line over 75 octets');
assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 143);
assert.equal((ics.match(/TRIGGER:-P7D/g) || []).length, 143);
assert.ok(ics.includes('DTSTAMP:20261107T000000Z'));
assert.ok(!buildICS(rows, { reminderOn: false, reminderDays: 7 }).includes('VALARM'));
assert.ok(buildICS([{ ...rows[0], n: 'A, B; C' }], {}).includes('SUMMARY:A\\, B\\; C'));

const tax = live.find((r) => r.id.startsWith('tds-tcs-payment-2026-11-07'));
assert.ok(reminderText(tax, WA_DEFAULTS).includes('Due *today*'));
assert.ok(gcalUrl(tax).includes('dates=20261107%2F20261108'));
console.log('calendar checks passed');
