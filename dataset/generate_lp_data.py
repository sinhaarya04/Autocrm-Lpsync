#!/usr/bin/env python3
"""
Generate realistic CRM dataset for hedge fund investor relations demo.
Produces lpsync_clean.csv (~150 rows) and lpsync_messy.csv (with data quality issues).
"""

import csv
import random
import copy
from datetime import datetime, timedelta

random.seed(42)

# ─────────────────────────────────────────────────────────────────────
# FIRM DATA: name, lp_type, city, state, aum_millions, domain
# ─────────────────────────────────────────────────────────────────────

FIRMS = [
    # ENDOWMENTS
    ("Harvard Management Company", "Endowment", "Boston", "MA", 50900, "hmc.harvard.edu"),
    ("Yale Investments Office", "Endowment", "New Haven", "CT", 41400, "investments.yale.edu"),
    ("Stanford Management Company", "Endowment", "Stanford", "CA", 36300, "smc.stanford.edu"),
    ("Princeton University Investment Company", "Endowment", "Princeton", "NJ", 35800, "princo.princeton.edu"),
    ("MIT Investment Management Company", "Endowment", "Cambridge", "MA", 27400, "mitimco.mit.edu"),
    ("Duke Management Company", "Endowment", "Durham", "NC", 12700, "dumac.duke.edu"),
    ("University of Texas Investment Management Company", "Endowment", "Austin", "TX", 70500, "utimco.utexas.edu"),
    ("Emory Investment Management", "Endowment", "Atlanta", "GA", 11200, "emoryinvestments.emory.edu"),
    ("University of Michigan Endowment", "Endowment", "Ann Arbor", "MI", 17000, "umich.edu"),
    ("Columbia Investment Management Company", "Endowment", "New York", "NY", 13300, "columbia.edu"),
    ("University of Pennsylvania Endowment", "Endowment", "Philadelphia", "PA", 20500, "upenn.edu"),
    ("Northwestern University Investment Office", "Endowment", "Evanston", "IL", 14200, "northwestern.edu"),
    ("Vanderbilt University Endowment", "Endowment", "Nashville", "TN", 10900, "vanderbilt.edu"),
    ("University of Notre Dame Investment Office", "Endowment", "Notre Dame", "IN", 20200, "notredame.edu"),
    ("University of Virginia Investment Management Company", "Endowment", "Charlottesville", "VA", 14300, "uvimco.virginia.edu"),

    # FOUNDATIONS
    ("Ford Foundation", "Foundation", "New York", "NY", 16000, "fordfoundation.org"),
    ("Rockefeller Foundation", "Foundation", "New York", "NY", 6100, "rockefellerfoundation.org"),
    ("Bill & Melinda Gates Foundation", "Foundation", "Seattle", "WA", 67000, "gatesfoundation.org"),
    ("Andrew W. Mellon Foundation", "Foundation", "New York", "NY", 8300, "mellon.org"),
    ("Howard Hughes Medical Institute", "Foundation", "Chevy Chase", "MD", 23600, "hhmi.org"),
    ("Bloomberg Philanthropies", "Foundation", "New York", "NY", 11500, "bloomberg.org"),
    ("MacArthur Foundation", "Foundation", "Chicago", "IL", 7400, "macfound.org"),
    ("Hewlett Foundation", "Foundation", "Menlo Park", "CA", 13200, "hewlett.org"),
    ("Kresge Foundation", "Foundation", "Troy", "MI", 4100, "kresge.org"),
    ("Simons Foundation", "Foundation", "New York", "NY", 5200, "simonsfoundation.org"),

    # PUBLIC PENSIONS
    ("CalPERS", "Public Pension", "Sacramento", "CA", 442000, "calpers.ca.gov"),
    ("CalSTRS", "Public Pension", "West Sacramento", "CA", 318000, "calstrs.com"),
    ("New York State Common Retirement Fund", "Public Pension", "Albany", "NY", 268000, "osc.ny.gov"),
    ("Teacher Retirement System of Texas", "Public Pension", "Austin", "TX", 198000, "trs.texas.gov"),
    ("Florida State Board of Administration", "Public Pension", "Tallahassee", "FL", 248000, "sbafla.com"),
    ("State of Wisconsin Investment Board", "Public Pension", "Madison", "WI", 150000, "swib.state.wi.us"),
    ("Ohio Public Employees Retirement System", "Public Pension", "Columbus", "OH", 107000, "opers.org"),
    ("Pennsylvania Public School Employees Retirement System", "Public Pension", "Harrisburg", "PA", 73000, "psers.pa.gov"),
    ("New York City Retirement Systems", "Public Pension", "New York", "NY", 263000, "comptroller.nyc.gov"),
    ("State of New Jersey Division of Investment", "Public Pension", "Trenton", "NJ", 94000, "nj.gov"),
    ("Virginia Retirement System", "Public Pension", "Richmond", "VA", 102000, "varetire.org"),
    ("Oregon Investment Council", "Public Pension", "Tigard", "OR", 100000, "oregon.gov"),
    ("Washington State Investment Board", "Public Pension", "Olympia", "WA", 180000, "sib.wa.gov"),
    ("Illinois Municipal Retirement Fund", "Public Pension", "Oak Brook", "IL", 53000, "imrf.org"),
    ("North Carolina Retirement Systems", "Public Pension", "Raleigh", "NC", 118000, "myncretirement.com"),

    # FAMILY OFFICES
    ("Soros Fund Management", "Family Office", "New York", "NY", 25000, "sorosfund.com"),
    ("Emerson Collective", "Family Office", "Palo Alto", "CA", 3500, "emersoncollective.com"),
    ("Bezos Expeditions", "Family Office", "Seattle", "WA", 120000, "bezosexpeditions.com"),
    ("Cascade Investment", "Family Office", "Kirkland", "WA", 60000, "cascadeinv.com"),
    ("MSD Partners", "Family Office", "New York", "NY", 18000, "msdpartners.com"),
    ("Vulcan Capital", "Family Office", "Seattle", "WA", 9000, "vulcan.com"),
    ("Druckenmiller Family Office", "Family Office", "New York", "NY", 12000, "duquesne.com"),
    ("Appaloosa Management", "Family Office", "Short Hills", "NJ", 14000, "appaloosa.com"),
    ("Icahn Enterprises", "Family Office", "New York", "NY", 17000, "ielp.com"),
    ("Tiger Global Management", "Family Office", "New York", "NY", 35000, "tigerglobal.com"),
    ("Lone Pine Capital", "Family Office", "Greenwich", "CT", 26000, "lonepinecapital.com"),
    ("Viking Global Investors", "Family Office", "Greenwich", "CT", 39000, "vikingglobal.com"),
    ("Pershing Square Capital", "Family Office", "New York", "NY", 18500, "pershingsquareholdings.com"),
    ("Third Point LLC", "Family Office", "New York", "NY", 14500, "thirdpoint.com"),
    ("Elliott Management", "Family Office", "New York", "NY", 65500, "elliottmgmt.com"),

    # RIAs / CONSULTANTS
    ("Cambridge Associates", "Consultant", "Boston", "MA", 500000, "cambridgeassociates.com"),
    ("Mercer Investments", "Consultant", "New York", "NY", 380000, "mercer.com"),
    ("Aon Hewitt Investment Consulting", "Consultant", "Chicago", "IL", 340000, "aon.com"),
    ("NEPC", "Consultant", "Boston", "MA", 1400000, "nepc.com"),
    ("Meketa Investment Group", "Consultant", "Westwood", "MA", 1700000, "meketa.com"),
    ("Callan Associates", "Consultant", "San Francisco", "CA", 470000, "callan.com"),
    ("Wilshire Advisors", "Consultant", "Santa Monica", "CA", 1300000, "wilshire.com"),
    ("Fund Evaluation Group", "Consultant", "Cincinnati", "OH", 82000, "feg.com"),
    ("Verus Investments", "Consultant", "Seattle", "WA", 300000, "verusinvestments.com"),
    ("RVK Inc", "Consultant", "Portland", "OR", 265000, "rvkinc.com"),

    # INSURANCE
    ("MetLife Investment Management", "Insurance Company", "Whippany", "NJ", 585000, "metlife.com"),
    ("Prudential Financial", "Insurance Company", "Newark", "NJ", 1400000, "prudential.com"),
    ("MassMutual", "Insurance Company", "Springfield", "MA", 305000, "massmutual.com"),
    ("TIAA", "Insurance Company", "New York", "NY", 1200000, "tiaa.org"),
    ("New York Life Investments", "Insurance Company", "New York", "NY", 360000, "newyorklife.com"),
    ("Lincoln Financial Group", "Insurance Company", "Radnor", "PA", 310000, "lincolnfinancial.com"),
    ("Aflac Global Investments", "Insurance Company", "Columbus", "GA", 155000, "aflac.com"),
    ("Hartford Investment Management", "Insurance Company", "Hartford", "CT", 120000, "hartfordfunds.com"),
    ("Allstate Investments", "Insurance Company", "Northbrook", "IL", 95000, "allstate.com"),
    ("Principal Global Investors", "Insurance Company", "Des Moines", "IA", 540000, "principalglobal.com"),
]

