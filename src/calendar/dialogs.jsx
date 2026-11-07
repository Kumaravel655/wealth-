import { useEffect, useRef, useState } from 'react';
import { CATEGORIES, FY, WA_DEFAULTS, reminderText } from './data.js';
import { Icon } from './views.jsx';

// Native <dialog>: focus trap, Esc and the top layer come free. Rendered only while open.
function Dialog({ title, onClose, children, wide }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    const back = document.activeElement;
    d.showModal();
    d.querySelector('[data-autofocus]')?.focus(); // showModal() would otherwise pick the close button
    return () => { d.close(); back?.focus?.(); };
  }, []);
  return (
    <dialog ref={ref} className={`cc-dialog${wide ? ' is-wide' : ''}`} aria-label={title} data-lenis-prevent onCancel={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}>
      <div className="cc-d-box">
        <header><h2>{title}</h2><button type="button" className="cc-d-x" aria-label="Close" onClick={onClose}><Icon name="x" /></button></header>
        {children}
      </div>
    </dialog>
  );
}

export function AddDialog({ onClose, onSave }) {
  const [error, setError] = useState('');
  const submit = (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const n = f.get('n').trim(), d = f.get('d'), c = f.get('c'), p = f.get('p').trim();
    if (!n || !d || !c) { setError('Enter a name, a due date and a category.'); return; }
    if (d < FY.start || d > FY.end) { setError('The due date must fall between 1 April 2026 and 31 March 2027.'); return; }
    onSave({ id: `custom-${Date.now()}`, n, d, c, p: p || 'Your entry', custom: true });
  };
  return (
    <Dialog title="Add a deadline" onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <label htmlFor="cc-f-n">Compliance name</label>
        <input id="cc-f-n" name="n" required maxLength={120} data-autofocus />
        <label htmlFor="cc-f-d">Due date</label>
        <input id="cc-f-d" name="d" type="date" required min={FY.start} max={FY.end} />
        <label htmlFor="cc-f-c">Category</label>
        <select id="cc-f-c" name="c" required defaultValue="">
          <option value="" disabled>Select a category</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <label htmlFor="cc-f-p">Period or remarks (optional)</label>
        <input id="cc-f-p" name="p" maxLength={120} />
        <p className="cc-f-err" role="alert">{error}</p>
        <p className="cc-f-hint">Saved in this browser only. Clearing browser data removes it.</p>
        <footer><button type="button" className="cc-btn" onClick={onClose}>Cancel</button><button type="submit" className="cc-btn cc-btn-primary">Save deadline</button></footer>
      </form>
    </Dialog>
  );
}

const SAMPLE = { n: 'GSTR-1 (monthly)', p: 'October 2026', d: '2026-11-11', left: 4 };

export function WADialog({ value, onClose, onSave }) {
  const [s, setS] = useState({ ...WA_DEFAULTS, ...value });
  const field = (key) => ({ id: `cc-w-${key}`, value: s[key], onChange: (e) => setS({ ...s, [key]: e.target.value }) });
  return (
    <Dialog title="WhatsApp message" onClose={onClose} wide>
      <form onSubmit={(e) => { e.preventDefault(); onSave(s); }}>
        <p className="cc-f-hint">The compliance name, period, due date and status are filled in for you. Edit the words around them.</p>
        <div className="cc-d-split">
          <div>
            <label htmlFor="cc-w-greeting">Opening line</label><input {...field('greeting')} />
            <label htmlFor="cc-w-closing">Closing line</label><textarea rows={3} {...field('closing')} />
            <label htmlFor="cc-w-signature">Signature</label><textarea rows={3} {...field('signature')} />
          </div>
          <div>
            <span className="cc-d-l">Preview</span>
            <pre className="cc-preview">{reminderText(SAMPLE, s)}</pre>
          </div>
        </div>
        <footer>
          <button type="button" className="cc-btn cc-btn-ghost" onClick={() => setS(WA_DEFAULTS)}><Icon name="reset" /> Reset</button>
          <button type="button" className="cc-btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="cc-btn cc-btn-primary">Save</button>
        </footer>
      </form>
    </Dialog>
  );
}

const DAY_PILLS = [1, 2, 3, 5, 7, 14];
const ICS_DEFAULT = { reminderOn: true, reminderDays: 7 };

