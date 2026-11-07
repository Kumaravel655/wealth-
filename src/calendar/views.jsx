import { useState } from 'react';
import { CATEGORIES, FY_MONTHS, STATUS_NAME, copyText, fmtDate, gcalUrl, reminderText, statusText } from './data.js';

const PATHS = {
  copy: <><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>,
  check: <path d="M20 6 9 17l-5-5" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  plus: <path d="M12 5v14M5 12h14" />,
  search: <><circle cx="11" cy="11" r="7.5" /><path d="m21 21-4.6-4.6" /></>,
  download: <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
  sliders: <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />,
  image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></>,
  file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></>,
  list: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  help: <><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01" /></>,
  reset: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></>,
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  pencil: <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" />,
  up: <path d="M12 19V5M5 12l7-7 7 7" />,
  left: <path d="M19 12H5M12 19l-7-7 7-7" />,
  right: <path d="M5 12h14M12 5l7 7-7 7" />,
  whatsapp: <path transform="scale(.09375)" fill="currentColor" stroke="none" d="M152.58,145.23l23,11.48A24,24,0,0,1,152,176a72.08,72.08,0,0,1-72-72A24,24,0,0,1,99.29,80.46l11.48,23L101,118a8,8,0,0,0-.73,7.51,56.47,56.47,0,0,0,30.15,30.15A8,8,0,0,0,138,155ZM232,128A104,104,0,0,1,79.12,219.82L45.07,231.17a16,16,0,0,1-20.24-20.24l11.35-34.05A104,104,0,1,1,232,128Zm-40,24a8,8,0,0,0-4.42-7.16l-32-16a8,8,0,0,0-8,.5l-14.69,9.8a40.55,40.55,0,0,1-16-16l9.8-14.69a8,8,0,0,0,.5-8l-16-32A8,8,0,0,0,104,64a40,40,0,0,0-40,40,88.1,88.1,0,0,0,88,88A40,40,0,0,0,192,152Z" />,
};

export function Icon({ name }) {
  return (
    <svg className="cc-i" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {PATHS[name]}
    </svg>
  );
}

export const catVar = (c) => `var(--cc-c${CATEGORIES.indexOf(c) + 1})`;

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Clipboard API needs HTTPS and permission; this path still works everywhere else.
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.append(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
}

export function StatusBadge({ r }) {
  return <span className={`cc-st cc-st-${r.st}`} title={STATUS_NAME[r.st]}>{statusText(r.left)}</span>;
}

function Actions({ r, ctx }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await copyToClipboard(copyText(r));
    setCopied(true);
    ctx.say('Copied.');
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className="cc-acts">
      <button type="button" aria-label={`Copy ${r.n}`} title="Copy" onClick={copy}><Icon name={copied ? 'check' : 'copy'} /></button>
      <a className="cc-a-wa" href={`https://wa.me/?text=${encodeURIComponent(reminderText(r, ctx.wa))}`} target="_blank" rel="noopener" aria-label={`Send ${r.n} reminder on WhatsApp`} title="WhatsApp reminder"><Icon name="whatsapp" /></a>
      <a href={gcalUrl(r)} target="_blank" rel="noopener" aria-label={`Add ${r.n} to Google Calendar`} title="Add to Google Calendar"><Icon name="calendar" /></a>
      {r.custom && <button type="button" className="cc-a-del" aria-label={`Remove ${r.n}`} title="Remove" onClick={() => ctx.onDelete(r)}><Icon name="x" /></button>}
    </div>
  );
}

function CatLabel({ c }) {
  return <span className="cc-cat"><i style={{ background: catVar(c) }} aria-hidden="true" />{c}</span>;
}

function MonthTools({ mo, rows, ctx }) {
  return (
    <div className="cc-mtools">
      <button type="button" aria-label={`Download ${mo.full} as PDF`} onClick={() => ctx.onMonth('pdf', mo, rows)}><Icon name="file" /> PDF</button>
      <button type="button" aria-label={`Download ${mo.full} as image`} onClick={() => ctx.onMonth('image', mo, rows)}><Icon name="image" /> Image</button>
      <button type="button" aria-label={`Send ${mo.full} on WhatsApp`} onClick={(e) => ctx.onMonth('wa', mo, rows, e.currentTarget)}><Icon name="whatsapp" /> Send</button>
    </div>
  );
}

const groupByMonth = (rows) => FY_MONTHS
  .map((mo) => ({ mo, rows: rows.filter((r) => r.d.startsWith(mo.key)) }))
  .filter((g) => g.rows.length);

