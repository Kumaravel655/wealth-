#!/usr/bin/env python3
"""
Wealth Bridge Website - High-Fidelity Content Extractor to Markdown
Produces:
  - 26 modular per-page Markdown files in extracted-content/pages/<slug>.md
  - 1 consolidated master Markdown book in extracted-content/FULL_WEBSITE_CONTENT.md
  - 1 index catalog README in extracted-content/README.md
"""

import os
import re
import json
import html
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString, Tag

WORKSPACE_DIR = Path(r"c:\Users\kumar\Downloads\wealth-")
OUTPUT_DIR = WORKSPACE_DIR / "extracted-content"
PAGES_DIR = OUTPUT_DIR / "pages"

PAGES_CONFIG = [
    # Core & Brand
    {"file": "index.html", "slug": "home", "title": "Home", "category": "Core & Brand"},
    {"file": "about/index.html", "slug": "about", "title": "About Wealth Bridge", "category": "Core & Brand"},
    {"file": "services/index.html", "slug": "services", "title": "All Services", "category": "Core & Brand"},
    
    # Returns & Compliance
    {"file": "income-tax-return-filing/index.html", "slug": "income-tax-return-filing", "title": "Income Tax Return Filing", "category": "Returns & Compliance"},
    {"file": "gst-return-filing/index.html", "slug": "gst-return-filing", "title": "GST Return Filing", "category": "Returns & Compliance"},
    {"file": "tds-tcs-compliance/index.html", "slug": "tds-tcs-compliance", "title": "TDS & TCS Compliance", "category": "Returns & Compliance"},
    {"file": "accounting-bookkeeping/index.html", "slug": "accounting-bookkeeping", "title": "Accounting, Bookkeeping & Payroll", "category": "Returns & Compliance"},
    {"file": "business-registration/index.html", "slug": "business-registration", "title": "Business Registration", "category": "Returns & Compliance"},
    {"file": "trusts-societies-cooperatives/index.html", "slug": "trusts-societies-cooperatives", "title": "Trusts, Societies & Cooperatives", "category": "Returns & Compliance"},
    
    # Notices, Hearings & Appeals
    {"file": "notices-and-appeals/index.html", "slug": "notices-and-appeals", "title": "Notices & Appeals Hub", "category": "Notices, Hearings & Appeals"},
    {"file": "income-tax-notices-appeals/index.html", "slug": "income-tax-notices-appeals", "title": "Income Tax Notices, Hearings & Appeals", "category": "Notices, Hearings & Appeals"},
    {"file": "gst-notices-appeals/index.html", "slug": "gst-notices-appeals", "title": "GST Notices, Hearings & Appeals", "category": "Notices, Hearings & Appeals"},
    {"file": "companies-act-roc-compliance/index.html", "slug": "companies-act-roc-compliance", "title": "Companies Act Compliance, Notices & Hearings", "category": "Notices, Hearings & Appeals"},
    {"file": "pf-esi-compliance/index.html", "slug": "pf-esi-compliance", "title": "PF & ESI Compliance, Inspections & Hearings", "category": "Notices, Hearings & Appeals"},
    
    # Finance & Growth
    {"file": "government-subsidies/index.html", "slug": "government-subsidies", "title": "Central & Tamil Nadu Government Subsidies", "category": "Finance & Growth"},
    {"file": "project-report-dpr/index.html", "slug": "project-report-dpr", "title": "Detailed Project Reports & CMA Data", "category": "Finance & Growth"},
    {"file": "msme-support/index.html", "slug": "msme-support", "title": "MSME Support Services", "category": "Finance & Growth"},
    
    # Local Practice Offices
    {"file": "tax-consultant-vellore/index.html", "slug": "tax-consultant-vellore", "title": "Tax Consultant in Vellore", "category": "Local Practice Offices"},
    {"file": "tax-consultant-chennai/index.html", "slug": "tax-consultant-chennai", "title": "Tax Consultant in Chennai", "category": "Local Practice Offices"},
    
    # Tools & Reference
    {"file": "tools/index.html", "slug": "tools", "title": "Financial & Tax Calculators", "category": "Tools & Reference"},
    {"file": "faq/index.html", "slug": "faq", "title": "Frequently Asked Questions", "category": "Tools & Reference"},
    
    # Inquiry & Contact
    {"file": "contact/index.html", "slug": "contact", "title": "Contact Us", "category": "Inquiry & Contact"},
    
    # Legal & Disclosures
    {"file": "privacy-policy/index.html", "slug": "privacy-policy", "title": "Privacy Policy", "category": "Legal & Disclosures"},
    {"file": "terms/index.html", "slug": "terms", "title": "Terms of Use", "category": "Legal & Disclosures"},
    {"file": "disclosure/index.html", "slug": "disclosure", "title": "Professional Disclosure", "category": "Legal & Disclosures"},
    
    # Error Handling
    {"file": "404.html", "slug": "404", "title": "Page Not Found (404)", "category": "Error Handling"},
]