# ─────────────────────────────────────────────────────────────────────
# CONTACT NAME POOLS (diverse)
# ─────────────────────────────────────────────────────────────────────

FIRST_NAMES_M = [
    "James", "Michael", "David", "Robert", "William", "Richard", "Thomas", "Daniel",
    "Christopher", "Matthew", "Andrew", "Jonathan", "Kevin", "Brian", "Jason",
    "Marcus", "Terrence", "DeShawn", "Jamal", "Andre",
    "Carlos", "Miguel", "Luis", "Rafael", "Diego",
    "Wei", "Hiroshi", "Raj", "Amir", "Sanjay",
    "Kwame", "Oluwaseun", "Ibrahim", "Hassan", "Tariq",
    "Nikolai", "Stefan", "Pierre", "Liam", "Connor",
    "Kenji", "Vikram", "Arjun", "Tomás", "Alejandro",
    "Dmitri", "Yusuf", "Samuel", "Benjamin", "Nathan",
]

FIRST_NAMES_F = [
    "Sarah", "Jennifer", "Emily", "Amanda", "Jessica", "Rebecca", "Katherine",
    "Elizabeth", "Margaret", "Laura", "Rachel", "Stephanie", "Christine", "Nicole",
    "Jasmine", "Keisha", "Monique", "Tamara", "Aaliyah",
    "Maria", "Elena", "Ana", "Sofia", "Isabella",
    "Mei", "Yuki", "Priya", "Ananya", "Nadia",
    "Amara", "Fatima", "Chioma", "Zainab", "Aisha",
    "Katarina", "Ingrid", "Margaux", "Siobhan", "Aoife",
    "Sakura", "Deepa", "Kavita", "Carmen", "Lucia",
    "Olga", "Layla", "Grace", "Claire", "Olivia",
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Davis", "Miller",
    "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White",
    "Harris", "Martin", "Thompson", "Garcia", "Martinez", "Robinson",
    "Clark", "Rodriguez", "Lewis", "Lee", "Walker", "Hall", "Allen",
    "Young", "King", "Wright", "Chen", "Wang", "Li", "Zhang", "Liu",
    "Patel", "Sharma", "Singh", "Kumar", "Gupta",
    "Kim", "Park", "Nakamura", "Tanaka", "Watanabe",
    "Okafor", "Mensah", "Ibrahim", "Al-Rashid", "Johansson",
    "O'Brien", "Murphy", "Sullivan", "Petrov", "Fernandez",
    "Torres", "Ramirez", "Nguyen", "Tran", "Moreau",
    "Bianchi", "Kowalski", "Hoffman", "Weber", "Muller",
    "Goldberg", "Rosenberg", "Stern", "Katz", "Friedman",
    "Blackwood", "Whitfield", "Delacroix", "Beaumont", "Takahashi",
]

