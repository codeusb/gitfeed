#!/usr/bin/env python3
"""
GitFeed - Core RSS Fetcher & Engine
Fetches RSS/Atom feeds, sanitizes HTML, deduplicates articles,
generates lightweight index and individual article files.
"""

import os
import sys
import json
import time
import hashlib
import re
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any, Tuple
from urllib.parse import urljoin, urlparse

import requests
import feedparser
from bs4 import BeautifulSoup
from dateutil import parser as date_parser

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FEEDS_CONFIG_PATH = os.path.join(BASE_DIR, "feeds.json")
DATA_DIR = os.path.join(BASE_DIR, "data")
ARTICLES_DIR = os.path.join(DATA_DIR, "articles")
INDEX_PATH = os.path.join(DATA_DIR, "index.json")
STATS_PATH = os.path.join(DATA_DIR, "stats.json")
FEEDS_CACHE_PATH = os.path.join(DATA_DIR, "feeds.json")

# Rolling retention limit: keep latest 1000 articles or up to 60 days
MAX_INDEX_ARTICLES = 1000
RETENTION_DAYS = 60
MAX_ARTICLES_PER_FEED = 60  # Prevent high-frequency feeds from flooding the index
MIN_ARTICLES_PER_FEED = 15  # Guarantee low-frequency weeklies are never crowded out

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36 GitFeed/1.0"
)

REQUEST_HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
    "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
}


def ensure_directories():
    os.makedirs(ARTICLES_DIR, exist_ok=True)
    os.makedirs(DATA_DIR, exist_ok=True)