def clean_str(s: str) -> str:
    """Normalize text whitespace and entity encodings."""
    if not s:
        return ""
    s = html.unescape(s)
    s = s.replace('\xa0', ' ')
    s = re.sub(r'[ \t]+', ' ', s)
    return s.strip()

def inline_text(tag) -> str:
    """Format inline DOM nodes to Markdown preserving links, emphasis, and strong tags."""
    if isinstance(tag, NavigableString):
        return str(tag)
    if not isinstance(tag, Tag):
        return ""
    
    parts = []
    for c in tag.children:
        if isinstance(c, NavigableString):
            parts.append(str(c))
        elif isinstance(c, Tag):
            name = c.name.lower()
            classes = c.get('class', [])
            # Skip noise elements and decorative avatars
            if name in ['svg', 'script', 'style'] or 'avatar' in classes:
                continue
            txt = inline_text(c)
            if name in ['strong', 'b']:
                st = clean_str(txt)
                parts.append(f"**{st}** " if st else "")
            elif name in ['em', 'i']:
                em = clean_str(txt)
                parts.append(f"*{em}* " if em else "")
            elif name == 'a':
                href = c.get('href', '')
                atxt = clean_str(txt)
                if href and atxt:
                    parts.append(f"[{atxt}]({href})")
                else:
                    parts.append(atxt)
            elif name == 'br':
                parts.append("\n")
            elif name in ['span', 'small', 'mark']:
                parts.append(txt)
            else:
                parts.append(txt)
    out = ''.join(parts)
    return html.unescape(re.sub(r'[ \t]+', ' ', out))

def format_table(table_tag: Tag) -> str:
    """Convert an HTML table to a clean Markdown table."""
    headers = []
    thead = table_tag.find('thead')
    if thead:
        headers = [clean_str(th.get_text()) for th in thead.find_all(['th', 'td'])]
        
    rows = []
    tbody = table_tag.find('tbody') or table_tag
    for tr in tbody.find_all('tr'):
        cells = tr.find_all(['th', 'td'])
        if not headers and not rows:
            if all(c.name == 'th' for c in cells):
                headers = [clean_str(c.get_text()) for c in cells]
                continue
        row_cells = []
        for c in cells:
            cell_txt = clean_str(inline_text(c)).replace('|', '\\|').replace('\n', ' ')
            row_cells.append(cell_txt)
        if row_cells:
            rows.append(row_cells)
            
    if not headers and rows:
        headers = [f"Col {i+1}" for i in range(len(rows[0]))]
    if not headers:
        return ""
        
    col_len = len(headers)
    for r in rows:
        while len(r) < col_len:
            r.append("")
            
    md = []
    md.append("| " + " | ".join(headers) + " |")
    md.append("| " + " | ".join(["---"] * col_len) + " |")
    for r in rows:
        md.append("| " + " | ".join(r[:col_len]) + " |")
    return "\n" + "\n".join(md) + "\n\n"

