# Master Plan: Full Website Content Extraction to Markdown

## Executive Summary & Objective

This document outlines the end-to-end plan to extract, transform, and preserve the complete content of the **Wealth Bridge** website (`thewealthbridge.in`) into high-fidelity, structured Markdown (`.md`).

The website is a 26-page multi-page architecture representing a specialized tax and business consulting practice established in 2007, operating across Tamil Nadu with offices in Katpadi (Vellore) and Vadapalani (Chennai). The goal is to produce:
1. **Per-Page Modular Markdown (`extracted-content/pages/*.md`)**: Dedicated markdown documentation for each page, including YAML frontmatter with SEO/Schema metadata, content hierarchy, tables, lists, and FAQs.
2. **Consolidated Full Website Master Document (`extracted-content/FULL_WEBSITE_CONTENT.md`)**: A unified, searchable, single-source knowledge base containing the complete textual content, service catalogs, statutory due dates, FAQs, calculators, office information, and legal disclosures.
3. **Automated Extraction & Verification Pipeline (`scripts/extract_to_markdown.py` and `scripts/test_extraction.py`)**: A deterministic Python parser powered by BeautifulSoup4 to guarantee zero data loss and reproducible extraction.

---

## 1. Page Inventory & Taxonomy

The website contains 26 distinct HTML documents structured into 8 functional categories:

| Category | Page Path | Canonical URL / Slug | Core Focus |
|---|---|---|---|
| **Core & Brand** | `index.html` | `/` (`home`) | Homepage, Hero, Compliance desk, Practice highlights, Reviews, Tamil Nadu map |
| | `about/index.html` | `/about/` (`about`) | Firm history (since 2007), Principal Advisor S. Dineshbabu, Philosophy, Standards |
| | `services/index.html` | `/services/` (`services`) | Master service index across all three practice pillars |
| **Returns & Compliance** | `income-tax-return-filing/index.html` | `/income-tax-return-filing/` | Individuals, firms, companies, trusts; ITR-1 to 7; process & checklists |
| | `gst-return-filing/index.html` | `/gst-return-filing/` | GSTR-1, 3B, 9, 9C, QRMP, monthly GSTR-2B purchase reconciliations |
| | `tds-tcs-compliance/index.html` | `/tds-tcs-compliance/` | Sections 194C/J/I/Q, 206C(1H), Form 24Q/26Q/27Q, TRACES defaults, Form 16/16A |
| | `accounting-bookkeeping/index.html` | `/accounting-bookkeeping/` | Tally/Zoho bookkeeping, monthly MIS, payroll processing, bank reconciliations |
| | `business-registration/index.html` | `/business-registration/` | Proprietorship, Partnership, LLP, Pvt Ltd, OPC, GST, MSME, FSSAI, IEC, Trademark |
| | `trusts-societies-cooperatives/index.html` | `/trusts-societies-cooperatives/` | Public trusts, 12A/80G, CSR-1, TN Societies Registration Act, Cooperative societies |
| **Notices, Hearings & Appeals** | `notices-and-appeals/index.html` | `/notices-and-appeals/` | Central notices hub, 4-law triage, stage-by-stage handling, time limits |
| | `income-tax-notices-appeals/index.html` | `/income-tax-notices-appeals/` | 143(1), 139(9), 148, 142(1), 144, penalty, CIT(Appeals), ITAT Tribunal support |
| | `gst-notices-appeals/index.html` | `/gst-notices-appeals/` | ASMT-10, DRC-01A, Sec 73/74/74A SCNs, audit, first appeals, GST Appellate Tribunal |
| | `companies-act-roc-compliance/index.html` | `/companies-act-roc-compliance/` | AOC-4, MGT-7, DIR-3 KYC, ROC notices, compounding, Sec 248 company revival |
| | `pf-esi-compliance/index.html` | `/pf-esi-compliance/` | EPFO/ESIC registrations, monthly challans, 7A/7B determination, inspections |
| **Finance & Growth** | `government-subsidies/index.html` | `/government-subsidies/` | NEEDS, UYEGP, PMEGP, TN Capital Subsidy, generator, payroll, credit linkage |
| | `project-report-dpr/index.html` | `/project-report-dpr/` | Bank-ready DPRs, CMA data format, term loans, working capital limits |
| | `msme-support/index.html` | `/msme-support/` | Udyam, CGTMSE credit guarantee, MSME Samadhaan delayed payment recovery |
| **Local Practice Offices** | `tax-consultant-vellore/index.html` | `/tax-consultant-vellore/` | Katpadi head office, Ranipet, Tirupattur, in-person consultation details |
| | `tax-consultant-chennai/index.html` | `/tax-consultant-chennai/` | Vadapalani office, 100 Feet Road, Chennai metro coverage, in-person meetings |
| **Tools & Reference** | `tools/index.html` | `/tools/` | Income Tax (new regime), GST (intra/inter), and Loan EMI calculators |
| | `faq/index.html` | `/faq/` | Comprehensive repository of 31+ questions and authoritative answers |
| **Inquiry & Contact** | `contact/index.html` | `/contact/` | Katpadi and Vadapalani office addresses, phones, emails, enquiry form structure |
| **Legal & Disclosures** | `privacy-policy/index.html` | `/privacy-policy/` | Client confidentiality, document security, data handling standards |
| | `terms/index.html` | `/terms/` | Terms of advisory engagement, limitation of liability, governing law |
| | `disclosure/index.html` | `/disclosure/` | Proprietorship disclosure (S. Dineshbabu), GSTIN, scope of representation |
| **Error Handling** | `404.html` | `/404.html` | Not-found fallback, emergency contact & quick navigation |

