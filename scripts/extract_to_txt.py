#!/usr/bin/env python3
"""
Wealth Bridge Website - Full Content Extractor to TXT
Extracts all 26 HTML pages from the Wealth Bridge website into:
  1. Consolidated master plain text file: FULL_WEBSITE_CONTENT.txt (root and extracted-content/)
  2. Individual per-page plain text files: extracted-content/txt_pages/<slug>.txt
  3. Plain text catalog index: extracted-content/README_TXT.txt
"""

import os
import re
import json
import html
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString, Tag

WORKSPACE_DIR = Path(r"c:\Users\kumar\Downloads\wealth-")
OUTPUT_DIR = WORKSPACE_DIR / "extracted-content"
TXT_PAGES_DIR = OUTPUT_DIR / "txt_pages"

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

def clean_text(text: str) -> str:
    """Normalize whitespace and unescape HTML characters."""
    if not text:
        return ""
    text = html.unescape(text)
    text = text.replace('\xa0', ' ')
    lines = [re.sub(r'[ \t]+', ' ', line).strip() for line in text.split('\n')]
    return '\n'.join([l for l in lines if l])

def extract_inline_text(tag: Tag) -> str:
    """Extract readable text preserving links and formatting."""
    if isinstance(tag, NavigableString):
        return str(tag)
    
    res = []
    for child in tag.children:
        if isinstance(child, NavigableString):
            res.append(str(child))
        elif isinstance(child, Tag):
            name = child.name.lower()
            if name in ['svg', 'script', 'style', 'noscript']:
                continue
            child_text = extract_inline_text(child).strip()
            if name == 'a':
                href = child.get('href', '').strip()
                if href and child_text:
                    if href.startswith(('tel:', 'mailto:')):
                        res.append(f"{child_text} ({href})")
                    elif href.startswith(('http://', 'https://')):
                        res.append(f"{child_text} ({href})")
                    elif href.startswith('/'):
                        res.append(f"{child_text} (https://thewealthbridge.in{href})")
                    else:
                        res.append(f"{child_text}")
                elif child_text:
                    res.append(child_text)
            elif name == 'br':
                res.append("\n")
            else:
                res.append(extract_inline_text(child))
    out = ''.join(res)
    out = re.sub(r'[ \t]+', ' ', out)
    return html.unescape(out)

def format_ascii_table(headers: list, rows: list) -> str:
    """Format data into an aligned, beautiful ASCII table."""
    if not headers and not rows:
        return ""
    if not headers and rows:
        headers = [f"Col {i+1}" for i in range(len(rows[0]))]
        
    num_cols = len(headers)
    clean_rows = []
    for r in rows:
        r_padded = [clean_text(str(c)).replace('\n', ' ') for c in r]
        while len(r_padded) < num_cols:
            r_padded.append("")
        clean_rows.append(r_padded[:num_cols])
        
    clean_headers = [clean_text(str(h)).replace('\n', ' ') for h in headers]
    
    # Calculate column widths with caps
    col_widths = [len(h) for h in clean_headers]
    for r in clean_rows:
        for i, val in enumerate(r):
            col_widths[i] = min(max(col_widths[i], len(val)), 50)
            
    # Helper to wrap text
    def wrap_cell(text, width):
        words = text.split()
        if not words:
            return [""]
        lines = []
        cur = []
        cur_len = 0
        for w in words:
            if cur_len + len(w) + (1 if cur else 0) <= width:
                cur.append(w)
                cur_len += len(w) + (1 if cur else 0)
            else:
                if cur:
                    lines.append(' '.join(cur))
                cur = [w]
                cur_len = len(w)
        if cur:
            lines.append(' '.join(cur))
        return lines

    # Divider line
    divider = "+" + "+".join(["-" * (w + 2) for w in col_widths]) + "+"
    
    out_lines = [divider]
    
    # Header row
    hdr_wrapped = [wrap_cell(h, col_widths[i]) for i, h in enumerate(clean_headers)]
    max_h_lines = max(len(w) for w in hdr_wrapped)
    for line_idx in range(max_h_lines):
        row_str = "|"
        for col_idx in range(num_cols):
            cell_lines = hdr_wrapped[col_idx]
            cell_txt = cell_lines[line_idx] if line_idx < len(cell_lines) else ""
            row_str += f" {cell_txt.ljust(col_widths[col_idx])} |"
        out_lines.append(row_str)
        
    out_lines.append(divider)
    
    # Data rows
    for r in clean_rows:
        r_wrapped = [wrap_cell(c, col_widths[i]) for i, c in enumerate(r)]
        max_r_lines = max(len(w) for w in r_wrapped) if r_wrapped else 1
        for line_idx in range(max_r_lines):
            row_str = "|"
            for col_idx in range(num_cols):
                cell_lines = r_wrapped[col_idx]
                cell_txt = cell_lines[line_idx] if line_idx < len(cell_lines) else ""
                row_str += f" {cell_txt.ljust(col_widths[col_idx])} |"
            out_lines.append(row_str)
        out_lines.append(divider)
        
    return "\n".join(out_lines) + "\n"

