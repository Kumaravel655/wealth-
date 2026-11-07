#!/usr/bin/env python3
"""
Test Suite: Extraction Verification & Integrity Checks
Runs deep validation on all generated Markdown files in extracted-content/
"""

import sys
import re
from pathlib import Path

WORKSPACE_DIR = Path(r"c:\Users\kumar\Downloads\wealth-")
OUTPUT_DIR = WORKSPACE_DIR / "extracted-content"
PAGES_DIR = OUTPUT_DIR / "pages"

EXPECTED_SLUGS = [
    "home", "about", "services", "income-tax-return-filing", "gst-return-filing",
    "tds-tcs-compliance", "accounting-bookkeeping", "business-registration",
    "trusts-societies-cooperatives", "notices-and-appeals", "income-tax-notices-appeals",
    "gst-notices-appeals", "companies-act-roc-compliance", "pf-esi-compliance",
    "government-subsidies", "project-report-dpr", "msme-support",
    "tax-consultant-vellore", "tax-consultant-chennai", "tools", "faq",
    "contact", "privacy-policy", "terms", "disclosure", "404"
]

def run_tests():
    failures = []
    print("Running Extraction Verification Tests...\n")

    # 1. Check directory existence
    if not OUTPUT_DIR.exists():
        failures.append("OUTPUT_DIR does not exist.")
    if not PAGES_DIR.exists():
        failures.append("PAGES_DIR does not exist.")

    # 2. Check all 26 page markdown files
    for slug in EXPECTED_SLUGS:
        p_path = PAGES_DIR / f"{slug}.md"
        if not p_path.exists():
            failures.append(f"Missing file: {p_path.name}")
            continue
        size = p_path.stat().st_size
        if size < 500:
            failures.append(f"File {slug}.md is too small ({size} bytes).")
            
        content = p_path.read_text(encoding='utf-8')
        
        # Verify YAML frontmatter
        if not content.startswith("---"):
            failures.append(f"File {slug}.md is missing YAML frontmatter header.")
        if "slug: " not in content or "title: " not in content:
            failures.append(f"File {slug}.md is missing required frontmatter fields.")
            
        # Verify no raw script or style tags
        if "<script" in content.lower():
            failures.append(f"File {slug}.md contains raw <script> tags.")
        if "<style" in content.lower():
            failures.append(f"File {slug}.md contains raw <style> tags.")

    # 3. Check FULL_WEBSITE_CONTENT.md
    full_path = OUTPUT_DIR / "FULL_WEBSITE_CONTENT.md"
    if not full_path.exists():
        failures.append("FULL_WEBSITE_CONTENT.md is missing.")
    else:
        full_text = full_path.read_text(encoding='utf-8')
        if len(full_text) < 50000:
            failures.append(f"FULL_WEBSITE_CONTENT.md is smaller than expected ({len(full_text)} chars).")
        # Check all chapters exist
        for slug in EXPECTED_SLUGS:
            if f"id=\"chapter-{slug}\"" not in full_text and f"id=\"chapter-{slug.replace('_', '-')}\"" not in full_text:
                failures.append(f"Chapter anchor for {slug} missing in FULL_WEBSITE_CONTENT.md")

    # 4. Check README.md catalog
    readme_path = OUTPUT_DIR / "README.md"
    if not readme_path.exists():
        failures.append("README.md is missing.")
    else:
        readme_text = readme_path.read_text(encoding='utf-8')
        for slug in EXPECTED_SLUGS:
            if f"pages/{slug}.md" not in readme_text:
                failures.append(f"Slug {slug} missing in README.md catalog table.")

    # 5. Check specific content assertions
    home_text = (PAGES_DIR / "home.md").read_text(encoding='utf-8')
    if "Statutory Compliance Calendar" not in home_text:
        failures.append("home.md is missing Statutory Compliance Calendar.")
    if "Notices, hearings and appeals across four laws" not in home_text:
        failures.append("home.md is missing four laws table.")
    if "S. Dineshbabu" not in home_text:
        failures.append("home.md is missing founder S. Dineshbabu reference.")

    about_text = (PAGES_DIR / "about.md").read_text(encoding='utf-8')
    if "S. Dineshbabu" not in about_text:
        failures.append("about.md missing S. Dineshbabu.")
    if "M. Jayakaran" not in about_text or "B.Com" not in about_text:
        failures.append("about.md missing team member data.")
    if "Integrity" not in about_text or "Diligence" not in about_text:
        failures.append("about.md missing core values.")

    faq_text = (PAGES_DIR / "faq.md").read_text(encoding='utf-8')
    q_count = len(re.findall(r'### Q:', faq_text))
    if q_count < 25:
        failures.append(f"faq.md has fewer than 25 questions (found {q_count}).")

    tools_text = (PAGES_DIR / "tools.md").read_text(encoding='utf-8')
    if "Income tax (new regime)" not in tools_text or "Loan EMI" not in tools_text:
        failures.append("tools.md missing calculator definitions.")

    # Report results
    if failures:
        print("FAILED: Found the following validation issues:")
        for f in failures:
            print(f"  - [FAIL] {f}")
        sys.exit(1)
    else:
        print("ALL TESTS PASSED! Verification successful:")
        print(f"  - [PASS] Exactly 26 modular markdown pages generated.")
        print(f"  - [PASS] FULL_WEBSITE_CONTENT.md exists with {len(full_text):,} characters.")
        print(f"  - [PASS] README.md catalog contains all 26 page entries.")
        print(f"  - [PASS] All YAML frontmatter fields valid.")
        print(f"  - [PASS] Zero script or style tags in markdown.")
        print(f"  - [PASS] Core tables, team rosters, calculators, and {q_count} FAQs verified.")

if __name__ == "__main__":
    run_tests()