def parse_section_content(container: Tag, current_heading: str = None) -> str:
    """Parse text, lists, tables, details, values, team, and cards within any container."""
    output = []
    
    # Process children
    for el in container.children:
        if isinstance(el, NavigableString):
            continue
        if not isinstance(el, Tag):
            continue
            
        name = el.name.lower()
        classes = el.get('class', [])
        
        if name in ['script', 'style', 'svg', 'noscript']:
            continue
            
        if name in ['h2', 'h3', 'h4']:
            # Sub-headers within section
            h_sub = clean_str(el.get_text())
            if h_sub and h_sub != current_heading:
                output.append(f"### {h_sub}\n")
            continue
            
        if name == 'p':
            p_text = clean_str(inline_text(el))
            if p_text:
                if 'sec-intro' in classes or 'lead' in classes:
                    output.append(f"*{p_text}*\n")
                else:
                    output.append(f"{p_text}\n")
                    
        elif name == 'table':
            output.append(format_table(el))
            
        elif name in ['ul', 'ol']:
            if 'marquee-track' in classes:
                continue
            is_ol = (name == 'ol')
            for i, li in enumerate(el.find_all('li', recursive=False), 1):
                # Decompose decorative avatar span if present
                for av in li.find_all(class_='avatar'):
                    av.decompose()
                    
                # Check for timeline / step node
                node_badge = li.find(class_=re.compile(r'\b(node|yr|ring)\b'))
                badge_str = ""
                if node_badge:
                    badge_str = clean_str(node_badge.get_text())
                    node_badge.decompose()
                    
                li_md = clean_str(inline_text(li))
                
                # Format team items specially if in team list
                if 'team' in classes:
                    b_tag = li.find('b')
                    if b_tag:
                        name_str = clean_str(b_tag.get_text())
                        degree_str = clean_str(li.get_text().replace(name_str, ''))
                        li_md = f"**{name_str}** ({degree_str})" if degree_str else f"**{name_str}**"
                
                if badge_str:
                    output.append(f"{i}. **{badge_str}** — {li_md}")
                elif is_ol:
                    output.append(f"{i}. {li_md}")
                else:
                    output.append(f"- {li_md}")
            output.append("")
            
        elif name == 'dl':
            # Definition list (e.g. values: Integrity, Diligence)
            for div in el.find_all('div', recursive=False):
                dt = div.find('dt')
                dd = div.find('dd')
                if dt and dd:
                    output.append(f"- **{clean_str(dt.get_text())}:** {clean_str(dd.get_text())}")
            output.append("")

        elif name == 'details':
            sum_tag = el.find('summary')
            q = clean_str(sum_tag.get_text()) if sum_tag else "Question"
            ans_p = el.find('p')
            ans = clean_str(inline_text(ans_p)) if ans_p else clean_str(el.get_text().replace(q, ''))
            output.append(f"### Q: {q}\n{ans}\n")
            
        elif name == 'blockquote':
            p_tag = el.find('p')
            foot = el.find('footer')
            q_txt = clean_str(p_tag.get_text()) if p_tag else clean_str(el.get_text())
            ft_txt = clean_str(foot.get_text()) if foot else ""
            ft_txt = re.sub(r'^[A-Z]{2}', '', ft_txt).strip()
            output.append(f"> \"{q_txt}\"")
            if ft_txt:
                output.append(f"> — **{ft_txt}**\n")
            else:
                output.append("")
                
        elif name in ['div', 'section', 'article']:
            # Handle specific cards
            if 'person' in classes:
                p_h2 = el.find(['h2', 'h3'])
                p_role = el.find(class_='role')
                p_name = clean_str(p_h2.get_text()) if p_h2 else "Advisor"
                p_role_txt = f" — *{clean_str(p_role.get_text())}*" if p_role else ""
                output.append(f"### {p_name}{p_role_txt}\n")
                for p in el.find_all('p', recursive=False):
                    if 'role' not in p.get('class', []):
                        output.append(f"{clean_str(inline_text(p))}\n")
            elif 'pcard' in classes:
                h = el.find(['h2', 'h3', 'h4'])
                h_txt = clean_str(h.get_text()) if h else ""
                output.append(f"### {h_txt}\n")
                for p in el.find_all('p'):
                    output.append(f"{clean_str(inline_text(p))}\n")
                for li in el.find_all('li'):
                    output.append(f"- {clean_str(inline_text(li))}")
                output.append("")
            elif 'city-card' in classes or 'office' in classes:
                role = el.find(class_='city-role')
                nm = el.find(class_='city-name') or el.find(['h2', 'h3'])
                addr = el.find('address')
                role_txt = f" ({clean_str(role.get_text())})" if role else ""
                nm_txt = clean_str(nm.get_text()) if nm else "Office"
                output.append(f"### {nm_txt}{role_txt}\n")
                if addr:
                    output.append(f"**Address:**\n{clean_str(addr.get_text())}\n")
                links = [f"[{clean_str(a.get_text())}]({a.get('href', '')})" for a in el.find_all('a')]
                if links:
                    output.append(f"**Links:** {' | '.join(links)}\n")
            elif 'table-scroll' in classes:
                tbl = el.find('table')
                if tbl:
                    output.append(format_table(tbl))
            else:
                # Recurse down inner div (e.g. wrap, svc-main, prose, etc.)
                sub = parse_section_content(el, current_heading=current_heading)
                if sub:
                    output.append(sub)
                    
    return "\n".join([o for o in output if o])

