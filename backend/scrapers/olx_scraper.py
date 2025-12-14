"""
OLX Bosnia Real Estate Scraper
Scrapes apartment listings from OLX.ba using Selenium + BeautifulSoup
Based on the proven scraping method from the Jupyter notebook
"""

import os
import time
import re
import random
import logging
from datetime import datetime
from typing import List, Dict, Optional, Tuple
from urllib.parse import urljoin

from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.common.exceptions import WebDriverException, TimeoutException

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class OLXScraper:
    """Scraper for OLX.ba property listings using Selenium"""
    
    BASE_URL = "https://olx.ba/pretraga?attr=&attr_encoded=1&q=stanovi&category_id=23&page={}&canton=9"
    DETAIL_BASE = "https://olx.ba"
    
    def __init__(self, 
                 delay: tuple = (2, 5),
                 firefox_binary: str = "/usr/bin/firefox",
                 geckodriver_path: str = None):
        """
        Initialize OLX scraper with Selenium
        
        Args:
            delay: Tuple of (min, max) seconds delay between requests
            firefox_binary: Path to Firefox binary
            geckodriver_path: Path to geckodriver (auto-detect if None)
        """
        self.delay = delay
        self.firefox_binary = firefox_binary
        self.geckodriver_path = geckodriver_path or self._find_geckodriver()
        self.driver = None
    
    def _find_geckodriver(self) -> str:
        """Auto-detect geckodriver path"""
        common_paths = [
            "/usr/bin/geckodriver",
            "/usr/local/bin/geckodriver",
            os.path.expanduser("~/miniforge3/bin/geckodriver"),
            os.path.expanduser("~/.local/bin/geckodriver"),
        ]
        
        for path in common_paths:
            if os.path.exists(path):
                return path
        
        # Try to find in PATH
        import shutil
        geckodriver = shutil.which("geckodriver")
        if geckodriver:
            return geckodriver
        
        raise FileNotFoundError(
            "Geckodriver not found. Install with: sudo apt install firefox-geckodriver"
        )
    
    def _init_driver(self):
        """Initialize Selenium WebDriver"""
        if self.driver:
            return
        
        logger.info("Initializing Firefox WebDriver...")
        options = Options()
        options.binary_location = self.firefox_binary
        options.add_argument("--headless")  # Run without GUI
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        
        service = Service(executable_path=self.geckodriver_path)
        self.driver = webdriver.Firefox(service=service, options=options)
        self.driver.set_page_load_timeout(120)
        logger.info("✅ WebDriver initialized")
    
    def _close_driver(self):
        """Close Selenium WebDriver"""
        if self.driver:
            self.driver.quit()
            self.driver = None
            logger.info("WebDriver closed")
    
    @staticmethod
    def clean_text(s: str) -> Optional[str]:
        """Clean text by removing extra whitespace"""
        return " ".join(s.split()).strip() if s else None
    
    @staticmethod
    def extract_price(text: str) -> Optional[int]:
        """Extract numeric price from text (e.g. '250,000 KM' -> 250000)"""
        if not text:
            return None
        cleaned = re.sub(r"[^0-9]", "", text)
        return int(cleaned) if cleaned else None
    
    @staticmethod
    def extract_number(text: str) -> Optional[int]:
        """Extract first number from text"""
        if not text:
            return None
        m = re.search(r"(\d+)", text)
        return int(m.group(1)) if m else None
    
    @staticmethod
    def extract_float(text: str) -> Optional[float]:
        """Extract float from text (e.g. '65,5 m²' -> 65.5)"""
        if not text:
            return None
        try:
            # Replace comma with dot for float conversion
            text_clean = re.sub(r"[^\d,.]", "", text).replace(",", ".")
            return float(text_clean) if text_clean else None
        except ValueError:
            return None
    
    @staticmethod
    def extract_coordinates(soup: BeautifulSoup) -> Tuple[Optional[float], Optional[float]]:
        """
        Extract latitude and longitude from Google Maps embed
        
        Returns:
            Tuple of (latitude, longitude) or (None, None)
        """
        try:
            # Method 1: Look for Google Maps links with ll parameter
            links = soup.find_all("a", href=re.compile(r"google\.com/maps"))
            for link in links:
                href = link.get("href", "")
                # Extract from ll parameter: ll=43.713458,18.285125
                ll_match = re.search(r'll=(-?\d+\.\d+),(-?\d+\.\d+)', href)
                if ll_match:
                    return float(ll_match.group(1)), float(ll_match.group(2))
                
                # Extract from @coordinates: @43.713458,18.285125
                at_match = re.search(r'@(-?\d+\.\d+),(-?\d+\.\d+)', href)
                if at_match:
                    return float(at_match.group(1)), float(at_match.group(2))
            
            # Method 2: Look for Google Maps iframe
            iframe = soup.find("iframe", src=re.compile(r"google\.com/maps"))
            if iframe:
                src = iframe.get("src", "")
                ll_match = re.search(r'll=(-?\d+\.\d+),(-?\d+\.\d+)', src)
                if ll_match:
                    return float(ll_match.group(1)), float(ll_match.group(2))
            
            # Method 3: Look in script tags
            scripts = soup.find_all("script")
            for script in scripts:
                if script.string:
                    coord_match = re.search(r'(?:lat|latitude)["\s:]+(-?\d+\.\d+).*?(?:lng|longitude)["\s:]+(-?\d+\.\d+)', script.string, re.IGNORECASE)
                    if coord_match:
                        return float(coord_match.group(1)), float(coord_match.group(2))
            
            return None, None
        except Exception as e:
            logger.warning(f"Failed to extract coordinates: {e}")
            return None, None
    
    @staticmethod
    def extract_property_details_flexible(soup: BeautifulSoup) -> Dict[str, any]:
        """
        Flexible extraction of property details from tbody div structure
        Extracts both text values and boolean amenities
        
        Returns:
            Dictionary of field name -> value (str or bool)
        """
        details = {}
        try:
            # Find all rows in the tbody div  
            rows = soup.select("div.tbody div.grid")
            for row in rows:
                # Get all h4 elements (label and value)
                h4_elements = row.find_all("h4")
                if len(h4_elements) >= 2:
                    # Text value field
                    label = h4_elements[0].get_text(strip=True)
                    value = h4_elements[1].get_text(strip=True)
                    
                    # Normalize label to snake_case
                    label_key = re.sub(r'\s+', '_', label.lower())
                    label_key = re.sub(r'[^a-z0-9_]', '', label_key)
                    details[label_key] = value
                elif len(h4_elements) == 1:
                    # Boolean field (has checkmark SVG or not)
                    label = h4_elements[0].get_text(strip=True)
                    has_checkmark = row.find("svg", {"data-testid": "input-success-suffix"}) is not None
                    
                    label_key = re.sub(r'\s+', '_', label.lower())
                    label_key = re.sub(r'[^a-z0-9_]', '', label_key)
                    details[label_key] = has_checkmark
        
        except Exception as e:
            logger.warning(f"Failed flexible extraction: {e}")
        
        return details
    
    def fetch_page_source(self, url: str) -> Optional[str]:
        """Load page and return HTML source"""
        try:
            self.driver.get(url)
            time.sleep(3)  # Wait for dynamic content
            return self.driver.page_source
        except (TimeoutException, WebDriverException, OSError) as e:
            logger.warning(f"Failed to load page: {url} → {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error loading page: {url} → {e}")
            return None
    
    def parse_detail_page(self, url: str) -> Optional[Dict]:
        """
        Parse detailed information from a single listing page
        
        Args:
            url: URL of the listing detail page
            
        Returns:
            Dictionary with listing details
        """
        logger.info(f"🔍 Parsing: {url}")
        
        html = self.fetch_page_source(url)
        if not html:
            logger.warning(f"   ❌ No HTML returned")
            return None
        
        try:
            soup = BeautifulSoup(html, "lxml")
            get_text = lambda sel: self.clean_text(
                soup.select_one(sel).get_text()
            ) if soup.select_one(sel) else None
            
            # Extract title
            title = get_text("h1") or get_text(".main-title-listing")
            logger.info(f"   📝 Title: {title}")
            
            # Extract price
            price_text = get_text(".price-heading")
            price_numeric = self.extract_price(price_text)
            logger.info(f"   💰 Price: {price_text} → {price_numeric} KM")
            
            # Extract municipality (location)
            municipality_tag = soup.find("div", class_="btn-pill city")
            if municipality_tag:
                # Remove SVG icons
                for svg in municipality_tag.find_all("svg"):
                    svg.decompose()
                municipality = self.clean_text(municipality_tag.get_text())
            else:
                municipality = None
            logger.info(f"   📍 Municipality: {municipality}")
            
            # Extract coordinates from Google Maps
            latitude, longitude = self.extract_coordinates(soup)
            if latitude and longitude:
                logger.info(f"   🗺️  Coordinates: {latitude}, {longitude}")
            
            # Extract flexible property details from tbody structure
            flexible_details = self.extract_property_details_flexible(soup)
            
            # Extract property details using CSS selectors (existing method)
            rooms_text = get_text("div.required-wrap:nth-child(5) > div:nth-child(2) > h4:nth-child(2)")
            rooms = self.extract_number(rooms_text)
            logger.info(f"   🚪 Rooms: {rooms_text} → {rooms}")
            
            square_m2_text = get_text("div.required-wrap:nth-child(6) > div:nth-child(2) > h4:nth-child(2)")
            square_m2 = self.extract_float(square_m2_text)
            logger.info(f"   📏 Size: {square_m2_text} → {square_m2} m²")
            
            condition = get_text("div.required-wrap:nth-child(2) > div:nth-child(2) > h4:nth-child(2)")
            logger.info(f"   🏗️  Condition: {condition}")
            
            ad_type = get_text("div.required-wrap:nth-child(3) > div:nth-child(2) > h4:nth-child(2)")
            logger.info(f"   📋 Ad Type: {ad_type}")
            
            property_type = get_text("div.required-wrap:nth-child(4) > div:nth-child(2) > h4:nth-child(2)")
            logger.info(f"   🏠 Property Type: {property_type}")
            
            equipment = get_text("div.required-wrap:nth-child(7) > div:nth-child(2) > h4:nth-child(2)")
            logger.info(f"   🛋️  Equipment: {equipment}")
            
            level = get_text("div.required-wrap:nth-child(8) > div:nth-child(2) > h4:nth-child(2)")
            logger.info(f"   🏢 Level: {level}")
            
            heating = get_text("div.required-wrap:nth-child(9) > div:nth-child(2) > h4:nth-child(2)")
            logger.info(f"   🔥 Heating: {heating}")
            
            # Extract external ID from URL
            url_match = re.search(r'/artikal/(\d+)', url)
            external_id = f"olx_{url_match.group(1)}" if url_match else f"olx_{hash(url) % 10000000}"
            logger.info(f"   🆔 External ID: {external_id}")
            
            # Extract all images from swiper carousel
            image_urls = []
            # Find all swiper slides with images (excluding duplicates)
            swiper_imgs = soup.select("div.swiper-slide:not(.swiper-slide-duplicate) img")
            for img in swiper_imgs:
                img_url = img.get("src") or img.get("data-src")
                if img_url and img_url not in image_urls:
                    image_urls.append(img_url)
            
            # Fallback to article-img if no swiper images found
            if not image_urls:
                img = soup.select_one("img.article-img")
                if img:
                    img_url = img.get("src") or img.get("data-src")
                    if img_url:
                        image_urls.append(img_url)
            
            thumbnail_url = image_urls[0] if image_urls else None
            logger.info(f"   🖼️  Images: {len(image_urls)} found")
            if image_urls:
                logger.info(f"      First: {image_urls[0][:60]}...")
                logger.info(f"      Total URLs: {image_urls}")
            
            # Build listing dictionary
            details = {
                "external_id": external_id,
                "source": "olx_ba",
                "title": title,
                "url": url,
                "price_numeric": price_numeric,
                "municipality": municipality,
                "condition": condition,
                "ad_type": ad_type,
                "property_type": property_type,
                "rooms": rooms,
                "square_m2": square_m2,
                "equipment": equipment,
                "level": level,
                "heating": heating,
                "thumbnail_url": thumbnail_url,
                "image_urls": image_urls,  # All images from carousel
                "latitude": latitude,
                "longitude": longitude,
                "posted_date": datetime.now().isoformat(),
                "scraped_at": datetime.now().isoformat(),
                "last_updated": datetime.now().isoformat(),
                "is_active": True,
            }
            
            # Merge flexible details (additional fields from tbody)
            # Log interesting fields found
            interesting_fields = ["adresa", "broj_kupatila", "primarna_orjentacija", "vrsta_poda", 
                                 "godina_izgradnje", "datum_objave", "garaža", "internet", 
                                 "kablovska_tv", "lift", "podrum_tavan", "balkon"]
            for field in interesting_fields:
                if field in flexible_details:
                    value = flexible_details[field]
                    logger.info(f"   🔍 {field}: {value}")
            
            # Add all flexible details with 'extra_' prefix to avoid conflicts
            for key, value in flexible_details.items():
                details[f"extra_{key}"] = value
            
            logger.info(f"   ✅ Successfully parsed listing with {len(flexible_details)} extra fields")
            return details
            
        except Exception as e:
            logger.error(f"   ❌ Failed to parse details for {url} → {e}")
            import traceback
            logger.error(traceback.format_exc())
            return None
    
    def scrape_listings(self, 
                       canton: int = 9,  # 9 = Sarajevo Canton
                       max_pages: int = 10) -> List[Dict]:
        """
        Scrape apartment listings from OLX search results
        
        Args:
            canton: Canton ID (9 for Sarajevo)
            max_pages: Maximum number of pages to scrape
            
        Returns:
            List of listing dictionaries
        """
        self._init_driver()
        all_listings = []
        
        try:
            for page in range(1, max_pages + 1):
                logger.info(f"Scraping page {page}/{max_pages}")
                
                search_url = self.BASE_URL.format(page)
                html = self.fetch_page_source(search_url)
                
                if not html:
                    logger.warning(f"Skipping search page {page}")
                    continue
                
                try:
                    soup = BeautifulSoup(html, "lxml")
                    
                    # Find main listings section
                    main_section = soup.find("main", class_="articles")
                    if not main_section:
                        logger.warning(f"No listings section found on page {page}")
                        continue
                    
                    # Extract all listing links
                    links = [
                        urljoin(self.DETAIL_BASE, a["href"])
                        for a in main_section.find_all("a", href=True)
                        if "/artikal/" in a.get("href", "")
                    ]
                    
                    # Remove duplicates
                    links = list(dict.fromkeys(links))
                    
                    logger.info(f"📄 Page {page}: found {len(links)} listings")
                    
                    if not links:
                        logger.info("⚠️  No more listings found")
                        break
                    
                    # Parse each listing
                    for idx, link in enumerate(links, 1):
                        logger.info(f"\n{'='*80}")
                        logger.info(f"Listing {idx}/{len(links)} on page {page}")
                        logger.info(f"{'='*80}")
                        
                        try:
                            data = self.parse_detail_page(link)
                            if data:
                                all_listings.append(data)
                                logger.info(f"✅ Total scraped: {len(all_listings)}")
                            else:
                                logger.warning(f"⚠️  No data extracted")
                            
                            # Random delay to be respectful
                            delay_time = random.uniform(*self.delay)
                            logger.info(f"⏳ Waiting {delay_time:.1f}s...")
                            time.sleep(delay_time)
                            
                        except Exception as e:
                            logger.error(f"❌ Error on listing {link}: {e}")
                            continue
                    
                except Exception as e:
                    logger.error(f"Failed to parse search page {page} → {e}")
                    continue
            
            logger.info(f"Total listings scraped: {len(all_listings)}")
            return all_listings
            
        finally:
            self._close_driver()


if __name__ == "__main__":
    # Test the scraper
    print("🧪 Testing OLX Scraper...")
    print("="*60)
    
    scraper = OLXScraper(delay=(1, 2))
    
    try:
        listings = scraper.scrape_listings(max_pages=1)
        
        print(f"\n✅ Scraped {len(listings)} listings")
        
        if listings:
            print("\n📋 Sample listing:")
            sample = listings[0]
            for key, value in sample.items():
                if value is not None:
                    print(f"  {key}: {value}")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
