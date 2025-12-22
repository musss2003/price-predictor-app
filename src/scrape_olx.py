#!/usr/bin/env python3
"""
Simple OLX Sarajevo scraper with exception handling.
Continues scraping even if timeouts or network errors occur.
"""
import os
import time
import csv
import re
import random
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.common.exceptions import WebDriverException, TimeoutException

# --- Paths ---
firefox_binary = "/usr/bin/firefox"
geckodriver_binary = "/home/mustafasinanovic/miniforge3/bin/geckodriver"

# --- Config ---
BASE_URL = "https://olx.ba/pretraga?attr=&attr_encoded=1&q=stanovi&category_id=23&page={}&canton=9"
OUTPUT_CSV = "data/sarajevo_flats.csv"
MAX_PAGES = 50
REQUEST_DELAY = (2, 5)

os.makedirs("data", exist_ok=True)

def clean_text(s):
    return " ".join(s.split()).strip() if s else None

def extract_price(text):
    if not text:
        return None
    cleaned = re.sub(r"[^0-9]", "", text)
    return int(cleaned) if cleaned else None

def extract_number(text):
    if not text:
        return None
    m = re.search(r"(\d+)", text)
    return int(m.group(1)) if m else None

def fetch_page_source(url, driver):
    try:
        driver.get(url)
        time.sleep(3)  # simple wait
        return driver.page_source
    except (TimeoutException, WebDriverException, OSError) as e:
        print(f"[!] Failed to load page: {url} → {e}")
        return None
    except Exception as e:
        print(f"[!] Unexpected error loading page: {url} → {e}")
        return None

def parse_detail_page(url, driver):
    html = fetch_page_source(url, driver)
    if not html:
        return None

    try:
        soup = BeautifulSoup(html, "lxml")
        get_text = lambda sel: clean_text(soup.select_one(sel).get_text()) if soup.select_one(sel) else None

        title = get_text("h1") or get_text(".main-title-listing")
        price_numeric = extract_price(get_text(".price-heading"))

        municipality_tag = soup.find("div", class_="btn-pill city")
        if municipality_tag:
            for svg in municipality_tag.find_all("svg"): svg.decompose()
            municipality = clean_text(municipality_tag.get_text())
        else:
            municipality = None
        
        rooms = extract_number(get_text("div.required-wrap:nth-child(5) > div:nth-child(2) > h4:nth-child(2)"))
        square_m2_text = get_text("div.required-wrap:nth-child(6) > div:nth-child(2) > h4:nth-child(2)")
        try:
            square_m2 = float(square_m2_text.replace(",", ".")) if square_m2_text else None
        except:
            square_m2 = None

        details = {
            "title": title,
            "url": url,
            "price_numeric": price_numeric,
            "municipality": municipality,
            "condition": get_text("div.required-wrap:nth-child(2) > div:nth-child(2) > h4:nth-child(2)"),
            "ad_type": get_text("div.required-wrap:nth-child(3) > div:nth-child(2) > h4:nth-child(2)"),
            "property_type": get_text("div.required-wrap:nth-child(4) > div:nth-child(2) > h4:nth-child(2)"),
            "rooms": rooms,
            "square_m2": square_m2,
            "equipment": get_text("div.required-wrap:nth-child(7) > div:nth-child(2) > h4:nth-child(2)"),
            "level": get_text("div.required-wrap:nth-child(8) > div:nth-child(2) > h4:nth-child(2)"),
            "heating": get_text("div.required-wrap:nth-child(9) > div:nth-child(2) > h4:nth-child(2)")
        }
        print("Parsed:", details)
        return details
    except Exception as e:
        print(f"[!] Failed to parse details for {url} → {e}")
        return None

def scrape():
    options = Options()
    options.binary_location = firefox_binary
    options.add_argument("--headless")
    service = Service(executable_path=geckodriver_binary)
    driver = webdriver.Firefox(service=service, options=options)
    driver.set_page_load_timeout(120)

    fieldnames = ["title","url","price_numeric","municipality",
                  "condition","ad_type","property_type","rooms","square_m2","equipment","level","heating"]

    write_header = not os.path.exists(OUTPUT_CSV)
    with open(OUTPUT_CSV, "a", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        if write_header: writer.writeheader()

        for page in range(1, MAX_PAGES + 1):
            search_url = BASE_URL.format(page)
            html = fetch_page_source(search_url, driver)
            if not html:
                print(f"[!] Skipping search page {page}")
                continue

            try:
                soup = BeautifulSoup(html, "lxml")
                main_section = soup.find("main", class_="articles")
                if not main_section:
                    continue

                links = [urljoin("https://olx.ba", a["href"]) for a in main_section.find_all("a", href=True)]
                print(f"Page {page}: found {len(links)} listings")

                for link in links:
                    try:
                        data = parse_detail_page(link, driver)
                        if data:
                            writer.writerow(data)
                        time.sleep(random.uniform(*REQUEST_DELAY))
                    except Exception as e:
                        print(f"[!] Skipping listing {link} due to error → {e}")
            except Exception as e:
                print(f"[!] Failed to parse search page {page} → {e}")

    driver.quit()
    print(f"Finished. CSV saved at: {OUTPUT_CSV}")

if __name__ == "__main__":
    scrape()