def extract_page(file_rel: str, cfg: dict) -> dict:
    """Extract complete content and metadata from an HTML file."""
    fpath = WORKSPACE_DIR / file_rel
    html_raw = fpath.read_text(encoding='utf-8')
    soup = BeautifulSoup(html_raw, 'html.parser')
    
    # 1. Head / SEO
    title = clean_str(soup.find('title').get_text()) if soup.find('title') else cfg['title']
    desc_tag = soup.find('meta', attrs={'name': 'description'})
    desc = clean_str(desc_tag['content']) if desc_tag and desc_tag.get('content') else ""
    can_tag = soup.find('link', rel='canonical')
    can = clean_str(can_tag['href']) if can_tag and can_tag.get('href') else f"https://thewealthbridge.in/{cfg['slug']}/"
    geo_reg = soup.find('meta', attrs={'name': 'geo.region'})
    geo_region = clean_str(geo_reg['content']) if geo_reg and geo_reg.get('content') else ""
    geo_place = soup.find('meta', attrs={'name': 'geo.placename'})
    geo_placename = clean_str(geo_place['content']) if geo_place and geo_place.get('content') else ""
    
    # 2. JSON-LD
    schemas = []
    faqs_schema = []
    for s in soup.find_all('script', type='application/ld+json'):
        try:
            d = json.loads(s.string)
            items = d.get('@graph', [d])
            schemas.extend(items)
            for it in items:
                if it.get('@type') == 'FAQPage' and 'mainEntity' in it:
                    for me in it['mainEntity']:
                        faqs_schema.append({
                            'question': clean_str(me.get('name', '')),
                            'answer': clean_str(me.get('acceptedAnswer', {}).get('text', ''))
                        })
        except Exception:
            pass
    schema_types = sorted(list({s.get('@type') for s in schemas if isinstance(s.get('@type'), str)} |
                               {t for s in schemas if isinstance(s.get('@type'), list) for t in s.get('@type')}))
                               
    # 3. Breadcrumbs
    crumbs = []
    crumbs_nav = soup.find('nav', class_='crumbs')
    if crumbs_nav:
        for a in crumbs_nav.find_all('a'):
            crumbs.append(f"[{clean_str(a.get_text())}]({a.get('href', '')})")
        curr = crumbs_nav.find('span', attrs={'aria-current': 'page'})
        if curr:
            crumbs.append(clean_str(curr.get_text()))
            
    # 4. Hero section
    hero = {}
    hero_el = soup.find('section', class_=re.compile(r'\b(hero|page-hero)\b'))
    if hero_el:
        kicker = hero_el.find(class_=re.compile(r'\b(h1-kicker|eyebrow)\b'))
        h1 = hero_el.find('h1')
        h1_display = hero_el.find(class_='h1-display')
        lead = hero_el.find(class_='lead')
        
        kicker_txt = clean_str(kicker.get_text()) if kicker else ""
        if h1_display:
            h1_txt = clean_str(h1_display.get_text())
        elif h1:
            h1_raw = clean_str(h1.get_text())
            if kicker_txt and h1_raw.startswith(kicker_txt):
                h1_raw = h1_raw[len(kicker_txt):].strip()
            h1_txt = h1_raw or title
        else:
            h1_txt = title
            
        ctas = []
        for btn in hero_el.find_all('a', class_=re.compile(r'\bbtn\b')):
            ctas.append((clean_str(btn.get_text()), btn.get('href', '')))
        hero = {
            'kicker': kicker_txt,
            'heading': h1_txt,
            'lead': clean_str(lead.get_text()) if lead else "",
            'ctas': ctas
        }
        
    # 5. Home Facts & Desk
    facts = []
    facts_sec = soup.find('section', class_='facts')
    if facts_sec:
        dl = facts_sec.find('dl')
        if dl:
            for div in dl.find_all('div', recursive=False):
                dt = div.find('dt')
                dd = div.find('dd')
                if dt and dd:
                    facts.append((clean_str(dt.get_text()), clean_str(dd.get_text())))
                
    desk = []
    desk_el = soup.find('aside', class_='desk')
    if desk_el:
        for li in desk_el.find_all('li', class_='due'):
            ring = li.find('span', class_='ring')
            what = li.find('span', class_='due-what')
            dt = li.find('span', class_='due-date')
            day_num = clean_str(ring.get_text()) if ring else ""
            title_st = clean_str(what.find('strong').get_text()) if what and what.find('strong') else ""
            desc_sp = clean_str(what.find('span').get_text()) if what and what.find('span') else ""
            freq_txt = clean_str(dt.get_text()) if dt else ""
            desk.append({'day': day_num, 'title': title_st, 'description': desc_sp, 'frequency': freq_txt})
            
    # 6. Audience
    audience = []
    aud_sec = soup.find('section', class_='audience')
    if aud_sec:
        first_ul = aud_sec.find('ul', class_='marquee-track')
        if first_ul:
            audience = [clean_str(li.get_text()) for li in first_ul.find_all('li')]
            
    # 7. Main Sections parsing
    main = soup.find('main', id='main') or soup.find('body')
    sections = []
    
    # Check for service groups (services/index.html)
    svc_groups = main.find_all('div', class_='svc-group')
    if svc_groups:
        for grp in svc_groups:
            h = grp.find(['h2', 'h3'])
            h_txt = clean_str(h.get_text()) if h else "Services"
            body_md = parse_section_content(grp, current_heading=h_txt)
            sections.append({'heading': h_txt, 'body': body_md})
        note = main.find('p', class_='note')
        if note:
            sections.append({'heading': 'Professional Fees & Terms', 'body': clean_str(note.get_text())})
    else:
        # Check for service main (service detail pages)
        svc_main = main.find('div', class_='svc-main')
        if svc_main:
            for sec in svc_main.find_all('section', recursive=False):
                h = sec.find(['h2', 'h3'])
                h_txt = clean_str(h.get_text()) if h else "Details"
                body_md = parse_section_content(sec, current_heading=h_txt)
                sections.append({'heading': h_txt, 'body': body_md})
        else:
            # Standard page flow
            for sec in main.find_all(['section', 'article'], recursive=True):
                classes = sec.get('class', [])
                if any(c in ['hero', 'page-hero', 'facts', 'audience', 'bridge'] for c in classes):
                    continue
                if 'side-box' in classes or 'pcard' in classes or 'city-card' in classes or 'office' in classes:
                    continue
                if sec.find_parent('section') and sec.find_parent('section') != main:
                    continue
                    
                h = sec.find(['h2', 'h3'])
                h_txt = clean_str(h.get_text()) if h else ""
                body_md = parse_section_content(sec, current_heading=h_txt)
                if h_txt or body_md:
                    sections.append({'heading': h_txt or "Overview", 'body': body_md})
                
    # 8. Sidebar / Related
    sidebar = []
    for sb in main.find_all('div', class_='side-box'):
        h = sb.find(['h2', 'h3'])
        h_txt = clean_str(h.get_text()) if h else "Information"
        paras = [clean_str(inline_text(p)) for p in sb.find_all('p')]
        links = [f"- [{clean_str(a.get_text())}]({a.get('href', '')})" for a in sb.find_all('a')]
        content_txt = "\n\n".join(paras) + ("\n\n" + "\n".join(links) if links else "")
        sidebar.append({'title': h_txt, 'content': content_txt})
        
    # 9. Tools & Forms (Calculators & Contact Form)
    tools = []
    for form in main.find_all('form'):
        f_id = form.get('id', '')
        f_h2 = form.find(['h2', 'h3'])
        t_name = clean_str(f_h2.get_text()) if f_h2 else ("Form: " + f_id)
        note = form.find('p', class_='tool-note')
        note_txt = clean_str(note.get_text()) if note else ""
        fields = []
        for lbl in form.find_all('label'):
            l_for = lbl.get('for', '')
            inp = form.find(id=l_for) if l_for else None
            val = inp.get('value', '') if inp and inp.get('value') else ""
            fields.append((clean_str(lbl.get_text()), val))
        tools.append({'name': t_name, 'note': note_txt, 'fields': fields})
        
    # 10. Reviews (Home page)
    reviews = []
    rev_sec = soup.find('section', attrs={'aria-labelledby': 'reviews-h'})
    if rev_sec:
        for bq in rev_sec.find_all('blockquote', class_='review'):
            p = bq.find('p')
            foot = bq.find('footer')
            q_txt = clean_str(p.get_text()) if p else ""
            auth = clean_str(foot.get_text()) if foot else ""
            auth = re.sub(r'^[A-Z]{2}', '', auth).strip()
            reviews.append({'quote': q_txt, 'author': auth})
            
    # 11. Offices (Home and About pages)
    offices = []
    for o_card in main.find_all(['article', 'div'], class_=re.compile(r'\b(city-card|office)\b')):
        role = o_card.find(class_='city-role')
        nm = o_card.find(class_='city-name') or o_card.find(['h2', 'h3'])
        addr = o_card.find('address')
        if addr:
            role_t = clean_str(role.get_text()) if role else ""
            nm_t = clean_str(nm.get_text()) if nm else ""
            links = [(clean_str(a.get_text()), a.get('href', '')) for a in o_card.find_all('a')]
            offices.append({
                'role': role_t,
                'name': nm_t,
                'address': clean_str(addr.get_text()),
                'links': links
            })

    return {
        'meta': cfg,
        'title': title,
        'description': desc,
        'canonical': can,
        'geo_region': geo_region,
        'geo_placename': geo_placename,
        'schema_types': schema_types,
        'faq_schema': faqs_schema,
        'breadcrumbs': crumbs,
        'hero': hero,
        'facts': facts,
        'compliance_desk': desk,
        'audience': audience,
        'sections': sections,
        'sidebar': sidebar,
        'tools': tools,
        'reviews': reviews,
        'offices': offices,
    }

