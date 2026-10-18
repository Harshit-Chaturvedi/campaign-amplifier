import urllib.request

IMAGE_MAP = {
    'cmp-clean-water': {
        'cover_url': 'https://images.unsplash.com/photo-1521207418485-99c705420785?w=1200&q=80',
        'ad_images': ['https://images.unsplash.com/photo-1429056147644-31d142d21ac2?w=1200&q=80'],
        'story_image': 'https://images.unsplash.com/photo-1521207418485-99c705420785?w=1200&q=80',
        'topic': 'Water tap running / drinking water fountain',
    },
    'cmp-tree-canopy': {
        'cover_url': 'https://images.pexels.com/photos/34439096/pexels-photo-34439096.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'ad_images': ['https://images.pexels.com/photos/26742744/pexels-photo-26742744.jpeg?auto=compress&cs=tinysrgb&w=1200'],
        'topic': 'Urban street tree canopy / tree-lined avenue',
    },
    'cmp-school-air': {
        'cover_url': 'https://images.unsplash.com/photo-1617721928610-4d953b81bba8?w=1200&q=80',
        'ad_images': ['https://images.unsplash.com/photo-1617721928610-4d953b81bba8?w=1200&q=80'],
        'topic': 'School classroom desks and windows ventilation',
    },
    'cmp-rural-clinic': {
        'cover_url': 'https://images.pexels.com/photos/12585206/pexels-photo-12585206.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'ad_images': ['https://images.pexels.com/photos/5234501/pexels-photo-5234501.jpeg?auto=compress&cs=tinysrgb&w=1200'],
        'topic': 'Medical stethoscope / clinical screening examination',
    },
    'cmp-antibiotic-watch': {
        'cover_url': 'https://images.pexels.com/photos/3786245/pexels-photo-3786245.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'ad_images': ['https://images.pexels.com/photos/3908180/pexels-photo-3908180.jpeg?auto=compress&cs=tinysrgb&w=1200'],
        'topic': 'Microbiology petri dishes and research microscope',
    },
    'cmp-school-library': {
        'cover_url': 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&q=80',
        'ad_images': ['https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&q=80'],
        'topic': 'School library wooden bookshelves and books',
    },
    'cmp-ballot-plain': {
        'cover_url': 'https://images.pexels.com/photos/8846076/pexels-photo-8846076.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'ad_images': ['https://images.pexels.com/photos/7103106/pexels-photo-7103106.jpeg?auto=compress&cs=tinysrgb&w=1200'],
        'topic': 'Ballot papers and election voting booths',
    },
    'cmp-airport-noise': {
        'cover_url': 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=80',
        'ad_images': ['https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=80'],
        'topic': 'Commercial aircraft flying in sky near airport',
    },
    'cmp-repair-right': {
        'cover_url': 'https://images.pexels.com/photos/29253996/pexels-photo-29253996.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'ad_images': ['https://images.pexels.com/photos/30248663/pexels-photo-30248663.jpeg?auto=compress&cs=tinysrgb&w=1200'],
        'topic': 'Agricultural tractor and farming equipment in field',
    },
    'cmp-night-shelter': {
        'cover_url': 'https://images.pexels.com/photos/6675103/pexels-photo-6675103.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'ad_images': ['https://images.pexels.com/photos/10799048/pexels-photo-10799048.jpeg?auto=compress&cs=tinysrgb&w=1200'],
        'topic': 'Snow-covered urban night street and cold winter pavement',
    },
    'cmp-school-crossing': {
        'cover_url': 'https://images.pexels.com/photos/17500082/pexels-photo-17500082.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'ad_images': ['https://images.pexels.com/photos/6025036/pexels-photo-6025036.jpeg?auto=compress&cs=tinysrgb&w=1200'],
        'topic': 'Pedestrian crosswalk painted lines and traffic crossing signals',
    },
    'cmp-odeon-theatre': {
        'cover_url': 'https://images.unsplash.com/photo-1561722798-9a732d141027?w=1200&q=80',
        'ad_images': ['https://images.unsplash.com/photo-1561722798-9a732d141027?w=1200&q=80'],
        'topic': 'Cinema auditorium with rows of red theatre seats',
    },
    'cmp-energy-coop': {
        'cover_url': 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=1200&q=80',
        'ad_images': ['https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=1200&q=80'],
        'topic': 'Rooftop solar panels and clean community microgrid',
    },
    'cmp-transit-map': {
        'cover_url': 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&q=80',
        'ad_images': ['https://images.unsplash.com/photo-1573466359556-977b406e0008?w=1200&q=80'],
        'topic': 'Red commuter transit bus and urban transit network',
    },
}

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
