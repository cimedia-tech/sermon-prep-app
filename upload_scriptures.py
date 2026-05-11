import requests

SUPABASE_URL = 'https://uovtlyrnswondbgszsdt.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvdnRseXJuc3dvbmRiZ3N6c2R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjI4NTgsImV4cCI6MjA5NDA5ODg1OH0.Xg3GChtZCNY8rREQHy5zg5Jos4a0tEe-TdDxIxdjx2Q'

# Upload PDF to storage
pdf_path = r'C:\Users\Augustus\Downloads\Scripture List 2026 May and June.pdf'
with open(pdf_path, 'rb') as f:
    pdf_data = f.read()

filename = 'scripture-list-may-june-2026.pdf'
upload_url = f'{SUPABASE_URL}/storage/v1/object/scripture-sheets/{filename}'
headers = {
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'apikey': SUPABASE_KEY,
    'Content-Type': 'application/pdf',
}
r = requests.post(upload_url, headers=headers, data=pdf_data)
print(f'Upload: {r.status_code} {r.text}')

pdf_url = f'{SUPABASE_URL}/storage/v1/object/public/scripture-sheets/{filename}'

entries = [
    {'week_date': '2026-05-03', 'anchor_scripture': 'St. John 14:1-14', 'sermon_title': '5th Sunday of Easter'},
    {'week_date': '2026-05-10', 'anchor_scripture': 'St. John 14:15-21', 'sermon_title': '6th Sunday of Easter - Mothers Day'},
    {'week_date': '2026-05-17', 'anchor_scripture': 'St. John 17:1-11', 'sermon_title': '7th Sunday of Easter'},
    {'week_date': '2026-05-24', 'anchor_scripture': 'St. John 7:37-39', 'sermon_title': 'Day of Pentecost'},
    {'week_date': '2026-05-31', 'anchor_scripture': 'St. Matthew 28:16-20', 'sermon_title': '1st Sunday after Pentecost'},
    {'week_date': '2026-06-07', 'anchor_scripture': 'St. Matthew 9:9-13, 18-26', 'sermon_title': '2nd Sunday after Pentecost'},
    {'week_date': '2026-06-14', 'anchor_scripture': 'St. Matthew 9:35-10:8', 'sermon_title': '3rd Sunday after Pentecost'},
    {'week_date': '2026-06-21', 'anchor_scripture': 'St. Matthew 10:24-39', 'sermon_title': '4th Sunday after Pentecost - Fathers Day'},
    {'week_date': '2026-06-28', 'anchor_scripture': 'St. Matthew 10:40-42', 'sermon_title': '5th Sunday after Pentecost'},
]

db_headers = {
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'apikey': SUPABASE_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal',
}

for entry in entries:
    row = {
        'pdf_url': pdf_url,
        'week_date': entry['week_date'],
        'anchor_scripture': entry['anchor_scripture'],
        'sermon_title': entry['sermon_title'],
        'user_email': 'christcathedralmembers@gmail.com',
        'is_processed': False,
    }
    r = requests.post(f'{SUPABASE_URL}/rest/v1/scripture_sheets', headers=db_headers, json=row)
    status = 'OK' if r.status_code in [200, 201] else f'ERR {r.status_code}'
    print(f"{entry['week_date']} | {entry['anchor_scripture']} | {status}")

print(f'\nDone! {len(entries)} entries created.')
