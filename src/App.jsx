import { useState, useMemo, useCallback, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Papa from 'papaparse';
import _ from 'lodash';

// ============================================================
// CONSTANTS
// ============================================================
const TODAY = new Date('2026-04-19');
const TABS = ['Data Overview', 'Cleanup Engine', 'Segmentation', 'Campaign Readiness'];
const VALID_LP_TYPES = ['Endowment', 'Foundation', 'Public Pension', 'Private Pension', 'Family Office', 'RIA', 'Consultant', 'Insurance Company', 'Sovereign Wealth Fund'];

const LP_TYPE_MAP = {
  'endowment':'Endowment','endwmnt':'Endowment','foundation':'Foundation','fndn':'Foundation','fdn':'Foundation',
  'public pension':'Public Pension','pub. pension':'Public Pension','pub pension':'Public Pension','pension':'Public Pension','public pension':'Public Pension',
  'private pension':'Private Pension','family office':'Family Office','fo':'Family Office','fam office':'Family Office','fam. office':'Family Office',
  'ria':'RIA','consultant':'Consultant','consulting':'Consultant',
  'insurance company':'Insurance Company','insurance co.':'Insurance Company','insurance':'Insurance Company','ins. company':'Insurance Company','ins co':'Insurance Company',
  'sovereign wealth fund':'Sovereign Wealth Fund','swf':'Sovereign Wealth Fund',
};

const STATE_TO_ABBR = {
  'alabama':'AL','alaska':'AK','arizona':'AZ','arkansas':'AR','california':'CA','colorado':'CO','connecticut':'CT',
  'delaware':'DE','florida':'FL','georgia':'GA','hawaii':'HI','idaho':'ID','illinois':'IL','indiana':'IN','iowa':'IA',
  'kansas':'KS','kentucky':'KY','louisiana':'LA','maine':'ME','maryland':'MD','massachusetts':'MA','michigan':'MI',
  'minnesota':'MN','mississippi':'MS','missouri':'MO','montana':'MT','nebraska':'NE','nevada':'NV','new hampshire':'NH',
  'new jersey':'NJ','new mexico':'NM','new york':'NY','north carolina':'NC','north dakota':'ND','ohio':'OH','oklahoma':'OK',
  'oregon':'OR','pennsylvania':'PA','rhode island':'RI','south carolina':'SC','south dakota':'SD','tennessee':'TN',
  'texas':'TX','utah':'UT','vermont':'VT','virginia':'VA','washington':'WA','west virginia':'WV','wisconsin':'WI',
  'wyoming':'WY','district of columbia':'DC',
};
const VALID_STATE_CODES = new Set(Object.values(STATE_TO_ABBR));

const FIRM_ALIASES = {
  'harvard mgmt company':'Harvard Management Company','harvard management co.':'Harvard Management Company','harvard management company':'Harvard Management Company',
  'calpers':'CalPERS','cal pers':'CalPERS','calstrs':'CalSTRS','cal strs':'CalSTRS',
  'tiger global mgmt':'Tiger Global Management','tiger global management':'Tiger Global Management',
  'elliott mgmt':'Elliott Management','elliot management':'Elliott Management','elliott management':'Elliott Management',
  'ford fdn':'Ford Foundation','ford foundation':'Ford Foundation',
  'cambridge assoc.':'Cambridge Associates','cambridge associates':'Cambridge Associates',
  'metlife investment mgmt':'MetLife Investment Management','metlife investment management':'MetLife Investment Management',
  'soros fund mgmt':'Soros Fund Management','soros fund management':'Soros Fund Management',
  'prudential fin.':'Prudential Financial','prudential financial':'Prudential Financial',
  'nepc':'NEPC','icahn enterprises':'Icahn Enterprises',
  'yale investments office':'Yale Investments Office','stanford management company':'Stanford Management Company',
  'princeton university investment company':'Princeton University Investment Company',
  'mit investment management company':'MIT Investment Management Company',
  'duke management company':'Duke Management Company',
  'university of texas investment management company':'University of Texas Investment Management Company',
  'emory investment management':'Emory Investment Management','university of michigan endowment':'University of Michigan Endowment',
  'columbia investment management company':'Columbia Investment Management Company',
  'university of pennsylvania endowment':'University of Pennsylvania Endowment',
  'northwestern university investment office':'Northwestern University Investment Office',
  'vanderbilt university endowment':'Vanderbilt University Endowment',
  'university of notre dame investment office':'University of Notre Dame Investment Office',
  'university of virginia investment management company':'University of Virginia Investment Management Company',
  'rockefeller foundation':'Rockefeller Foundation','bill & melinda gates foundation':'Bill & Melinda Gates Foundation',
  'andrew w. mellon foundation':'Andrew W. Mellon Foundation','howard hughes medical institute':'Howard Hughes Medical Institute',
  'bloomberg philanthropies':'Bloomberg Philanthropies','macarthur foundation':'MacArthur Foundation',
  'hewlett foundation':'Hewlett Foundation','kresge foundation':'Kresge Foundation','simons foundation':'Simons Foundation',
  'new york state common retirement fund':'New York State Common Retirement Fund',
  'teacher retirement system of texas':'Teacher Retirement System of Texas',
  'florida state board of administration':'Florida State Board of Administration',
  'state of wisconsin investment board':'State of Wisconsin Investment Board',
  'ohio public employees retirement system':'Ohio Public Employees Retirement System',
  'pennsylvania public school employees retirement system':'Pennsylvania Public School Employees Retirement System',
  'new york city retirement systems':'New York City Retirement Systems',
  'state of new jersey division of investment':'State of New Jersey Division of Investment',
  'virginia retirement system':'Virginia Retirement System','oregon investment council':'Oregon Investment Council',
  'washington state investment board':'Washington State Investment Board',
  'illinois municipal retirement fund':'Illinois Municipal Retirement Fund',
  'north carolina retirement systems':'North Carolina Retirement Systems',
  'emerson collective':'Emerson Collective','bezos expeditions':'Bezos Expeditions',
  'cascade investment':'Cascade Investment','msd partners':'MSD Partners','vulcan capital':'Vulcan Capital',
  'druckenmiller family office':'Druckenmiller Family Office','appaloosa management':'Appaloosa Management',
  'lone pine capital':'Lone Pine Capital','viking global investors':'Viking Global Investors',
  'pershing square capital':'Pershing Square Capital','third point llc':'Third Point LLC',
  'mercer investments':'Mercer Investments','aon hewitt investment consulting':'Aon Hewitt Investment Consulting',
  'meketa investment group':'Meketa Investment Group','callan associates':'Callan Associates',
  'wilshire advisors':'Wilshire Advisors','fund evaluation group':'Fund Evaluation Group',
  'verus investments':'Verus Investments','rvk inc':'RVK Inc',
  'massmutual':'MassMutual','tiaa':'TIAA','new york life investments':'New York Life Investments',
  'lincoln financial group':'Lincoln Financial Group','aflac global investments':'Aflac Global Investments',
  'hartford investment management':'Hartford Investment Management','allstate investments':'Allstate Investments',
  'principal global investors':'Principal Global Investors',
};

const LP_COLORS = {
  'Endowment':'#10b981','Foundation':'#ec4899','Public Pension':'#8b5cf6','Private Pension':'#a78bfa',
  'Family Office':'#06b6d4','RIA':'#3b82f6','Consultant':'#6366f1','Insurance Company':'#f59e0b','Sovereign Wealth Fund':'#14b8a6',
};

const JUNK_NAMES = ['test','asdf','delete me','remove','do not use'];

// (Dataset removed — app starts blank, user uploads CSV)
// ============================================================
// UTILITY FUNCTIONS
// ============================================================
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => { const r = new Array(n + 1); r[0] = i; return r; });
  for (let j = 1; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

function isValidEmail(email) {
  if (!email || !email.trim()) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isJunkRow(row) {
  const name = (row.firm_name || '').toLowerCase().trim();
  return JUNK_NAMES.includes(name) || (!row.firm_name?.trim() && !row.contact_name?.trim());
}

function toTitleCase(str) {
  if (!str) return str;
  return str.trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function calculateQualityScore(data) {
  if (!data.length) return 100;
  const n = data.length;
  const fields = ['firm_name','lp_type','contact_name','title','email','phone','city','state','aum_millions','strategy_interest','last_contact_date','email_status'];
  let filled = 0;
  data.forEach(r => fields.forEach(f => { if (r[f]?.toString().trim()) filled++; }));
  const completeness = (filled / (n * fields.length)) * 15;
  let validEmails = 0;
  data.forEach(r => { if (isValidEmail(r.email)) validEmails++; });
  const emailScore = (validEmails / n) * 15;
  const junk = data.filter(r => isJunkRow(r)).length;
  const seen = new Set(); let dupes = 0;
  data.forEach(r => {
    const key = (r.firm_name||'').toLowerCase().trim() + '|' + (r.contact_name||'').toLowerCase().trim();
    if (key === '|') return;
    if (seen.has(key)) dupes++; else seen.add(key);
  });
  const cleanliness = (1 - (junk + dupes) / n) * 20;
  const phoneRe = /^\(\d{3}\) \d{3}-\d{4}$/;
  let goodPhones = 0;
  data.forEach(r => { if (phoneRe.test(r.phone)) goodPhones++; });
  const phoneScore = (goodPhones / n) * 10;
  let goodStates = 0;
  data.forEach(r => { const s = r.state?.trim(); if (s && s.length === 2 && VALID_STATE_CODES.has(s.toUpperCase())) goodStates++; });
  const stateScore = (goodStates / n) * 10;
  let goodLp = 0;
  data.forEach(r => { if (VALID_LP_TYPES.includes(r.lp_type?.trim())) goodLp++; });
  const lpScore = (goodLp / n) * 10;
  let fresh = 0;
  data.forEach(r => { if (r.last_contact_date?.trim()) { const d = new Date(r.last_contact_date); if (!isNaN(d) && (TODAY - d) / 86400000 <= 180) fresh++; }});
  const freshScore = (fresh / n) * 10;
  let goodNames = 0;
  data.forEach(r => { const nm = r.contact_name?.trim(); if (nm && nm !== nm.toUpperCase() && nm !== nm.toLowerCase()) goodNames++; });
  const nameScore = (goodNames / n) * 10;
  return Math.min(100, Math.max(0, Math.round(completeness + emailScore + cleanliness + phoneScore + stateScore + lpScore + freshScore + nameScore)));
}

function computeStats(data) {
  const totalRows = data.length;
  const uniqueFirms = new Set(data.map(r => (r.firm_name||'').toLowerCase().trim()).filter(Boolean)).size;
  const seen = new Set(); let duplicates = 0;
  data.forEach(r => { const key = `${(r.firm_name||'').toLowerCase().trim()}|${(r.contact_name||'').toLowerCase().trim()}`; if (key === '|') return; if (seen.has(key)) duplicates++; else seen.add(key); });
  const fields = ['firm_name','contact_name','email','phone','title','city','state','aum_millions','lp_type','strategy_interest','last_contact_date','email_status'];
  let missingFields = 0;
  data.forEach(r => fields.forEach(f => { if (!r[f]?.toString().trim()) missingFields++; }));
  let invalidEmails = 0;
  data.forEach(r => { const e = r.email?.trim(); if (e && !isValidEmail(e)) invalidEmails++; });
  let staleContacts = 0;
  data.forEach(r => { if (r.last_contact_date?.trim()) { const d = new Date(r.last_contact_date); if (!isNaN(d) && (TODAY - d) / 86400000 > 180) staleContacts++; }});
  const junkRows = data.filter(r => isJunkRow(r)).length;
  return { totalRows, uniqueFirms, duplicates, missingFields, invalidEmails, staleContacts, junkRows };
}

function detectProblems(row) {
  const p = {};
  if (!row.firm_name?.trim()) p.firm_name = 'critical';
  if (!row.contact_name?.trim()) p.contact_name = 'critical';
  if (!row.email?.trim()) p.email = 'critical';
  else if (!isValidEmail(row.email)) p.email = 'critical';
  if (!row.title?.trim()) p.title = 'warning';
  if (!row.phone?.trim()) p.phone = 'warning';
  if (!row.city?.trim()) p.city = 'warning';
  if (!row.state?.trim()) p.state = 'warning';
  else { const s = row.state.trim(); if (!(s.length === 2 && VALID_STATE_CODES.has(s.toUpperCase()))) p.state = 'warning'; }
  if (!row.aum_millions?.toString().trim()) p.aum_millions = 'warning';
  if (!row.lp_type?.trim()) p.lp_type = 'warning';
  else if (!VALID_LP_TYPES.includes(row.lp_type.trim())) p.lp_type = 'warning';
  if (!row.strategy_interest?.trim()) p.strategy_interest = 'warning';
  if (!row.last_contact_date?.trim()) p.last_contact_date = 'warning';
  if (!row.email_status?.trim()) p.email_status = 'warning';
  if (isJunkRow(row)) Object.keys(row).forEach(k => p[k] = 'critical');
  return p;
}

function computeSegmentation(data) {
  const lpGroups = _.countBy(data, 'lp_type');
  const lpTypeCounts = Object.entries(lpGroups).filter(([n]) => n).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const tiers = [{name:'Under $1B',min:0,max:1000},{name:'$1B–$10B',min:1000,max:10000},{name:'$10B–$50B',min:10000,max:50000},{name:'$50B–$100B',min:50000,max:100000},{name:'$100B–$500B',min:100000,max:500000},{name:'$500B+',min:500000,max:Infinity}];
  const aumTiers = tiers.map(t => ({ name: t.name, value: data.filter(r => { const a = Number(r.aum_millions)||0; return a >= t.min && a < t.max; }).length })).filter(t => t.value > 0);
  const stratMap = {};
  data.forEach(r => { if (r.strategy_interest) r.strategy_interest.split('; ').forEach(s => { const t = s.trim(); if (t) stratMap[t] = (stratMap[t]||0)+1; }); });
  const strategyCounts = Object.entries(stratMap).map(([name,value]) => ({name,value})).sort((a,b) => b.value - a.value);
  const geoGroups = _.groupBy(data, 'state');
  const geoDist = Object.entries(geoGroups).filter(([s]) => s).map(([state, rows]) => ({ state, count: rows.length, avgAum: Math.round(_.meanBy(rows, r => Number(r.aum_millions)||0)) })).sort((a,b) => b.count - a.count);
  return { lpTypeCounts, aumTiers, strategyCounts, geoDist };
}

function computeCampaignBuckets(data) {
  const ready = [], cleanup = [], remove = [];
  data.forEach(r => {
    const valid = isValidEmail(r.email);
    const status = (r.email_status||'').trim();
    const days = r.last_contact_date?.trim() ? Math.round((TODAY - new Date(r.last_contact_date))/86400000) : Infinity;
    const hasCore = r.firm_name?.trim() && r.contact_name?.trim();
    if (!valid || status === 'Bounced' || status === 'Unsubscribed' || days > 365) remove.push(r);
    else if (valid && status === 'Active' && days <= 180 && hasCore) ready.push(r);
    else cleanup.push(r);
  });
  return { ready, cleanup, remove };
}

// ============================================================
// CLEANUP PIPELINE
// ============================================================
function removeJunkRows(data) {
  const changes = [];
  const cleaned = data.filter(r => {
    if (isJunkRow(r)) { changes.push({ type:'junk', message:`Removed: "${r.firm_name||'(empty row)'}" — ${r.contact_name||'no contact'}` }); return false; }
    return true;
  });
  return { data: cleaned, changes };
}

function standardizeNames(data) {
  const changes = [];
  let contactCount = 0;
  const cleaned = data.map(r => {
    const row = { ...r };
    const key = r.firm_name.toLowerCase().trim();
    if (FIRM_ALIASES[key] && FIRM_ALIASES[key] !== r.firm_name) {
      changes.push({ type:'name', message:`Firm: "${r.firm_name}" → "${FIRM_ALIASES[key]}"` });
      row.firm_name = FIRM_ALIASES[key];
    }
    if (r.contact_name?.trim()) {
      const tc = toTitleCase(r.contact_name);
      if (tc !== r.contact_name) { contactCount++; row.contact_name = tc; }
    }
    return row;
  });
  if (contactCount > 0) changes.push({ type:'name', message:`Standardized capitalization for ${contactCount} contact names` });
  return { data: cleaned, changes };
}

function normalizePhones(data) {
  const changes = []; let count = 0;
  const cleaned = data.map(r => {
    const row = { ...r };
    if (r.phone?.trim()) {
      const digits = r.phone.replace(/\D/g, '');
      const actual = digits.startsWith('1') && digits.length === 11 ? digits.slice(1) : digits;
      if (actual.length === 10) {
        const fmt = `(${actual.slice(0,3)}) ${actual.slice(3,6)}-${actual.slice(6)}`;
        if (fmt !== r.phone) { count++; row.phone = fmt; }
      }
    }
    return row;
  });
  if (count > 0) changes.push({ type:'phone', message:`Normalized ${count} phone numbers to (XXX) XXX-XXXX format` });
  return { data: cleaned, changes };
}

function validateEmails(data) {
  const changes = []; let missingCount = 0;
  const cleaned = data.map(r => {
    const row = { ...r };
    if (r.email?.trim() && !isValidEmail(r.email)) changes.push({ type:'email', message:`Invalid: "${r.email}" (${r.contact_name})` });
    if (!r.email?.trim()) missingCount++;
    return row;
  });
  if (missingCount > 0) changes.push({ type:'email', message:`${missingCount} contacts missing email addresses` });
  return { data: cleaned, changes };
}

function standardizeStates(data) {
  const changes = []; let count = 0; const examples = [];
  const cleaned = data.map(r => {
    const row = { ...r };
    if (r.state?.trim()) {
      const s = r.state.trim();
      if (s.length === 2 && VALID_STATE_CODES.has(s.toUpperCase())) {
        if (s !== s.toUpperCase()) { count++; if (examples.length < 3) examples.push(`"${s}" → "${s.toUpperCase()}"`); row.state = s.toUpperCase(); }
      } else {
        const abbr = STATE_TO_ABBR[s.toLowerCase()];
        if (abbr) { count++; if (examples.length < 3) examples.push(`"${s}" → "${abbr}"`); row.state = abbr; }
      }
    }
    return row;
  });
  if (count > 0) changes.push({ type:'state', message:`Standardized ${count} state entries (${examples.join(', ')})` });
  return { data: cleaned, changes };
}

function normalizeLpTypes(data) {
  const changes = []; let count = 0; const examples = [];
  const cleaned = data.map(r => {
    const row = { ...r };
    if (r.lp_type?.trim()) {
      const key = r.lp_type.toLowerCase().trim();
      const canonical = LP_TYPE_MAP[key];
      if (canonical && canonical !== r.lp_type) { count++; if (examples.length < 3) examples.push(`"${r.lp_type}" → "${canonical}"`); row.lp_type = canonical; }
    }
    return row;
  });
  if (count > 0) changes.push({ type:'lp_type', message:`Normalized ${count} LP type entries (${examples.join(', ')})` });
  return { data: cleaned, changes };
}

function detectDuplicates(data) {
  const changes = [];
  const groups = {};
  data.forEach((r, i) => {
    const key = `${(r.firm_name||'').toLowerCase()}|${(r.contact_name||'').toLowerCase()}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push({ ...r, _idx: i });
  });
  const kept = [];
  Object.values(groups).forEach(rows => {
    if (rows.length > 1) {
      rows.sort((a, b) => { const c = r => Object.entries(r).filter(([k,v]) => !k.startsWith('_') && v?.toString().trim()).length; return c(b) - c(a); });
      kept.push(rows[0]);
      for (let i = 1; i < rows.length; i++) changes.push({ type:'duplicate', message:`Removed duplicate: "${rows[i].contact_name}" at "${rows[i].firm_name}"` });
    } else kept.push(rows[0]);
  });
  const firmNames = [...new Set(kept.map(r => r.firm_name))];
  for (let i = 0; i < firmNames.length; i++) {
    for (let j = i + 1; j < firmNames.length; j++) {
      const a = firmNames[i].toLowerCase(), b = firmNames[j].toLowerCase();
      if (a === b) continue;
      const sim = 1 - levenshtein(a, b) / Math.max(a.length, b.length);
      if (sim >= 0.8) changes.push({ type:'duplicate', message:`Potential match: "${firmNames[i]}" ↔ "${firmNames[j]}" (${Math.round(sim*100)}%)` });
    }
  }
  return { data: kept.map(({ _idx, ...rest }) => rest), changes };
}

function flagStaleContacts(data) {
  const changes = []; let stale = 0, veryStale = 0, noDate = 0;
  data.forEach(r => {
    if (r.last_contact_date?.trim()) {
      const days = Math.round((TODAY - new Date(r.last_contact_date)) / 86400000);
      if (days > 365) veryStale++; else if (days > 180) stale++;
    } else noDate++;
  });
  if (veryStale > 0) changes.push({ type:'stale', message:`${veryStale} contacts not reached in over 1 year` });
  if (stale > 0) changes.push({ type:'stale', message:`${stale} contacts not reached in 6–12 months` });
  if (noDate > 0) changes.push({ type:'stale', message:`${noDate} contacts have no recorded contact date` });
  return { data, changes };
}

// ============================================================
// SUB-COMPONENTS
// ============================================================
function QualityGauge({ score }) {
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  const label = score >= 80 ? 'Good' : score >= 60 ? 'Fair' : 'Poor';
  return (
    <div className="flex flex-col items-center gap-2 p-6 bg-slate-800/50 rounded-xl border border-slate-700/50 min-w-[160px]">
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#334155" strokeWidth="8" />
          <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${score * 2.639} ${263.9 - score * 2.639}`} strokeLinecap="round"
            className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color }}>{score}</span>
        </div>
      </div>
      <div className="text-sm font-medium" style={{ color }}>{label}</div>
      <div className="text-xs text-slate-500">Data Quality Score</div>
    </div>
  );
}

function StatCard({ label, value, color = 'slate', subtitle }) {
  const styles = {
    slate: 'border-l-slate-600 bg-slate-500/10 text-slate-300',
    red: 'border-l-red-500 bg-red-500/10 text-red-400',
    amber: 'border-l-amber-500 bg-amber-500/10 text-amber-400',
    green: 'border-l-emerald-500 bg-emerald-500/10 text-emerald-400',
    cyan: 'border-l-cyan-500 bg-cyan-500/10 text-cyan-400',
  };
  return (
    <div className={`border-l-2 rounded-lg p-4 ${styles[color]}`}>
      <div className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</div>
      <div className="text-xs text-slate-400 mt-1">{label}</div>
      {subtitle && <div className="text-[10px] text-slate-500 mt-0.5">{subtitle}</div>}
    </div>
  );
}

function KanbanColumn({ title, items, color, total, expanded, onToggle }) {
  const c = { emerald: { bg:'bg-emerald-500/10', border:'border-emerald-500/30', text:'text-emerald-400', badge:'bg-emerald-500/20' },
    amber: { bg:'bg-amber-500/10', border:'border-amber-500/30', text:'text-amber-400', badge:'bg-amber-500/20' },
    red: { bg:'bg-red-500/10', border:'border-red-500/30', text:'text-red-400', badge:'bg-red-500/20' } }[color];
  const pct = total ? Math.round(items.length / total * 100) : 0;
  return (
    <div className={`${c.bg} rounded-xl border ${c.border} overflow-hidden`}>
      <button onClick={onToggle} className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-2">
          <h3 className={`text-sm font-medium ${c.text}`}>{title}</h3>
          <span className={`${c.badge} ${c.text} text-xs px-2 py-0.5 rounded-full font-medium`}>{items.length}</span>
        </div>
        <span className="text-xs text-slate-500">{pct}% {expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="px-4 pb-3 max-h-[350px] overflow-auto space-y-1.5">
          {items.map((r, i) => (
            <div key={i} className="bg-slate-900/50 rounded-lg px-3 py-2 text-xs">
              <div className="text-slate-300 font-medium truncate">{r.contact_name}</div>
              <div className="text-slate-500 truncate">{r.firm_name}</div>
              <div className="text-slate-600 truncate">{r.email || 'No email'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const LOG_COLORS = {
  junk:'bg-red-500/20 text-red-400', duplicate:'bg-purple-500/20 text-purple-400',
  name:'bg-blue-500/20 text-blue-400', phone:'bg-teal-500/20 text-teal-400',
  email:'bg-rose-500/20 text-rose-400', state:'bg-amber-500/20 text-amber-400',
  lp_type:'bg-indigo-500/20 text-indigo-400', stale:'bg-orange-500/20 text-orange-400',
  duplicate_suggestion:'bg-violet-500/20 text-violet-400',
};

const TABLE_COLS = [
  {key:'firm_name',label:'Firm Name',w:'min-w-[200px]'},{key:'lp_type',label:'LP Type',w:'min-w-[120px]'},
  {key:'contact_name',label:'Contact',w:'min-w-[150px]'},{key:'title',label:'Title',w:'min-w-[170px]'},
  {key:'email',label:'Email',w:'min-w-[200px]'},{key:'phone',label:'Phone',w:'min-w-[130px]'},
  {key:'city',label:'City',w:'min-w-[110px]'},{key:'state',label:'State',w:'min-w-[60px]'},
  {key:'aum_millions',label:'AUM ($M)',w:'min-w-[90px]'},{key:'strategy_interest',label:'Strategy',w:'min-w-[180px]'},
  {key:'last_contact_date',label:'Last Contact',w:'min-w-[100px]'},{key:'email_status',label:'Status',w:'min-w-[90px]'},
];

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [rawData, setRawData] = useState(null);
  const [cleanedData, setCleanedData] = useState(null);
  const [changeLog, setChangeLog] = useState([]);
  const [cleanupProgress, setCleanupProgress] = useState(null);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [expandedBuckets, setExpandedBuckets] = useState({ ready: false, cleanup: false, remove: false });
  const fileInputRef = useRef(null);

  const rawScore = useMemo(() => rawData ? calculateQualityScore(rawData) : 0, [rawData]);
  const cleanScore = useMemo(() => cleanedData ? calculateQualityScore(cleanedData) : null, [cleanedData]);
  const rawStats = useMemo(() => rawData ? computeStats(rawData) : null, [rawData]);
  const cleanStats = useMemo(() => cleanedData ? computeStats(cleanedData) : null, [cleanedData]);
  const problems = useMemo(() => rawData ? rawData.map(r => detectProblems(r)) : [], [rawData]);
  const segData = useMemo(() => (cleanedData || rawData) ? computeSegmentation(cleanedData || rawData) : null, [cleanedData, rawData]);
  const buckets = useMemo(() => cleanedData ? computeCampaignBuckets(cleanedData) : null, [cleanedData]);

  const handleUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, { header: true, skipEmptyLines: false, complete: (res) => { setRawData(res.data); setCleanedData(null); setChangeLog([]); setActiveTab(0); setCleanupProgress(null); } });
    e.target.value = '';
  }, []);

  const exportCSV = useCallback(() => {
    if (!cleanedData) return;
    const cols = TABLE_COLS.map(c => c.key);
    const csv = Papa.unparse(cleanedData, { columns: cols });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'lpsync_cleaned.csv'; a.click();
    URL.revokeObjectURL(url);
  }, [cleanedData]);

  const runCleanup = useCallback(() => {
    if (!rawData) return;
    setIsCleaningUp(true);
    setCleanupProgress({ step: 0, total: 8, label: 'Initializing...' });
    const steps = [
      { label: 'Removing junk entries...', fn: removeJunkRows },
      { label: 'Standardizing names...', fn: standardizeNames },
      { label: 'Normalizing phone numbers...', fn: normalizePhones },
      { label: 'Validating emails...', fn: validateEmails },
      { label: 'Standardizing states...', fn: standardizeStates },
      { label: 'Normalizing LP types...', fn: normalizeLpTypes },
      { label: 'Detecting duplicates...', fn: detectDuplicates },
      { label: 'Analyzing contact freshness...', fn: flagStaleContacts },
    ];
    let currentData = rawData.map(r => ({ ...r }));
    let allChanges = [];
    function exec(i) {
      if (i >= steps.length) {
        setCleanedData(currentData);
        setChangeLog(allChanges);
        setCleanupProgress({ step: 8, total: 8, label: 'Complete!' });
        setTimeout(() => setIsCleaningUp(false), 600);
        return;
      }
      setCleanupProgress({ step: i + 1, total: 8, label: steps[i].label });
      setTimeout(() => {
        const res = steps[i].fn(currentData);
        currentData = res.data;
        allChanges = [...allChanges, ...res.changes];
        exec(i + 1);
      }, 350);
    }
    setTimeout(() => exec(0), 200);
  }, [rawData]);

  const toggleBucket = useCallback((key) => setExpandedBuckets(prev => ({ ...prev, [key]: !prev[key] })), []);

  // ── RENDER ──
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50">
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">LP<span className="text-cyan-400">Sync</span></h1>
            <p className="text-[11px] text-slate-500 -mt-0.5">CRM Intelligence for Capital Raising</p>
          </div>
          {rawData && (
            <nav className="flex gap-1">
              {TABS.map((tab, i) => (
                <button key={i} onClick={() => setActiveTab(i)}
                  className={`px-4 py-2 text-sm rounded-lg transition-all ${activeTab === i ? 'text-cyan-400 bg-cyan-400/10 font-medium' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}>
                  {tab}
                </button>
              ))}
            </nav>
          )}
        </div>
      </header>

      <input ref={fileInputRef} type="file" accept=".csv" onChange={handleUpload} className="hidden" />
      <main className="max-w-[1400px] mx-auto px-6 py-6">
        {/* ── UPLOAD LANDING SCREEN ── */}
        {!rawData && (
          <div className="animate-[fadeIn_0.4s_ease-out] flex flex-col items-center justify-center py-24">
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-12 max-w-lg w-full text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Upload Your CRM Data</h2>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Upload a CSV file with your LP contact data. LPSync will analyze data quality,
                clean up inconsistencies, detect duplicates, and segment your contacts for campaign readiness.
              </p>
              <button onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 rounded-lg font-medium text-sm transition-all shadow-lg shadow-cyan-500/25">
                Choose CSV File
              </button>
              <p className="text-slate-600 text-xs mt-4">
                Expected columns: firm_name, lp_type, contact_name, title, email, phone, city, state, aum_millions, strategy_interest, last_contact_date, email_status
              </p>
            </div>
          </div>
        )}

        {/* ── TAB 0: DATA OVERVIEW ── */}
        {rawData && activeTab === 0 && (
          <div className="animate-[fadeIn_0.3s_ease-out] space-y-6">
            <div className="flex gap-6">
              <QualityGauge score={rawScore} />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-200">Data Summary</h2>
                  <div className="flex gap-2">
                    <button onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors">
                      Upload CSV
                    </button>
                    {cleanedData && (
                      <button onClick={() => setActiveTab(1)} className="px-4 py-2 text-sm bg-emerald-500/20 text-emerald-400 rounded-lg">
                        View Cleanup Results
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <StatCard label="Total Contacts" value={rawStats.totalRows} color="cyan" />
                  <StatCard label="Unique Firms" value={rawStats.uniqueFirms} color="slate" />
                  <StatCard label="Duplicates Found" value={rawStats.duplicates} color={rawStats.duplicates > 0 ? 'red' : 'green'} />
                  <StatCard label="Missing Fields" value={rawStats.missingFields} color={rawStats.missingFields > 10 ? 'amber' : 'green'} />
                  <StatCard label="Invalid Emails" value={rawStats.invalidEmails} color={rawStats.invalidEmails > 0 ? 'red' : 'green'} />
                  <StatCard label="Stale Contacts" value={rawStats.staleContacts} color={rawStats.staleContacts > 0 ? 'amber' : 'green'} subtitle="> 180 days" />
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-200 mb-3">Raw Data <span className="text-sm font-normal text-slate-500">({rawData.length} rows)</span></h2>
              <div className="overflow-auto max-h-[450px] rounded-lg border border-slate-700/50 bg-slate-800/30">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 z-10 bg-slate-800">
                    <tr>{TABLE_COLS.map(c => <th key={c.key} className={`px-3 py-2.5 text-left text-slate-400 font-medium whitespace-nowrap ${c.w}`}>{c.label}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {rawData.map((row, i) => {
                      const rp = problems[i] || {};
                      return (
                        <tr key={i} className={`${isJunkRow(row) ? 'bg-red-500/10' : i % 2 ? 'bg-slate-800/20' : ''} hover:bg-slate-700/20`}>
                          {TABLE_COLS.map(c => {
                            const lvl = rp[c.key];
                            const cls = lvl === 'critical' ? 'bg-red-500/15 text-red-300' : lvl === 'warning' ? 'bg-amber-500/10 text-amber-300' : 'text-slate-300';
                            return <td key={c.key} className={`px-3 py-1.5 ${c.w} truncate ${cls}`}>{row[c.key] || <span className="text-slate-600">—</span>}</td>;
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 1: CLEANUP ENGINE ── */}
        {rawData && activeTab === 1 && (
          <div className="animate-[fadeIn_0.3s_ease-out] space-y-6">
            <div className="flex items-center gap-4">
              <button onClick={runCleanup} disabled={isCleaningUp || !!cleanedData}
                className={`px-6 py-3 rounded-lg font-medium text-sm transition-all ${cleanedData ? 'bg-emerald-500/20 text-emerald-400' : isCleaningUp ? 'bg-slate-700 text-slate-400 cursor-wait' : 'bg-cyan-500 hover:bg-cyan-400 text-slate-900 shadow-lg shadow-cyan-500/25'}`}>
                {cleanedData ? 'Cleanup Complete' : isCleaningUp ? 'Processing...' : 'Run Cleanup'}
              </button>
              {cleanedData && <span className="text-sm text-slate-400">{changeLog.length} changes applied</span>}
              {cleanedData && <button onClick={() => { setCleanedData(null); setChangeLog([]); setCleanupProgress(null); }} className="text-xs text-slate-500 hover:text-slate-300">Reset</button>}
            </div>

            {(isCleaningUp || cleanupProgress) && !cleanedData && (
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-300">{cleanupProgress?.label}</span>
                  <span className="text-slate-500">Step {cleanupProgress?.step || 0} / {cleanupProgress?.total || 8}</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div className="bg-cyan-400 h-2 rounded-full transition-all duration-300 ease-out" style={{ width: `${((cleanupProgress?.step || 0) / 8) * 100}%` }} />
                </div>
              </div>
            )}

            {cleanedData && (
              <>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                    <h3 className="text-sm font-medium text-slate-400 mb-4">Before Cleanup</h3>
                    <div className="flex items-center gap-6">
                      <QualityGauge score={rawScore} />
                      <div className="space-y-1.5 text-sm">
                        <div className="text-slate-400">{rawStats.totalRows} contacts</div>
                        <div className="text-red-400">{rawStats.duplicates} duplicates</div>
                        <div className="text-red-400">{rawStats.junkRows} junk rows</div>
                        <div className="text-amber-400">{rawStats.invalidEmails} invalid emails</div>
                        <div className="text-amber-400">{rawStats.staleContacts} stale contacts</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-5 border border-emerald-500/20">
                    <h3 className="text-sm font-medium text-emerald-400 mb-4">After Cleanup</h3>
                    <div className="flex items-center gap-6">
                      <QualityGauge score={cleanScore} />
                      <div className="space-y-1.5 text-sm">
                        <div className="text-slate-400">{cleanStats.totalRows} contacts</div>
                        <div className="text-emerald-400">{cleanStats.duplicates} duplicates</div>
                        <div className="text-emerald-400">{cleanStats.junkRows} junk rows</div>
                        <div className={cleanStats.invalidEmails > 0 ? 'text-amber-400' : 'text-emerald-400'}>{cleanStats.invalidEmails} invalid emails</div>
                        <div className={cleanStats.staleContacts > 0 ? 'text-amber-400' : 'text-emerald-400'}>{cleanStats.staleContacts} stale contacts</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                  <h3 className="text-sm font-medium text-slate-300 mb-3">Change Log <span className="text-slate-500 font-normal">({changeLog.length} changes)</span></h3>
                  <div className="max-h-[350px] overflow-auto space-y-1">
                    {changeLog.map((c, i) => (
                      <div key={i} className="flex gap-2 text-xs py-1 items-start">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${LOG_COLORS[c.type] || 'bg-slate-500/20 text-slate-400'}`}>{c.type}</span>
                        <span className="text-slate-400">{c.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {!cleanedData && !isCleaningUp && (
              <div className="text-center py-16 text-slate-500 text-sm">
                Click <span className="text-cyan-400">Run Cleanup</span> to standardize, deduplicate, and validate your CRM data.
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: SEGMENTATION ── */}
        {rawData && activeTab === 2 && (
          <div className="animate-[fadeIn_0.3s_ease-out] space-y-6">
            {!cleanedData ? (
              <div className="text-center py-20">
                <p className="text-slate-400 text-sm mb-3">Run the cleanup engine first to view segmentation.</p>
                <button onClick={() => setActiveTab(1)} className="text-cyan-400 text-sm hover:underline">Go to Cleanup Engine</button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                    <h3 className="text-sm font-medium text-slate-300 mb-3">By LP Type</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={segData.lpTypeCounts} margin={{bottom:40}}>
                        <XAxis dataKey="name" tick={{fill:'#94a3b8',fontSize:10}} angle={-35} textAnchor="end" interval={0} />
                        <YAxis tick={{fill:'#94a3b8',fontSize:11}} />
                        <Tooltip contentStyle={{backgroundColor:'#1e293b',border:'1px solid #334155',borderRadius:'8px',color:'#e2e8f0',fontSize:12}} />
                        <Bar dataKey="value" radius={[4,4,0,0]}>
                          {segData.lpTypeCounts.map((e, i) => <Cell key={i} fill={LP_COLORS[e.name]||'#64748b'} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                    <h3 className="text-sm font-medium text-slate-300 mb-3">By AUM Tier</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={segData.aumTiers} margin={{bottom:40}}>
                        <XAxis dataKey="name" tick={{fill:'#94a3b8',fontSize:10}} angle={-35} textAnchor="end" interval={0} />
                        <YAxis tick={{fill:'#94a3b8',fontSize:11}} />
                        <Tooltip contentStyle={{backgroundColor:'#1e293b',border:'1px solid #334155',borderRadius:'8px',color:'#e2e8f0',fontSize:12}} />
                        <Bar dataKey="value" fill="#06b6d4" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                    <h3 className="text-sm font-medium text-slate-300 mb-3">By Strategy Interest</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={segData.strategyCounts} margin={{bottom:40}}>
                        <XAxis dataKey="name" tick={{fill:'#94a3b8',fontSize:10}} angle={-35} textAnchor="end" interval={0} />
                        <YAxis tick={{fill:'#94a3b8',fontSize:11}} />
                        <Tooltip contentStyle={{backgroundColor:'#1e293b',border:'1px solid #334155',borderRadius:'8px',color:'#e2e8f0',fontSize:12}} />
                        <Bar dataKey="value" fill="#8b5cf6" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-300 mb-3">Filter by Segment</h3>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setSelectedSegment(null)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${!selectedSegment ? 'bg-cyan-400/20 text-cyan-400 ring-1 ring-cyan-400/50' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}>
                      All ({cleanedData.length})
                    </button>
                    {segData.lpTypeCounts.map(s => (
                      <button key={s.name} onClick={() => setSelectedSegment(selectedSegment === s.name ? null : s.name)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${selectedSegment === s.name ? 'ring-1 ring-cyan-400/50 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
                        style={selectedSegment === s.name ? {backgroundColor:(LP_COLORS[s.name]||'#64748b')+'30'} : {}}>
                        {s.name} ({s.value})
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                    <h3 className="text-sm font-medium text-slate-300 mb-3">Geographic Distribution</h3>
                    <div className="max-h-[280px] overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-slate-800"><tr>
                          <th className="text-left text-slate-400 px-2 py-1.5 font-medium">State</th>
                          <th className="text-right text-slate-400 px-2 py-1.5 font-medium">Contacts</th>
                          <th className="text-right text-slate-400 px-2 py-1.5 font-medium">Avg AUM ($M)</th>
                        </tr></thead>
                        <tbody>{segData.geoDist.slice(0, 20).map(g => (
                          <tr key={g.state} className="border-t border-slate-700/30">
                            <td className="px-2 py-1.5 text-slate-300">{g.state}</td>
                            <td className="px-2 py-1.5 text-right text-slate-300">{g.count}</td>
                            <td className="px-2 py-1.5 text-right text-slate-400">{g.avgAum.toLocaleString()}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                    <h3 className="text-sm font-medium text-slate-300 mb-3">
                      {selectedSegment || 'All'} Contacts ({(selectedSegment ? cleanedData.filter(r => r.lp_type === selectedSegment) : cleanedData).length})
                    </h3>
                    <div className="max-h-[280px] overflow-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-slate-800"><tr>
                          <th className="text-left px-2 py-1.5 text-slate-400 font-medium">Firm</th>
                          <th className="text-left px-2 py-1.5 text-slate-400 font-medium">Contact</th>
                          <th className="text-left px-2 py-1.5 text-slate-400 font-medium">Email</th>
                          <th className="text-right px-2 py-1.5 text-slate-400 font-medium">AUM ($M)</th>
                        </tr></thead>
                        <tbody>{(selectedSegment ? cleanedData.filter(r => r.lp_type === selectedSegment) : cleanedData).slice(0,50).map((r,i) => (
                          <tr key={i} className="border-t border-slate-700/30">
                            <td className="px-2 py-1.5 text-slate-300 truncate max-w-[180px]">{r.firm_name}</td>
                            <td className="px-2 py-1.5 text-slate-300 truncate max-w-[130px]">{r.contact_name}</td>
                            <td className="px-2 py-1.5 text-slate-400 truncate max-w-[180px]">{r.email || '—'}</td>
                            <td className="px-2 py-1.5 text-right text-slate-400">{Number(r.aum_millions) ? Number(r.aum_millions).toLocaleString() : '—'}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── TAB 3: CAMPAIGN READINESS ── */}
        {rawData && activeTab === 3 && (
          <div className="animate-[fadeIn_0.3s_ease-out] space-y-6">
            {!cleanedData ? (
              <div className="text-center py-20">
                <p className="text-slate-400 text-sm mb-3">Run the cleanup engine first to view campaign readiness.</p>
                <button onClick={() => setActiveTab(1)} className="text-cyan-400 text-sm hover:underline">Go to Cleanup Engine</button>
              </div>
            ) : (
              <>
                <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                  <h3 className="text-sm font-medium text-slate-300 mb-2">Campaign Summary</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    You have <span className="text-emerald-400 font-semibold">{buckets.ready.length} contacts</span> ready for immediate outreach
                    across <span className="text-cyan-400 font-semibold">{new Set(buckets.ready.map(r => r.lp_type)).size} segments</span>.
                    {' '}<span className="text-amber-400 font-semibold">{buckets.cleanup.length}</span> contacts need data cleanup before outreach, and
                    {' '}<span className="text-red-400 font-semibold">{buckets.remove.length}</span> should be removed or re-engaged through other channels.
                    {(() => { const top = _.chain(buckets.ready).countBy('lp_type').toPairs().maxBy(1).value(); return top ? <> Recommended: prioritize <span className="text-cyan-400 font-semibold">{top[0]}</span> segment ({top[1]} ready contacts).</> : null; })()}
                  </p>
                  <div className="mt-4">
                    <button onClick={exportCSV} className="px-5 py-2.5 text-sm bg-cyan-500 hover:bg-cyan-400 text-slate-900 rounded-lg font-medium transition-colors shadow-lg shadow-cyan-500/25">
                      Export Clean Data
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <KanbanColumn title="Ready to Email" items={buckets.ready} color="emerald" total={cleanedData.length} expanded={expandedBuckets.ready} onToggle={() => toggleBucket('ready')} />
                  <KanbanColumn title="Needs Cleanup" items={buckets.cleanup} color="amber" total={cleanedData.length} expanded={expandedBuckets.cleanup} onToggle={() => toggleBucket('cleanup')} />
                  <KanbanColumn title="Remove / Re-engage" items={buckets.remove} color="red" total={cleanedData.length} expanded={expandedBuckets.remove} onToggle={() => toggleBucket('remove')} />
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-[1400px] mx-auto px-6 py-4 border-t border-slate-800 mt-8">
        <p className="text-[11px] text-slate-600 text-center">LPSync by Oakpoint Advisors — Built for demo purposes</p>
      </footer>
    </div>
  );
}