def load_feeds_config() -> Dict[str, Any]:
    if not os.path.exists(FEEDS_CONFIG_PATH):
        raise FileNotFoundError(f"Configuration file not found: {FEEDS_CONFIG_PATH}")
    with open(FEEDS_CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def load_existing_index() -> List[Dict[str, Any]]:
    if os.path.exists(INDEX_PATH):
        try:
            with open(INDEX_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):
                    return data
        except Exception as e:
            print(f"Warning: Failed to parse existing index.json: {e}")
    return []


def generate_article_id(feed_id: str, entry: Any) -> str:
    guid = entry.get("id") or entry.get("guid") or entry.get("link") or entry.get("title") or str(time.time())
    raw_key = f"{feed_id}:{guid}"
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()[:16]


def parse_entry_date(entry: Any) -> str:
    """Returns ISO 8601 UTC string: YYYY-MM-DDTHH:MM:SSZ"""
    # Try feedparser parsed struct_time
    for attr in ("published_parsed", "updated_parsed", "created_parsed"):
        parsed = entry.get(attr)
        if parsed:
            try:
                dt = datetime(*parsed[:6], tzinfo=timezone.utc)
                return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
            except Exception:
                pass

    # Try raw string with dateutil
    for attr in ("published", "updated", "pubDate", "date"):
        raw = entry.get(attr)
        if raw and isinstance(raw, str):
            try:
                dt = date_parser.parse(raw)
                if not dt.tzinfo:
                    dt = dt.replace(tzinfo=timezone.utc)
                else:
                    dt = dt.astimezone(timezone.utc)
                return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
            except Exception:
                pass

    # Fallback to now
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def extract_content(entry: Any) -> str:
    """Extract richest available HTML content."""
    # Check 'content' list first
    if "content" in entry and entry.content:
        for c in entry.content:
            if isinstance(c, dict) and c.get("value"):
                return c["value"]

    # Check summary_detail or summary
    if entry.get("summary_detail") and entry.summary_detail.get("value"):
        return entry.summary_detail["value"]
    if entry.get("summary"):
        return entry["summary"]

    # Check description
    if entry.get("description"):
        return entry["description"]

    return ""


def clean_html(raw_html: str, base_url: str = "") -> Tuple[str, Optional[str], str]:
    """
    Cleans raw HTML.
    Returns:
        (sanitized_html, cover_image_url, plain_text_snippet)
    """
    if not raw_html:
        return "", None, ""

    soup = BeautifulSoup(raw_html, "html.parser")

    # Remove dangerous/unwanted tags
    for tag in soup(["script", "style", "iframe", "noscript", "meta", "form"]):
        tag.decompose()

    # Trackers and tracking 1x1 pixels
    for img in soup.find_all("img"):
        width = img.get("width")
        height = img.get("height")
        src = img.get("src") or ""
        if (width in ("1", "0") and height in ("1", "0")) or "tracker" in src.lower():
            img.decompose()

    # Find cover image before removing relative src
    cover_image = None
    for img in soup.find_all("img"):
        src = img.get("src") or img.get("data-src")
        if src:
            if base_url and not urlparse(src).netloc:
                src = urljoin(base_url, src)

            # Check if this is a valid article cover image (not an icon/badge/svg)
            width_str = str(img.get("width", "")).replace("px", "")
            height_str = str(img.get("height", "")).replace("px", "")
            is_small = False
            try:
                if width_str and int(width_str) <= 48:
                    is_small = True
                if height_str and int(height_str) <= 48:
                    is_small = True
            except ValueError:
                pass

            src_lower = src.lower()
            is_excluded = (
                is_small
                or src_lower.endswith(".svg")
                or src_lower.endswith(".gif")
                or "shields.io" in src_lower
                or "badge" in src_lower
                or "/assets/icons/" in src_lower
                or "tracker" in src_lower
            )

            if not cover_image and not is_excluded:
                cover_image = src

            # Add security & lazy loading
            img["src"] = src
            img["loading"] = "lazy"
            img["referrerpolicy"] = "no-referrer"
            img.attrs.pop("srcset", None)

    # Convert relative links in <a> tags
    if base_url:
        for a in soup.find_all("a", href=True):
            a["href"] = urljoin(base_url, a["href"])
            a["target"] = "_blank"
            a["rel"] = "noopener noreferrer"

    # Plain text snippet
    plain_text = re.sub(r"\s+", " ", soup.get_text()).strip()
    snippet = plain_text[:220] + ("..." if len(plain_text) > 220 else "")

    sanitized_html = str(soup)
    return sanitized_html, cover_image, snippet


def estimate_read_time(text: str) -> int:
    """Estimates reading time in minutes (supports English words & CJK characters)."""
    cjk_chars = len(re.findall(r"[\u4e00-\u9fff]", text))
    latin_words = len(re.findall(r"[a-zA-Z0-9]+", text))
    total_effective_words = (cjk_chars / 1.5) + latin_words
    minutes = max(1, round(total_effective_words / 220))
    return minutes


def fetch_single_feed(feed_cfg: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], Dict[str, Any], Optional[str]]:
    feed_id = feed_cfg["id"]
    feed_title = feed_cfg.get("title", feed_id)
    feed_url = feed_cfg["url"]
    site_url = feed_cfg.get("siteUrl") or feed_url

    print(f"-> Fetching [{feed_id}] ({feed_title}): {feed_url}")
    try:
        resp = requests.get(feed_url, headers=REQUEST_HEADERS, timeout=18)
        resp.raise_for_status()
        content = resp.content
    except Exception as e:
        err_msg = f"HTTP request failed: {str(e)}"
        print(f"   [Error] {err_msg}")
        return [], {}, err_msg

    try:
        parsed = feedparser.parse(content)
        if parsed.bozo and not parsed.entries:
            err_msg = f"Feed parse failed: {parsed.bozo_exception}"
            print(f"   [Error] {err_msg}")
            return [], {}, err_msg
    except Exception as e:
        err_msg = f"Parser exception: {str(e)}"
        print(f"   [Error] {err_msg}")
        return [], {}, err_msg

    feed_meta = {
        "title": parsed.feed.get("title") or feed_title,
        "description": parsed.feed.get("description") or feed_cfg.get("description", ""),
        "link": parsed.feed.get("link") or site_url,
    }

    articles = []
    for entry in parsed.entries:
        try:
            art_id = generate_article_id(feed_id, entry)
            art_link = entry.get("link") or site_url
            art_title = entry.get("title") or "Untitled"
            # Strip tags from title
            art_title = re.sub(r"<[^>]+>", "", art_title).strip()
            published_at = parse_entry_date(entry)
            author = entry.get("author") or feed_meta["title"]

            raw_html = extract_content(entry)
            sanitized_html, cover_img, snippet = clean_html(raw_html, base_url=art_link)

            # Check enclosures for audio/podcast or cover image
            attachments = []
            if "enclosures" in entry:
                for enc in entry.enclosures:
                    enc_url = enc.get("href") or enc.get("url")
                    enc_type = enc.get("type", "")
                    if enc_url:
                        attachments.append({
                            "url": enc_url,
                            "type": enc_type,
                            "length": enc.get("length")
                        })
                        if not cover_img and enc_type.startswith("image/"):
                            cover_img = enc_url

            read_time = estimate_read_time(snippet + " " + art_title)

            article_obj = {
                "id": art_id,
                "feedId": feed_id,
                "feedTitle": feed_meta["title"],
                "category": feed_cfg.get("category", "default"),
                "title": art_title,
                "link": art_link,
                "author": author,
                "publishedAt": published_at,
                "snippet": snippet,
                "coverImage": cover_img,
                "readTime": read_time,
                "content": sanitized_html,
                "attachments": attachments,
            }
            articles.append(article_obj)
        except Exception as item_err:
            print(f"   [Warn] Failed parsing entry in {feed_id}: {item_err}")
            continue

    print(f"   [OK] Retrieved {len(articles)} entries for {feed_id}")
    return articles, feed_meta, None