TITLES = [
    "Chief Investment Officer",
    "Director of Alternative Investments",
    "Head of Private Markets",
    "Portfolio Manager",
    "Senior Investment Analyst",
    "Managing Director",
    "VP of Institutional Investments",
    "Director of External Managers",
    "Head of Hedge Fund Allocations",
    "Senior Portfolio Strategist",
]

# Area codes by city (real codes)
CITY_AREA_CODES = {
    "New York": "212", "Boston": "617", "Cambridge": "617",
    "San Francisco": "415", "Chicago": "312", "Los Angeles": "213",
    "Austin": "512", "Tallahassee": "850", "Sacramento": "916",
    "West Sacramento": "916", "Albany": "518", "Madison": "608",
    "Columbus": "614", "Harrisburg": "717", "Trenton": "609",
    "Richmond": "804", "Tigard": "503", "Olympia": "360",
    "Oak Brook": "630", "Raleigh": "919", "New Haven": "203",
    "Stanford": "650", "Princeton": "609", "Durham": "919",
    "Atlanta": "404", "Ann Arbor": "734", "Philadelphia": "215",
    "Evanston": "847", "Nashville": "615", "Notre Dame": "574",
    "Charlottesville": "434", "Seattle": "206", "Chevy Chase": "301",
    "Menlo Park": "650", "Troy": "248", "Palo Alto": "650",
    "Kirkland": "425", "Short Hills": "973", "Greenwich": "203",
    "Westwood": "781", "Santa Monica": "310", "Cincinnati": "513",
    "Portland": "503", "Whippany": "973", "Newark": "973",
    "Springfield": "413", "Radnor": "610", "Hartford": "860",
    "Northbrook": "847", "Des Moines": "515",
}
DEFAULT_AREA_CODE = "646"