function Row({ r, ctx }) {
  return (
    <tr className={r.st === 'ov' ? 'is-ov' : undefined}>
      <td className="cc-t-date"><b>{fmtDate(r.d, { day: '2-digit', month: 'short' })}</b> <span>{r.d.slice(0, 4)}</span></td>
      <td className="cc-t-st"><StatusBadge r={r} /></td>
      <th scope="row" className="cc-t-name">{r.n}{r.custom && <em>Yours</em>}</th>
      <td className="cc-t-p">{r.p}</td>
      <td className="cc-t-c"><CatLabel c={r.c} /></td>
      <td className="cc-t-a"><Actions r={r} ctx={ctx} /></td>
    </tr>
  );
}

export function TableView({ rows, sep, ctx }) {
  const groups = sep ? groupByMonth(rows) : [{ mo: null, rows }];
  return (
    <div className="cc-panel cc-tablewrap table-scroll">
      <table className="cc-table">
        <caption className="sr-only">Compliance deadlines, earliest first</caption>
        <thead>
          <tr><th scope="col">Due date</th><th scope="col">Status</th><th scope="col">Compliance</th><th scope="col">Period</th><th scope="col">Category</th><th scope="col"><span className="sr-only">Actions</span></th></tr>
        </thead>
        {groups.map(({ mo, rows: list }) => (
          <tbody key={mo?.key ?? 'all'}>
            {mo && (
              <tr className="cc-sep">
                <th colSpan={6} scope="rowgroup">
                  <div><span>{mo.full} <small>{list.length} deadline{list.length === 1 ? '' : 's'}</small></span><MonthTools mo={mo} rows={list} ctx={ctx} /></div>
                </th>
              </tr>
            )}
            {list.map((r) => <Row key={r.id} r={r} ctx={ctx} />)}
          </tbody>
        ))}
      </table>
    </div>
  );
}

