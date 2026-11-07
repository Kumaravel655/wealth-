import { useCallback, useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  AGM_DEFAULT, CATEGORIES, FY, FY_MONTHS, WA_DEFAULTS, copyText, decorate, filterRows, fmtDate, gcalUrl,
  localISO, monthText, reminderText, withAgm,
} from './data.js';
import {
  calendarCanvas, canvasBlob, canvasPDF, excelBlob, exportExcel, exportICS, exportPDF, monthCanvas, pdfBlob, saveCanvas, shareOrWhatsApp,
} from './exports.js';
import { CalendarView, CardsView, CategoryPanel, Icon, MonthPanel, StatusBadge, TableView, catVar, copyToClipboard } from './views.jsx';
import { AddDialog, HelpDialog, ICSDialog, WADialog } from './dialogs.jsx';

function read(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : JSON.parse(v);
  } catch { return fallback; }
}
function useStored(key, fallback) {
  const [value, setValue] = useState(() => read(key, fallback));
  const set = useCallback((next) => {
    setValue(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* private mode: keeps working for this visit */ }
  }, [key]);
  return [value, set];
}

const monthOf = (iso) => FY_MONTHS.find((m) => m.key === iso.slice(0, 7))?.key ?? null;
const STATUS_TAG = { overdue: 'Overdue', urgent: 'Due in 7 days', upcoming: 'Due in 30 days' };
const VIEWS = [['table', 'Table', 'list'], ['cards', 'Cards', 'grid'], ['calendar', 'Calendar', 'calendar']];

function Tile({ tone, value, label, hint, active, onClick }) {
  return (
    <button type="button" className={`cc-tile cc-tile-${tone}`} aria-pressed={active} onClick={onClick}>
      <b>{value}</b>
      <span className="cc-tile-l">{label}</span>
      <span className="cc-tile-h">{hint}</span>
    </button>
  );
}

function Popover({ pop, onClose, children }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!pop) return undefined;
    el.showPopover();
    const r = pop.anchor.getBoundingClientRect();
    const { offsetWidth: w, offsetHeight: h } = el;
    el.style.left = `${Math.max(8, Math.min(r.left, innerWidth - w - 8))}px`;
    el.style.top = `${r.bottom + h + 12 > innerHeight ? Math.max(8, r.top - h - 6) : r.bottom + 6}px`;
    el.querySelector('button, a')?.focus();
    const close = () => el.hidePopover();
    addEventListener('scroll', close, { passive: true, once: true });
    return () => removeEventListener('scroll', close);
  }, [pop]);
  return (
    <div ref={ref} popover="auto" className="cc-pop" data-lenis-prevent
      onToggle={(e) => { if (e.newState === 'closed') { const a = pop?.anchor; onClose(); a?.focus?.(); } }}>
      {pop && children}
    </div>
  );
}