export function ICSDialog({ value, count, onClose, onSave }) {
  const [s, setS] = useState(value);
  const days = Math.min(30, Math.max(1, Number(s.reminderDays) || 1));
  const clean = { reminderOn: s.reminderOn, reminderDays: days };
  return (
    <Dialog title="Calendar file settings" onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(clean, false); }}>
        <p className="cc-f-hint">Works with Google Calendar, Apple Calendar and Outlook. The file holds the {count} deadline{count === 1 ? '' : 's'} in your current view.</p>
        <label className="cc-check"><input type="checkbox" checked={s.reminderOn} onChange={(e) => setS({ ...s, reminderOn: e.target.checked })} /> Add a reminder</label>
        {s.reminderOn && (
          <>
            <label htmlFor="cc-i-days">Days before the due date</label>
            <input id="cc-i-days" type="number" min="1" max="30" value={s.reminderDays} onChange={(e) => setS({ ...s, reminderDays: e.target.value })} />
            <div className="cc-chips cc-chips-wrap" role="group" aria-label="Common reminder lengths">
              {DAY_PILLS.map((d) => (
                <button key={d} type="button" className="cc-chip" aria-pressed={days === d} onClick={() => setS({ ...s, reminderDays: d })}>{d}d</button>
              ))}
            </div>
          </>
        )}
        <p className="cc-preview cc-preview-line">{s.reminderOn ? `Each event alerts you ${days} day${days === 1 ? '' : 's'} before the due date.` : 'No reminder will be added.'}</p>
        <p className="cc-f-hint"><b>Easy to remove later:</b> create a separate calendar called “Compliance FY 2026-27” and import into it. Deleting that one calendar removes every event at once.</p>
        <footer>
          <button type="button" className="cc-btn cc-btn-ghost" onClick={() => setS(ICS_DEFAULT)}><Icon name="reset" /> Reset</button>
          <button type="button" className="cc-btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="cc-btn">Save</button>
          <button type="button" className="cc-btn cc-btn-primary" onClick={() => onSave(clean, true)}><Icon name="download" /> Download .ics</button>
        </footer>
      </form>
    </Dialog>
  );
}

const USE = [
  ['What this is', (t) => `A free calendar of ${t} statutory deadlines for FY 2026-27, April 2026 to March 2027, across GST, TDS and TCS, PF and ESI, income tax, company law and more. No login and no install.`],
  ['What the status colours mean', () => 'Overdue is past the due date. Critical is within 3 days, Urgent within 7, Upcoming within 30, and On track is later than that. Statuses follow the date in “Status as on”.'],
  ['Filter by status, month or category', () => 'Click a tile to see that status across the year, and click it again to clear. Month and category chips narrow the list, and they stack with search. The chart bars and the category list do the same thing. Double-click the bar chart to show all months.'],
  ['Search', () => 'Type part of a name, period or category. Ctrl+F (⌘F on Mac) jumps to the search box.'],
  ['AGM date', () => 'Choose the Company Law category to see the AGM date field. ADT-1, AOC-4 and MGT-7 are then counted from your date. The default is 30 September 2026.'],
  ['Three views', () => 'Table groups deadlines by month, and the Month separators box turns that off. Cards suit phones and meetings. Calendar shows a month grid; tap a deadline for its actions, or “+N more” on a busy day.'],
  ['Act on a deadline', () => 'Each row has Copy, WhatsApp and Google Calendar. WhatsApp opens with your message filled in, and you choose the contact yourself. Google Calendar needs you to be signed in to Google.'],
  ['Export', () => 'Excel, PDF and .ics use the deadlines in your current view, so filter first. The slider button next to .ics sets a reminder of 1 to 30 days. Each month also has its own PDF, image and WhatsApp buttons.'],
  ['Make it yours', () => 'Add your own deadlines, edit the WhatsApp wording, or change “Status as on” to see what will be urgent on a future date. Your entries and message stay saved in this browser.'],
];
const LIMITS = [
  'Covers FY 2026-27 only.',
  'Your entries live in this browser. Clearing site data, private windows or a new device will not carry them over.',
  'An imported .ics file is a snapshot. It does not update itself, so download and import again after any change.',
  'Sending to several WhatsApp contacts at once is not supported.',
  'On phones, images and PDFs go through the share sheet. On a computer they download, and you attach them in WhatsApp.',
  'Dates can change by notification. Confirm against CBDT, CBIC and MCA before you act.',
];

export function HelpDialog({ total, onClose }) {
  return (
    <Dialog title="How to use the calendar" onClose={onClose} wide>
      <div className="cc-help">
        {USE.map(([h, text]) => <section key={h}><h3>{h}</h3><p>{text(total)}</p></section>)}
        <section><h3>Limits to keep in mind</h3><ul>{LIMITS.map((l) => <li key={l}>{l}</li>)}</ul></section>
      </div>
    </Dialog>
  );
}