export function CardsView({ rows, ctx }) {
  return groupByMonth(rows).map(({ mo, rows: list }) => (
    <section key={mo.key} className="cc-mgroup" aria-label={mo.full}>
      <header className="cc-mhead">
        <h3>{mo.full} <small>{list.length} deadline{list.length === 1 ? '' : 's'}</small></h3>
        <MonthTools mo={mo} rows={list} ctx={ctx} />
      </header>
      <ul className="cc-cards">
        {list.map((r) => (
          <li key={r.id} className="cc-card-d" style={{ '--c': catVar(r.c) }}>
            <div className="cc-card-top"><b>{fmtDate(r.d, { day: '2-digit', month: 'short', year: 'numeric' })}</b><StatusBadge r={r} /></div>
            <h4>{r.n}{r.custom && <em>Yours</em>}</h4>
            <p>{r.p}</p>
            <div className="cc-card-end"><CatLabel c={r.c} /><Actions r={r} ctx={ctx} /></div>
          </li>
        ))}
      </ul>
    </section>
  ));
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarView({ rows, monthKey, refDate, ctx, onNav, onToday, onAction }) {
  const [y, m] = monthKey.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const idx = FY_MONTHS.findIndex((x) => x.key === monthKey);
  const mo = FY_MONTHS[idx];
  const inMonth = rows.filter((r) => r.d.startsWith(monthKey));
  const trailing = (7 - ((first + days) % 7)) % 7;
  return (
    <div className="cc-panel cc-cal">
      <div className="cc-cal-head">
        <div><h3>{mo?.full ?? monthKey}</h3><p>{inMonth.length} deadline{inMonth.length === 1 ? '' : 's'} this month</p></div>
        <div className="cc-cal-nav">
          <button type="button" className="cc-btn" onClick={onToday}><Icon name="reset" /> Today</button>
          <button type="button" className="cc-btn" disabled={idx === 0} onClick={() => onNav(-1)} aria-label="Previous month"><Icon name="left" /></button>
          <button type="button" className="cc-btn" disabled={idx === FY_MONTHS.length - 1} onClick={() => onNav(1)} aria-label="Next month"><Icon name="right" /></button>
          <button type="button" className="cc-btn" onClick={() => onAction('image')}><Icon name="image" /> Image</button>
          <button type="button" className="cc-btn" onClick={() => onAction('pdf')}><Icon name="file" /> PDF</button>
          <button type="button" className="cc-btn" onClick={() => onAction('wa')}><Icon name="whatsapp" /> Send</button>
        </div>
      </div>
      <ul className="cc-legend">
        {CATEGORIES.map((c) => <li key={c}><CatLabel c={c} /></li>)}
      </ul>
      {inMonth.length === 0 && <p className="cc-cal-none">No deadlines match these filters this month.</p>}
      <div className="cc-grid">
        {DOW.map((d, i) => <div key={d} className={`cc-dow${i === 0 || i === 6 ? ' is-wk' : ''}`}>{d}</div>)}
        {Array.from({ length: first }, (_, i) => <div key={`a${i}`} className="cc-cell is-blank" />)}
        {Array.from({ length: days }, (_, i) => {
          const day = i + 1;
          const iso = `${monthKey}-${String(day).padStart(2, '0')}`;
          const items = inMonth.filter((r) => r.d === iso);
          const dow = (first + i) % 7;
          const cls = ['cc-cell', items.length ? 'has' : '', iso === refDate ? 'is-today' : '', dow === 0 || dow === 6 ? 'is-wk' : ''].filter(Boolean).join(' ');
          return (
            <div key={iso} className={cls}>
              <span className="cc-daynum"><span className="cc-daydow">{DOW[dow]} </span>{day}</span>
              {items.slice(0, 3).map((r) => (
                <button key={r.id} type="button" className="cc-ev" style={{ '--c': catVar(r.c) }} onClick={(e) => ctx.openRow(r, e.currentTarget)}>{r.n}</button>
              ))}
              {items.length > 3 && <button type="button" className="cc-more" onClick={(e) => ctx.openMore(items.slice(3), e.currentTarget)}>+{items.length - 3} more</button>}
            </div>
          );
        })}
        {Array.from({ length: trailing }, (_, i) => <div key={`z${i}`} className="cc-cell is-blank" />)}
      </div>
    </div>
  );
}

const R = 42;
const CIRC = 2 * Math.PI * R;

export function CategoryPanel({ rows, cat, onPick }) {
  const data = CATEGORIES.map((c) => ({ c, n: rows.filter((r) => r.c === c).length }));
  const total = rows.length;
  let off = 0;
  const gap = total > 1 ? 1.2 : 0;
  return (
    <div className="cc-panel cc-cats">
      <h2>By category</h2>
      <div className="cc-cats-body">
        <svg viewBox="0 0 110 110" className="cc-donut" aria-hidden="true">
          <circle cx="55" cy="55" r={R} className="cc-donut-track" />
          {data.filter((d) => d.n).map((d) => {
            const len = (d.n / total) * CIRC;
            const seg = (
              <circle key={d.c} cx="55" cy="55" r={R} stroke={catVar(d.c)} strokeDasharray={`${Math.max(len - gap, 0.5)} ${CIRC}`} strokeDashoffset={-off}
                transform="rotate(-90 55 55)" className={cat !== 'All' && cat !== d.c ? 'is-dim' : undefined} onClick={() => onPick(d.c)}>
                <title>{`${d.c}: ${d.n}`}</title>
              </circle>
            );
            off += len;
            return seg;
          })}
          <text x="55" y="53" className="cc-donut-n">{total}</text>
          <text x="55" y="66" className="cc-donut-l">deadlines</text>
        </svg>
        <ul>
          {data.map((d) => (
            <li key={d.c}>
              <button type="button" aria-pressed={cat === d.c} onClick={() => onPick(d.c)}>
                <i style={{ background: catVar(d.c) }} aria-hidden="true" /><span>{d.c}</span><b>{d.n}</b>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function MonthPanel({ rows, month, refKey, onPick, onReset }) {
  const months = FY_MONTHS.map((mo) => {
    const list = rows.filter((r) => r.d.startsWith(mo.key));
    return { mo, n: list.length, cats: CATEGORIES.map((c) => ({ c, n: list.filter((r) => r.c === c).length })).filter((x) => x.n) };
  });
  const max = Math.max(...months.map((m) => m.n), 1);
  return (
    <div className="cc-panel cc-months">
      <div className="cc-months-head">
        <h2>Deadlines by month</h2>
        {month && <button type="button" className="cc-linkbtn" onClick={onReset}>Show all months</button>}
      </div>
      <ol className="cc-bars" onDoubleClick={onReset}>
        {months.map(({ mo, n, cats }, i) => (
          <li key={mo.key} className={[mo.key < refKey ? 'is-past' : '', mo.key === refKey ? 'is-now' : '', month && month !== mo.key ? 'is-dim' : ''].filter(Boolean).join(' ')}>
            <button type="button" aria-pressed={month === mo.key} aria-label={`${mo.full}, ${n} deadlines`} onClick={() => onPick(mo.key)}>
              <span className="cc-bar-n">{n}</span>
              <span className="cc-bar" style={{ height: `${(n / max) * 100}%`, '--i': i }}>
                {cats.map((x) => <span key={x.c} style={{ flexGrow: x.n, background: catVar(x.c) }} />)}
              </span>
              <span className="cc-bar-l">{mo.short}</span>
              <span className={`cc-tip${i < 2 ? ' is-start' : i > 9 ? ' is-end' : ''}`} aria-hidden="true">
                <b>{mo.full}</b>
                {cats.map((x) => <span key={x.c}><i style={{ background: catVar(x.c) }} />{x.c}<em>{x.n}</em></span>)}
              </span>
            </button>
          </li>
        ))}
      </ol>
      <ul className="cc-legend">
        {CATEGORIES.map((c) => <li key={c}><CatLabel c={c} /></li>)}
      </ul>
    </div>
  );
}