def format_page_markdown(data: dict) -> str:
    """Render extracted page data into structured Markdown."""
    lines = []
    
    # 1. Frontmatter
    lines.append("---")
    lines.append(f"title: \"{data['title']}\"")
    lines.append(f"description: \"{data['description']}\"")
    lines.append(f"canonical: \"{data['canonical']}\"")
    lines.append(f"category: \"{data['meta']['category']}\"")
    lines.append(f"slug: \"{data['meta']['slug']}\"")
    if data['geo_region']:
        lines.append(f"geo_region: \"{data['geo_region']}\"")
    if data['geo_placename']:
        lines.append(f"geo_placename: \"{data['geo_placename']}\"")
    if data['schema_types']:
        lines.append(f"structured_data_types: {json.dumps(data['schema_types'])}")
    lines.append("---\n")
    
    # 2. Breadcrumbs
    if data['breadcrumbs']:
        lines.append(f"> **Breadcrumbs:** {' > '.join(data['breadcrumbs'])}\n")
        
    # 3. Hero
    hero = data['hero']
    if hero.get('kicker'):
        lines.append(f"*{hero['kicker']}*\n")
    lines.append(f"# {hero.get('heading') or data['title']}\n")
    if hero.get('lead'):
        lines.append(f"{hero['lead']}\n")
    if hero.get('ctas'):
        c_strs = [f"[{t}]({h})" for t, h in hero['ctas']]
        lines.append(f"**Call to Action:** {' | '.join(c_strs)}\n")
    lines.append("---\n")
    
    # 4. Quick Facts (Home)
    if data['facts']:
        lines.append("## Practice Highlights at a Glance\n")
        for k, v in data['facts']:
            lines.append(f"- **{k}:** {v}")
        lines.append("")
        
    # 5. Statutory Compliance Calendar (Home)
    if data['compliance_desk']:
        lines.append("## Statutory Compliance Calendar (Monthly Due Dates)\n")
        lines.append("| Day / Date | Statutory Due Requirement | Details | Frequency |")
        lines.append("|---|---|---|---|")
        for it in data['compliance_desk']:
            lines.append(f"| {it['day']} | **{it['title']}** | {it['description']} | {it['frequency']} |")
        lines.append("\n*Note: Tracking and client reminders for statutory extensions are handled for all registered clients.*\n")
        
    # 6. Audience (Home)
    if data['audience']:
        lines.append("## Who We Work With\n")
        for a in data['audience']:
            lines.append(f"- {a}")
        lines.append("")
        
    # 7. Main Sections
    seen_h = set()
    for s in data['sections']:
        h = s['heading'].strip()
        body = s['body'].strip()
        if not body:
            continue
        if h and h not in seen_h:
            seen_h.add(h)
            lines.append(f"## {h}\n")
        lines.append(f"{body}\n")
        
    # 8. Interactive Tools / Forms
    if data['tools']:
        lines.append("## Interactive Tools & Forms\n")
        for t in data['tools']:
            lines.append(f"### {t['name']}")
            if t['note']:
                lines.append(f"*{t['note']}*\n")
            if t['fields']:
                lines.append("**Fields & Parameters:**")
                for lbl, val in t['fields']:
                    lines.append(f"- **{lbl}**: `{val}`" if val else f"- **{lbl}**")
            lines.append("")
            
    # 9. Verified Reviews
    if data['reviews']:
        lines.append("## Verified Client Reviews (Google 5.0 Rating)\n")
        for r in data['reviews']:
            lines.append(f"> \"{r['quote']}\"")
            lines.append(f"> — **{r['author']}**\n")
            
    # 10. Offices (if not already rendered in main body sections)
    if data['offices'] and data['meta']['slug'] in ['home', 'contact']:
        lines.append("## Office Locations & Visiting Hours\n")
        for o in data['offices']:
            r_str = f" ({o['role']})" if o['role'] else ""
            lines.append(f"### {o['name']}{r_str}")
            lines.append(f"**Address:**\n{o['address']}\n")
            if o['links']:
                l_strs = [f"[{t}]({h})" for t, h in o['links']]
                lines.append(f"**Actions:** {' | '.join(l_strs)}\n")
                
    # 11. Sidebar & Related Services
    if data['sidebar']:
        lines.append("## Engagement & Related Services\n")
        for sb in data['sidebar']:
            lines.append(f"### {sb['title']}")
            lines.append(f"{sb['content']}\n")
            
    # 12. Fallback FAQ from Schema if not in body
    if data['faq_schema'] and not any("Frequently asked questions" in s['heading'] or "Common questions" in s['heading'] for s in data['sections']):
        lines.append("## Frequently Asked Questions\n")
        for f in data['faq_schema']:
            lines.append(f"### Q: {f['question']}")
            lines.append(f"{f['answer']}\n")
            
    # 13. Footer Reference Notice
    lines.append("---\n")
    lines.append("### Practice Details & Regulatory Notice")
    lines.append("- **Firm Name:** Wealth Bridge Tax & Business Consultants")
    lines.append("- **Proprietor:** S. Dineshbabu (Practising since 2007)")
    lines.append("- **GSTIN:** 33ATFPD1293G1Z2")
    lines.append("- **Operating Hours:** Monday to Saturday, 9:30 am to 6:30 pm")
    lines.append("- **Head Office:** Union Bank Upstairs, No. 23, 8th East Main Road, Gandhinagar, Katpadi, Vellore 632006")
    lines.append("- **Chennai Office:** No. 23/1, 1st Floor, Alagiri Nagar 5th Street, 100 Feet Road, Vadapalani, Chennai 600026")
    lines.append("- **Direct Helpline:** +91 86677 53901 | Vellore Landline: 0416 224 1199")
    lines.append("- **Email:** infowealthbridge@gmail.com")
    lines.append(f"- **Official Page URL:** [{data['canonical']}]({data['canonical']})\n")

    return "\n".join(lines)

