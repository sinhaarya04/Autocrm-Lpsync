# LPSync — Interview Walkthrough & Project Documentation

## The Problem

In investor relations, one of the biggest operational bottlenecks is data quality. Your CRM — whether it's Salesforce, DealCloud, or even just a shared Excel file — accumulates years of contact data from different team members, conferences, capital intro events, and third-party databases. Over time, the data gets messy. You end up with the same LP entered three different ways — "CalPERS" in one row, "CALPERS" in another, "Cal PERS" somewhere else. Phone numbers in five different formats. State fields that say "New York" in one row and "NY" in the next. Contacts who left their firm two years ago but are still showing as active. And when it's time to run an outreach campaign for a new fund launch, your team wastes hours — sometimes days — manually cleaning spreadsheets before they can even start sending emails. That's the problem LPSync solves.

## What LPSync Is

LPSync is a browser-based CRM data cleanup and investor segmentation tool. There's no backend, no database, no login — you upload a CSV export from whatever CRM system the firm uses, and the tool does everything in the browser. That matters because LP contact data is sensitive — you don't want it hitting a third-party server.

## How It Works — Tab by Tab

### Tab 1: Data Overview

When you upload a file, the first thing you see is a **Data Quality Score** — a 0 to 100 number that tells you how clean your data is. It's calculated from completeness (how many fields are filled), email validity, duplicate rate, formatting consistency, and contact freshness. Below that you see stat cards breaking down the specific issues: how many duplicates, how many invalid emails, how many stale contacts, how many missing fields. And the raw data table highlights every problematic cell — red for critical issues like invalid emails or junk rows, yellow for warnings like missing titles or inconsistent state formats. So before you even run the cleanup, you can see exactly where the problems are.

### Tab 2: Cleanup Engine

This is the core of the tool. You hit "Run Cleanup" and it executes eight operations sequentially with a progress bar:

1. **Junk Removal** — removes test entries, empty rows, obviously fake data
2. **Name Standardization** — resolves firm name variants (e.g., "Harvard Mgmt Company" and "Harvard Management Co." become "Harvard Management Company") and fixes contact name capitalization
3. **Phone Normalization** — converts all phone numbers to consistent (XXX) XXX-XXXX format
4. **Email Validation** — flags malformed and missing email addresses
5. **State Standardization** — converts all state fields to two-letter abbreviations
6. **LP Type Normalization** — maps all variants to canonical types (e.g., "fam office", "FO", "FAMILY OFFICE" all become "Family Office")
7. **Duplicate Detection** — uses Levenshtein distance (string similarity algorithm) to find and merge duplicate records, catching near-matches that simple string comparison would miss
8. **Stale Contact Flagging** — flags contacts with no interaction in 6+ months

After cleanup, you see a side-by-side before/after comparison showing the score improvement, and a full change log of every transformation made.

### Tab 3: Segmentation

Once the data is clean, this tab provides three chart views: contacts broken down by LP type (endowments, pensions, family offices, consultants, insurance companies), by AUM tier, and by strategy interest (hedge fund, private equity, private credit, real estate, venture capital). There's also a geographic distribution table and clickable segment filters. This is useful for targeted campaigns — if the firm is raising a real estate fund, you can immediately see which LPs have expressed interest in real estate and how many are campaign-ready.

### Tab 4: Campaign Readiness

Every contact gets sorted into one of three buckets:

- **Ready to Email** (green) — valid email, active status, recent contact history
- **Needs Cleanup** (yellow) — fixable issues like missing fields or unknown email status
- **Remove / Re-engage** (red) — bounced emails, unsubscribed contacts, or people not contacted in over a year

It gives a campaign summary telling you exactly how many contacts are ready, across how many segments, and recommends which segment to prioritize. An Export button downloads the cleaned dataset as a CSV you can import right back into your CRM.

## Why This Matters for IR

In a fundraising cycle, speed matters. If the firm is launching a new fund and needs to reach 200 LPs in the first two weeks, you can't afford to spend the first three days cleaning data. This tool turns that into a five-minute task. It also reduces human error — when you're manually deduplicating, you miss things. The fuzzy matching catches variants that a human eye might skip. And the segmentation view means outreach is targeted from day one — you're not blasting the same email to a $50 billion pension fund and a $500 million family office.

## Technical Stack

- **React 19** — single-page application, all logic in one JSX file
- **Vite 8** — build tool and dev server
- **Tailwind CSS 4** — utility-first styling, dark mode dashboard aesthetic
- **Recharts** — bar charts for segmentation visualization
- **Papaparse** — CSV parsing and export
- **Lodash** — data grouping and aggregation utilities
- **Custom Levenshtein implementation** — inline fuzzy string matching for duplicate detection

No backend, no database, no external API calls. Everything runs client-side in the browser. LP data never leaves the user's machine.

## Future Enhancements

- **CRM Integration** — connect directly to Salesforce or DealCloud via API so cleanup runs on live data and writes back automatically
- **Email Enrichment** — plug into Clearbit or Apollo.io to auto-fill missing emails, verify deliverability, and pull in updated titles
- **Contact Activity Timeline** — pull in email open/reply data from Outlook or HubSpot for engagement-based stale contact detection
- **LP Relationship Mapping** — show which LPs have co-invested, which consultants advise which pensions, to prioritize warm intros
- **Commitment Tracking** — track which LPs you've reached, who's in due diligence, who's passed, building a pipeline funnel for capital raising
- **AI-Powered Meeting Prep** — auto-generate LP briefs pulling annual report data, recent allocation changes, and prior interactions
- **Compliance Flags** — flag contacts in jurisdictions with specific solicitation rules or LPs whose mandate doesn't match the fund strategy
- **Multi-User Collaboration** — let multiple IR team members see the same cleaned dataset, assign follow-up owners, and track relationships

## Running Locally

```bash
git clone git@github.com:sinhaarya04/Autocrm-Lpsync.git
cd Autocrm-Lpsync
npm install
npm run dev
```

Open http://localhost:5173 and upload `dataset/lpsync_messy.csv` to demo.
