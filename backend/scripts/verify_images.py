#!/usr/bin/env python3
"""
Manual standalone verification script for campaign media assets.
Run manually only: python backend/scripts/verify_images.py
Never imported at application startup.
"""
import sys
import os
import urllib.request

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.media_map import IMAGE_MAP

def verify_all_images():
    print(f"{'Campaign ID':<20} | {'Field':<12} | {'HTTP':<5} | {'Content-Type':<12} | {'Matches Topic'}")
    print("-" * 80)

    all_verified = True
    for cid, data in IMAGE_MAP.items():
        urls_to_check = [('cover_url', data['cover_url'])]
        for idx, ad_url in enumerate(data['ad_images']):
            urls_to_check.append((f'ad_image_{idx+1}', ad_url))
        if 'story_image' in data:
            urls_to_check.append(('story_image', data['story_image']))
        
        for field_name, url in urls_to_check:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
            try:
                with urllib.request.urlopen(req, timeout=10) as resp:
                    status = resp.status
                    ctype = resp.headers.get('Content-Type', '').split(';')[0]
                    if status == 200 and 'image' in ctype:
                        match = 'yes'
                    else:
                        match = 'unverified'
                        all_verified = False
                    print(f"{cid:<20} | {field_name:<12} | {status:<5} | {ctype:<12} | {match} ({data['topic'][:25]}...)")
            except Exception as e:
                print(f"{cid:<20} | {field_name:<12} | ERR   | {str(e)[:12]} | unverified")
                all_verified = False

    print("-" * 80)
    print(f"All images verified HTTP 200: {all_verified}")
    return all_verified

if __name__ == '__main__':
    success = verify_all_images()
    sys.exit(0 if success else 1)