def generate_full_markdown(all_data: list) -> str:
    """Compile comprehensive single-source Markdown document."""
    doc = []
    doc.append("# Wealth Bridge — Complete Website Content & Practice Documentation\n")
    doc.append("**Tax & Business Consultants in Vellore and Chennai | Established in 2007**\n")
    doc.append("> *Making More Possibilities*\n")
    doc.append("---\n")
    
    # Executive Overview
    doc.append("## Executive Overview & Practice Scope\n")
    doc.append(
        "Wealth Bridge Tax & Business Consultants is an independent professional consulting firm "
        "founded in Vellore in 2007 by **S. Dineshbabu**. With dedicated physical offices in **Katpadi (Vellore)** "
        "and **Vadapalani (Chennai)**, Wealth Bridge advises businesses, salaried individuals, doctors, contractors, "
        "exporters, and MSMEs across all 38 districts of Tamil Nadu and nationwide.\n\n"
        "### Three Core Practice Pillars:\n"
        "1. **Returns & Compliance:** Income tax return filing, GST return filing, TDS/TCS, Accounting & Bookkeeping, Business Registration, Trusts & Societies.\n"
        "2. **Notices, Hearings & Appeals:** Four laws coverage (Income Tax, GST, Companies Act, PF & ESI) from initial reply through to Commissioner and Tribunal appeals.\n"
        "3. **Finance & Growth:** Central and Tamil Nadu government subsidies (NEEDS, UYEGP, PMEGP), Bank-ready Detailed Project Reports (DPRs), CMA data, and MSME support.\n"
    )
    doc.append("---\n")

    # Table of Contents
    doc.append("## Table of Contents\n")
    cats = {}
    for p in all_data:
        cats.setdefault(p['meta']['category'], []).append(p)
        
    for cat_name, pages in cats.items():
        doc.append(f"### {cat_name}")
        for p in pages:
            anchor = p['meta']['slug'].replace('_', '-')
            doc.append(f"- [{p['title']}](#chapter-{anchor}) — *{p['description'][:95]}...*")
        doc.append("")
    doc.append("---\n")

    # Sequential chapters
    for i, p in enumerate(all_data, 1):
        slug = p['meta']['slug']
        doc.append(f"<a id=\"chapter-{slug}\"></a>\n")
        doc.append(f"# Chapter {i}: {p['title']}")
        doc.append(f"**Category:** {p['meta']['category']} | **Canonical URL:** `{p['canonical']}`\n")
        
        page_md = format_page_markdown(p)
        if page_md.startswith("---"):
            parts = page_md.split("---", 2)
            if len(parts) >= 3:
                page_md = parts[2].strip()
        doc.append(page_md)
        doc.append("\n\n---\n")
        
    return "\n".join(doc)

