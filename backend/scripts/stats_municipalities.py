"""
Quick backend-side sanity check for municipality statistics, matching the API logic.

This script:
  - Fetches all active listings from Supabase (all_listings table) with pagination
  - Splits stats by ad_type (Prodaja / Iznajmljivanje)
  - Infers unknown ad_type as Prodaja if price_per_m2 >= min Prodaja price_per_m2
  - Prints per-municipality totals and per-type aggregates

Usage:
  python backend/scripts/stats_municipalities.py
  python backend/scripts/stats_municipalities.py --table listings_olx
  python backend/scripts/stats_municipalities.py --table listings_nekretnine

Env:
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_KEY)
"""

import argparse
import os
from collections import defaultdict
from typing import Dict, List

from dotenv import load_dotenv
from supabase import create_client


def supabase_client():
    load_dotenv()
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/SUPABASE_KEY are required")
    return create_client(url, key)


def fetch_listings(table: str) -> List[Dict]:
    client = supabase_client()
    listings: List[Dict] = []
    batch_size = 1000
    offset = 0
    while True:
        resp = (
            client.table(table)
            .select("municipality, price_numeric, square_m2, ad_type")
            .eq("is_active", True)
            .range(offset, offset + batch_size - 1)
            .execute()
        )
        batch = resp.data or []
        if not batch:
            break
        listings.extend(batch)
        if len(batch) < batch_size:
            break
        offset += batch_size
    return listings


PPM_MIN = 5       # minimum plausible KM/m²
PPM_MAX = 20000    # maximum plausible KM/m²


def summarize(listings: List[Dict]):
    # Diagnostics counters
    dropped_unknown = 0
    inferred_prodaja = 0
    dropped_insufficient = 0
    missing_price = 0
    missing_size = 0
    ppm_entries = {"Prodaja": [], "Iznajmljivanje": []}  # ad_type -> list of (ppm, muni, price, size)

    # Find minimum price_per_m2 among Prodaja
    prodaja_ppm = []
    for item in listings:
        if item.get("ad_type") == "Prodaja":
            try:
                price = float(item.get("price_numeric"))
                size = float(item.get("square_m2"))
                if price and size:
                    prodaja_ppm.append(price / size)
            except (TypeError, ValueError):
                continue
    min_prodaja_ppm = min(prodaja_ppm) if prodaja_ppm else None

    stats = defaultdict(
        lambda: {
            "Prodaja": {"count": 0, "prices": [], "sizes": []},
            "Iznajmljivanje": {"count": 0, "prices": [], "sizes": []},
        }
    )

    for listing in listings:
        muni = listing.get("municipality") or "Unknown"
        ad_type = listing.get("ad_type")
        try:
            price = float(listing.get("price_numeric"))
            size = float(listing.get("square_m2"))
        except (TypeError, ValueError):
            price = None
            size = None
        if price is None:
            missing_price += 1
        if size is None or size == 0:
            missing_size += 1

        # Infer unknowns as Prodaja if price_per_m2 above min Prodaja; else skip
        if not ad_type or ad_type == "Unknown":
            if price and size and size > 0 and min_prodaja_ppm is not None:
                ppm = price / size
                if ppm < PPM_MIN or ppm > PPM_MAX:
                    dropped_unknown += 1
                    continue
                if ppm >= min_prodaja_ppm:
                    ad_type = "Prodaja"
                    inferred_prodaja += 1
                else:
                    dropped_unknown += 1
                    continue
            else:
                dropped_insufficient += 1
                continue

        # Skip implausible ppm
        if price and size and size > 0:
            ppm = price / size
            if ppm < PPM_MIN or ppm > PPM_MAX:
                continue

        bucket = stats[muni]["Prodaja" if ad_type == "Prodaja" else "Iznajmljivanje"]
        bucket["count"] += 1
        if price:
            bucket["prices"].append(price)
        if size:
            bucket["sizes"].append(size)
        if price and size and size > 0 and ad_type in ("Prodaja", "Iznajmljivanje"):
            ppm_entries[ad_type].append((price / size, muni, price, size))

    def summarize_entry(entry):
        avg_price = sum(entry["prices"]) / len(entry["prices"]) if entry["prices"] else 0
        avg_size = sum(entry["sizes"]) / len(entry["sizes"]) if entry["sizes"] else 0
        price_per_m2 = avg_price / avg_size if avg_size > 0 else 0
        return {
            "count": entry["count"],
            "avg_price": round(avg_price, 2),
            "avg_size": round(avg_size, 2),
            "price_per_m2": round(price_per_m2, 2),
        }

    results = []
    for muni, data in stats.items():
        prodaja = summarize_entry(data["Prodaja"])
        iznajmljivanje = summarize_entry(data["Iznajmljivanje"])
        total_count = prodaja["count"] + iznajmljivanje["count"]
        results.append(
            {
                "municipality": muni,
                "total_count": total_count,
                "prodaja": prodaja,
                "iznajmljivanje": iznajmljivanje,
            }
        )

    results.sort(key=lambda x: x["total_count"], reverse=True)
    # Outliers: top/bottom ppm
    bottom_ppm = {
        k: sorted(v, key=lambda x: x[0])[:10] for k, v in ppm_entries.items()
    }
    top_ppm = {
        k: sorted(v, key=lambda x: x[0])[-10:] for k, v in ppm_entries.items()
    }

    return (
        results,
        inferred_prodaja,
        dropped_unknown,
        dropped_insufficient,
        missing_price,
        missing_size,
        bottom_ppm,
        top_ppm,
    )


def main():
    parser = argparse.ArgumentParser(description="Compute municipality statistics by ad_type.")
    parser.add_argument("--table", default="all_listings", help="Supabase table (default: all_listings)")
    args = parser.parse_args()

    listings = fetch_listings(args.table)
    print(f"Fetched {len(listings)} active rows from {args.table}")

    (
        results,
        inferred_prodaja,
        dropped_unknown,
        dropped_insufficient,
        missing_price,
        missing_size,
        bottom_ppm,
        top_ppm,
    ) = summarize(listings)
    for stat in results:
        print(
            f"{stat['municipality']}: total={stat['total_count']} | "
            f"Prodaja(count={stat['prodaja']['count']}, avg={stat['prodaja']['avg_price']}, ppm={stat['prodaja']['price_per_m2']}) | "
            f"Iznajmljivanje(count={stat['iznajmljivanje']['count']}, avg={stat['iznajmljivanje']['avg_price']}, ppm={stat['iznajmljivanje']['price_per_m2']})"
        )
    print("-" * 80)
    print(
        f"Diagnostics: inferred_prodaja={inferred_prodaja}, "
        f"dropped_unknown_ad_type={dropped_unknown}, "
        f"dropped_insufficient_data={dropped_insufficient}, "
        f"missing_price={missing_price}, missing_or_zero_size={missing_size}"
    )
    for ad_type, label in [("Prodaja", "Sales"), ("Iznajmljivanje", "Rentals")]:
        print("-" * 80)
        print(f"{label} - Lowest price_per_m2 (possible bargains or bad data):")
        for ppm, muni, price, size in bottom_ppm.get(ad_type, []):
            print(f"{ppm:.2f} KM/m² | {muni} | price={price} size={size}")
        print("-" * 80)
        print(f"{label} - Highest price_per_m2 (possible outliers):")
        for ppm, muni, price, size in top_ppm.get(ad_type, []):
            print(f"{ppm:.2f} KM/m² | {muni} | price={price} size={size}")


if __name__ == "__main__":
    main()
