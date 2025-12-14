"""
Nekretnine.ba Real Estate Scraper
Scrapes apartment listings from Nekretnine.ba using Selenium for dynamic content
Based on the proven notebook implementation
"""

import os
import time
import re
import math
import random
import logging
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import WebDriverException, TimeoutException
from datetime import datetime
from typing import List, Dict, Optional, Set
from supabase import Client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class NekretnineScraper:
    """Scraper for Nekretnine.ba property listings using Selenium"""
    
    # Base URL for Sarajevo Canton flats - matching your notebook
    BASE_URL = "https://nekretnine.ba/listing.php?lang=ba&sel=nekretnine&grad=65&naselje=&kat=3&subjekt=2&cij1=&cij2=&pov1=&pov2=&spr1=&spr2=&firma=&page={}"
    DETAIL_URL_PATTERN = r"^real-estate\.php\?lang=ba&sel=nekretnine&view="
    
    # Neighborhood to municipality mapping - from your notebook
    NEIGHBORHOOD_MAPPING = {
        # Sarajevo - Centar
        'Centar': 'Sarajevo - Centar', 'Marijin Dvor': 'Sarajevo - Centar',
        'Skenderija': 'Sarajevo - Centar', 'Mejtas': 'Sarajevo - Centar',
        'Mejtaš': 'Sarajevo - Centar', 'mejtaš': 'Sarajevo - Centar',
        'Džidžikovac': 'Sarajevo - Centar', 'Bjelave': 'Sarajevo - Centar',
        'Čobanija': 'Sarajevo - Centar', 'Šip': 'Sarajevo - Centar',
        'Koševo': 'Sarajevo - Centar', 'Koševsko brdo': 'Sarajevo - Centar',
        'Ferhadija': 'Sarajevo - Centar', 'Breka': 'Sarajevo - Centar',
        
        # Sarajevo - Stari Grad
        'Stari Grad': 'Sarajevo - Stari Grad', 'Baščaršija': 'Sarajevo - Stari Grad',
        'Alifakovac': 'Sarajevo - Stari Grad', 'Jekovac': 'Sarajevo - Stari Grad',
        'Vratnik': 'Sarajevo - Stari Grad', 'Bistrik': 'Sarajevo - Stari Grad',
        
        # Sarajevo - Novo Sarajevo
        'Novo Sarajevo': 'Sarajevo - Novo Sarajevo', 'Grbavica': 'Sarajevo - Novo Sarajevo',
        'Dolac Malta': 'Sarajevo - Novo Sarajevo', 'Ciglane': 'Sarajevo - Novo Sarajevo',
        'Hrasno': 'Sarajevo - Novo Sarajevo', 'Kovačići': 'Sarajevo - Novo Sarajevo',
        'Pofalići': 'Sarajevo - Novo Sarajevo',
        
        # Sarajevo - Novi Grad
        'Novi Grad': 'Sarajevo - Novi Grad', 'Švrakino Selo': 'Sarajevo - Novi Grad',
        'Alipašino Polje': 'Sarajevo - Novi Grad', 'Alipašino': 'Sarajevo - Novi Grad',
        'Čengić Vila': 'Sarajevo - Novi Grad', 'Zabrđe': 'Sarajevo - Novi Grad',
        'Dobrinja': 'Sarajevo - Novi Grad', 'Mojmilo': 'Sarajevo - Novi Grad',
        
        # Ilidža
        'Ilidža': 'Ilidža', 'Butmir': 'Ilidža', 'Hrasnica': 'Ilidža',
        'Sokolović Kolonija': 'Ilidža', 'Otes': 'Ilidža', 'Stup': 'Ilidža',
        
        # Other municipalities
        'Hadžići': 'Hadžići', 'Vogošća': 'Vogošća', 'Ilijaš': 'Ilijaš', 'Trnovo': 'Trnovo'
    }
    
    def __init__(self, delay: tuple = (2, 5), headless: bool = True, supabase_client: Client = None):
        """
        Initialize scraper with Selenium
        
        Args:
            delay: Tuple of (min, max) delay between requests in seconds
            headless: Run browser in headless mode
            supabase_client: Optional Supabase client for duplicate checking and saving
        """
        self.delay = delay
        self.headless = headless
        self.driver = None
        self.supabase = supabase_client
        self.existing_urls: Set[str] = set()
        
        # Load existing URLs if Supabase client provided
        if self.supabase:
            self._load_existing_urls()
    
    def _create_driver(self):
        """Create and configure Chrome WebDriver"""
        logger.info("Initializing Chrome WebDriver...")
        try:
            options = ChromeOptions()
            if self.headless:
                options.add_argument("--headless")
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-dev-shm-usage")
            options.add_argument("--disable-blink-features=AutomationControlled")
            options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
            
            # Set page load strategy to not wait for full page load
            options.set_capability("pageLoadStrategy", "none")
            
            self.driver = webdriver.Chrome(options=options)
            self.driver.set_page_load_timeout(10)
            logger.info("WebDriver started successfully")
            return self.driver
        except Exception as e:
            logger.error(f"Failed to start Chrome driver: {e}")
            return None
    
    @staticmethod
    def clean_text(s):
        """Clean and normalize text"""
        return " ".join(s.split()).strip() if s else None
    
    @staticmethod
    def extract_price(text):
        """Extract price as integer from text"""
        if not text:
            return None
        cleaned = re.sub(r"[^0-9]", "", text)
        return int(cleaned) if cleaned else None
    
    @staticmethod
    def extract_number(text):
        """Extract first number from text"""
        if not text:
            return None
        m = re.search(r"(\d+)", text)
        return int(m.group(1)) if m else None
    
    @staticmethod
    def extract_external_id(url: str) -> Optional[str]:
        """Extract external ID from Nekretnine URL"""
        if not url:
            return None
        
        # Try to extract ID from URL parameter: ?view=12345
        view_match = re.search(r'[?&]view=(\d+)', url)
        if view_match:
            return f"nekretnine_{view_match.group(1)}"
        
        # Try to extract from path: /nekretnine/12345
        path_match = re.search(r'/nekretnine/(\d+)', url)
        if path_match:
            return f"nekretnine_{path_match.group(1)}"
        
        # Fallback: use hash of URL
        import hashlib
        url_hash = hashlib.md5(url.encode()).hexdigest()[:12]
        return f"nekretnine_{url_hash}"
    
    def _load_existing_urls(self):
        """Load existing listing URLs from database to avoid duplicates"""
        try:
            logger.info("Loading existing Nekretnine listings from database...")
            response = self.supabase.table("listings_nekretnine").select("url").execute()
            self.existing_urls = {item['url'] for item in response.data if item.get('url')}
            logger.info(f"Loaded {len(self.existing_urls)} existing URLs")
        except Exception as e:
            logger.warning(f"Could not load existing URLs: {e}")
            self.existing_urls = set()
    
    def _is_duplicate(self, url: str) -> bool:
        """Check if listing URL already exists in database"""
        return url in self.existing_urls
    
    def _save_listings_to_database(self, listings: List[Dict]) -> int:
        """Save a batch of listings to database"""
        if not self.supabase or not listings:
            return 0
        
        try:
            # Filter out duplicates
            new_listings = [l for l in listings if not self._is_duplicate(l.get('url'))]
            
            if not new_listings:
                logger.info("    No new listings to save (all duplicates)")
                return 0
            
            # Prepare data for database
            db_listings = []
            for listing in new_listings:
                # Ensure external_id exists
                external_id = listing.get('external_id')
                if not external_id:
                    external_id = self.extract_external_id(listing.get('url'))
                
                db_listing = {
                    'external_id': external_id,
                    'title': listing.get('title'),
                    'url': listing.get('url'),
                    'price_numeric': listing.get('price_numeric'),
                    'municipality': listing.get('municipality'),
                    'property_type': listing.get('property_type', 'Stan'),
                    'ad_type': listing.get('ad_type', 'Prodaja'),
                    'rooms': listing.get('rooms'),
                    'square_m2': listing.get('square_m2'),
                    'latitude': listing.get('latitude'),
                    'longitude': listing.get('longitude'),
                    'equipment': listing.get('equipment'),
                    'description': listing.get('description', '')[:1000] if listing.get('description') else None,
                    'thumbnail_url': listing.get('thumbnail_url'),
                    'image_urls': listing.get('image_urls', []),
                    'last_updated': datetime.now().isoformat(),
                    'is_active': True,
                    'deal_score': 0  # Will be calculated later
                }
                db_listings.append(db_listing)
            
            # Insert into database
            response = self.supabase.table("listings_nekretnine").insert(db_listings).execute()
            saved_count = len(response.data) if response.data else 0
            
            # Update existing URLs cache
            for listing in new_listings:
                if listing.get('url'):
                    self.existing_urls.add(listing['url'])
            
            logger.info(f"    ✅ Saved {saved_count} new listings to database")
            return saved_count
            
        except Exception as e:
            logger.error(f"    ❌ Error saving to database: {e}")
            return 0
    
    def _standardize_municipality(self, municipality: str, title: str = "", description: str = "") -> str:
        """
        Standardize municipality name using neighborhood mapping
        Based on your notebook's comprehensive mapping logic
        """
        if not municipality:
            return None
        
        # Combine all text for searching
        search_text = f"{municipality} {title} {description}".lower()
        
        # Try to find matching neighborhood
        for neighborhood, target_municipality in self.NEIGHBORHOOD_MAPPING.items():
            if neighborhood.lower() in search_text:
                return target_municipality
        
        # Return as-is if no mapping found
        return municipality
    
    def fetch_page_source(self, url: str, short_wait: int = 10) -> Optional[str]:
        """
        Load URL and return HTML (may be partial)
        Based on your notebook's fetch_page_source function
        """
        try:
            logger.debug(f"Loading URL: {url}")
            self.driver.get(url)
            time.sleep(short_wait)
            return self.driver.page_source
        except (TimeoutException, WebDriverException, OSError) as e:
            logger.warning(f"Failed to load page {url}: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error loading {url}: {e}")
            return None
    
    def extract_images_from_carousel(self, soup: BeautifulSoup) -> List[str]:
        """
        Extract all image URLs from Slick carousel slider
        
        Images are in <a> tags with class 'item mfp-gallery slick-slide'
        and have data-background-image or href attributes with the image URL.
        
        Returns:
            List of unique image URLs
        """
        try:
            image_urls = []
            
            # Find the slick carousel container
            slick_list = soup.find('div', class_='slick-list')
            if not slick_list:
                logger.debug("No slick-list found")
                return []
            
            # Find all image links in the carousel
            image_links = slick_list.find_all('a', class_='item')
            
            for link in image_links:
                # Try data-background-image first
                img_url = link.get('data-background-image')
                
                # Fallback to href attribute
                if not img_url:
                    img_url = link.get('href')
                
                # Validate and clean URL
                if img_url:
                    # Make absolute URL if needed
                    if not img_url.startswith('http'):
                        img_url = urljoin('https://www.nekretnine1.pro', img_url)
                    
                    # Only add unique URLs (slick clones duplicates)
                    if img_url not in image_urls:
                        image_urls.append(img_url)
            
            logger.info(f"   🖼️  Found {len(image_urls)} images in carousel")
            return image_urls
            
        except Exception as e:
            logger.warning(f"Failed to extract carousel images: {e}")
            return []
    
    def extract_coordinates_from_leaflet(self, soup: BeautifulSoup) -> tuple:
        """
        Extract latitude and longitude from Leaflet map
        
        The Leaflet marker position is stored in the transform CSS property
        and can be calculated from tile coordinates.
        
        Returns:
            Tuple of (latitude, longitude) or (None, None)
        """
        try:
            # Method 1: Look for marker icon with transform position
            marker = soup.find("img", class_="leaflet-marker-icon")
            if marker:
                style = marker.get("style", "")
                # Extract translate3d values: transform: translate3d(371px, 200px, 0px)
                transform_match = re.search(r'translate3d\((\d+)px,\s*(\d+)px', style)
                if transform_match:
                    marker_x = int(transform_match.group(1))
                    marker_y = int(transform_match.group(2))
                    logger.debug(f"Marker position: x={marker_x}, y={marker_y}")
                    
                    # Look for tile URLs to determine zoom and center
                    tiles = soup.find_all("img", class_="leaflet-tile")
                    if tiles:
                        # Extract tile coordinates from URL: /16/36121/23865.png
                        # Format: /{zoom}/{x}/{y}.png
                        for tile in tiles:
                            src = tile.get("src", "")
                            tile_match = re.search(r'/(\d+)/(\d+)/(\d+)\.png', src)
                            if tile_match:
                                zoom = int(tile_match.group(1))
                                tile_x = int(tile_match.group(2))
                                tile_y = int(tile_match.group(3))
                                
                                # Convert tile coordinates to lat/lng
                                # OpenStreetMap tile formula
                                n = 2.0 ** zoom
                                lon_deg = tile_x / n * 360.0 - 180.0
                                lat_rad = math.atan(math.sinh(math.pi * (1 - 2 * tile_y / n)))
                                lat_deg = math.degrees(lat_rad)
                                
                                logger.info(f"   🗺️  Coordinates extracted from Leaflet: {lat_deg:.6f}, {lon_deg:.6f}")
                                return round(lat_deg, 6), round(lon_deg, 6)
            
            # Method 2: Look in script tags for map initialization
            scripts = soup.find_all("script")
            for script in scripts:
                if script.string:
                    # Look for setView([lat, lng], zoom)
                    map_match = re.search(r'setView\(\[(-?\d+\.\d+),\s*(-?\d+\.\d+)\]', script.string)
                    if map_match:
                        lat = float(map_match.group(1))
                        lng = float(map_match.group(2))
                        logger.info(f"   🗺️  Coordinates from setView: {lat}, {lng}")
                        return lat, lng
                    
                    # Look for L.marker([lat, lng])
                    marker_match = re.search(r'L\.marker\(\[(-?\d+\.\d+),\s*(-?\d+\.\d+)\]', script.string)
                    if marker_match:
                        lat = float(marker_match.group(1))
                        lng = float(marker_match.group(2))
                        logger.info(f"   🗺️  Coordinates from marker: {lat}, {lng}")
                        return lat, lng
            
            logger.debug("No coordinates found in Leaflet map")
            return None, None
            
        except Exception as e:
            logger.warning(f"Failed to extract Leaflet coordinates: {e}")
            return None, None
    
    def parse_detail_page(self, url: str) -> Optional[Dict]:
        """
        Parse listing detail page
        Based on your notebook's parse_detail_page function
        """
        html = self.fetch_page_source(url)
        if not html:
            return None
        
        try:
            soup = BeautifulSoup(html, "lxml")
            
            # Extract title (remove tag span)
            title_elem = soup.select_one("div.listing-titlebar-title h2")
            if title_elem:
                tag_span = title_elem.find("span", class_="listing-tag")
                if tag_span:
                    tag_span.decompose()
                title = self.clean_text(title_elem.get_text())
            else:
                title = None
            
            # Extract municipality (address/location)
            municipality_elem = soup.select_one("a.listing-address")
            municipality_raw = self.clean_text(municipality_elem.get_text()) if municipality_elem else None
            
            # Extract price
            price_elem = soup.select_one("span.re-slidep")
            price_numeric = self.extract_price(price_elem.get_text()) if price_elem else None
            
            # Extract property type
            property_type_elem = soup.find("b", string="TIP")
            property_type = self.clean_text(property_type_elem.find_next("div").get_text()) if property_type_elem else None
            
            # Extract ad type
            ad_type_elem = soup.find("b", string="SUBJEKT")
            ad_type = self.clean_text(ad_type_elem.find_next("div").get_text()) if ad_type_elem else None
            
            # Extract rooms
            rooms_elem = soup.find("b", string="BROJ SOBA")
            rooms_text = self.clean_text(rooms_elem.find_next("div").get_text()) if rooms_elem else None
            rooms = self.extract_number(rooms_text) if rooms_text else None
            
            # Extract square meters
            square_m2_elem = soup.find("b", string="POVRŠINA")
            square_m2 = None
            if square_m2_elem:
                area_text = square_m2_elem.find_next("div").get_text(strip=True)
                area_match = re.search(r'([\d,\.]+)', area_text)
                if area_match:
                    area_str = area_match.group(1).replace(',', '.')
                    try:
                        square_m2 = float(area_str)
                    except:
                        pass
            
            # Extract description
            description_head = soup.find("h3", string=re.compile("Opis nekretnine"))
            description = self.clean_text(description_head.find_next("p").get_text(" ")) if description_head else None
            
            # Extract equipment/amenities
            equipment_list = [self.clean_text(li.get_text()) for li in soup.select("ul.listing-features li")]
            equipment = ", ".join([e for e in equipment_list if e])
            
            # Extract coordinates from Leaflet map
            latitude, longitude = self.extract_coordinates_from_leaflet(soup)
            
            # Extract all images from carousel
            images = self.extract_images_from_carousel(soup)
            thumbnail_url = images[0] if images else None
            
            # Standardize municipality using mapping
            municipality = self._standardize_municipality(
                municipality_raw,
                title or "",
                description or ""
            )
            
            # Extract external_id from URL
            external_id = self.extract_external_id(url)
            
            details = {
                "external_id": external_id,
                "title": title,
                "url": url,
                "price_numeric": price_numeric,
                "municipality": municipality,
                "property_type": property_type,
                "ad_type": ad_type,
                "rooms": rooms,
                "square_m2": square_m2,
                "latitude": latitude,
                "longitude": longitude,
                "equipment": equipment,
                "description": description,
                "thumbnail_url": thumbnail_url,
                "image_urls": images,
                "last_updated": datetime.now().isoformat()
            }
            
            logger.info(f"Parsed: {title[:50]}... - {price_numeric} KM")
            return details
            
        except Exception as e:
            logger.error(f"Failed to parse {url}: {e}")
            return None
    
    def scrape_page_listings(self, page_num: int) -> List[str]:
        """
        Scrape all listing URLs from a single search results page
        Based on your notebook's scrape_page_listings function
        """
        url = self.BASE_URL.format(page_num)
        logger.info(f"Fetching search page {page_num}")
        
        html = self.fetch_page_source(url)
        if not html:
            logger.warning(f"No HTML for page {page_num}")
            return []
        
        try:
            soup = BeautifulSoup(html, "lxml")
            links = [
                urljoin("https://nekretnine.ba/", a["href"])
                for a in soup.find_all("a", href=re.compile(self.DETAIL_URL_PATTERN))
            ]
            
            logger.info(f"Found {len(links)} listings on page {page_num}")
            return links
            
        except Exception as e:
            logger.error(f"Failed to parse search page {page_num}: {e}")
            return []
    
    def scrape_listings(self, max_pages: int = 10, save_per_page: bool = True) -> Dict:
        """
        Main scraping method with page-by-page saving
        
        Args:
            max_pages: Maximum number of pages to scrape
            save_per_page: Save to database after each page (recommended for long scrapes)
            
        Returns:
            Dictionary with scraping statistics
        """
        if not self.driver:
            self.driver = self._create_driver()
            if not self.driver:
                logger.error("Failed to create driver")
                return {'success': False, 'error': 'Driver creation failed'}
        
        all_listings = []
        total_saved = 0
        total_duplicates = 0
        total_found = 0
        
        logger.info(f"\n{'='*60}")
        logger.info(f"Starting Nekretnine.ba scrape: max_pages={max_pages}, save_per_page={save_per_page}")
        logger.info(f"{'='*60}\n")
        
        try:
            # Process pages one by one
            for page in range(1, max_pages + 1):
                logger.info(f"📄 Processing page {page}/{max_pages}")
                
                # Get listing URLs from this page
                urls = self.scrape_page_listings(page)
                if not urls:
                    logger.info(f"  No listings found on page {page}, stopping")
                    break
                
                # Check for duplicates
                new_urls = [url for url in urls if not self._is_duplicate(url)]
                duplicate_count = len(urls) - len(new_urls)
                total_duplicates += duplicate_count
                total_found += len(urls)
                
                logger.info(f"  Found {len(urls)} listings ({len(new_urls)} new, {duplicate_count} duplicates)")
                
                if not new_urls:
                    logger.info(f"  All listings on page {page} are duplicates, continuing...")
                    time.sleep(random.uniform(1, 2))
                    continue
                
                # Scrape details for new listings
                logger.info(f"  Scraping details for {len(new_urls)} new listings...")
                page_listings = []
                
                for i, url in enumerate(new_urls, 1):
                    logger.info(f"    [{i}/{len(new_urls)}] Scraping: {url[:80]}...")
                    
                    listing_data = self.parse_detail_page(url)
                    if listing_data:
                        page_listings.append(listing_data)
                        logger.info(f"      ✓ Success: {listing_data.get('title', 'N/A')[:50]}...")
                    else:
                        logger.warning(f"      ✗ Failed to parse")
                    
                    # Respectful delay between detail pages
                    time.sleep(random.uniform(*self.delay))
                
                all_listings.extend(page_listings)
                
                # Save to database after each page
                if save_per_page and self.supabase and page_listings:
                    saved = self._save_listings_to_database(page_listings)
                    total_saved += saved
                
                # Delay before next search page
                time.sleep(random.uniform(1, 2))
            
            # Summary
            logger.info(f"\n{'='*60}")
            logger.info(f"✅ Nekretnine.ba Scraping Complete!")
            logger.info(f"  Total pages processed: {page}")
            logger.info(f"  Total listings found: {total_found}")
            logger.info(f"  New listings scraped: {len(all_listings)}")
            logger.info(f"  Duplicates skipped: {total_duplicates}")
            logger.info(f"  Saved to database: {total_saved}")
            logger.info(f"{'='*60}\n")
            
            return {
                'success': True,
                'source': 'nekretnine',
                'listings': all_listings,
                'total_found': total_found,
                'new_count': len(all_listings),
                'duplicate_count': total_duplicates,
                'saved_count': total_saved,
                'pages_scraped': page
            }
            
        except Exception as e:
            logger.error(f"❌ Error during scraping: {e}")
            import traceback
            traceback.print_exc()
            return {
                'success': False,
                'error': str(e),
                'listings': all_listings,
                'new_count': len(all_listings),
                'saved_count': total_saved
            }
        finally:
            self.cleanup()
    
    def cleanup(self):
        """Close the browser"""
        if self.driver:
            try:
                self.driver.quit()
                logger.info("Browser closed")
            except:
                pass
            self.driver = None
    
    def __del__(self):
        """Destructor to ensure cleanup"""
        self.cleanup()