---

## 2. Extraction Architecture & Conversion Rules

### 2.1 Metadata & Frontmatter
Each extracted markdown document will include YAML frontmatter capturing:
- `title`: Web page `<title>`
- `description`: Meta description
- `canonical`: Canonical URL
- `robots`: Index/Follow directives
- `keywords` / `geo_region` / `geo_placename`: Geographic targeting
- `structured_data_types`: Extracted `@type` entities from `application/ld+json` (Organization, FAQPage, BreadcrumbList, LocalBusiness, etc.)

### 2.2 Heading & Section Hierarchy
- `# <H1>`: The primary page title (or display title from hero).
- `## <H2>`: Main section titles (e.g., "What we handle", "How it works", "Documents required", "Common questions").
- `### <H3>`: Subsections (e.g., specific notice types, individual FAQ questions, office names).
- `#### <H4>`: Minor groupings.

### 2.3 Special Content Components
1. **Breadcrumbs (`nav.crumbs`)**: Formatted as `Breadcrumbs: [Home](/) > [Services](/services/) > GST Return Filing`.
2. **Hero Copy & Lead (`p.lead`)**: Formatted as blockquotes or introductory bold lead text.
3. **Action Buttons / CTAs**: Preserved as descriptive links (e.g., `[Call: +91 86677 53901](tel:+918667753901)` and `[WhatsApp: +91 86677 53901](https://wa.me/918667753901)`).
4. **Data Tables (`table.ledger`)**: Converted into clean GitHub Flavored Markdown (GFM) tables with headers, dividers, and cell data.
5. **FAQ Accordions (`details > summary`)**: Converted into structured `### Question` with the full answer text beneath. If schema FAQ exists, both are reconciled to avoid missing any nuance.
6. **Numbered Sequences (`ol.steps`, `ol.timeline-h`)**: Converted to `1. Step name: description`.
7. **Bullet Lists (`ul.ticks`, `ul.audience`, etc.)**: Converted to clean `- Item`.
8. **Testimonials / Reviews (`blockquote.review`)**: Converted to Markdown blockquotes with client name, source, and star ratings.
9. **Compliance Calendar / Due Dates**: Extracted into a structured table showing date, frequency, and statutory requirement.
10. **Calculators & Forms**: Converted to functional documentation specifying input fields, select options, formulas, and guidance notes.
11. **Offices & Geographic Coverage**: Extracted as structured address cards with phone, email, directions link, and district service modes.

### 2.4 Noise Removal & Sanitization
- Remove scripts (`<script>`), analytics, motion gates (`wb-motion`, `wb-ready`).
- Remove inline SVG path codes while preserving meaningful labels and symbols.
- Unescape HTML entities (`&amp;` -> `&`, `&#8377;` / `₹` -> `₹`, `&quot;` -> `"`).
- Normalize multiple whitespace and linebreaks.

---

## 3. Directory & File Organization

The extracted content will be saved under `c:\Users\kumar\Downloads\wealth-\extracted-content\`:

```
c:\Users\kumar\Downloads\wealth-\
├── CONTENT_EXTRACTION_PLAN.md               # This master execution plan
├── extracted-content/
│   ├── README.md                           # Master index, catalog, summary metrics
│   ├── FULL_WEBSITE_CONTENT.md             # Consolidated single-file full website content
│   └── pages/                              # Individual 26 modular Markdown files
│       ├── home.md
│       ├── about.md
│       ├── services.md
│       ├── income-tax-return-filing.md
│       ├── income-tax-notices-appeals.md
│       ├── gst-return-filing.md
│       ├── gst-notices-appeals.md
│       ├── tds-tcs-compliance.md
│       ├── accounting-bookkeeping.md
│       ├── business-registration.md
│       ├── companies-act-roc-compliance.md
│       ├── pf-esi-compliance.md
│       ├── msme-support.md
│       ├── government-subsidies.md
│       ├── project-report-dpr.md
│       ├── trusts-societies-cooperatives.md
│       ├── notices-and-appeals.md
│       ├── tax-consultant-chennai.md
│       ├── tax-consultant-vellore.md
│       ├── tools.md
│       ├── faq.md
│       ├── contact.md
│       ├── privacy-policy.md
│       ├── terms.md
│       ├── disclosure.md
│       └── 404.md
└── scripts/
    ├── extract_to_markdown.py              # Automated extraction engine
    └── test_extraction.py                  # Automated verification test suite
```

---

## 4. Implementation Steps

1. **Phase 1: Tooling & Script Construction**
   - Write `scripts/extract_to_markdown.py` with custom parsing handlers for heroes, sections, tables, FAQs, lists, forms, calculators, reviews, and schema.org JSON-LD.
2. **Phase 2: Execution**
   - Run the script across all 26 HTML files.
   - Generate individual markdown files in `extracted-content/pages/`.
   - Compile the unified `extracted-content/FULL_WEBSITE_CONTENT.md`.
   - Generate `extracted-content/README.md`.
3. **Phase 3: Automated Verification & Testing**
   - Write and execute `scripts/test_extraction.py`.
   - Validate:
     * Exactly 26 markdown pages exist.
     * `FULL_WEBSITE_CONTENT.md` exists and contains all 26 page sections.
     * No raw `<script>` or unparsed HTML tags remain in body markdown.
     * All tables and FAQ items are populated.
     * File size and non-empty guarantees (> 500 bytes per page, > 40 KB for master document).
4. **Phase 4: Final Reporting**
   - Deliver complete report with verification records.
