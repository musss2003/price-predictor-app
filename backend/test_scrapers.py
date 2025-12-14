#!/usr/bin/env python3
"""
Test script for running OLX and Nekretnine scrapers with duplicate checking
Saves data to database after each page for long-running scrapes
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scrapers.olx_scraper import OLXScraper
from scrapers.nekretnine_scraper import NekretnineScraper

# Load environment variables
load_dotenv()


def test_olx_scraper(max_pages=5):
    """Test OLX scraper with database integration"""
    print("\n" + "="*70)
    print("🧪 TESTING OLX SCRAPER")
    print("="*70)
    
    # Initialize Supabase client
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Error: SUPABASE_URL and SUPABASE_KEY must be set in .env file")
        return
    
    supabase = create_client(supabase_url, supabase_key)
    
    # Initialize scraper with Supabase client
    scraper = OLXScraper(delay=2.0, supabase_client=supabase)
    
    # Run scraper with page-by-page saving
    result = scraper.scrape_listings(
        category="nekretnine",
        location="Sarajevo",
        max_pages=max_pages,
        save_per_page=True
    )
    
    # Print results
    print("\n📊 OLX Scraping Results:")
    print(f"  ✅ Total found: {result['total_found']}")
    print(f"  🆕 New listings: {result['new_count']}")
    print(f"  🔄 Duplicates skipped: {result['duplicate_count']}")
    print(f"  💾 Saved to database: {result['saved_count']}")
    print(f"  📄 Pages scraped: {result['pages_scraped']}")
    
    # Show sample listing
    if result['listings']:
        print("\n📋 Sample OLX Listing:")
        sample = result['listings'][0]
        for key, value in sample.items():
            if value is not None:
                print(f"    {key}: {value}")


def test_nekretnine_scraper(max_pages=2):
    """Test Nekretnine scraper with database integration"""
    print("\n" + "="*70)
    print("🧪 TESTING NEKRETNINE.BA SCRAPER")
    print("="*70)
    
    # Initialize Supabase client
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Error: SUPABASE_URL and SUPABASE_KEY must be set in .env file")
        return
    
    supabase = create_client(supabase_url, supabase_key)
    
    # Initialize scraper with Supabase client
    scraper = NekretnineScraper(
        delay=(2, 4), 
        headless=True, 
        supabase_client=supabase
    )
    
    # Run scraper with page-by-page saving
    result = scraper.scrape_listings(
        max_pages=max_pages,
        save_per_page=True
    )
    
    # Print results
    if result.get('success'):
        print("\n📊 Nekretnine.ba Scraping Results:")
        print(f"  ✅ Total found: {result['total_found']}")
        print(f"  🆕 New listings: {result['new_count']}")
        print(f"  🔄 Duplicates skipped: {result['duplicate_count']}")
        print(f"  💾 Saved to database: {result['saved_count']}")
        print(f"  📄 Pages scraped: {result['pages_scraped']}")
        
        # Show sample listing
        if result['listings']:
            print("\n📋 Sample Nekretnine Listing:")
            sample = result['listings'][0]
            for key, value in sample.items():
                if value is not None:
                    print(f"    {key}: {value}")
    else:
        print(f"\n❌ Scraping failed: {result.get('error')}")


def run_full_scrape(olx_pages=10, nekretnine_pages=10):
    """Run both scrapers for production scraping"""
    print("\n" + "="*70)
    print("🚀 STARTING FULL SCRAPE - BOTH SOURCES")
    print("="*70)
    print(f"OLX Pages: {olx_pages}")
    print(f"Nekretnine Pages: {nekretnine_pages}")
    print("Features: ✅ Duplicate checking, ✅ Page-by-page saving")
    print()
    
    # Test OLX
    test_olx_scraper(max_pages=olx_pages)
    
    print("\n" + "-"*70 + "\n")
    
    # Test Nekretnine
    test_nekretnine_scraper(max_pages=nekretnine_pages)
    
    print("\n" + "="*70)
    print("✅ FULL SCRAPE COMPLETED")
    print("="*70)


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Test scrapers with database integration")
    parser.add_argument("--source", choices=["olx", "nekretnine", "both"], default="both",
                       help="Which scraper to test")
    parser.add_argument("--olx-pages", type=int, default=5,
                       help="Number of pages to scrape from OLX")
    parser.add_argument("--nekretnine-pages", type=int, default=2,
                       help="Number of pages to scrape from Nekretnine")
    parser.add_argument("--full", action="store_true",
                       help="Run full production scrape (100 pages each)")
    
    args = parser.parse_args()
    
    if args.full:
        run_full_scrape(olx_pages=100, nekretnine_pages=100)
    elif args.source == "olx":
        test_olx_scraper(max_pages=args.olx_pages)
    elif args.source == "nekretnine":
        test_nekretnine_scraper(max_pages=args.nekretnine_pages)
    else:
        run_full_scrape(olx_pages=args.olx_pages, nekretnine_pages=args.nekretnine_pages)
