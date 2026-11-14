#!/usr/bin/env python3
"""
GitFeed - OPML Tool
Convert between OPML 2.0 and feeds.json.
Allows users to import existing subscriptions or backup feeds to standard OPML.
"""

import sys
import os
import json
import xml.etree.ElementTree as ET
from xml.dom import minidom
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FEEDS_CONFIG_PATH = os.path.join(BASE_DIR, "feeds.json")


def sanitize_id(text: str) -> str:
    text = text.lower().strip()
    return "".join(c if c.isalnum() or c in "-_" else "-" for c in text).strip("-") or "feed"


def import_opml(opml_path: str):
    if not os.path.exists(opml_path):
        print(f"Error: OPML file '{opml_path}' does not exist.")
        sys.exit(1)

    try:
        tree = ET.parse(opml_path)
        root = tree.getroot()
    except Exception as e:
        print(f"Error parsing OPML: {e}")
        sys.exit(1)

    existing_config = {"categories": [], "feeds": []}
    if os.path.exists(FEEDS_CONFIG_PATH):
        try:
            with open(FEEDS_CONFIG_PATH, "r", encoding="utf-8") as f:
                existing_config = json.load(f)
        except Exception:
            pass

    existing_feed_urls = {f["url"].strip().lower() for f in existing_config.get("feeds", [])}
    categories_map = {c["id"]: c for c in existing_config.get("categories", [])}

    body = root.find("body")
    if body is None:
        body = root

    new_feeds = []

    def parse_node(node, current_cat_id="tech-news"):
        for child in node.findall("outline"):
            xml_url = child.get("xmlUrl") or child.get("xmlurl")
            title = child.get("title") or child.get("text") or "Untitled Feed"
            html_url = child.get("htmlUrl") or child.get("htmlurl") or ""

            if xml_url:
                xml_url = xml_url.strip()
                if xml_url.lower() in existing_feed_urls:
                    continue
                feed_id = sanitize_id(title)
                # Ensure unique id
                counter = 1
                base_feed_id = feed_id
                while any(f["id"] == feed_id for f in existing_config.get("feeds", []) + new_feeds):
                    feed_id = f"{base_feed_id}-{counter}"
                    counter += 1

                feed_obj = {
                    "id": feed_id,
                    "title": title,
                    "url": xml_url,
                    "siteUrl": html_url or xml_url,
                    "category": current_cat_id,
                    "description": child.get("description", ""),
                    "enabled": True
                }
                new_feeds.append(feed_obj)
                existing_feed_urls.add(xml_url.lower())
            else:
                # Folder / Category node
                cat_name = title
                cat_id = sanitize_id(cat_name)
                if cat_id not in categories_map:
                    categories_map[cat_id] = {
                        "id": cat_id,
                        "name": cat_name,
                        "nameEn": cat_name,
                        "icon": "folder"
                    }
                parse_node(child, current_cat_id=cat_id)

    parse_node(body)

    all_categories = list(categories_map.values())
    all_feeds = existing_config.get("feeds", []) + new_feeds

    result = {
        "categories": all_categories,
        "feeds": all_feeds
    }

    with open(FEEDS_CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"Successfully imported {len(new_feeds)} new feeds from '{opml_path}'.")
    print(f"Total feeds now: {len(all_feeds)}. Saved to {FEEDS_CONFIG_PATH}")


def export_opml(output_path: str):
    if not os.path.exists(FEEDS_CONFIG_PATH):
        print(f"Error: {FEEDS_CONFIG_PATH} does not exist.")
        sys.exit(1)

    with open(FEEDS_CONFIG_PATH, "r", encoding="utf-8") as f:
        config = json.load(f)

    categories = {c["id"]: c.get("name", c["id"]) for c in config.get("categories", [])}
    feeds = config.get("feeds", [])

    # Group feeds by category
    cat_groups = {}
    for feed in feeds:
        cat_id = feed.get("category", "default")
        cat_groups.setdefault(cat_id, []).append(feed)

    opml = ET.Element("opml", version="2.0")
    head = ET.SubElement(opml, "head")
    title = ET.SubElement(head, "title")
    title.text = "GitFeed RSS Subscriptions"
    date_created = ET.SubElement(head, "dateCreated")
    date_created.text = datetime.utcnow().strftime("%a, %d %b %Y %H:%M:%S GMT")

    body = ET.SubElement(opml, "body")

    for cat_id, cat_feeds in cat_groups.items():
        cat_title = categories.get(cat_id, cat_id)
        folder = ET.SubElement(body, "outline", text=cat_title, title=cat_title)
        for feed in cat_feeds:
            ET.SubElement(
                folder,
                "outline",
                type="rss",
                text=feed.get("title", feed["id"]),
                title=feed.get("title", feed["id"]),
                xmlUrl=feed["url"],
                htmlUrl=feed.get("siteUrl", "")
            )

    xml_str = ET.tostring(opml, encoding="utf-8")
    pretty_xml = minidom.parseString(xml_str).toprettyxml(indent="  ", encoding="utf-8")

    with open(output_path, "wb") as f:
        f.write(pretty_xml)

    print(f"Successfully exported {len(feeds)} feeds to '{output_path}'.")


def main():
    if len(sys.argv) < 3:
        print("Usage:")
        print("  python scripts/opml_tool.py import <path_to_file.opml>")
        print("  python scripts/opml_tool.py export <output_path.opml>")
        sys.exit(1)

    action = sys.argv[1].lower()
    path = sys.argv[2]

    if action == "import":
        import_opml(path)
    elif action == "export":
        export_opml(path)
    else:
        print(f"Unknown action: {action}. Use 'import' or 'export'.")


if __name__ == "__main__":
    main()