# Strategy interest weights by LP type
STRATEGY_WEIGHTS = {
    "Endowment":         {"Hedge Fund": 3, "Private Equity": 3, "Private Credit": 2, "Real Estate": 2, "Venture Capital": 3},
    "Foundation":        {"Hedge Fund": 2, "Private Equity": 3, "Private Credit": 2, "Real Estate": 2, "Venture Capital": 2},
    "Public Pension":    {"Hedge Fund": 2, "Private Equity": 4, "Private Credit": 3, "Real Estate": 4, "Venture Capital": 1},
    "Family Office":     {"Hedge Fund": 4, "Private Equity": 3, "Private Credit": 2, "Real Estate": 2, "Venture Capital": 4},
    "Consultant":        {"Hedge Fund": 3, "Private Equity": 3, "Private Credit": 3, "Real Estate": 3, "Venture Capital": 2},
    "Insurance Company": {"Hedge Fund": 1, "Private Equity": 3, "Private Credit": 4, "Real Estate": 3, "Venture Capital": 1},
}

EMAIL_STATUSES = ["Active"] * 70 + ["Bounced"] * 10 + ["Unknown"] * 10 + ["Unsubscribed"] * 10

used_names = set()


def generate_name():
    """Generate a unique first + last name."""
    while True:
        if random.random() < 0.5:
            first = random.choice(FIRST_NAMES_M)
        else:
            first = random.choice(FIRST_NAMES_F)
        last = random.choice(LAST_NAMES)
        full = f"{first} {last}"
        if full not in used_names:
            used_names.add(full)
            return first, last


def generate_phone(city):
    area = CITY_AREA_CODES.get(city, DEFAULT_AREA_CODE)
    return f"{area}-{random.randint(200,999):03d}-{random.randint(1000,9999):04d}"


def pick_strategies(lp_type):
    weights = STRATEGY_WEIGHTS[lp_type]
    strategies = list(weights.keys())
    w = [weights[s] for s in strategies]
    n = random.choices([1, 2, 3], weights=[15, 50, 35])[0]
    picked = set()
    while len(picked) < n:
        choice = random.choices(strategies, weights=w, k=1)[0]
        picked.add(choice)
    return "; ".join(sorted(picked))


def generate_contact_date():
    """40% within 90d, 30% 90-180d, 30% 180-365d."""
    today = datetime(2026, 4, 19)
    r = random.random()
    if r < 0.40:
        days = random.randint(1, 90)
    elif r < 0.70:
        days = random.randint(91, 180)
    else:
        days = random.randint(181, 365)
    return (today - timedelta(days=days)).strftime("%Y-%m-%d")


def make_email(first, last, domain):
    return f"{first.lower()}.{last.lower()}@{domain}"


# ─────────────────────────────────────────────────────────────────────
# GENERATE CLEAN ROWS
# ─────────────────────────────────────────────────────────────────────

HEADERS = [
    "firm_name", "lp_type", "contact_name", "title", "email",
    "phone", "city", "state", "aum_millions", "strategy_interest",
    "last_contact_date", "email_status"
]

rows = []
for firm_name, lp_type, city, state, aum, domain in FIRMS:
    n_contacts = random.choices([1, 2], weights=[35, 65])[0]
    for i in range(n_contacts):
        first, last = generate_name()
        title = TITLES[i] if i == 0 else random.choice(TITLES[1:])
        row = {
            "firm_name": firm_name,
            "lp_type": lp_type,
            "contact_name": f"{first} {last}",
            "title": title,
            "email": make_email(first, last, domain),
            "phone": generate_phone(city),
            "city": city,
            "state": state,
            "aum_millions": aum,
            "strategy_interest": pick_strategies(lp_type),
            "last_contact_date": generate_contact_date(),
            "email_status": random.choice(EMAIL_STATUSES),
        }
        rows.append(row)

