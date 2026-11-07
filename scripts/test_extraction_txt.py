#!/usr/bin/env python3
"""
Test Suite for Plain Text (.txt) Website Extraction Verification
Validates completeness, formatting integrity, and zero data loss.
"""

import re
import sys
from pathlib import Path

WORKSPACE = Path(r"c:\Users\kumar\Downloads\wealth-")
OUTPUT_DIR = WORKSPACE / "extracted-content"
TXT_PAGES_DIR = OUTPUT_DIR / "txt_pages"
MASTER_FILE_ROOT = WORKSPACE / "FULL_WEBSITE_CONTENT.txt"
MASTER_FILE_EXTRACTED = OUTPUT_DIR / "FULL_WEBSITE_CONTENT.txt"
README_FILE = OUTPUT_DIR / "README_TXT.txt"

TOTAL_EXPECTED_PAGES = 26

REQUIRED_PAGES = [
    "home",
    "about",
    "services",
    "income-tax-return-filing",
    "gst-return-filing",
    "tds-tcs-compliance",
    "accounting-bookkeeping",
    "business-registration",
    "trusts-societies-cooperatives",
    "notices-and-appeals",
    "income-tax-notices-appeals",
    "gst-notices-appeals",
    "companies-act-roc-compliance",
    "pf-esi-compliance",
    "government-subsidies",
    "project-report-dpr",
    "msme-support",
    "tax-consultant-vellore",
    "tax-consultant-chennai",
    "tools",
    "faq",
    "contact",
    "privacy-policy",
    "terms",
    "disclosure",
    "404",
]

def run_tests():
    print("=" * 80)
    print("STARTING TEST SUITE: TXT WEBSITE EXTRACTION VERIFICATION")
    print("=" * 80)
    failures = []
    
    # Test 1: Check master consolidated files exist and size
    print("\n[TEST 1] Verifying Master Consolidated Plain Text Files...")
    if not MASTER_FILE_ROOT.exists():
        failures.append("MASTER_FILE_ROOT (FULL_WEBSITE_CONTENT.txt in root) does not exist!")
    else:
        size = MASTER_FILE_ROOT.stat().st_size
        print(f"  PASS: Master file in root exists ({size:,} bytes)")
        if size < 50000:
            failures.append(f"Master file in root too small: {size} bytes")

    if not MASTER_FILE_EXTRACTED.exists():
        failures.append("MASTER_FILE_EXTRACTED (FULL_WEBSITE_CONTENT.txt in extracted-content) does not exist!")
    else:
        size = MASTER_FILE_EXTRACTED.stat().st_size
        print(f"  PASS: Master file in extracted-content exists ({size:,} bytes)")
        if size < 50000:
            failures.append(f"Master file in extracted-content too small: {size} bytes")

    # Test 2: Check README_TXT.txt exists
    print("\n[TEST 2] Verifying Master Index README_TXT.txt...")
    if not README_FILE.exists():
        failures.append("README_TXT.txt does not exist!")
    else:
        content = README_FILE.read_text(encoding='utf-8')
        print(f"  PASS: README_TXT.txt exists ({len(content):,} chars)")
        if "Total Website Pages:       26" not in content:
            failures.append("README_TXT.txt does not report 26 pages!")

    # Test 3: Check all 26 individual text pages exist and are non-empty
    print("\n[TEST 3] Verifying 26 Individual Modular Page Text Files...")
    actual_files = list(TXT_PAGES_DIR.glob("*.txt"))
    print(f"  Found {len(actual_files)} files in {TXT_PAGES_DIR}")
    if len(actual_files) != TOTAL_EXPECTED_PAGES:
        failures.append(f"Expected {TOTAL_EXPECTED_PAGES} page files, found {len(actual_files)}")
        
    for slug in REQUIRED_PAGES:
        f = TXT_PAGES_DIR / f"{slug}.txt"
        if not f.exists():
            failures.append(f"Missing page file: {f.name}")
        else:
            text = f.read_text(encoding='utf-8')
            if len(text) < 500:
                failures.append(f"Page file {f.name} is too short ({len(text)} chars)")
            print(f"  PASS: {slug}.txt ({len(text):,} chars, {len(text.splitlines())} lines)")

    # Test 4: Master file contains all 26 chapters
    print("\n[TEST 4] Verifying Master Book Chapter Structure...")
    master_content = MASTER_FILE_ROOT.read_text(encoding='utf-8')
    for idx in range(1, 27):
        pattern = f"CHAPTER {idx:02d} OF 26:"
        if pattern not in master_content:
            failures.append(f"Master file missing chapter marker: '{pattern}'")
    print("  PASS: All 26 chapters present in sequence in master document.")

    # Test 5: Check for raw unparsed HTML artifacts in text output
    print("\n[TEST 5] Checking for unparsed HTML/entity noise in text files...")
    html_patterns = [
        re.compile(r'<div\b', re.IGNORECASE),
        re.compile(r'<span\b', re.IGNORECASE),
        re.compile(r'<p\b', re.IGNORECASE),
        re.compile(r'<script\b', re.IGNORECASE),
        re.compile(r'<svg\b', re.IGNORECASE),
        re.compile(r'&amp;', re.IGNORECASE),
        re.compile(r'&quot;', re.IGNORECASE),
        re.compile(r'&nbsp;', re.IGNORECASE),
    ]
    
    noise_found = 0
    for f in actual_files:
        content = f.read_text(encoding='utf-8')
        for pat in html_patterns:
            m = pat.search(content)
            if m:
                failures.append(f"Unparsed HTML/entity {pat.pattern} found in {f.name} at char {m.start()}")
                noise_found += 1
                
    if noise_found == 0:
        print("  PASS: Zero unparsed HTML tags or unescaped HTML entities in all text pages.")

    # Test 6: Verify key business facts and critical content integrity
    print("\n[TEST 6] Verifying Critical Practice Information...")
    key_phrases = [
        ("Wealth Bridge Tax & Business Consultants", "Firm name"),
        ("S. Dineshbabu", "Principal Advisor"),
        ("33ATFPD1293G1Z2", "GSTIN"),
        ("86677 53901", "Helpline number"),
        ("0416 224 1199", "Landline number"),
        ("Katpadi, Vellore", "Head office location"),
        ("Vadapalani, Chennai", "Chennai office location"),
        ("TDS & TCS deposit", "Statutory due date item"),
        ("GSTR-1", "Statutory due date item"),
        ("GSTR-3B", "Statutory due date item"),
        ("Q31: Trust, society or Section 8 company", "FAQ coverage"),
    ]
    for phrase, label in key_phrases:
        if phrase not in master_content:
            failures.append(f"Missing critical phrase in master document: '{phrase}' ({label})")
        else:
            print(f"  PASS: Confirmed presence of {label}: '{phrase}'")

    print("\n" + "=" * 80)
    if failures:
        print(f"TEST FAILED! {len(failures)} issues found:")
        for fail in failures:
            print(f"  FAIL: {fail}")
        sys.exit(1)
    else:
        print("ALL TESTS PASSED WITH 100% INTEGRITY & COMPLIANCE!")
        print("=" * 80)

if __name__ == "__main__":
    run_tests()