def extract_json_ld(soup: BeautifulSoup) -> list:
    """Extract schema.org structured data from script tags."""
    schemas = []
    for s in soup.find_all('script', type='application/ld+json'):
        try:
            data = json.loads(s.string)
            if '@graph' in data:
                schemas.extend(data['@graph'])
            else:
                schemas.append(data)
        except Exception:
            pass
    return schemas

def parse_html_page_to_txt(file_rel_path: str, meta_info: dict) -> str:
    """Parse an HTML file and format its complete contents into clean plain text."""
    file_path = WORKSPACE_DIR / file_rel_path
    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")
        
    raw_html = file_path.read_text(encoding='utf-8')
    soup = BeautifulSoup(raw_html, 'html.parser')
    
    # 1. Metadata
    title_tag = soup.find('title')
    title = clean_text(title_tag.get_text()) if title_tag else meta_info['title']
    
    desc_tag = soup.find('meta', attrs={'name': 'description'})
    description = desc_tag['content'].strip() if desc_tag and desc_tag.get('content') else ""
    
    canonical_tag = soup.find('link', rel='canonical')
    canonical = canonical_tag['href'].strip() if canonical_tag and canonical_tag.get('href') else f"https://thewealthbridge.in/{meta_info['slug']}/"
    
    geo_reg = soup.find('meta', attrs={'name': 'geo.region'})
    geo_region = geo_reg['content'].strip() if geo_reg and geo_reg.get('content') else ""
    
    geo_place = soup.find('meta', attrs={'name': 'geo.placename'})
    geo_placename = geo_place['content'].strip() if geo_place and geo_place.get('content') else ""
    
    schemas = extract_json_ld(soup)
    schema_types = sorted(list({s.get('@type') for s in schemas if isinstance(s.get('@type'), str)} | 
                               {t for s in schemas if isinstance(s.get('@type'), list) for t in s.get('@type')}))

    faq_schema_items = []
    for s in schemas:
        if s.get('@type') == 'FAQPage' and 'mainEntity' in s:
            for item in s['mainEntity']:
                q = item.get('name', '').strip()
                ans = item.get('acceptedAnswer', {}).get('text', '').strip()
                if q and ans:
                    faq_schema_items.append({'q': q, 'a': ans})

    # Start building output document
    doc = []
    
    # Header border
    doc.append("=" * 80)
    doc.append(f"WEALTH BRIDGE - TAX & BUSINESS CONSULTANTS")
    doc.append(f"PAGE: {title.upper()}")
    doc.append("=" * 80)
    doc.append("")
    
    # Metadata Block
    doc.append("[ METADATA & PAGE DETAILS ]")
    doc.append(f"  * Page Title:        {title}")
    doc.append(f"  * Category:          {meta_info['category']}")
    doc.append(f"  * Canonical URL:     {canonical}")
    if description:
        doc.append(f"  * Meta Description:  {description}")
    if geo_region or geo_placename:
        doc.append(f"  * Geographic Scope:  {geo_placename} ({geo_region})")
    if schema_types:
        doc.append(f"  * Structured Schema: {', '.join(schema_types)}")
    doc.append("")
    
    # Breadcrumbs
    crumbs_nav = soup.find('nav', class_='crumbs')
    if crumbs_nav:
        c_items = []
        for li in crumbs_nav.find_all(['li', 'a', 'span']):
            t = clean_text(li.get_text())
            if t and t not in c_items:
                c_items.append(t)
        if c_items:
            doc.append(f"Navigation Path: {' > '.join(c_items)}")
            doc.append("")

    # Upcoming Due Dates Ticker
    ticker = soup.find('div', class_='ticker')
    if ticker:
        ticker_items = []
        for li in ticker.find_all('li'):
            b = li.find('b')
            b_txt = clean_text(b.get_text()) if b else ""
            full_t = clean_text(li.get_text())
            ticker_items.append(full_t)
        if ticker_items:
            doc.append("[ UPCOMING STATUTORY DUE DATES TRACKED ]")
            for ti in ticker_items:
                doc.append(f"  * {ti}")
            doc.append("")

    doc.append("-" * 80)
    
    # Hero Section
    hero = soup.find(['section', 'div'], class_=re.compile(r'\b(hero|page-hero)\b'))
    if hero:
        kicker = hero.find(class_=re.compile(r'\b(h1-kicker|eyebrow)\b'))
        h1 = hero.find('h1')
        lead = hero.find(class_='lead')
        
        if kicker:
            doc.append(f"{clean_text(kicker.get_text()).upper()}")
        if h1:
            doc.append(f"\n{clean_text(h1.get_text())}\n")
        if lead:
            doc.append(f"{clean_text(lead.get_text())}\n")
            
        btn_links = []
        for btn in hero.find_all('a', class_=re.compile(r'\bbtn\b')):
            bt = clean_text(btn.get_text())
            bh = btn.get('href', '').strip()
            if bt and bh:
                btn_links.append(f"{bt}: {bh}")
        if btn_links:
            doc.append("Action Contacts:")
            for bl in btn_links:
                doc.append(f"  * {bl}")
            doc.append("")
            
    doc.append("-" * 80)
    doc.append("")

    main_elem = soup.find('main', id='main') or soup.find('body')

    # Specific Section: Compliance Desk (Homepage)
    desk = main_elem.find('aside', class_='desk')
    if desk:
        doc.append("[ COMPLIANCE DESK - MONTHLY STATUTORY CALENDAR ]")
        desk_note = desk.find('p', class_='desk-note')
        due_list = desk.find('ol', class_='due-list')
        if due_list:
            c_headers = ["Day/Date", "Requirement", "Details", "Frequency"]
            c_rows = []
            for li in due_list.find_all('li', class_='due'):
                ring = li.find('span', class_='ring')
                day = clean_text(ring.get_text()) if ring else ""
                due_what = li.find('span', class_='due-what')
                st = due_what.find('strong') if due_what else None
                sp = due_what.find('span') if due_what else None
                what_t = clean_text(st.get_text()) if st else ""
                det_t = clean_text(sp.get_text()) if sp else ""
                due_date = li.find('span', class_='due-date')
                freq = clean_text(due_date.get_text()) if due_date else ""
                c_rows.append([day, what_t, det_t, freq])
            doc.append(format_ascii_table(c_headers, c_rows))
        if desk_note:
            doc.append(f"Note: {clean_text(desk_note.get_text())}\n")
        cta_a = desk.find('a', class_='desk-cta')
        if cta_a:
            cta_txt = clean_text(cta_a.get_text()).replace('\n', ' - ')
            doc.append(f"Emergency Notice Triage: {cta_txt} ({cta_a.get('href', '')})\n")

    # Specific Section: Key Practice Facts / Numbers
    facts_sec = main_elem.find('section', class_='facts')
    if facts_sec:
        doc.append("[ PRACTICE HIGHLIGHTS AT A GLANCE ]")
        dl = facts_sec.find('dl')
        if dl:
            for div in dl.find_all('div'):
                dt = div.find('dt')
                dd = div.find('dd')
                if dt and dd:
                    doc.append(f"  * {clean_text(dt.get_text())}: {clean_text(dd.get_text())}")
        doc.append("")

    # Specific Section: Who We Work With (Audience)
    aud_sec = main_elem.find('section', class_='audience')
    if aud_sec:
        doc.append("[ WHO WE WORK WITH - CLIENT SPECTRUM ]")
        ul = aud_sec.find('ul', class_='marquee-track')
        if ul:
            for li in ul.find_all('li'):
                doc.append(f"  * {clean_text(li.get_text())}")
        doc.append("")

    # Specific Section: Triage ("What do you need help with?")
    triage_sec = main_elem.find('section', class_='triage')
    if triage_sec:
        doc.append("[ IMMEDIATE ASSISTANCE & TRIAGE ]")
        t_h2 = triage_sec.find('h2')
        if t_h2:
            doc.append(f"{clean_text(t_h2.get_text())}:")
        for li in triage_sec.find_all('li'):
            a = li.find('a')
            if a:
                doc.append(f"  * {clean_text(a.get_text())} -> https://thewealthbridge.in{a.get('href', '')}")
        doc.append("")

    # Specific Section: Core Practice Areas (Pcards on homepage)
    pcards_sec = main_elem.find('div', class_='pcards')
    if pcards_sec:
        doc.append("[ CORE PRACTICE AREAS ]")
        for card in pcards_sec.find_all('article', class_='pcard'):
            c_h3 = card.find('h3')
            c_p = card.find('p')
            doc.append(f"\n--- {clean_text(c_h3.get_text()).upper()} ---" if c_h3 else "")
            if c_p:
                doc.append(f"{clean_text(c_p.get_text())}")
            links = []
            for la in card.find_all('a'):
                links.append(f"{clean_text(la.get_text())} (https://thewealthbridge.in{la.get('href', '')})")
            if links:
                doc.append("Key Specializations:")
                for l in links:
                    doc.append(f"  * {l}")
        doc.append("")

    # Specific Section: Also on our desk
    also_sec = main_elem.find('div', class_='also')
    if also_sec:
        doc.append("[ ALSO ON OUR DESK ]")
        for li in also_sec.find_all('li'):
            a = li.find('a')
            st = li.find('strong')
            sp = li.find('span')
            title_s = clean_text(st.get_text()) if st else (clean_text(a.get_text()) if a else "")
            desc_s = clean_text(sp.get_text()) if sp else ""
            href_s = a.get('href', '') if a else ""
            doc.append(f"  * {title_s}: {desc_s} (https://thewealthbridge.in{href_s})")
        doc.append("")

    # Specific Section: "Why Wealth Bridge" / "One principal reviews every reply"
    why_sec = main_elem.find('section', class_=re.compile(r'\bwhy\b'))
    if why_sec:
        doc.append("[ PRACTICE PRINCIPLES & CLIENT COMMITMENT ]")
        w_h2 = why_sec.find('h2')
        w_intro = why_sec.find('p', class_='sec-intro')
        if w_h2:
            doc.append(f"Headline: {clean_text(w_h2.get_text())}")
        if w_intro:
            doc.append(f"Overview: {clean_text(w_intro.get_text())}\n")
        for li in why_sec.find_all('li'):
            st = li.find('strong')
            st_txt = clean_text(st.get_text()) if st else ""
            full_txt = clean_text(li.get_text())
            body_txt = full_txt.replace(st_txt, '').strip()
            doc.append(f"  * {st_txt.upper()}: {body_txt}")
        doc.append("")

    # Specific Section: Six steps timeline (Process)
    proc_ol = main_elem.find('ol', class_='timeline-h')
    if proc_ol:
        doc.append("[ OUR SIX-STEP ENGAGEMENT PROCESS ]")
        for li in proc_ol.find_all('li'):
            node = li.find('span', class_='node')
            st = li.find('strong')
            p = li.find('p')
            n_txt = clean_text(node.get_text()) if node else ""
            s_txt = clean_text(st.get_text()) if st else ""
            p_txt = clean_text(p.get_text()) if p else ""
            doc.append(f"  Step {n_txt} - {s_txt}: {p_txt}")
        doc.append("")

    # Specific Section: Notices across four laws Table
    appeals_sec = main_elem.find('section', id='appeals') or main_elem.find('div', class_='table-scroll')
    if appeals_sec:
        tbl = appeals_sec.find('table')
        if tbl:
            doc.append("[ STATUTORY NOTICES, HEARINGS & APPEALS ACROSS FOUR LAWS ]")
            t_headers = []
            th_tags = tbl.find_all('th', scope='col')
            if th_tags:
                t_headers = [clean_text(th.get_text()) for th in th_tags]
            t_rows = []
            tbody = tbl.find('tbody') or tbl
            for tr in tbody.find_all('tr'):
                cells = tr.find_all(['td', 'th'])
                row_vals = [clean_text(extract_inline_text(c)) for c in cells]
                if row_vals:
                    t_rows.append(row_vals)
            doc.append(format_ascii_table(t_headers, t_rows))

    # Specific Section: Tamil Nadu Coverage
    tnmap_sec = main_elem.find('section', class_=re.compile(r'\btnmap-sec\b'))
    if tnmap_sec:
        doc.append("[ TAMIL NADU STATEWIDE PRACTICE & COVERAGE ]")
        h2 = tnmap_sec.find('h2')
        p_intro = tnmap_sec.find('p', class_='sec-intro')
        if h2:
            doc.append(f"{clean_text(h2.get_text())}")
        if p_intro:
            doc.append(f"{clean_text(p_intro.get_text())}\n")
        doc.append("Service Modes Across All 38 Districts:")
        doc.append("  * In-Person Districts: Vellore, Ranipet, Tirupattur, Chennai")
        doc.append("  * Online Representation & Filings: All 38 districts of Tamil Nadu (Ariyalur, Chengalpattu, Chennai, Coimbatore, Cuddalore, Dharmapuri, Dindigul, Erode, Kallakurichi, Kanchipuram, Kanniyakumari, Karur, Krishnagiri, Madurai, Mayiladuthurai, Nagapattinam, Namakkal, Nilgiris, Perambalur, Pudukkottai, Ramanathapuram, Ranipet, Salem, Sivagangai, Tenkasi, Thanjavur, Theni, Thiruvallur, Thiruvarur, Thoothukudi, Tiruchirappalli, Tirunelveli, Tirupattur, Tiruppur, Tiruvannamalai, Vellore, Viluppuram, Virudhunagar)\n")

    # Specific Section: About Page - Timeline, Values, Team
    if meta_info['slug'] == 'about':
        doc.append("[ OUR STORY & HISTORY ]")
        prose = main_elem.find('div', class_='prose')
        if prose:
            first_p = prose.find('p', class_='first')
            if first_p:
                doc.append(f"{clean_text(first_p.get_text())}\n")
            timeline = prose.find('ol', class_='timeline')
            if timeline:
                for li in timeline.find_all('li'):
                    yr = li.find('span', class_='yr')
                    p = li.find('p')
                    yr_t = clean_text(yr.get_text()) if yr else ""
                    p_t = clean_text(p.get_text()) if p else ""
                    doc.append(f"  * {yr_t}: {p_t}")
                doc.append("")
                
            values = prose.find('dl', class_='values')
            if values:
                doc.append("[ WHAT WE STAND FOR - PRACTICE VALUES ]")
                for div in values.find_all('div'):
                    dt = div.find('dt')
                    dd = div.find('dd')
                    if dt and dd:
                        doc.append(f"  * {clean_text(dt.get_text())}: {clean_text(dd.get_text())}")
                doc.append("")
                
        # Leadership & Principals
        doc.append("[ LEADERSHIP & PRINCIPAL ADVISORS ]")
        for person in main_elem.find_all('div', class_='person'):
            ph2 = person.find('h2')
            prole = person.find('p', class_='role')
            p_name = clean_text(ph2.get_text()) if ph2 else ""
            p_role = clean_text(prole.get_text()) if prole else ""
            doc.append(f"\n{p_name} - {p_role}")
            for p in person.find_all('p'):
                if 'role' not in p.get('class', []):
                    doc.append(f"{clean_text(p.get_text())}")
        doc.append("")
        
        # Team Members
        team_sec = main_elem.find('ul', class_='team')
        if team_sec:
            doc.append("[ PROFESSIONAL TEAM MEMBERS ]")
            doc.append("Commerce and management graduates, trained in-house in accounting, GST, income tax and compliance:")
            for li in team_sec.find_all('li'):
                b = li.find('b')
                deg = li.find_all('span')[-1] if li.find_all('span') else None
                b_name = clean_text(b.get_text()) if b else clean_text(li.get_text())
                deg_txt = clean_text(deg.get_text()) if deg and deg != b else ""
                doc.append(f"  * {b_name} ({deg_txt})" if deg_txt else f"  * {b_name}")
            doc.append("")

    # Specific Section: Service Master Groups (Services Page)
    if meta_info['slug'] == 'services':
        doc.append("[ COMPLETE DIRECTORY OF SERVICES ]")
        for group in main_elem.find_all('div', class_='svc-group'):
            gh2 = group.find('h2', class_='svc-group-h')
            doc.append(f"\n==================================================")
            doc.append(f"PILLAR: {clean_text(gh2.get_text()).upper() if gh2 else 'SERVICES'}")
            doc.append(f"==================================================")
            for li in group.find_all('li'):
                a = li.find('a')
                st = li.find('strong')
                sp = li.find('span')
                s_name = clean_text(st.get_text()) if st else clean_text(a.get_text())
                s_desc = clean_text(sp.get_text()) if sp else ""
                s_href = a.get('href', '') if a else ""
                doc.append(f"\n* {s_name}")
                doc.append(f"  Description: {s_desc}")
                doc.append(f"  Service Page URL: https://thewealthbridge.in{s_href}")
        doc.append("")

    # Specific Section: Standard Service Page Main Layout (.svc-main)
    svc_main = main_elem.find('div', class_='svc-main')
    if svc_main:
        for sec in svc_main.find_all('section', recursive=False):
            sec_h2 = sec.find('h2')
            s_title = clean_text(sec_h2.get_text()) if sec_h2 else ""
            if s_title and s_title.lower() != "frequently asked questions":
                doc.append(f"\n[ {s_title.upper()} ]")
                
            # Paragraphs
            for p in sec.find_all('p', recursive=False):
                doc.append(f"{clean_text(extract_inline_text(p))}\n")
                
            # Lists
            for ul in sec.find_all('ul', recursive=False):
                for li in ul.find_all('li'):
                    doc.append(f"  * {clean_text(extract_inline_text(li))}")
                doc.append("")
                
            # Ordered Steps
            for ol in sec.find_all('ol', recursive=False):
                for idx, li in enumerate(ol.find_all('li'), 1):
                    doc.append(f"  {idx}. {clean_text(extract_inline_text(li))}")
                doc.append("")
                
            # Tables
            for tbl in sec.find_all('table', recursive=False):
                t_headers = [clean_text(th.get_text()) for th in tbl.find_all('th', scope='col')]
                t_rows = [[clean_text(extract_inline_text(c)) for c in tr.find_all(['td', 'th'])] for tr in tbl.find_all('tr')]
                doc.append(format_ascii_table(t_headers, t_rows))

    # General prose sections (For pages like Privacy, Terms, Disclosure, etc.)
    prose_blocks = main_elem.find_all('div', class_='prose')
    for prose in prose_blocks:
        if meta_info['slug'] == 'about':
            continue # already handled above
        # Process children of prose in document order
        for child in prose.children:
            if isinstance(child, Tag):
                if child.name in ['h2', 'h3']:
                    doc.append(f"\n[ {clean_text(child.get_text()).upper()} ]")
                elif child.name == 'p':
                    doc.append(f"{clean_text(extract_inline_text(child))}\n")
                elif child.name == 'ul':
                    for li in child.find_all('li'):
                        doc.append(f"  * {clean_text(extract_inline_text(li))}")
                    doc.append("")
                elif child.name == 'ol':
                    for i, li in enumerate(child.find_all('li'), 1):
                        doc.append(f"  {i}. {clean_text(extract_inline_text(li))}")
                    doc.append("")

    # Specific Section: Calculators (Tools Page)
    tool_forms = main_elem.find_all('form', class_='tool')
    if tool_forms:
        doc.append("[ INTERACTIVE FINANCIAL CALCULATORS ]")
        for form in tool_forms:
            f_h2 = form.find('h2')
            note = form.find('p', class_='tool-note')
            f_name = clean_text(f_h2.get_text()) if f_h2 else "Tool"
            doc.append(f"\n--- CALCULATOR: {f_name.upper()} ---")
            if note:
                doc.append(f"Note: {clean_text(note.get_text())}")
            doc.append("Configured Inputs & Default Values:")
            for lbl in form.find_all('label'):
                l_txt = clean_text(lbl.get_text())
                f_for = lbl.get('for', '')
                inp = form.find(id=f_for) if f_for else lbl.find(['input', 'select'])
                val = ""
                if inp:
                    if inp.name == 'select':
                        sel_opt = inp.find('option', selected=True) or inp.find('option')
                        val = clean_text(sel_opt.get_text()) if sel_opt else ""
                    else:
                        val = inp.get('value', '')
                if l_txt and val:
                    doc.append(f"  * {l_txt}: {val}")
                elif l_txt:
                    doc.append(f"  * {l_txt}")
            # Fieldsets
            for fs in form.find_all('fieldset'):
                leg = fs.find('legend')
                leg_t = clean_text(leg.get_text()) if leg else "Option"
                opts = [clean_text(lbl.get_text()) for lbl in fs.find_all('label')]
                doc.append(f"  * {leg_t}: {' / '.join(opts)}")
        doc.append("")

    # Specific Section: Contact Enquiry Form (Contact Page)
    contact_form = main_elem.find('form', id='enquiry')
    if contact_form:
        doc.append("[ ONLINE ENQUIRY FORM SPECIFICATION ]")
        f_h2 = contact_form.find('h2')
        if f_h2:
            doc.append(f"Form Title: {clean_text(f_h2.get_text())}")
        doc.append("Input Fields:")
        for lbl in contact_form.find_all('label'):
            l_txt = clean_text(lbl.get_text())
            f_for = lbl.get('for', '')
            inp = contact_form.find(id=f_for) if f_for else None
            if inp and inp.name == 'select':
                opts = [clean_text(o.get_text()) for o in inp.find_all('option')]
                doc.append(f"  * {l_txt}: Dropdown options: {', '.join(opts)}")
            elif inp and inp.name == 'textarea':
                doc.append(f"  * {l_txt}: Multi-line text message")
            else:
                doc.append(f"  * {l_txt}")
        help_p = contact_form.find('p', class_='form-help')
        if help_p:
            doc.append(f"Submission Action: {clean_text(help_p.get_text())}")
        doc.append("")

    # Specific Section: Office Locations & Addresses
    offices = main_elem.find_all(['div', 'article'], class_=re.compile(r'\b(city-card|office)\b'))
    if offices:
        doc.append("[ PHYSICAL PRACTICE OFFICES ]")
        for o in offices:
            role = o.find(class_='city-role')
            name = o.find(['h2', 'h3', 'p'], class_=re.compile(r'\b(city-name)\b')) or o.find(['h2', 'h3'])
            addr = o.find('address')
            r_t = clean_text(role.get_text()) if role else ""
            n_t = clean_text(name.get_text()) if name else ""
            hdr = f"{r_t} - {n_t}".strip(" - ")
            doc.append(f"\n--- {hdr.upper()} ---")
            if addr:
                doc.append(f"Address:\n{clean_text(extract_inline_text(addr))}")
            phones = []
            for a in o.find_all('a'):
                href = a.get('href', '')
                t = clean_text(a.get_text())
                if href.startswith('tel:'):
                    phones.append(f"Phone: {t} ({href})")
                elif 'maps' in href:
                    phones.append(f"Directions: {href}")
                elif 'Office page' in t:
                    phones.append(f"Office Page: https://thewealthbridge.in{href}")
            for ph in phones:
                doc.append(f"  * {ph}")
        doc.append("")

    # Local Office Service Areas (e.g. Vellore page)
    areas_sec = main_elem.find('ul', class_='areas')
    if areas_sec:
        doc.append("[ LOCAL AREAS & TALUKS SERVED ]")
        area_items = [clean_text(li.get_text()) for li in areas_sec.find_all('li')]
        doc.append(f"Localities: {', '.join(area_items)}\n")

    # Specific Section: Client Reviews (Homepage)
    rev_sec = main_elem.find('section', class_=re.compile(r'\b(reviews|section)\b'), attrs={'aria-labelledby': 'reviews-h'})
    if rev_sec:
        reviews_list = rev_sec.find_all('blockquote', class_='review')
        if reviews_list:
            doc.append("[ VERIFIED CLIENT REVIEWS (GOOGLE RATING 5.0) ]")
            for bq in reviews_list:
                p = bq.find('p')
                ft = bq.find('footer')
                b = ft.find('b') if ft else None
                author = clean_text(b.get_text()) if b else (clean_text(ft.get_text()) if ft else "Client")
                quote = clean_text(p.get_text()) if p else ""
                doc.append(f"  * \"{quote}\" - {author} (Google Review)")
            doc.append("")

    # Specific Section: FAQs on Page
    page_faqs = []
    for faq_container in main_elem.find_all(['section', 'div'], class_=re.compile(r'\bfaq\b')):
        for det in faq_container.find_all('details'):
            sum_elem = det.find('summary')
            q_text = clean_text(sum_elem.get_text()) if sum_elem else ""
            ans_p = det.find('p')
            a_text = clean_text(ans_p.get_text()) if ans_p else clean_text(det.get_text().replace(q_text, ''))
            if q_text and a_text:
                page_faqs.append((q_text, a_text))

    # Reconcile Page FAQs with Schema FAQs
    combined_faqs = list(page_faqs)
    seen_questions = {q.lower() for q, _ in page_faqs}
    for item in faq_schema_items:
        if item['q'].lower() not in seen_questions:
            combined_faqs.append((item['q'], item['a']))
            seen_questions.add(item['q'].lower())

    if combined_faqs:
        doc.append("[ FREQUENTLY ASKED QUESTIONS & ANSWERS ]")
        for idx, (q, a) in enumerate(combined_faqs, 1):
            doc.append(f"\nQ{idx}: {q}")
            doc.append(f"A{idx}: {a}")
        doc.append("")

    # Specific Section: Sidebar boxes (Engagement and Related Services)
    sidebars = main_elem.find_all('div', class_='side-box')
    if sidebars:
        doc.append("[ SIDEBAR & RELATED SERVICES ]")
        for box in sidebars:
            bh2 = box.find(['h2', 'h3'])
            if bh2:
                doc.append(f"\n-- {clean_text(bh2.get_text()).upper()} --")
            for p in box.find_all('p'):
                doc.append(f"{clean_text(p.get_text())}")
            for a in box.find_all('a'):
                doc.append(f"  * {clean_text(a.get_text())} ({a.get('href', '')})")
        doc.append("")

    # Specific Section: CTA Band at bottom of page
    cta_band = main_elem.find('section', class_=re.compile(r'\b(cta-band)\b'))
    if cta_band:
        cb_h2 = cta_band.find('h2')
        cb_p = cta_band.find('p')
        if cb_h2:
            doc.append("[ CALL TO ACTION & CONSULTATION ]")
            doc.append(f"Prompt: {clean_text(cb_h2.get_text())}")
        if cb_p:
            doc.append(f"Response: {clean_text(cb_p.get_text())}")
        cb_links = []
        for a in cta_band.find_all('a'):
            cb_links.append(f"{clean_text(a.get_text())}: {a.get('href', '')}")
        if cb_links:
            for l in cb_links:
                doc.append(f"  * {l}")
        doc.append("")

    # Footer Notice & Firm Disclosures
    doc.append("=" * 80)
    doc.append("FIRM INFORMATION, PRACTICE DETAILS & STATUTORY NOTICE")
    doc.append("=" * 80)
    doc.append("Firm Name:        Wealth Bridge Tax & Business Consultants")
    doc.append("Proprietor:       S. Dineshbabu (Founder & Principal Advisor, practising since 2007)")
    doc.append("GSTIN:            33ATFPD1293G1Z2")
    doc.append("Operating Hours:  Monday to Saturday, 9:30 am to 6:30 pm")
    doc.append("Head Office:      Union Bank Upstairs, No. 23, 8th East Main Road, Gandhinagar, Katpadi, Vellore 632006")
    doc.append("Chennai Office:   No. 23/1, 1st Floor, Alagiri Nagar 5th Street, 100 Feet Road, Vadapalani, Chennai 600026")
    doc.append("Direct Helpline:  +91 86677 53901 | Vellore Landline: 0416 224 1199")
    doc.append("Official Email:   infowealthbridge@gmail.com")
    doc.append("Live Page URL:    " + (canonical or f"https://thewealthbridge.in/{meta_info['slug']}/"))
    doc.append("Legal Terms:      Attest functions reserved for specified licensed professionals are not undertaken.")
    doc.append("=" * 80)
    doc.append("\n")

    return "\n".join(doc)

