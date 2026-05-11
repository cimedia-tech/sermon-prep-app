import requests

SUPABASE_URL = 'https://uovtlyrnswondbgszsdt.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvdnRseXJuc3dvbmRiZ3N6c2R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjI4NTgsImV4cCI6MjA5NDA5ODg1OH0.Xg3GChtZCNY8rREQHy5zg5Jos4a0tEe-TdDxIxdjx2Q'

headers = {
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'apikey': SUPABASE_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal',
}

# Full readings from the PDF for each Sunday
readings = {
    '2026-05-03': 'Acts 7:55-60 | Psalm 31:1-5, 15-16 | 1 Peter 2:2-10 | St. John 14:1-14',
    '2026-05-10': 'Acts 17:22-31 | Psalm 66:8-20 | 1 Peter 3:13-22 | St. John 14:15-21',
    '2026-05-17': 'Acts 1:6-14 | Psalm 68:1-10, 32-35 | 1 Peter 4:12-14; 5:6-11 | St. John 17:1-11',
    '2026-05-24': 'Acts 2:1-21 | Psalm 104:24-35 | 1 Corinthians 12:3-13 | St. John 7:37-39',
    '2026-05-31': 'Genesis 1:1-2:4 | Psalm 8 | 2 Corinthians 13:11-13 | St. Matthew 28:16-20',
    '2026-06-07': 'Genesis 12:1-9 | Psalm 33:1-12 | Romans 4:13-25 | St. Matthew 9:9-13, 18-26',
    '2026-06-14': 'Genesis 18:1-15 | Psalm 116:1-2, 12-19 | Romans 5:1-8 | St. Matthew 9:35-10:8',
    '2026-06-21': 'Genesis 21:8-21 | Psalm 86:1-10, 16-17 | Romans 6:1-11 | St. Matthew 10:24-39',
    '2026-06-28': 'Genesis 22:1-14 | Psalm 13 | Romans 6:12-23 | St. Matthew 10:40-42',
}

for date, scriptures in readings.items():
    # Update the row matching this date
    url = f'{SUPABASE_URL}/rest/v1/scripture_sheets?week_date=eq.{date}'
    patch_headers = {**headers, 'Prefer': 'return=representation'}
    r = requests.patch(url, headers=patch_headers, json={'supporting_scriptures': scriptures})
    count = len(r.json()) if r.status_code == 200 else 0
    print(f'{date} | Updated {count} row(s) | {r.status_code}')

print('\nDone!')
