# Property Data Sync System - Setup Guide

## 🎯 Overview

This system automatically keeps your property database up-to-date with external platforms (OLX, Nekretnine.ba, etc.) by:
- **Web scraping** property listings
- **Tracking price changes** over time
- **Auto-updating** your database
- **Marking expired** listings
- **Monitoring** listing popularity

---

## 📦 Installation

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Update Database Schema

Run the migration to add new columns:

```bash
psql -U your_user -d your_database -f migrations/add_sync_columns.sql
```

Or using Supabase SQL Editor - copy/paste from `migrations/add_sync_columns.sql`

---

## 🚀 Quick Start

### Manual Sync (One-Time)

```bash
cd backend
python sync_service.py --mode once --db "postgresql://user:pass@localhost/dbname"
```

### Scheduled Service (Continuous)

```bash
# Runs full sync every 24 hours, incremental every 1 hour
python sync_service.py --mode schedule --db "postgresql://user:pass@localhost/dbname"
```

### Using Docker (Recommended)

```dockerfile
# Add to docker-compose.yml

  sync-service:
    build: ./backend
    command: python sync_service.py --mode schedule
    environment:
      - DATABASE_URL=${DATABASE_URL}
    restart: always
    depends_on:
      - db
```

---

## 🔧 Configuration

### 1. Customize Scraping

Edit `scrapers/olx_scraper.py`:

```python
# Change delay between requests (be respectful!)
scraper = OLXScraper(delay=2.0)  # 2 seconds

# Adjust search parameters
listings = scraper.scrape_listings(
    category="nekretnine",
    location="Sarajevo",  # Your target city
    max_pages=50  # How many pages to scrape
)
```

### 2. Add More Platforms

Create new scraper in `scrapers/`:

```python
# scrapers/nekretnine_scraper.py

class NekretnineScraper:
    BASE_URL = "https://www.nekretnine.ba"
    
    def scrape_listings(self, ...):
        # Your scraping logic
        pass
```

Then add to `sync_service.py`:

```python
from scrapers.nekretnine_scraper import NekretnineScraper

self.scrapers = {
    'olx': OLXScraper(delay=2.0),
    'nekretnine': NekretnineScraper(delay=2.0),
}
```

### 3. Sync Intervals

Modify in `sync_service.py`:

```python
await scheduler.run_forever(
    full_sync_interval=3600 * 24,  # 24 hours for full sync
    incremental_sync_interval=3600  # 1 hour for quick updates
)
```

---

## 📊 New Database Fields

### Essential Fields Added

```sql
-- Source tracking
external_id VARCHAR(255)    -- ID from original platform
source VARCHAR(50)           -- 'olx', 'nekretnine', etc.

-- Visual content
thumbnail_url TEXT
image_urls TEXT[]

-- Property details
bathrooms INTEGER
building_year INTEGER
elevator BOOLEAN
parking_spaces INTEGER
balcony BOOLEAN
pet_friendly BOOLEAN

-- Seller info
seller_name VARCHAR(255)
seller_type VARCHAR(50)

-- Timestamps
posted_date TIMESTAMP
last_updated TIMESTAMP
scraped_at TIMESTAMP

-- Status
is_active BOOLEAN
expired_at TIMESTAMP

-- Analytics
view_count INTEGER
save_count INTEGER
```

---

## 🎨 Frontend Updates Needed

### 1. Add Images to Listing Cards

```tsx
// In explore.tsx
interface Listing {
  // ... existing fields
  thumbnail_url?: string
  image_urls?: string[]
  bathrooms?: number
  building_year?: number
  elevator?: boolean
}

// In ListingCard component
{item.thumbnail_url && (
  <Image 
    source={{ uri: item.thumbnail_url }}
    style={styles.thumbnail}
  />
)}
```

### 2. Add New Filters

```tsx
const [filters, setFilters] = useState({
  // ... existing
  hasPar king: false,
  hasElevator: false,
  petFriendly: false,
  buildingYearMin: '',
  bathroomsMin: '',
})
```