def build_consolidated_master_txt(all_pages_data: list) -> str:
    """Compile the master unified plain text book containing all 26 pages."""
    book = []
    
    book.append("################################################################################")
    book.append("WEALTH BRIDGE TAX & BUSINESS CONSULTANTS")
    book.append("COMPLETE MASTER KNOWLEDGE BASE & WEBSITE CONTENT REPOSITORY")
    book.append("Established in 2007 | Vellore & Chennai, Tamil Nadu")
    book.append("Official Website: https://thewealthbridge.in/")
    book.append("################################################################################\n")
    
    book.append("EXECUTIVE OVERVIEW:")
    book.append("Wealth Bridge Tax & Business Consultants is an independent professional consulting")
    book.append("firm founded in Vellore in 2007 by S. Dineshbabu. With dedicated physical offices in")
    book.append("Katpadi (Vellore) and Vadapalani (Chennai), Wealth Bridge advises businesses, salaried")
    book.append("individuals, doctors, contractors, exporters, and MSMEs across all 38 districts of")
    book.append("Tamil Nadu and nationwide.\n")
    
    book.append("CORE PRACTICE PILLARS:")
    book.append("1. RETURNS & COMPLIANCE: Income tax, GST, TDS/TCS, Accounting & Bookkeeping,")
    book.append("   Business Registration, Trusts, Societies & Cooperatives.")
    book.append("2. NOTICES, HEARINGS & APPEALS: Scrutiny, reassessment, ASMT-10, SCNs (Sec 73/74/74A),")
    book.append("   ROC compounding, and PF/ESI 7A determination hearings.")
    book.append("3. FINANCE & GROWTH: Central and Tamil Nadu government subsidies (NEEDS, UYEGP, PMEGP),")
    book.append("   Bank-ready Detailed Project Reports (DPRs), CMA data, and MSME Samadhaan.\n")
    
    book.append("TABLE OF CONTENTS - CHAPTER DIRECTORY (26 PAGES):")
    book.append("-" * 80)
    
    for idx, p in enumerate(all_pages_data, 1):
        slug = p['meta']['slug']
        cat = p['meta']['category']
        title = p['title']
        book.append(f"Chapter {idx:02d}: [{cat.upper()}] {title}")
        book.append(f"            Slug: /{slug}/ | Canonical: {p['canonical']}")
        
    book.append("-" * 80)
    book.append("\n\n")
    
    # Render all chapters
    for idx, p in enumerate(all_pages_data, 1):
        book.append("################################################################################")
        book.append(f"CHAPTER {idx:02d} OF 26: {p['title'].upper()}")
        book.append(f"CATEGORY: {p['meta']['category'].upper()} | SLUG: {p['meta']['slug']}")
        book.append("################################################################################\n")
        book.append(p['txt_content'])
        book.append("\n\n")
        
    return "\n".join(book)