def run():
    print("==========================================")
    print(f"GitFeed fetch started at {datetime.now(timezone.utc).isoformat()}")
    print("==========================================")
    ensure_directories()

    config = load_feeds_config()
    feeds = config.get("feeds", [])
    categories = config.get("categories", [])

    existing_index = load_existing_index()
    existing_map = {item["id"]: item for item in existing_index}

    new_articles_count = 0
    updated_index_items = []
    feed_statuses = {}

    all_fetched_articles: List[Dict[str, Any]] = []

    for feed_cfg in feeds:
        if not feed_cfg.get("enabled", True):
            print(f"Skipping disabled feed: {feed_cfg.get('id')}")
            continue

        feed_id = feed_cfg["id"]
        articles, feed_meta, error = fetch_single_feed(feed_cfg)

        status_record = {
            "title": feed_cfg.get("title", feed_id),
            "category": feed_cfg.get("category", "default"),
            "url": feed_cfg["url"],
            "lastChecked": datetime.now(timezone.utc).isoformat(),
            "status": "error" if error else "ok",
            "articlesFetched": len(articles),
            "error": error
        }
        feed_statuses[feed_id] = status_record

        for art in articles:
            art_id = art["id"]
            all_fetched_articles.append(art)

            # Check if this article content is already saved on disk
            art_path = os.path.join(ARTICLES_DIR, f"{art_id}.json")
            if not os.path.exists(art_path):
                # Write full article JSON
                with open(art_path, "w", encoding="utf-8") as f:
                    json.dump(art, f, ensure_ascii=False, indent=2)
                new_articles_count += 1
            else:
                # If article existed, update if content length increased or missing
                pass

            # Prepare lightweight index entry (without heavy full HTML content)
            summary_item = {
                "id": art["id"],
                "feedId": art["feedId"],
                "feedTitle": art["feedTitle"],
                "category": art["category"],
                "title": art["title"],
                "link": art["link"],
                "author": art["author"],
                "publishedAt": art["publishedAt"],
                "snippet": art["snippet"],
                "coverImage": art["coverImage"],
                "readTime": art["readTime"]
            }
            existing_map[art_id] = summary_item

    # 1. Filter out articles belonging to feeds that no longer exist or are disabled
    active_feed_ids = {f["id"] for f in feeds if f.get("enabled", True)}
    valid_articles = [art for art in existing_map.values() if art.get("feedId") in active_feed_ids]

    # 2. Sort by publishedAt descending
    valid_articles.sort(key=lambda x: x.get("publishedAt", ""), reverse=True)

    # 3. Two-pass balanced retention:
    #    Pass 1: Ensure every active feed gets up to MIN_ARTICLES_PER_FEED
    #    Pass 2: Fill remaining capacity with articles within RETENTION_DAYS and MAX_ARTICLES_PER_FEED
    cutoff_date = (datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS)).strftime("%Y-%m-%dT%H:%M:%SZ")

    feed_buckets: Dict[str, List[Dict[str, Any]]] = {}
    for art in valid_articles:
        fid = art.get("feedId", "")
        feed_buckets.setdefault(fid, []).append(art)

    selected_ids = set()
    trimmed_index: List[Dict[str, Any]] = []

    # Pass 1: Guarantee minimum articles per active feed
    for fid, arts in feed_buckets.items():
        for art in arts[:MIN_ARTICLES_PER_FEED]:
            selected_ids.add(art["id"])
            trimmed_index.append(art)

    # Pass 2: Fill up with remaining articles within retention limits
    feed_counts = {fid: min(len(arts), MIN_ARTICLES_PER_FEED) for fid, arts in feed_buckets.items()}
    for art in valid_articles:
        art_id = art["id"]
        if art_id in selected_ids:
            continue
        fid = art.get("feedId", "")
        pub = art.get("publishedAt", "")
        if (
            len(trimmed_index) < MAX_INDEX_ARTICLES
            and pub >= cutoff_date
            and feed_counts.get(fid, 0) < MAX_ARTICLES_PER_FEED
        ):
            selected_ids.add(art_id)
            trimmed_index.append(art)
            feed_counts[fid] = feed_counts.get(fid, 0) + 1

    # Final sort descending by published date
    trimmed_index.sort(key=lambda x: x.get("publishedAt", ""), reverse=True)
    active_ids = {x["id"] for x in trimmed_index}

    # Write data/index.json
    with open(INDEX_PATH, "w", encoding="utf-8") as f:
        json.dump(trimmed_index, f, ensure_ascii=False, indent=2)

    # Clean up very old article files from disk if pruned from index and past retention
    deleted_files = 0
    try:
        for fname in os.listdir(ARTICLES_DIR):
            if fname.endswith(".json"):
                file_art_id = fname[:-5]
                if file_art_id not in active_ids:
                    # check file mtime
                    fpath = os.path.join(ARTICLES_DIR, fname)
                    mtime = datetime.fromtimestamp(os.path.getmtime(fpath), tz=timezone.utc)
                    if (datetime.now(timezone.utc) - mtime).days > RETENTION_DAYS:
                        os.remove(fpath)
                        deleted_files += 1
    except Exception as e:
        print(f"Warning during article pruning: {e}")

    # Copy current feeds.json to data/feeds.json for easy client access
    with open(FEEDS_CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump({
            "categories": categories,
            "feeds": feeds,
            "updatedAt": datetime.now(timezone.utc).isoformat()
        }, f, ensure_ascii=False, indent=2)

    # Write data/stats.json
    stats = {
        "lastUpdated": datetime.now(timezone.utc).isoformat(),
        "totalArticles": len(trimmed_index),
        "newArticlesInThisRun": new_articles_count,
        "prunedArticles": deleted_files,
        "activeFeeds": len([f for f in feeds if f.get("enabled", True)]),
        "feedStatuses": feed_statuses,
    }
    with open(STATS_PATH, "w", encoding="utf-8") as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)

    print("==========================================")
    print(f"Finished! New articles saved: {new_articles_count}")
    print(f"Total active articles in index: {len(trimmed_index)}")
    if deleted_files:
        print(f"Pruned {deleted_files} expired article files.")
    print("==========================================")


if __name__ == "__main__":
    run()