### 3. Show Price History

```tsx
// Create new component PriceHistoryChart.tsx
import { LineChart } from 'react-native-chart-kit'

<LineChart
  data={{
    labels: priceHistory.map(p => formatDate(p.recorded_at)),
    datasets: [{ data: priceHistory.map(p => p.price) }]
  }}
/>
```

---

## 🔄 How It Works

### 1. **Full Sync** (Daily)
- Scrapes all pages from all sources
- Identifies new listings
- Updates changed listings (price, title)
- Marks missing listings as expired

### 2. **Incremental Sync** (Hourly)
- Quick check of first 5 pages
- Updates recent listings only
- Fast, lightweight

### 3. **Price Tracking**
- Saves every price change to `price_history`
- Enables price drop alerts
- Shows price trends

### 4. **Analytics**
- Tracks views and saves
- Calculates popularity scores
- Measures time on market

---

## 🎯 Best Practices

### Respectful Scraping
```python
# ✅ Good: 2-3 second delays
scraper = OLXScraper(delay=2.0)

# ❌ Bad: Too fast, might get blocked
scraper = OLXScraper(delay=0.1)
```

### Error Handling
```python
# Always wrap in try-catch
try:
    listings = scraper.scrape_listings()
except Exception as e:
    logger.error(f"Scraping failed: {e}")
    # Send alert, retry later
```

### Database Performance
```sql
-- Use indexes for fast queries
CREATE INDEX idx_listings_active_price 
ON listings(is_active, price_numeric)
WHERE is_active = true;
```

---

## 📈 Monitoring

### Check Sync Status

```sql
-- Latest syncs
SELECT * FROM sync_logs 
ORDER BY started_at DESC 
LIMIT 10;

-- Active listings by source
SELECT source, COUNT(*) 
FROM listings 
WHERE is_active = true 
GROUP BY source;

-- Price changes this week
SELECT COUNT(*) 
FROM price_history 
WHERE recorded_at > NOW() - INTERVAL '7 days';
```

### View Popular Listings

```sql
SELECT * FROM popular_listings LIMIT 20;
```

---

## 🚨 Troubleshooting

### Scraper Not Finding Listings
- Website changed structure → Update CSS selectors
- Being blocked → Increase delay, add user agent rotation
- Check: `scrapers/olx_scraper.py` → Update selectors

### Database Errors
- Connection issues → Check DATABASE_URL
- Constraint violations → Check external_id uniqueness
- Performance slow → Add indexes from migration file

### Service Crashes
- Memory issues → Reduce max_pages
- Network timeout → Increase timeout in requests
- Check logs: `tail -f sync_service.log`

---

## 🎁 Bonus Features

### 1. Price Drop Alerts

```python
# In sync_service.py after price update
if new_price < old_price * 0.9:  # 10% drop
    send_notification(listing, "Price dropped!")
```

### 2. Image Caching

```python
# Download and store images locally/CDN
from PIL import Image
import boto3

def cache_images(listing):
    for url in listing['image_urls']:
        img = download_image(url)
        upload_to_s3(img, f"listings/{listing['id']}/")
```

### 3. AI-Enhanced Descriptions

```python
import openai

def enhance_description(raw_text):
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{
            "role": "user",
            "content": f"Improve this property description: {raw_text}"
        }]
    )
    return response.choices[0].message.content
```

---

## 📚 Next Steps

1. ✅ Install dependencies
2. ✅ Run database migration
3. ✅ Test manual sync once
4. ✅ Verify data in database
5. ✅ Update frontend to show new fields
6. ✅ Deploy scheduled service
7. ✅ Monitor sync logs
8. ✅ Add more platforms (Nekretnine.ba, etc.)

---

## 🤝 Support

For issues:
1. Check logs in `sync_service.log`
2. Review `sync_logs` table in database
3. Test scrapers individually
4. Update CSS selectors if website changed

**Happy syncing! 🎉**