def build_readme_txt(all_pages_data: list) -> str:
    """Create plain text index catalog."""
    lines = []
    lines.append("================================================================================")
    lines.append("WEALTH BRIDGE WEBSITE - PLAIN TEXT (TXT) EXTRACTION REPOSITORY")
    lines.append("================================================================================")
    lines.append("This directory contains the complete, uncompressed, full-text extraction of")
    lines.append("the Wealth Bridge website (thewealthbridge.in) in clean plain text (.txt) format.\n")
    lines.append("FILES AND STRUCTURE:")
    lines.append("  1. FULL_WEBSITE_CONTENT.txt")
    lines.append("     Consolidated master document containing the complete text of all 26 website")
    lines.append("     pages, table of contents, statutory calendar, and practice disclosures.\n")
    lines.append("  2. txt_pages/")
    lines.append("     Directory containing 26 individual modular plain text files, one per page.\n")
    lines.append("SUMMARY METRICS:")
    lines.append(f"  * Total Website Pages:       {len(all_pages_data)}")
    lines.append("  * Established:               2007 (Vellore)")
    lines.append("  * Offices:                   Katpadi (Vellore) and Vadapalani (Chennai)")
    lines.append("  * Google Rating:             5.0 (132 reviews)")
    lines.append("  * Master Due Dates Tracked:  TDS/TCS (7th), GSTR-1 (11th), PF/ESI (15th),")
    lines.append("                               GSTR-3B (20th), ITR (31st July)\n")
    lines.append("PAGE INVENTORY & FILE MAPPING:")
    lines.append("-" * 80)
    lines.append(f"{'#':<3} | {'Page Name':<38} | {'Category':<22} | {'Text File'}")
    lines.append("-" * 80)
    for idx, p in enumerate(all_pages_data, 1):
        slug = p['meta']['slug']
        cat = p['meta']['category']
        title = p['title'][:36]
        lines.append(f"{idx:<3} | {title:<38} | {cat:<22} | txt_pages/{slug}.txt")
    lines.append("-" * 80)
    return "\n".join(lines)