def generate_index_readme(all_data: list) -> str:
    """Generate master README catalog."""
    doc = []
    doc.append("# Wealth Bridge Website Content Repository (Extracted Markdown)\n")
    doc.append("This repository contains the complete, verified, high-fidelity Markdown extraction of the **Wealth Bridge** website (`thewealthbridge.in`).\n")
    doc.append("## Repository Structure\n")
    doc.append("- **[`FULL_WEBSITE_CONTENT.md`](./FULL_WEBSITE_CONTENT.md)**: Consolidated master documentation containing the entire 26-page website in a single searchable document.")
    doc.append("- **[`pages/`](./pages/)**: 26 modular Markdown files corresponding to each page of the website.\n")
    doc.append("## Extraction Highlights & Practice Metrics\n")
    doc.append(f"- **Total Pages Extracted:** {len(all_data)}")
    doc.append("- **Firm Established:** 2007 (Vellore)")
    doc.append("- **Offices:** Katpadi, Vellore (Head Office) and Vadapalani, Chennai")
    doc.append("- **Google Rating:** 5.0 (132 reviews)")
    doc.append("- **Monthly Due Dates:** TDS/TCS (7th), GSTR-1 (11th), PF/ESI (15th), GSTR-3B (20th), ITR (31st July)")
    doc.append("- **Coverage:** All 38 districts of Tamil Nadu (In-person in Vellore, Ranipet, Tirupattur, Chennai; Online statewide)\n")
    doc.append("## Extracted Pages Directory\n")
    doc.append("| # | Page Title | Category | Source HTML | Extracted Markdown |")
    doc.append("|---|---|---|---|---|")
    for i, p in enumerate(all_data, 1):
        slug = p['meta']['slug']
        doc.append(f"| {i} | **{p['title']}** | {p['meta']['category']} | `{p['meta']['file']}` | [`pages/{slug}.md`](./pages/{slug}.md) |")
    doc.append("\n---\n*Extracted and verified by the Wealth Bridge Extraction Pipeline.*")
    return "\n".join(doc)