export default function App() {
  const today = useMemo(() => localISO(), []);
  const [theme, setTheme] = useStored('wb_cc_theme', null);
  const [agm, setAgm] = useStored('wb_cc_agm', AGM_DEFAULT);
  const [custom, setCustom] = useStored('wb_cc_custom', []);
  const [wa, setWa] = useStored('wb_cc_wa', WA_DEFAULTS);
  const [ics, setIcs] = useStored('wb_cc_ics', { reminderOn: true, reminderDays: 7 });

  const [ref, setRef] = useState(today);
  const [month, setMonth] = useState(() => monthOf(today));
  const [cat, setCat] = useState('All');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(null);
  const [view, setView] = useState('table');
  const [sep, setSep] = useState(true);
  const [calKey, setCalKey] = useState(() => monthOf(today) ?? FY_MONTHS[0].key);
  const [dialog, setDialog] = useState(null);
  const [pop, setPop] = useState(null);
  const [toast, setToast] = useState('');
  const [showTop, setShowTop] = useState(false);
  const searchRef = useRef(null);
  const toastTimer = useRef(null);

  const q = useDeferredValue(search);
  const all = useMemo(() => decorate([...withAgm(agm), ...custom], ref), [agm, custom, ref]);
  const shown = useMemo(() => filterRows(all, { month, cat, search: q, status }), [all, month, cat, q, status]);
  const donutRows = useMemo(() => filterRows(all, { month, search: q, status }), [all, month, q, status]);
  const counts = useMemo(() => ({
    overdue: filterRows(all, { status: 'overdue' }).length,
    urgent: filterRows(all, { status: 'urgent' }).length,
    upcoming: filterRows(all, { status: 'upcoming' }).length,
  }), [all]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') { e.preventDefault(); searchRef.current?.focus(); searchRef.current?.select(); }
    };
    const onScroll = () => setShowTop(scrollY > 300);
    addEventListener('keydown', onKey);
    addEventListener('scroll', onScroll, { passive: true });
    return () => { removeEventListener('keydown', onKey); removeEventListener('scroll', onScroll); };
  }, []);

  const say = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 4000);
  };
  // Every export runs through here: library chunks load on demand and can fail on a dropped connection.
  const run = async (fn, rows, done) => {
    setPop(null);
    if (rows && !rows.length) { say('Nothing to export. Clear a filter and try again.'); return; }
    say('Preparing your file…');
    try {
      await fn();
      say(done || 'Done. Check your downloads.');
    } catch {
      say('Could not create the file. Check your connection and try again.');
    }
  };

  const pickStatus = (key) => { setStatus(status === key ? null : key); setMonth(null); setCat('All'); setSearch(''); };
  const pickMonth = (key) => { setMonth(key); if (key) setCalKey(key); setStatus(null); };
  const pickCat = (c) => { setCat(cat === c ? 'All' : c); setStatus(null); setSearch(''); };
  const changeRef = (iso) => { if (!iso) return; setRef(iso); pickMonth(monthOf(iso)); };
  const clearAll = () => { setMonth(null); setCat('All'); setSearch(''); setStatus(null); };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  const isDark = theme === 'dark';

  const removeCustom = (r) => {
    if (window.confirm(`Remove "${r.n}"? This cannot be undone.`)) setCustom(custom.filter((x) => x.id !== r.id));
  };

  const pdfName = (label) => `Compliance-${label.replace(/\s+/g, '-')}.pdf`;
  const imgName = (label) => `Compliance-${label.replace(/\s+/g, '-')}.jpg`;
  const monthFile = async (type, mo, rows) => (type === 'image'
    ? new File([await canvasBlob(await monthCanvas(rows, mo.full))], imgName(mo.full), { type: 'image/jpeg' })
    : new File([await pdfBlob(rows, `Compliance calendar: ${mo.full}`)], pdfName(mo.full), { type: 'application/pdf' }));

  const monthAction = (action, mo, rows, anchor) => {
    if (action === 'pdf') run(() => exportPDF(rows, `Compliance calendar: ${mo.full}`, pdfName(mo.full)), rows);
    if (action === 'image') run(async () => saveCanvas(await monthCanvas(rows, mo.full), imgName(mo.full)), rows);
    if (action === 'wa') setPop({ kind: 'month', anchor, mo, rows });
  };
  const sendMonth = (type, mo, rows) => run(
    () => shareOrWhatsApp(monthText(mo.full, rows.length, wa), () => monthFile(type, mo, rows)), rows, 'File ready. Attach it in WhatsApp if it did not attach itself.',
  );

  const calMonth = month ?? calKey;
  const calMo = FY_MONTHS.find((m) => m.key === calMonth);
  const calRows = shown.filter((r) => r.d.startsWith(calMonth));
  const calAction = (action) => {
    const label = calMo?.full ?? calMonth;
    if (action === 'image') run(async () => saveCanvas(await calendarCanvas(shown, calMonth), `Calendar-${label.replace(/\s+/g, '-')}.jpg`), calRows);
    if (action === 'pdf') run(async () => canvasPDF(await calendarCanvas(shown, calMonth), `Calendar-${label.replace(/\s+/g, '-')}.pdf`), calRows);
    if (action === 'wa') {
      run(() => shareOrWhatsApp(monthText(label, calRows.length, wa), async () => new File(
        [await canvasBlob(await calendarCanvas(shown, calMonth))], `Calendar-${label.replace(/\s+/g, '-')}.jpg`, { type: 'image/jpeg' },
      )), calRows, 'File ready. Attach it in WhatsApp if it did not attach itself.');
    }
  };
  const calNav = (step) => {
    const i = FY_MONTHS.findIndex((m) => m.key === calMonth) + step;
    if (FY_MONTHS[i]) pickMonth(FY_MONTHS[i].key);
  };
  const calToday = () => {
    const key = monthOf(ref);
    if (key) pickMonth(key);
    else { setMonth(null); setCalKey(ref.slice(0, 7)); }
  };

  const ctx = { wa, onDelete: removeCustom, onMonth: monthAction, say, openRow: (r, anchor) => setPop({ kind: 'row', r, anchor }), openMore: (rows, anchor) => setPop({ kind: 'more', rows, anchor }) };

  const tags = [STATUS_TAG[status], month && FY_MONTHS.find((m) => m.key === month).full, cat !== 'All' && cat, q.trim() && `“${q.trim()}”`].filter(Boolean);

  return (
    <section className="cc" data-theme={theme || undefined} aria-label="Compliance calendar tool">
      <div className="wrap cc-inner">
        <div className="cc-strip">
          <div className="cc-asof">
            <label htmlFor="cc-ref">Status as on</label>
            <input id="cc-ref" type="date" value={ref} onChange={(e) => changeRef(e.target.value)} />
            {ref !== today && (
              <button type="button" className="cc-btn cc-btn-ghost" onClick={() => changeRef(today)}><Icon name="reset" /> Back to today</button>
            )}
          </div>
          <dl className="cc-terms">
            <div><dt>FY</dt><dd>Financial Year, April to March</dd></div>
            <div><dt>AY</dt><dd>Assessment Year, follows the FY</dd></div>
            <div><dt>TY</dt><dd>Tax Year, under the Income-tax Act 2025</dd></div>
          </dl>
          <div className="cc-strip-end">
            <button type="button" className="cc-btn cc-btn-ghost" role="switch" aria-checked={isDark} onClick={toggleTheme}>
              <Icon name={isDark ? 'sun' : 'moon'} /> {isDark ? 'Light' : 'Dark'}
            </button>
            <button type="button" className="cc-btn cc-btn-ghost" onClick={() => setDialog('help')}><Icon name="help" /> Help</button>
          </div>
        </div>

        <div className="cc-tiles">
          <Tile tone="all" value={all.length} label="Total deadlines" hint="Apr 2026 to Mar 2027" active={false} onClick={() => { setStatus(null); clearAll(); }} />
          <Tile tone="ov" value={counts.overdue} label="Overdue" hint="Past the due date" active={status === 'overdue'} onClick={() => pickStatus('overdue')} />
          <Tile tone="ur" value={counts.urgent} label="Due in 7 days" hint="Needs action now" active={status === 'urgent'} onClick={() => pickStatus('urgent')} />
          <Tile tone="up" value={counts.upcoming} label="Due in 30 days" hint="Includes the next 7 days" active={status === 'upcoming'} onClick={() => pickStatus('upcoming')} />
        </div>

        <div className="cc-insights">
          <CategoryPanel rows={donutRows} cat={cat} onPick={pickCat} />
          <MonthPanel rows={all} month={month} refKey={ref.slice(0, 7)} onPick={(key) => pickMonth(month === key ? null : key)} onReset={() => pickMonth(null)} />
        </div>
        <nav className="cc-links" aria-label="Related tools">
          <a href="/tools/">Income tax, GST and EMI calculators</a>
          <a href="/tds-tcs-compliance/">TDS and TCS compliance</a>
          <a href="/gst-return-filing/">GST return filing</a>
          <a href="/contact/#enquiry">Ask us about a deadline</a>
        </nav>

        <div className="cc-panel cc-controls">
          <div className="cc-row">
            <div className="cc-search">
              <Icon name="search" />
              <input ref={searchRef} type="search" value={search} onChange={(e) => { setSearch(e.target.value); setStatus(null); }}
                placeholder="Search name, period or category" aria-label="Search deadlines" />
              {search && <button type="button" aria-label="Clear search" onClick={() => { setSearch(''); searchRef.current?.focus(); }}><Icon name="x" /></button>}
            </div>
            <button type="button" className="cc-btn cc-btn-primary" onClick={() => setDialog('add')}><Icon name="plus" /> Add deadline</button>
            <div className="cc-seg" role="group" aria-label="View">
              {VIEWS.map(([key, label, icon]) => (
                <button key={key} type="button" aria-pressed={view === key} onClick={() => setView(key)}><Icon name={icon} /> {label}</button>
              ))}
            </div>
          </div>

          <div className="cc-filter">
            <span className="cc-filter-l" id="cc-l-month">Month</span>
            <div className="cc-chips" role="group" aria-labelledby="cc-l-month" data-lenis-prevent>
              <button type="button" className="cc-chip" aria-pressed={!month} onClick={() => pickMonth(null)}>All</button>
              {FY_MONTHS.map((m) => (
                <button key={m.key} type="button" className="cc-chip" aria-pressed={month === m.key} aria-label={m.full} onClick={() => pickMonth(m.key)}>{m.label}</button>
              ))}
            </div>
          </div>
          <div className="cc-filter">
            <span className="cc-filter-l" id="cc-l-cat">Category</span>
            <div className="cc-chips" role="group" aria-labelledby="cc-l-cat" data-lenis-prevent>
              <button type="button" className="cc-chip" aria-pressed={cat === 'All'} onClick={() => { setCat('All'); setStatus(null); }}>All</button>
              {CATEGORIES.map((c) => (
                <button key={c} type="button" className="cc-chip" aria-pressed={cat === c} onClick={() => pickCat(c)}>
                  <i style={{ background: catVar(c) }} aria-hidden="true" />{c}
                </button>
              ))}
            </div>
            <button type="button" className="cc-btn cc-btn-ghost cc-wa-edit" onClick={() => setDialog('wa')}><Icon name="pencil" /> WhatsApp message</button>
          </div>

          {cat === 'Company Law' && (
            <div className="cc-agm">
              <label htmlFor="cc-agm">AGM date</label>
              <input id="cc-agm" type="date" value={agm} onChange={(e) => e.target.value && setAgm(e.target.value)} />
              <span>ADT-1, AOC-4 and MGT-7 move with this date. Applies to companies only.</span>
              {agm !== AGM_DEFAULT && <button type="button" className="cc-btn cc-btn-ghost" onClick={() => setAgm(AGM_DEFAULT)}><Icon name="reset" /> Reset to 30 Sep 2026</button>}
            </div>
          )}
        </div>

        <div className="cc-results">
          <div className="cc-count" aria-live="polite">
            Showing <b>{shown.length}</b> of <b>{all.length}</b> deadlines{custom.length > 0 && ` (${custom.length} of yours)`}
            {tags.length > 0 && <span className="cc-tags">{tags.join(' · ')}</span>}
            {month && q.trim() && <button type="button" className="cc-linkbtn" onClick={() => pickMonth(null)}>Search all months</button>}
            {tags.length > 0 && <button type="button" className="cc-linkbtn" onClick={clearAll}>Clear filters</button>}
          </div>
          <div className="cc-exports">
            {view === 'table' && (
              <label className="cc-check"><input type="checkbox" checked={sep} onChange={(e) => setSep(e.target.checked)} /> Month separators</label>
            )}
            <button type="button" className="cc-btn" onClick={() => run(() => exportExcel(shown), shown)}><Icon name="download" /> Excel</button>
            <button type="button" className="cc-btn" onClick={() => run(() => exportPDF(shown), shown)}><Icon name="download" /> PDF</button>
            <span className="cc-joined">
              <button type="button" className="cc-btn" onClick={() => run(async () => exportICS(shown, ics), shown)}><Icon name="calendar" /> .ics</button>
              <button type="button" className="cc-btn" aria-label="Calendar export settings" onClick={() => setDialog('ics')}><Icon name="sliders" /></button>
            </span>
          </div>
        </div>

        {shown.length === 0 && view !== 'calendar' ? (
          <div className="cc-empty">
            <p><b>No deadlines match these filters.</b></p>
            <p>Try another month or category, or clear everything.</p>
            <button type="button" className="cc-btn cc-btn-primary" onClick={clearAll}>Clear filters</button>
          </div>
        ) : (
          <>
            {view === 'table' && <TableView rows={shown} sep={sep} ctx={ctx} />}
            {view === 'cards' && <CardsView rows={shown} ctx={ctx} />}
            {view === 'calendar' && (
              <CalendarView rows={shown} monthKey={calMonth} refDate={ref} ctx={ctx} onNav={calNav} onToday={calToday} onAction={calAction} />
            )}
          </>
        )}

        <p className="cc-note">
          Statutory dates checked on {FY.checked}. Extensions can be announced at any time, so confirm against CBDT, CBIC and MCA notifications before you act.
          Your entries and settings stay in this browser; nothing is sent to us. This is general information, not professional advice for your case.
        </p>
      </div>

      <Popover pop={pop} onClose={() => setPop(null)}>
        {pop?.kind === 'row' && <RowPop r={pop.r} wa={wa} say={say} />}
        {pop?.kind === 'more' && (
          <>
            <p className="cc-pop-t">{fmtDate(pop.rows[0].d)}</p>
            {pop.rows.map((r) => (
              <button key={r.id} type="button" className="cc-pop-item" onClick={() => setPop({ kind: 'row', r, anchor: pop.anchor })}>
                <i style={{ background: catVar(r.c) }} aria-hidden="true" />{r.n}
              </button>
            ))}
          </>
        )}
        {pop?.kind === 'month' && (
          <>
            <p className="cc-pop-t">Send {pop.mo.full}</p>
            <button type="button" className="cc-pop-item" onClick={() => sendMonth('image', pop.mo, pop.rows)}><Icon name="image" /> As an image</button>
            <button type="button" className="cc-pop-item" onClick={() => sendMonth('pdf', pop.mo, pop.rows)}><Icon name="file" /> As a PDF</button>
          </>
        )}
      </Popover>

      {dialog === 'add' && (
        <AddDialog onClose={() => setDialog(null)} onSave={(row) => { setCustom([...custom, row]); setDialog(null); say(`Added ${row.n}.`); }} />
      )}
      {dialog === 'wa' && <WADialog value={wa} onClose={() => setDialog(null)} onSave={(v) => { setWa(v); setDialog(null); say('WhatsApp message saved.'); }} />}
      {dialog === 'ics' && (
        <ICSDialog value={ics} count={shown.length} onClose={() => setDialog(null)}
          onSave={(v, download) => {
            setIcs(v);
            setDialog(null);
            if (download) run(async () => exportICS(shown, v), shown); else say('Calendar settings saved.');
          }} />
      )}
      {dialog === 'help' && <HelpDialog total={all.length} onClose={() => setDialog(null)} />}

      <div className="cc-toast" role="status">{toast}</div>
      {showTop && (
        <button type="button" className="cc-top" aria-label="Back to top" onClick={() => scrollTo({ top: 0 })}><Icon name="up" /></button>
      )}
    </section>
  );
}

function RowPop({ r, wa, say }) {
  return (
    <>
      <p className="cc-pop-t">{r.n}</p>
      <p className="cc-pop-s">{r.p} · {fmtDate(r.d)}</p>
      <StatusBadge r={r} />
      <div className="cc-pop-actions">
        <button type="button" className="cc-btn" onClick={async () => { await copyToClipboard(copyText(r)); say('Copied.'); }}><Icon name="copy" /> Copy</button>
        <a className="cc-btn" href={`https://wa.me/?text=${encodeURIComponent(reminderText(r, wa))}`} target="_blank" rel="noopener"><Icon name="whatsapp" /> WhatsApp</a>
        <a className="cc-btn" href={gcalUrl(r)} target="_blank" rel="noopener"><Icon name="calendar" /> Google Calendar</a>
      </div>
    </>
  );
}
