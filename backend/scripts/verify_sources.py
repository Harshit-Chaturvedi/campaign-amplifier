#!/usr/bin/env python3
"""
Manual standalone verification script for campaign source URLs.
Run manually only: python backend/scripts/verify_sources.py
Never imported at application startup.
"""
import sys
import os
import httpx

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Target verified URLs defined for seed campaigns
SOURCES_TO_VERIFY = [
    # cmp-clean-water
    ("cmp-clean-water", "EPA National Drinking Water Standards", "https://www.epa.gov/ground-water-and-drinking-water"),
    ("cmp-clean-water", "EPA Lead and Copper Rule", "https://www.epa.gov/dwreginfo/lead-and-copper-rule"),
    ("cmp-clean-water", "EPA 3Ts School Drinking Water", "https://www.epa.gov/ground-water-and-drinking-water/3ts-reducing-lead-drinking-water"),
    ("cmp-clean-water", "EPA Action Link", "https://www.epa.gov/dwreginfo"),
    
    # cmp-tree-canopy
    ("cmp-tree-canopy", "EPA Urban Heat Island Research", "https://www.epa.gov/heatislands"),
    ("cmp-tree-canopy", "EPA Green Infrastructure Canopy", "https://www.epa.gov/green-infrastructure"),
    
    # cmp-school-air
    ("cmp-school-air", "EPA Healthy School Indoor Environments", "https://www.epa.gov/iaq-schools"),
    ("cmp-school-air", "EPA Indoor Air Quality Guidance", "https://www.epa.gov/indoor-air-quality-iaq"),
    
    # cmp-rural-clinic
    ("cmp-rural-clinic", "NIH Rural Health Research", "https://www.ncbi.nlm.nih.gov/pmc/"),
    ("cmp-rural-clinic", "NLM MedlinePlus Rural Health", "https://medlineplus.gov/ruralhealthconcerns.html"),
    
    # cmp-antibiotic-watch
    ("cmp-antibiotic-watch", "NCBI Antimicrobial Surveillance", "https://www.ncbi.nlm.nih.gov/books/NBK441921/"),
    ("cmp-antibiotic-watch", "NLM MedlinePlus Antibiotic Resistance", "https://medlineplus.gov/antibioticresistance.html"),
    
    # cmp-school-library
    ("cmp-school-library", "NCES School Library Survey", "https://nces.ed.gov/surveys/libraries/"),
    ("cmp-school-library", "IES Research & Evaluation", "https://ies.ed.gov/"),
    
    # cmp-ballot-plain
    ("cmp-ballot-plain", "Federal Plain Language Guidelines", "https://www.plainlanguage.gov/guidelines/"),
    ("cmp-ballot-plain", "National Archives Plain Writing", "https://www.archives.gov/open/plain-writing"),
    
    # cmp-airport-noise
    ("cmp-airport-noise", "EPA Clean Air Act Title IV Noise", "https://www.epa.gov/clean-air-act-overview/title-iv-noise-pollution"),
    ("cmp-airport-noise", "EPA Noise Control Act Summary", "https://www.epa.gov/laws-regulations/summary-noise-control-act"),
    
    # cmp-repair-right
    ("cmp-repair-right", "DOJ Antitrust Repair Restrictions", "https://www.justice.gov/atr"),
    ("cmp-repair-right", "NIST Manufacturing Extension AgTech", "https://www.nist.gov/mep"),
    
    # cmp-night-shelter
    ("cmp-night-shelter", "NLM MedlinePlus Hypothermia Guide", "https://medlineplus.gov/hypothermia.html"),
    ("cmp-night-shelter", "NWS Extreme Cold Safety", "https://www.weather.gov/safety/cold"),
    
    # cmp-school-crossing
    ("cmp-school-crossing", "FHWA Pedestrian and Bicycle Safety", "https://www.fhwa.dot.gov/environment/bicycle_pedestrian/"),
    ("cmp-school-crossing", "FHWA Environmental Review Policy", "https://www.fhwa.dot.gov/environment/"),
    
    # cmp-odeon-theatre
    ("cmp-odeon-theatre", "NPS Historic Preservation Fund", "https://www.nps.gov/subjects/historicpreservation/index.htm"),
    ("cmp-odeon-theatre", "NEA Grants & Guidelines", "https://www.arts.gov/grants"),
    
    # cmp-energy-coop
    ("cmp-energy-coop", "DOE National Community Solar", "https://www.energy.gov/communitysolar/community-solar"),
    ("cmp-energy-coop", "DOE Solar Energy Technologies Office", "https://www.energy.gov/eere/solar/solar-energy-technologies-office"),
    
    # cmp-transit-map
    ("cmp-transit-map", "EPA Smart Growth & Transportation", "https://www.epa.gov/smartgrowth"),
    ("cmp-transit-map", "AFDC Transit & Fleet Redesign", "https://afdc.energy.gov/"),
]

def verify_all_sources():
    print(f"{'Campaign ID':<22} | {'HTTP':<5} | {'Source Title':<36} | {'URL'}")
    print("-" * 110)

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    }

    all_verified = True
    with httpx.Client(headers=headers, follow_redirects=True, timeout=12.0) as client:
        for cid, title, url in SOURCES_TO_VERIFY:
            try:
                resp = client.get(url)
                status = resp.status_code
                if status == 200:
                    status_str = "200"
                else:
                    status_str = str(status)
                    all_verified = False
                print(f"{cid:<22} | {status_str:<5} | {title[:36]:<36} | {url}")
            except Exception as e:
                print(f"{cid:<22} | ERR   | {title[:36]:<36} | {url} ({e})")
                all_verified = False

    print("-" * 110)
    print(f"All seed source URLs verified HTTP 200: {all_verified}")
    return all_verified

if __name__ == '__main__':
    success = verify_all_sources()
    sys.exit(0 if success else 1)
