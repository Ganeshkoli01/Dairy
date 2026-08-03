import json
import openpyxl

# 1. Load existing parsed rate entries from price.xlsx
with open('d:/dairy_first_project/rate_entries.json', 'r', encoding='utf-8') as f:
    existing_entries = json.load(f)

# Existing matrix lookup map
existing_buf_map = {(round(e['fat'], 1), round(e['snf'], 1)): e['rate'] for e in existing_entries}

# 2. Define Full Grid Bounds
# Buffalo FAT: 5.0 to 10.0 (step 0.1)
buf_fats = [round(5.0 + i * 0.1, 1) for i in range(51)]
# Buffalo SNF: 8.0 to 10.0 (step 0.1)
buf_snfs = [round(8.0 + i * 0.1, 1) for i in range(21)]

full_buffalo_entries = []

# Baseline calculation function using price.xlsx formulas & deltas
def get_buffalo_rate(fat, snf):
    # Check if exact cell exists in price.xlsx
    if (fat, snf) in existing_buf_map:
        return existing_buf_map[(fat, snf)]
    
    # Nearest available FAT >= 5.5
    ref_fat = max(5.5, min(10.0, fat))
    ref_snf = max(8.7, min(10.0, snf))
    
    # Base rate at reference point
    base_rate = existing_buf_map.get((ref_fat, ref_snf), 51.10)
    
    # FAT difference delta (-₹0.30 per 0.1 FAT for fat < 5.5)
    fat_diff_steps = round((fat - ref_fat) * 10)
    fat_delta = fat_diff_steps * 0.30
    
    # SNF difference delta (-₹0.30 per 0.1 SNF for snf < 8.7)
    snf_diff_steps = round((snf - ref_snf) * 10)
    snf_delta = snf_diff_steps * 0.30
    
    calc_rate = base_rate + fat_delta + snf_delta
    return round(calc_rate, 2)

for f in buf_fats:
    for s in buf_snfs:
        r = get_buffalo_rate(f, s)
        full_buffalo_entries.append({
            'milkType': 'buffalo',
            'fat': f,
            'snf': s,
            'rate': r
        })

print(f"Generated complete Buffalo Rate Chart: {len(full_buffalo_entries)} entries (51 FATs x 21 SNFs)")

# 3. Generate Complete Cow Milk Rate Chart (FAT 3.0 to 5.0 x SNF 7.5 to 9.5)
cow_fats = [round(3.0 + i * 0.1, 1) for i in range(21)]
cow_snfs = [round(7.5 + i * 0.1, 1) for i in range(21)]

full_cow_entries = []
for f in cow_fats:
    for s in cow_snfs:
        # Base Cow Rate at FAT 3.5 / SNF 8.5 = 35.00
        fat_diff = round((f - 3.5) * 10)
        snf_diff = round((s - 8.5) * 10)
        rate = 35.00 + (fat_diff * 0.50) + (snf_diff * 0.30)
        full_cow_entries.append({
            'milkType': 'cow',
            'fat': f,
            'snf': s,
            'rate': round(max(20.0, rate), 2)
        })

print(f"Generated complete Cow Rate Chart: {len(full_cow_entries)} entries (21 FATs x 21 SNFs)")

# Save full rate dataset
all_entries = full_buffalo_entries + full_cow_entries
with open('d:/dairy_first_project/full_rate_entries.json', 'w', encoding='utf-8') as f:
    json.dump(all_entries, f, indent=2)

print(f"Total full matrix entries saved: {len(all_entries)}")