print(f"Generated {len(rows)} clean rows from {len(FIRMS)} firms")

# ─────────────────────────────────────────────────────────────────────
# WRITE CLEAN CSV
# ─────────────────────────────────────────────────────────────────────

OUTDIR = "/Users/aryansinha/Desktop/arzu/dataset"

with open(f"{OUTDIR}/lpsync_clean.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=HEADERS)
    writer.writeheader()
    writer.writerows(rows)
print(f"Wrote lpsync_clean.csv")

# ─────────────────────────────────────────────────────────────────────
# CREATE MESSY VERSION
# ─────────────────────────────────────────────────────────────────────

messy = [copy.deepcopy(r) for r in rows]

# 1. Add 18 duplicate rows with slightly different firm name spellings
dupe_variations = {
    "CalPERS": ["CALPERS", "Cal PERS", "California PERS"],
    "CalSTRS": ["CALSTRS", "Cal STRS"],
    "Harvard Management Company": ["Harvard Mgmt Company", "Harvard Management Co.", "harvard management company"],
    "Tiger Global Management": ["Tiger Global Mgmt", "TIGER GLOBAL MANAGEMENT"],
    "Elliott Management": ["Elliot Management", "Elliott Mgmt"],
    "Ford Foundation": ["FORD FOUNDATION", "Ford Fdn"],
    "Prudential Financial": ["PRUDENTIAL FINANCIAL", "Prudential Fin."],
    "MetLife Investment Management": ["Metlife Investment Mgmt", "METLIFE INVESTMENT MANAGEMENT"],
    "Cambridge Associates": ["CAMBRIDGE ASSOCIATES", "Cambridge Assoc."],
    "Soros Fund Management": ["SOROS FUND MANAGEMENT", "Soros Fund Mgmt"],
}

for firm, variants in dupe_variations.items():
    source_rows = [r for r in rows if r["firm_name"] == firm]
    if source_rows:
        for variant in variants[:2]:
            dupe = copy.deepcopy(random.choice(source_rows))
            dupe["firm_name"] = variant
            messy.append(dupe)

# 2. Randomize phone formats
PHONE_FORMATS = [
    lambda p: p,                                          # xxx-xxx-xxxx (original)
    lambda p: f"({p[:3]}) {p[4:7]}-{p[8:]}",             # (xxx) xxx-xxxx
    lambda p: p.replace("-", ""),                          # xxxxxxxxxx
    lambda p: p.replace("-", "."),                         # xxx.xxx.xxxx
]
for r in messy:
    if r["phone"]:
        fmt = random.choice(PHONE_FORMATS)
        r["phone"] = fmt(r["phone"])

# 3. Change ~20 state entries to full names or inconsistent formats
STATE_FULL = {
    "CA": "California", "NY": "New York", "TX": "Texas", "FL": "Florida",
    "MA": "Massachusetts", "CT": "Connecticut", "NJ": "New Jersey",
    "PA": "Pennsylvania", "IL": "Illinois", "WA": "Washington",
    "OH": "Ohio", "VA": "Virginia", "OR": "Oregon", "WI": "Wisconsin",
    "MI": "Michigan", "GA": "Georgia", "NC": "North Carolina",
    "IN": "Indiana", "TN": "Tennessee", "MD": "Maryland", "IA": "Iowa",
}
state_swap_indices = random.sample(range(len(messy)), min(20, len(messy)))
for idx in state_swap_indices:
    abbr = messy[idx]["state"]
    if abbr in STATE_FULL:
        choice = random.choice([STATE_FULL[abbr], STATE_FULL[abbr].upper(), STATE_FULL[abbr].lower()])
        messy[idx]["state"] = choice

# 4. Change ~20 LP type entries to variants
LP_TYPE_VARIANTS = {
    "Family Office":     ["FO", "fam office", "FAMILY OFFICE", "Family office", "Fam. Office"],
    "Endowment":         ["endowment", "ENDOWMENT", "Endow.", "Endwmnt"],
    "Foundation":        ["foundation", "FOUNDATION", "Fndn", "Fdn"],
    "Public Pension":    ["Public pension", "PUBLIC PENSION", "Pub Pension", "pension", "Pub. Pension"],
    "Consultant":        ["consultant", "CONSULTANT", "RIA", "Consulting"],
    "Insurance Company": ["Insurance", "INSURANCE COMPANY", "insurance co.", "Ins. Company", "Ins Co"],
}
lp_swap_indices = random.sample(range(len(messy)), min(20, len(messy)))
for idx in lp_swap_indices:
    lp = messy[idx]["lp_type"]
    if lp in LP_TYPE_VARIANTS:
        messy[idx]["lp_type"] = random.choice(LP_TYPE_VARIANTS[lp])

# 5. Mess up capitalization on ~30 firm names and contact names
cap_indices = random.sample(range(len(messy)), min(30, len(messy)))
for idx in cap_indices:
    if random.random() < 0.5:
        messy[idx]["firm_name"] = random.choice([
            messy[idx]["firm_name"].upper(),
            messy[idx]["firm_name"].lower(),
            messy[idx]["firm_name"].title(),
        ])
    else:
        messy[idx]["contact_name"] = random.choice([
            messy[idx]["contact_name"].upper(),
            messy[idx]["contact_name"].lower(),
        ])

# 6. Blank out ~50 random cells
blank_fields = ["phone", "email", "title", "city", "state", "aum_millions",
                 "strategy_interest", "last_contact_date", "email_status"]
for _ in range(50):
    idx = random.randint(0, len(messy) - 1)
    field = random.choice(blank_fields)
    messy[idx][field] = ""

# 7. Add ~5 malformed emails
bad_emails = ["john@", "@gmail.com", "test", "john@.com", "jane@@corp.com"]
bad_email_indices = random.sample(range(len(messy)), 5)
for i, idx in enumerate(bad_email_indices):
    messy[idx]["email"] = bad_emails[i]

# 8. Add 7 junk rows
junk_rows = [
    {"firm_name": "TEST", "lp_type": "", "contact_name": "Test User", "title": "", "email": "test@test.com",
     "phone": "000-000-0000", "city": "", "state": "", "aum_millions": "", "strategy_interest": "",
     "last_contact_date": "", "email_status": ""},
    {"firm_name": "asdf", "lp_type": "asdf", "contact_name": "asdf", "title": "asdf", "email": "asdf",
     "phone": "asdf", "city": "asdf", "state": "asdf", "aum_millions": "", "strategy_interest": "",
     "last_contact_date": "", "email_status": ""},
    {"firm_name": "DELETE ME", "lp_type": "", "contact_name": "", "title": "", "email": "",
     "phone": "", "city": "", "state": "", "aum_millions": "", "strategy_interest": "",
     "last_contact_date": "", "email_status": ""},
    {"firm_name": "", "lp_type": "", "contact_name": "", "title": "", "email": "",
     "phone": "", "city": "", "state": "", "aum_millions": "", "strategy_interest": "",
     "last_contact_date": "", "email_status": ""},
    {"firm_name": "REMOVE", "lp_type": "N/A", "contact_name": "Nobody", "title": "N/A", "email": "no@no.no",
     "phone": "111-111-1111", "city": "Nowhere", "state": "XX", "aum_millions": "0", "strategy_interest": "",
     "last_contact_date": "", "email_status": "Unknown"},
    {"firm_name": "", "lp_type": "", "contact_name": "", "title": "", "email": "",
     "phone": "", "city": "", "state": "", "aum_millions": "", "strategy_interest": "",
     "last_contact_date": "", "email_status": ""},
    {"firm_name": "DO NOT USE", "lp_type": "test", "contact_name": "Fake Person", "title": "Intern",
     "email": "fake@fake.fake", "phone": "999.999.9999", "city": "Faketown", "state": "ZZ",
     "aum_millions": "1", "strategy_interest": "Crypto", "last_contact_date": "2020-01-01",
     "email_status": "Bounced"},
]

# Insert junk rows at random positions
for junk in junk_rows:
    pos = random.randint(0, len(messy))
    messy.insert(pos, junk)

# Shuffle the messy data a bit (move some rows around)
random.shuffle(messy)

# ─────────────────────────────────────────────────────────────────────
# WRITE MESSY CSV
# ─────────────────────────────────────────────────────────────────────

with open(f"{OUTDIR}/lpsync_messy.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=HEADERS)
    writer.writeheader()
    writer.writerows(messy)

print(f"Wrote lpsync_messy.csv with {len(messy)} rows")
print(f"\nSummary:")
print(f"  Clean rows: {len(rows)}")
print(f"  Messy rows: {len(messy)} (includes {len(messy) - len(rows)} added dupes/junk)")
print(f"  Firms:      {len(FIRMS)}")
print(f"  LP types:   {len(set(f[1] for f in FIRMS))}")