def main():
    print(f"Starting plain text (txt) extraction for all {len(PAGES_CONFIG)} pages...")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    TXT_PAGES_DIR.mkdir(parents=True, exist_ok=True)
    
    all_pages = []
    for cfg in PAGES_CONFIG:
        print(f"  -> Processing: {cfg['file']} ({cfg['slug']})")
        txt_content = parse_html_page_to_txt(cfg['file'], cfg)
        
        # Save individual txt file
        page_file = TXT_PAGES_DIR / f"{cfg['slug']}.txt"
        page_file.write_text(txt_content, encoding='utf-8')
        
        all_pages.append({
            'meta': cfg,
            'title': cfg['title'],
            'canonical': f"https://thewealthbridge.in/{cfg['slug']}/" if cfg['slug'] != 'home' else "https://thewealthbridge.in/",
            'txt_content': txt_content,
            'char_count': len(txt_content),
            'line_count': len(txt_content.splitlines())
        })
        
    print(f"Successfully generated 26 individual text files in {TXT_PAGES_DIR}")
    
    # Build Master Consolidated Document
    print("Compiling consolidated master plain text document: FULL_WEBSITE_CONTENT.txt...")
    master_txt = build_consolidated_master_txt(all_pages)
    
    # Save in extracted-content/
    master_out1 = OUTPUT_DIR / "FULL_WEBSITE_CONTENT.txt"
    master_out1.write_text(master_txt, encoding='utf-8')
    
    # Save in workspace root
    master_out2 = WORKSPACE_DIR / "FULL_WEBSITE_CONTENT.txt"
    master_out2.write_text(master_txt, encoding='utf-8')
    print(f"Wrote FULL_WEBSITE_CONTENT.txt ({len(master_txt):,} characters, {len(master_txt.splitlines()):,} lines)")
    
    # Build README_TXT.txt
    readme_txt = build_readme_txt(all_pages)
    (OUTPUT_DIR / "README_TXT.txt").write_text(readme_txt, encoding='utf-8')
    (WORKSPACE_DIR / "README_TXT.txt").write_text(readme_txt, encoding='utf-8')
    
    print("All plain text extraction tasks completed successfully!")

if __name__ == "__main__":
    main()
