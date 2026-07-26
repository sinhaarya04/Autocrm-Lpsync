<div align="center">

# 🧹 LPSync

### **CRM data cleanup & investor segmentation — entirely in your browser**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Recharts](https://img.shields.io/badge/Recharts-3-FF7300?style=for-the-badge)](https://recharts.org)

**No backend. No database. No login. Your LP data never leaves the browser.**

</div>

---

## 💡 The Problem

Every investor-relations team knows this pain: the CRM has accumulated years of contact data from conferences, capital-intro events, and third-party databases. The same LP shows up as `CalPERS`, `CALPERS`, and `Cal PERS`. Phone numbers come in five formats. Contacts who left their firms two years ago still show as active. Before any outreach campaign can start, someone burns hours (or days) hand-cleaning spreadsheets.

**LPSync turns that into a one-click job.**

## ⚙️ What It Does

Upload a CSV export from any CRM (Salesforce, DealCloud, Excel) and LPSync runs everything client-side — which matters, because LP contact data is sensitive and shouldn't touch a third-party server.

### 📊 Tab 1 — Data Overview
- **Data Quality Score (0–100)** computed from completeness, email validity, duplicate rate, formatting consistency, and contact freshness
- Stat cards break down every issue: duplicates, invalid emails, stale contacts, missing fields
- The raw table highlights problem cells — 🔴 critical (invalid emails, junk rows) and 🟡 warnings (missing titles, inconsistent states)

### 🔧 Tab 2 — Cleanup Engine
Hit **Run Cleanup** and eight operations execute in sequence:

| # | Operation | What it fixes |
|---|-----------|---------------|
| 1 | Junk Removal | Test entries, empty rows, fake data |
| 2 | Name Standardization | `Harvard Mgmt Company` → `Harvard Management Company` |
| 3 | Phone Normalization | Everything → `(XXX) XXX-XXXX` |
| 4 | Email Validation | Flags malformed / missing addresses |
| 5 | State Standardization | `New York` → `NY` |
| 6 | LP Type Normalization | `fam office` / `FO` → `Family Office` |
| 7 | Duplicate Detection | **Levenshtein-distance** fuzzy matching merges near-duplicates |
| 8 | Stale Contact Flagging | No interaction in 6+ months |

Afterwards you get a before/after score comparison and a full change log of every transformation.

## 🚀 Getting Started

```bash
npm install
npm run dev      # local dev server
npm run build    # production build
```

Then drop in a CSV — or generate a realistic messy dataset with the included script:

```bash
python dataset/generate_lp_data.py
```

## 🧱 Tech Stack

- **React 19 + Vite 8** — SPA, no server round-trips
- **Tailwind CSS 4** — styling
- **PapaParse** — CSV parsing in the browser
- **Recharts** — quality-score and segmentation visuals
- **Lodash** — data wrangling

## 📚 More

See [`WALKTHROUGH.md`](WALKTHROUGH.md) for the full tab-by-tab project walkthrough and design rationale.