if __name__ == "__main__":
    # Test the scraper
    scraper = NekretnineScraper()
    listings = scraper.scrape_listings(max_pages=2)
    print(f"\nScraped {len(listings)} listings")
    if listings:
        print("\nSample listing:")
        import json
        print(json.dumps(listings[0], indent=2, ensure_ascii=False))
    
    def scrape_listings(self, 
                       property_type: str = 'stan',
                       ad_type: str = 'prodaja',
                       location: str = '',
                       max_pages: int = 10) -> List[Dict]:
        """
        Scrape property listings from search results
        
        Args:
            property_type: Type of property (stan, kuća, etc.)
            ad_type: Type of ad (prodaja, iznajmljivanje)
            location: Location filter
            max_pages: Maximum number of pages to scrape
            
        Returns:
            List of property dictionaries
        """
        all_listings = []
        
        for page in range(1, max_pages + 1):
            logger.info(f"Scraping page {page}/{max_pages}")
            
            # Build search URL
            params = {
                'tip_nekretnine': property_type,
                'vrsta_oglasa': ad_type,
                'stranica': page
            }
            
            if location:
                params['grad'] = location
            
            try:
                response = self.session.get(
                    self.SEARCH_URL,
                    params=params,
                    timeout=15
                )
                
                if response.status_code != 200:
                    logger.warning(f"Got status {response.status_code} for page {page}")
                    break
                
                listings = self._parse_listings_page(response.text, page)
                
                if not listings:
                    logger.info(f"No listings found on page {page}")
                    break
                
                all_listings.extend(listings)
                logger.info(f"Found {len(listings)} listings on page {page}")
                
                # Respectful delay
                if page < max_pages:
                    time.sleep(self.delay)
                    
            except Exception as e:
                logger.error(f"Error scraping page {page}: {str(e)}")
                break
        
        logger.info(f"Total listings scraped: {len(all_listings)}")
        return all_listings
    
    def _parse_listings_page(self, html: str, page_num: int) -> List[Dict]:
        """Parse listings from a search results page"""
        soup = BeautifulSoup(html, 'html.parser')
        listings = []
        
        # Try multiple possible selectors
        containers = (
            soup.find_all('article', class_='itemBox') or
            soup.find_all('div', class_='property-item') or
            soup.find_all('div', class_='listing-item') or
            soup.find_all('div', {'data-property-id': True}) or
            []
        )
        
        for container in containers:
            try:
                listing = self._extract_listing_data(container, page_num)
                if listing and listing.get('external_id'):
                    listings.append(listing)
            except Exception as e:
                logger.warning(f"Error extracting listing: {str(e)}")
                continue
        
        return listings
    
    def _extract_listing_data(self, container, page_num: int) -> Optional[Dict]:
        """Extract data from a single listing container"""
        
        # Extract title and URL
        title_elem = container.find('h3') or container.find('h2') or container.find('a', class_='title')
        if not title_elem:
            return None
        
        link = title_elem.find('a') if title_elem.name != 'a' else title_elem
        if not link:
            return None
        
        title = link.text.strip()
        url = urljoin(self.BASE_URL, link.get('href', ''))
        
        # Extract external ID from URL
        external_id = self._extract_id_from_url(url)
        if not external_id:
            external_id = f"nekretnine_{hash(url) % 10000000}"
        
        # Extract price
        price_elem = container.find('span', class_='price') or container.find('div', class_='price')
        price_text = price_elem.text.strip() if price_elem else ''
        price_numeric = self._extract_price(price_text)
        
        # Extract location
        location_elem = container.find('span', class_='location') or container.find('div', class_='location')
        location = location_elem.text.strip() if location_elem else ''
        municipality = self._extract_municipality(location or title)
        
        # Extract details (rooms, size, etc.)
        details = self._extract_details(container)
        
        # Extract image
        img = container.find('img')
        thumbnail_url = None
        if img:
            thumbnail_url = img.get('data-src') or img.get('src') or img.get('data-lazy')
            if thumbnail_url and not thumbnail_url.startswith('http'):
                thumbnail_url = urljoin(self.BASE_URL, thumbnail_url)
        
        # Build listing dictionary
        listing = {
            'external_id': external_id,
            'source': 'nekretnine_ba',
            'url': url,
            'title': title,
            'price_numeric': price_numeric,
            'municipality': municipality,
            'rooms': details.get('rooms'),
            'square_m2': details.get('square_m2'),
            'thumbnail_url': thumbnail_url,
            'description': self._extract_description(container),
            'posted_date': datetime.now().isoformat(),
            'bathrooms': details.get('bathrooms'),
            'level': details.get('level'),
            'heating': details.get('heating'),
            'condition': details.get('condition'),
            'property_type': 'Stan',
            'ad_type': 'Prodaja'
        }
        
        return listing
    
    def _extract_details(self, container) -> Dict:
        """Extract property details like rooms, size, etc."""
        details = {}
        
        # Look for detail list
        detail_list = container.find('ul', class_='list') or container.find('ul', class_='details')
        if detail_list:
            items = detail_list.find_all('li')
            for item in items:
                text = item.text.strip().lower()
                
                # Extract rooms
                if 'soba' in text or 'room' in text:
                    rooms = re.search(r'(\d+(?:\.\d+)?)', text)
                    if rooms:
                        details['rooms'] = float(rooms.group(1))
                
                # Extract size
                if 'm²' in text or 'm2' in text or 'kvadrat' in text:
                    size = re.search(r'(\d+(?:\.\d+)?)', text)
                    if size:
                        details['square_m2'] = float(size.group(1))
                
                # Extract bathrooms
                if 'kupatil' in text or 'bathroom' in text or 'wc' in text:
                    bathrooms = re.search(r'(\d+)', text)
                    if bathrooms:
                        details['bathrooms'] = int(bathrooms.group(1))
                
                # Extract level/floor
                if 'sprat' in text or 'kat' in text or 'floor' in text:
                    details['level'] = text
                
                # Extract heating
                if 'grijanje' in text or 'heating' in text:
                    details['heating'] = text
                
                # Extract condition
                if 'stanje' in text or 'condition' in text:
                    details['condition'] = text
        
        return details
    
    def _extract_price(self, price_text: str) -> Optional[int]:
        """Extract numeric price from text"""
        if not price_text:
            return None
        
        # Remove currency symbols and clean up
        price_clean = re.sub(r'[^\d,.]', '', price_text)
        price_clean = price_clean.replace('.', '').replace(',', '')
        
        try:
            return int(price_clean)
        except ValueError:
            return None
    
    def _extract_municipality(self, text: str) -> str:
        """Extract municipality from location text or title"""
        municipalities = [
            'Centar', 'Novo Sarajevo', 'Stari Grad', 'Novi Grad',
            'Ilidža', 'Vogošća', 'Hadžići', 'Ilijaš', 'Trnovo',
            'Banja Luka', 'Tuzla', 'Zenica', 'Mostar', 'Bijeljina'
        ]
        
        text_lower = text.lower()
        for municipality in municipalities:
            if municipality.lower() in text_lower:
                return municipality
        
        return 'Ostalo'
    
    def _extract_id_from_url(self, url: str) -> Optional[str]:
        """Extract property ID from URL"""
        # Try to find ID in URL path or query params
        match = re.search(r'/(\d+)', url)
        if match:
            return f"nekretnine_{match.group(1)}"
        
        # Try query parameters
        parsed = urlparse(url)
        params = parse_qs(parsed.query)
        if 'id' in params:
            return f"nekretnine_{params['id'][0]}"
        
        return None
    
    def _extract_description(self, container) -> str:
        """Extract property description"""
        desc_elem = container.find('p', class_='description') or container.find('div', class_='description')
        if desc_elem:
            return desc_elem.text.strip()[:500]  # Limit to 500 chars
        return ''
    
    def scrape_detail_page(self, url: str) -> Optional[Dict]:
        """
        Scrape detailed information from a property detail page
        
        Args:
            url: URL of the property detail page
            
        Returns:
            Dictionary with detailed property information
        """
        try:
            response = self.session.get(url, timeout=15)
            if response.status_code != 200:
                return None
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            details = {}
            
            # Extract all images
            image_gallery = soup.find('div', class_='gallery') or soup.find('div', class_='images')
            if image_gallery:
                images = image_gallery.find_all('img')
                image_urls = []
                for img in images:
                    img_url = img.get('data-src') or img.get('src')
                    if img_url and img_url.startswith('http'):
                        image_urls.append(img_url)
                details['image_urls'] = image_urls[:10]  # Limit to 10 images
            
            # Extract full description
            desc_elem = soup.find('div', class_='description') or soup.find('div', class_='content')
            if desc_elem:
                details['description'] = desc_elem.text.strip()
            
            # Extract additional features
            features_list = soup.find('ul', class_='features') or soup.find('div', class_='amenities')
            if features_list:
                features_text = features_list.text.lower()
                details['elevator'] = 'lift' in features_text or 'dizalo' in features_text
                details['balcony'] = 'balkon' in features_text or 'balcony' in features_text
                details['terrace'] = 'terasa' in features_text or 'terrace' in features_text
                details['parking_spaces'] = 1 if 'parking' in features_text or 'garaža' in features_text else 0
            
            # Extract seller information
            seller_elem = soup.find('div', class_='seller') or soup.find('div', class_='contact')
            if seller_elem:
                seller_name = seller_elem.find('span', class_='name')
                if seller_name:
                    details['seller_name'] = seller_name.text.strip()
                
                phone = seller_elem.find('a', href=re.compile(r'tel:'))
                if phone:
                    details['seller_phone'] = phone.text.strip()
            
            time.sleep(self.delay)  # Be respectful
            return details
            
        except Exception as e:
            logger.error(f"Error scraping detail page {url}: {str(e)}")
            return None


if __name__ == "__main__":
    # Test the scraper
    scraper = NekretnineScraper(delay=1.0)
    
    print("🧪 Testing Nekretnine.ba scraper...")
    print("="*60)
    
    listings = scraper.scrape_listings(max_pages=1)
    
    print(f"\n✅ Scraped {len(listings)} listings")
    
    if listings:
        print("\n📋 Sample listing:")
        sample = listings[0]
        for key, value in sample.items():
            if value is not None:
                print(f"  {key}: {value}")