def main():
    print(f"Beginning high-fidelity extraction for {len(PAGES_CONFIG)} pages...")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    PAGES_DIR.mkdir(parents=True, exist_ok=True)
    
    all_pages = []
    for cfg in PAGES_CONFIG:
        print(f"  -> Processing: {cfg['file']} -> {cfg['slug']}.md")
        data = extract_page(cfg['file'], cfg)
        all_pages.append(data)
        
        md_text = format_page_markdown(data)
        out_path = PAGES_DIR / f"{cfg['slug']}.md"
        out_path.write_text(md_text, encoding='utf-8')
        
    print(f"Successfully generated {len(all_pages)} modular Markdown files.")
    
    print("Compiling master document: FULL_WEBSITE_CONTENT.md...")
    full_md = generate_full_markdown(all_pages)
    (OUTPUT_DIR / "FULL_WEBSITE_CONTENT.md").write_text(full_md, encoding='utf-8')
    print(f"Wrote FULL_WEBSITE_CONTENT.md ({len(full_md):,} characters)")
    
    print("Generating catalog README.md...")
    readme_md = generate_index_readme(all_pages)
    (OUTPUT_DIR / "README.md").write_text(readme_md, encoding='utf-8')
    print("All extraction artifacts generated successfully!")

if __name__ == "__main__":
    main()
