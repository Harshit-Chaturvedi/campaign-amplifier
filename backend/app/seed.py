import datetime
import uuid
from app.database import engine, SessionLocal, Base
from app.models import (
    User, Campaign, StoryBlock, Source, CampaignAsset,
    CampaignReach, Contribution, Notification, NotificationPref,
    CampaignUpdate, Report, SystemConfig
)
from app.auth.security import hash_password
from app.services.reach import estimate_reach

def utcnow():
    return datetime.datetime.now(datetime.timezone.utc)

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).count() > 0:
            print("Database already contains data. Skipping re-seed.")
            return

        now = utcnow()
        day = datetime.timedelta(days=1)
        pw_hash = hash_password("demo123")

        # 1. Seed Users (supporting both .org and .com demo logins)
        demo_users = [
            # Creator
            User(
                id="creator-demo",
                email="creator@demo.org",
                name="Elena Rostova",
                username="elena-rostova",
                password_hash=pw_hash,
                role="creator",
                bio="Independent environmental reporter and community campaign organizer.",
                photo_url="https://picsum.photos/seed/creator-elena/200/200",
                created_at=now - 90 * day
            ),
            User(
                id="creator-demo-com",
                email="creator@demo.com",
                name="Elena Rostova",
                username="elena-rostova-com",
                password_hash=pw_hash,
                role="creator",
                bio="Independent environmental reporter and community campaign organizer.",
                photo_url="https://picsum.photos/seed/creator-elena/200/200",
                created_at=now - 90 * day
            ),
            # Backer
            User(
                id="backer-demo",
                email="backer@demo.org",
                name="Marcus Vance",
                username="marcus-v",
                password_hash=pw_hash,
                role="user",
                bio="Backing civic and evidence-based policy amplification.",
                photo_url="https://picsum.photos/seed/backer-marcus/200/200",
                created_at=now - 60 * day
            ),
            User(
                id="backer-demo-com",
                email="backer@demo.com",
                name="Marcus Vance",
                username="marcus-v-com",
                password_hash=pw_hash,
                role="user",
                bio="Backing civic and evidence-based policy amplification.",
                photo_url="https://picsum.photos/seed/backer-marcus/200/200",
                created_at=now - 60 * day
            ),
            # Admin
            User(
                id="admin-demo",
                email="admin@demo.org",
                name="Platform Moderator",
                username="admin-reviewer",
                password_hash=pw_hash,
                role="admin",
                bio="Review team lead for evidence, advertising compliance, and distribution.",
                photo_url="https://picsum.photos/seed/admin-lead/200/200",
                created_at=now - 120 * day
            ),
            User(
                id="admin-demo-com",
                email="admin@demo.com",
                name="Platform Moderator",
                username="admin-reviewer-com",
                password_hash=pw_hash,
                role="admin",
                bio="Review team lead for evidence, advertising compliance, and distribution.",
                photo_url="https://picsum.photos/seed/admin-lead/200/200",
                created_at=now - 120 * day
            ),
        ]

        for u in demo_users:
            db.add(u)
            pref = NotificationPref(
                user_id=u.id,
                funding_milestones=True,
                campaign_updates=True,
                review_decisions=True,
                email_summary=False
            )
            db.add(pref)

        # 2. Seed Campaigns
        campaigns_data = [
            # 1. Clean Water (environment - available_for_funding)
            {
                "id": "cmp-clean-water",
                "owner_id": "creator-demo",
                "title": "Clean drinking water in every public school",
                "summary": "A district-by-district push to replace lead service lines in the thirty oldest public schools in the county.",
                "tagline": "Thirty schools still run on pipes laid before 1970.",
                "category": "environment",
                "creator_type": "nonprofit",
                "creator_name": "County Clean Water Coalition",
                "status": "available_for_funding",
                "funding_goal": 8000.0,
                "amount_raised": 5240.0,
                "backer_count": 38,
                "duration_days": 30,
                "cover_url": "https://picsum.photos/seed/water-school-cover/800/500",
                "headline": "Eleven schools. Elevated lead. One deadline.",
                "ad_description": "The state will fund pipe replacements, but only if districts apply before June. Help alert parents and school boards.",
                "cta": "Learn More",
                "created_at": now - 25 * day,
                "submitted_at": now - 23 * day,
                "approved_at": now - 20 * day,
                "published_at": now - 18 * day,
                "deadline": now + 12 * day,
                "reach": {
                    "locations": ["Cook County", "Metro Area"],
                    "interests": ["Public Schools", "Parent Teacher Associations", "Water Quality"],
                    "channels": ["Meta", "Instagram", "YouTube"],
                    "budget_alloc": {"Meta": 50, "Instagram": 30, "YouTube": 20}
                },
                "sources": [
                    {"title": "County Public Health Water Quality Assessment 2025", "url": "https://example.org/county-water-testing-2025"},
                    {"title": "State Lead Service Line Replacement Grant Directive", "url": "https://example.org/state-lead-grant-fund"},
                    {"title": "EPA Safe Drinking Water School Guidance", "url": "https://example.org/epa-school-water-guidance"}
                ],
                "story_blocks": [
                    {"type": "heading", "content": {"text": "The Lead We Know Is There", "level": 1}},
                    {"type": "paragraph", "content": {"text": "Thirty schools in this county still draw drinking water through service lines installed before 1970. Testing last spring found elevated lead in eleven of them."}},
                    {"type": "statistic", "content": {"value": "11 of 30", "label": "Tested schools showed lead levels exceeding health guidelines"}},
                    {"type": "image", "content": {"url": "https://picsum.photos/seed/water-test-piping/800/500", "caption": "Lead line intake valve at Roosevelt Elementary, installed 1968", "credit": "Water Coalition Field Inspection"}},
                    {"type": "paragraph", "content": {"text": "The replacement program is already fully funded at the state level, but school districts must file targeted applications with official water test records to release the capital."}},
                    {"type": "quote", "content": {"quote": "The money to fix this already exists in the state capital budget. What is missing is public awareness that the filing deadline is ninety days away.", "attribution": "Marisol Everett, Water Coalition Director"}},
                    {"type": "action", "content": {"title": "Check Your School District", "description": "See whether your local district has filed its lead abatement grant application.", "url": "https://example.org/check-my-school-lead"}}
                ]
            },
            # 2. Tree Canopy (environment - available_for_funding)
            {
                "id": "cmp-tree-canopy",
                "owner_id": "creator-demo",
                "title": "Plant the shade where the heat actually is",
                "summary": "Thermal mapping reveals an 11°C heat disparity between city blocks. We are funding targeted distribution to redirect urban canopy budgets.",
                "tagline": "The hottest blocks have the fewest trees.",
                "category": "environment",
                "creator_type": "individual",
                "creator_name": "Tobias Lund",
                "status": "available_for_funding",
                "funding_goal": 11000.0,
                "amount_raised": 7650.0,
                "backer_count": 52,
                "duration_days": 30,
                "cover_url": "https://picsum.photos/seed/heat-canopy-cover/800/500",
                "headline": "11°C hotter four blocks apart. Time to fix canopy funding.",
                "ad_description": "The city canopy budget is split equally by district instead of heat vulnerability. See the thermal map.",
                "cta": "View the Map",
                "created_at": now - 20 * day,
                "submitted_at": now - 18 * day,
                "approved_at": now - 15 * day,
                "published_at": now - 14 * day,
                "deadline": now + 16 * day,
                "reach": {
                    "locations": ["Ward 4", "Ward 7", "Downtown Corridor"],
                    "interests": ["Urban Forestry", "Neighborhood Planning", "Climate Resilience"],
                    "channels": ["Meta", "Reddit", "Instagram"],
                    "budget_alloc": {"Meta": 45, "Reddit": 35, "Instagram": 20}
                },
                "sources": [
                    {"title": "Urban Climate Lab Summer Heat Surface Scan 2025", "url": "https://example.org/heat-island-scan"},
                    {"title": "Municipal Forestry Budget Distribution Breakdown", "url": "https://example.org/forestry-allocation"}
                ],
                "story_blocks": [
                    {"type": "heading", "content": {"text": "Thermal Mapping Exposed the Gap", "level": 1}},
                    {"type": "paragraph", "content": {"text": "High-resolution thermal imagery taken last August confirmed what residents already know: neighborhood heat vulnerability tracks almost exactly with historical underinvestment in street trees."}},
                    {"type": "statistic", "content": {"value": "11°C", "label": "Surface temperature difference between shaded and unshaded corridors"}}
                ]
            },
            # 3. School Air (health - available_for_funding)
            {
                "id": "cmp-school-air",
                "owner_id": None,
                "title": "Clean air standards for older public school classrooms",
                "summary": "Classroom carbon dioxide and particulate monitors consistently spike on winter days. Funding a regional push for mechanical ventilation upgrades.",
                "tagline": "Stale air directly impairs cognitive performance in students.",
                "category": "health",
                "creator_type": "community_group",
                "creator_name": "Parents for Healthy Classrooms",
                "status": "available_for_funding",
                "funding_goal": 6500.0,
                "amount_raised": 1950.0,
                "backer_count": 19,
                "duration_days": 21,
                "cover_url": "https://picsum.photos/seed/clean-air-classroom/800/500",
                "headline": "Classroom CO2 is 2,400 ppm by 11am. Here is the data.",
                "ad_description": "Continuous monitoring across 40 classrooms proves ventilation is failing our kids. Support our awareness push.",
                "cta": "See Results",
                "created_at": now - 10 * day,
                "submitted_at": now - 9 * day,
                "approved_at": now - 7 * day,
                "published_at": now - 6 * day,
                "deadline": now + 24 * day,
                "reach": {
                    "locations": ["Tri-County Metro"],
                    "interests": ["Parenting", "Pediatric Health", "Public School Education"],
                    "channels": ["Meta", "Instagram"],
                    "budget_alloc": {"Meta": 60, "Instagram": 40}
                },
                "sources": [
                    {"title": "University Indoor Air Quality Field Study in Public Classrooms", "url": "https://example.org/classroom-air-study"},
                    {"title": "ASHRAE Standard 62.1 Ventilation for Acceptable Indoor Air Quality", "url": "https://example.org/ashrae-standards"}
                ],
                "story_blocks": [
                    {"type": "heading", "content": {"text": "When Classrooms Run Out of Fresh Air", "level": 1}},
                    {"type": "paragraph", "content": {"text": "Monitors deployed across forty elementary classrooms recorded average carbon dioxide levels above 2,100 parts per million before midday during colder months."}},
                    {"type": "statistic", "content": {"value": "2,100 ppm", "label": "Average peak CO2 measured in unventilated classrooms"}}
                ]
            },
            # 4. Rural Clinic (health - completed with Report)
            {
                "id": "cmp-rural-clinic",
                "owner_id": None,
                "title": "Mobile preventative health screenings in rural counties",
                "summary": "Successfully alerted 68,000 residents across three remote counties to the arrival of free cancer and cardiac mobile screening clinics.",
                "tagline": "Healthcare that travels to the people who need it most.",
                "category": "health",
                "creator_type": "nonprofit",
                "creator_name": "Regional Health Access Fund",
                "status": "completed",
                "funding_goal": 10000.0,
                "amount_raised": 10000.0,
                "backer_count": 84,
                "duration_days": 30,
                "cover_url": "https://picsum.photos/seed/rural-clinic-bus/800/500",
                "headline": "Free preventative screenings in your town this weekend.",
                "ad_description": "The mobile health clinic will be at the county fairgrounds Saturday and Sunday. No insurance required.",
                "cta": "View Schedule",
                "created_at": now - 70 * day,
                "submitted_at": now - 65 * day,
                "approved_at": now - 60 * day,
                "published_at": now - 58 * day,
                "deadline": now - 28 * day,
                "reach": {
                    "locations": ["Douglas County", "Otero County", "Union County"],
                    "interests": ["Community Health", "Senior Services", "Rural Living"],
                    "channels": ["Meta", "YouTube", "Local Radio Digital"],
                    "budget_alloc": {"Meta": 60, "YouTube": 30, "Local Radio Digital": 10}
                },
                "sources": [
                    {"title": "State Department of Health Rural Health Disparities Report", "url": "https://example.org/rural-disparities"},
                    {"title": "Mobile Clinic Deployment Log and Attendance Records", "url": "https://example.org/mobile-clinic-records"}
                ],
                "story_blocks": [
                    {"type": "heading", "content": {"text": "Turning Empty Appointments into Full Clinics", "level": 1}},
                    {"type": "paragraph", "content": {"text": "The mobile health van previously visited rural clinics with less than 20% appointment utilization because notices were only posted in county offices."}},
                    {"type": "statistic", "content": {"value": "412", "label": "Individuals screened across four stops, detecting 29 early-stage conditions"}}
                ],
                "report": {
                    "funds_raised": 10000.0,
                    "ad_spend": 9500.0,
                    "impressions": 655172,
                    "measured_reach": 68400,
                    "clicks": 4820,
                    "est_reach": estimate_reach(10000.0)["estimate"],
                    "is_final": True
                }
            },
            # 5. Antibiotic Watch (science - available_for_funding)
            {
                "id": "cmp-antibiotic-watch",
                "owner_id": None,
                "title": "Open surveillance for antibiotic resistance genes",
                "summary": "Publishing monthly sewer sequencing maps so clinicians and public health researchers can track emergent superbug transmission in real time.",
                "tagline": "What wastewater reveals before hospital admissions rise.",
                "category": "science",
                "creator_type": "nonprofit",
                "creator_name": "Biosurveillance Open Network",
                "status": "available_for_funding",
                "funding_goal": 9500.0,
                "amount_raised": 4200.0,
                "backer_count": 31,
                "duration_days": 30,
                "cover_url": "https://picsum.photos/seed/sequencing-lab-cover/800/500",
                "headline": "Antibiotic-resistant markers in wastewater doubled in 6 months.",
                "ad_description": "Independent sequencing data is published openly. Fund amplification to alert doctors and local health officials.",
                "cta": "Inspect Data",
                "created_at": now - 15 * day,
                "submitted_at": now - 14 * day,
                "approved_at": now - 12 * day,
                "published_at": now - 10 * day,
                "deadline": now + 20 * day,
                "reach": {
                    "locations": ["Statewide Medical Districts"],
                    "interests": ["Biomedical Research", "Infectious Disease", "Public Health Epidemiology"],
                    "channels": ["LinkedIn", "Meta", "X"],
                    "budget_alloc": {"LinkedIn": 50, "Meta": 30, "X": 20}
                },
                "sources": [
                    {"title": "Open Science Framework: Metro Sewer Metagenomic Sequence Dataset", "url": "https://example.org/wastewater-seq-data"},
                    {"title": "CDC Antimicrobial Resistance Threat Assessment Brief", "url": "https://example.org/cdc-amr-threats"}
                ],
                "story_blocks": [
                    {"type": "heading", "content": {"text": "The Signal Before the Outbreak", "level": 1}},
                    {"type": "paragraph", "content": {"text": "Municipal wastewater testing can detect changes in pathogen prevalence weeks before patients present to hospital emergency departments."}}
                ]
            },
            # 6. School Library (education - available_for_funding)
            {
                "id": "cmp-school-library",
                "owner_id": None,
                "title": "Qualified librarians in every public middle school",
                "summary": "Fourteen public middle schools have repurposed libraries as study halls after staff cuts. Spreading awareness before the school board district vote.",
                "tagline": "A library without a librarian is just a room full of shelves.",
                "category": "education",
                "creator_type": "community_group",
                "creator_name": "Coalition for School Literacy",
                "status": "available_for_funding",
                "funding_goal": 5000.0,
                "amount_raised": 3950.0,
                "backer_count": 46,
                "duration_days": 14,
                "cover_url": "https://picsum.photos/seed/school-library-books/800/500",
                "headline": "14 middle schools have locked library doors this semester.",
                "ad_description": "Reading scores dropped 12% in schools that cut credentialed librarians. The district budget vote is this Tuesday.",
                "cta": "Read the Brief",
                "created_at": now - 8 * day,
                "submitted_at": now - 7 * day,
                "approved_at": now - 5 * day,
                "published_at": now - 4 * day,
                "deadline": now + 10 * day,
                "reach": {
                    "locations": ["Metropolitan School District"],
                    "interests": ["Reading Education", "PTA Members", "Local School Boards"],
                    "channels": ["Meta", "Instagram"],
                    "budget_alloc": {"Meta": 70, "Instagram": 30}
                },
                "sources": [
                    {"title": "State Library Association Middle Grade Literacy Report 2025", "url": "https://example.org/school-literacy-audit"}
                ],
                "story_blocks": [
                    {"type": "heading", "content": {"text": "More Than Books on Shelves", "level": 1}},
                    {"type": "paragraph", "content": {"text": "Professional school librarians teach digital research literacy, recommend tailored materials, and keep collections current."}}
                ]
            },
            # 7. Ballot Plain (public_policy - submitted)
            {
                "id": "cmp-ballot-plain",
                "owner_id": "creator-demo",
                "title": "Write ballot measures at a tenth-grade reading level",
                "summary": "Five of seven propositions on the last state ballot exceeded a college graduate reading level, obfuscating key tax and zoning decisions.",
                "tagline": "The last measure needed a graduate degree to parse.",
                "category": "public_policy",
                "creator_type": "creator",
                "creator_name": "Priscilla Nwosu",
                "status": "submitted",
                "funding_goal": 9000.0,
                "amount_raised": 0.0,
                "backer_count": 0,
                "duration_days": 30,
                "cover_url": "https://picsum.photos/seed/ballot-voting-booth/800/500",
                "headline": "Could you read the last ballot? Honestly?",
                "ad_description": "Five of seven measures scored above college reading level. Nine states already mandate plain-language summaries.",
                "cta": "Take the Test",
                "created_at": now - 2 * day,
                "submitted_at": now - 1 * day,
                "reach": {
                    "locations": ["Statewide"],
                    "interests": ["Elections", "Civic Engagement", "Government Transparency"],
                    "channels": ["Meta", "Reddit", "YouTube"],
                    "budget_alloc": {"Meta": 40, "Reddit": 40, "YouTube": 20}
                },
                "sources": [
                    {"title": "Flesch-Kincaid Analysis of State Ballot Propositions (2020-2024)", "url": "https://example.org/ballot-readability-study"}
                ],
                "story_blocks": [
                    {"type": "heading", "content": {"text": "A Turnout Problem Disguised as Drafting", "level": 1}},
                    {"type": "paragraph", "content": {"text": "An independent linguistic audit found the average ballot measure contained sentences exceeding 84 words with triple negatives."}}
                ]
            },
            # 8. Airport Noise (public_policy - changes_requested)
            {
                "id": "cmp-airport-noise",
                "owner_id": "creator-demo",
                "title": "Publish the night-flight noise readings the airport already logs",
                "summary": "Eleven permanent decibel monitors ring the airport perimeter, but telemetry is currently withheld from surrounding residential communities.",
                "tagline": "The monitors exist. The readings are not public.",
                "category": "public_policy",
                "creator_type": "community_group",
                "creator_name": "Fair Skies Neighborhood Alliance",
                "status": "changes_requested",
                "funding_goal": 7000.0,
                "amount_raised": 0.0,
                "backer_count": 0,
                "duration_days": 30,
                "cover_url": "https://picsum.photos/seed/plane-night-sky/800/500",
                "headline": "Eleven noise monitors ring the airport. Where are the logs?",
                "ad_description": "Night freight flights exceed 85dB over residential neighborhoods. Back the campaign to mandate live public reporting.",
                "cta": "View Map",
                "created_at": now - 4 * day,
                "submitted_at": now - 3 * day,
                "reach": {
                    "locations": ["North Hills", "Riverdale", "Airport Flight Path"],
                    "interests": ["Local Government", "Neighborhood Associations", "Environmental Noise"],
                    "channels": ["Meta", "Nextdoor Ads"],
                    "budget_alloc": {"Meta": 60, "Nextdoor Ads": 40}
                },
                "sources": [
                    {"title": "Airport Authority Operating Agreement Environmental Clause 4.2", "url": "https://example.org/airport-operating-agreement"}
                ],
                "story_blocks": [
                    {"type": "heading", "content": {"text": "Monitored But Hidden", "level": 1}},
                    {"type": "paragraph", "content": {"text": "Under state operating agreements, the regional airport authority operates eleven sound level meters along residential approach paths."}}
                ]
            },
            # 9. Repair Right (economic_policy - available_for_funding)
            {
                "id": "cmp-repair-right",
                "owner_id": None,
                "title": "Let farmers repair the equipment they own",
                "summary": "Proprietary software locks force farmers to wait weeks for dealer technicians during critical harvest windows. Backing awareness across rural districts.",
                "tagline": "A $400 sensor can idle a $400,000 combine for three weeks.",
                "category": "economic_policy",
                "creator_type": "business",
                "creator_name": "Prairie Agritech Coalition",
                "status": "available_for_funding",
                "funding_goal": 15000.0,
                "amount_raised": 4300.0,
                "backer_count": 35,
                "duration_days": 45,
                "cover_url": "https://picsum.photos/seed/tractor-combine-field/800/500",
                "headline": "You own the combine. You do not own the password.",
                "ad_description": "An eleven-day wait for a dealer technician mid-harvest costs tens of thousands in lost grain. Four states fixed this.",
                "cta": "See the Bill",
                "created_at": now - 16 * day,
                "submitted_at": now - 14 * day,
                "approved_at": now - 12 * day,
                "published_at": now - 11 * day,
                "deadline": now + 34 * day,
                "reach": {
                    "locations": ["Rural Counties", "Agricultural Belt"],
                    "interests": ["Farming & Agriculture", "Agricultural Machinery", "Rural Small Business"],
                    "channels": ["YouTube", "Meta", "Reddit"],
                    "budget_alloc": {"YouTube": 45, "Meta": 35, "Reddit": 20}
                },
                "sources": [
                    {"title": "US PIRG Agricultural Right to Repair Investigation", "url": "https://example.org/right-to-repair-ag-report"},
                    {"title": "State Senate Agriculture Committee Bill 204 Hearing Minutes", "url": "https://example.org/ag-repair-bill-204"}
                ],
                "story_blocks": [
                    {"type": "heading", "content": {"text": "Held Hostage During Harvest", "level": 1}},
                    {"type": "paragraph", "content": {"text": "Modern combines refuse to start after routine repairs until authorized dealer technicians connect diagnostic tools."}},
                    {"type": "statistic", "content": {"value": "11 Days", "label": "Average wait time for a technician during peak harvest"}}
                ]
            },
            # 10. Night Shelter (community - promoting with measured delivery)
            {
                "id": "cmp-night-shelter",
                "owner_id": "creator-demo",
                "title": "Keep the winter shelter open past 7am during freezes",
                "summary": "The city shelter turns people onto the streets at dawn regardless of below-freezing temperatures. Funding targeted civic awareness across council wards.",
                "tagline": "Turned out at dawn into a freeze warning.",
                "category": "community",
                "creator_type": "nonprofit",
                "creator_name": "Downtown Care Collective",
                "status": "promoting",
                "funding_goal": 6000.0,
                "amount_raised": 6000.0,
                "backer_count": 62,
                "duration_days": 20,
                "cover_url": "https://picsum.photos/seed/winter-shelter-steps/800/500",
                "headline": "Turned out at 7am into a freeze warning.",
                "ad_description": "Emergency services log nine hypothermia calls every freeze morning. Keeping doors open costs $340. A transport costs more.",
                "cta": "Contact Council",
                "created_at": now - 35 * day,
                "submitted_at": now - 32 * day,
                "approved_at": now - 30 * day,
                "published_at": now - 28 * day,
                "deadline": now + 12 * day,
                "reach": {
                    "locations": ["Downtown District", "City Wards 1-5"],
                    "interests": ["Community Outreach", "Homelessness Advocacy", "City Council News"],
                    "channels": ["Meta", "Instagram"],
                    "budget_alloc": {"Meta": 60, "Instagram": 40}
                },
                "sources": [
                    {"title": "City Municipal Shelter Operating Agreement 1998 Clause 3", "url": "https://example.org/shelter-agreement-1998"},
                    {"title": "EMS Cold Exposure Response Call Log Winter 2024-2025", "url": "https://example.org/ems-cold-calls"}
                ],
                "story_blocks": [
                    {"type": "heading", "content": {"text": "The 7am Disconnect", "level": 1}},
                    {"type": "paragraph", "content": {"text": "Under an operating rule written in 1998, city shelter beds must be vacated at 7:00 AM sharp, regardless of weather warnings."}},
                    {"type": "statistic", "content": {"value": "$340", "label": "Cost to extend shelter operations through noon during a freeze"}}
                ],
                "report": {
                    "funds_raised": 6000.0,
                    "ad_spend": 3110.0,
                    "impressions": 214500,
                    "measured_reach": 24800,
                    "clicks": 1780,
                    "est_reach": estimate_reach(6000.0)["estimate"],
                    "is_final": False
                }
            },
            # 11. School Crossing (community - completed with Report)
            {
                "id": "cmp-school-crossing",
                "owner_id": None,
                "title": "A supervised pedestrian crossing outside Cedar Elementary",
                "summary": "A community-funded advertising campaign that mobilized 400 parents and residents, prompting the Department of Transportation to install flashing beacons.",
                "tagline": "Funded, run, and the crossing is now in place.",
                "category": "community",
                "creator_type": "community_group",
                "creator_name": "Cedar Elementary Parent Action",
                "status": "completed",
                "funding_goal": 4500.0,
                "amount_raised": 4500.0,
                "backer_count": 39,
                "duration_days": 21,
                "cover_url": "https://picsum.photos/seed/crosswalk-school-safe/800/500",
                "headline": "350 children cross four lanes of traffic every morning.",
                "ad_description": "No crossing guard. No signal. Help demand safe school crossings before the next district review.",
                "cta": "View Petition",
                "created_at": now - 90 * day,
                "submitted_at": now - 85 * day,
                "approved_at": now - 80 * day,
                "published_at": now - 78 * day,
                "deadline": now - 57 * day,
                "reach": {
                    "locations": ["Cedar Park", "Ward 3"],
                    "interests": ["Pedestrian Safety", "School Traffic", "Parenting"],
                    "channels": ["Meta", "Nextdoor"],
                    "budget_alloc": {"Meta": 70, "Nextdoor": 30}
                },
                "sources": [
                    {"title": "City DOT Cedar Avenue Speed & Traffic Volume Survey", "url": "https://example.org/dot-traffic-cedar"},
                    {"title": "City Council Resolution Approving Signal Installation", "url": "https://example.org/council-res-crossing"}
                ],
                "story_blocks": [
                    {"type": "heading", "content": {"text": "From Hazard to Completed Crosswalk", "level": 1}},
                    {"type": "paragraph", "content": {"text": "Cedar Avenue carried 14,000 vehicles a day with an average speed of 42 mph in a 25 mph school zone."}},
                    {"type": "statistic", "content": {"value": "400+", "label": "Local residents signed the public comment petition"}}
                ],
                "report": {
                    "funds_raised": 4500.0,
                    "ad_spend": 4275.0,
                    "impressions": 294827,
                    "measured_reach": 32100,
                    "clicks": 2940,
                    "est_reach": estimate_reach(4500.0)["estimate"],
                    "is_final": True
                }
            },
            # 12. Odeon Theatre (arts_culture - distribution_preparation)
            {
                "id": "cmp-odeon-theatre",
                "owner_id": None,
                "title": "Preserve the 1934 Odeon as an independent community theatre",
                "summary": "A community trust has secured a conditional lease; reaching council matching funds threshold will unlock permanent cultural preservation.",
                "tagline": "Seventy years of stage and film heritage facing demolition.",
                "category": "arts_culture",
                "creator_type": "community_group",
                "creator_name": "Odeon Heritage Trust",
                "status": "distribution_preparation",
                "funding_goal": 8000.0,
                "amount_raised": 8000.0,
                "backer_count": 71,
                "duration_days": 30,
                "cover_url": "https://picsum.photos/seed/odeon-art-deco/800/500",
                "headline": "The Odeon survived 90 years. It needs you this week.",
                "ad_description": "The regional arts grant requires broad public engagement. Help amplify the trust campaign before the council deadline.",
                "cta": "View Heritage Plan",
                "created_at": now - 28 * day,
                "submitted_at": now - 25 * day,
                "approved_at": now - 22 * day,
                "published_at": now - 20 * day,
                "reach": {
                    "locations": ["Historic District", "Arts Corridor"],
                    "interests": ["Historic Architecture", "Community Theatre", "Independent Cinema"],
                    "channels": ["Meta", "Instagram", "YouTube"],
                    "budget_alloc": {"Meta": 40, "Instagram": 40, "YouTube": 20}
                },
                "sources": [
                    {"title": "State Historic Preservation Office Art Deco Survey", "url": "https://example.org/odeon-historic-survey"}
                ],
                "story_blocks": [
                    {"type": "heading", "content": {"text": "A Stage for the Whole Community", "level": 1}},
                    {"type": "paragraph", "content": {"text": "The Odeon opened in 1934 and served as the town cultural heart for seven decades."}},
                    {"type": "statistic", "content": {"value": "1934", "label": "Original Art Deco cinema and theatre construction year"}}
                ]
            },
            # 13. Energy Co-op (business - promoting with measured delivery)
            {
                "id": "cmp-energy-coop",
                "owner_id": None,
                "title": "Switch your power to the community solar microgrid",
                "summary": "Spreading the word to commercial tenants and apartment renters that locally-owned solar provides 18% lower peak kWh tariffs with zero upfront cost.",
                "tagline": "Clean energy owned by the community that produces it.",
                "category": "business",
                "creator_type": "business",
                "creator_name": "GreenGrid Energy Co-op",
                "status": "promoting",
                "funding_goal": 15000.0,
                "amount_raised": 15000.0,
                "backer_count": 110,
                "duration_days": 45,
                "cover_url": "https://picsum.photos/seed/solar-panels-roof/800/500",
                "headline": "Renting an apartment? You can still use solar power.",
                "ad_description": "Subscribe to the neighborhood community solar farm and cut your electric bill by 18%. No rooftop needed.",
                "cta": "Calculate Savings",
                "created_at": now - 45 * day,
                "submitted_at": now - 40 * day,
                "approved_at": now - 38 * day,
                "published_at": now - 35 * day,
                "deadline": now + 30 * day,
                "reach": {
                    "locations": ["East District", "Tech Corridor", "University Heights"],
                    "interests": ["Clean Energy", "Apartment Renters", "Small Business Cost Savings"],
                    "channels": ["LinkedIn", "Meta", "Reddit"],
                    "budget_alloc": {"LinkedIn": 40, "Meta": 40, "Reddit": 20}
                },
                "sources": [
                    {"title": "Public Utility Commission Community Solar Tariff Order", "url": "https://example.org/puc-solar-order"},
                    {"title": "GreenGrid Co-op Annual Clean Generation Audit", "url": "https://example.org/greengrid-audit"}
                ],
                "story_blocks": [
                    {"type": "heading", "content": {"text": "Solar Without a Rooftop", "level": 1}},
                    {"type": "paragraph", "content": {"text": "Over 68% of city residents live in multi-family buildings or rental properties where installing private solar panels is impossible."}},
                    {"type": "statistic", "content": {"value": "18%", "label": "Average reported rate reduction on utility electric bills"}}
                ],
                "report": {
                    "funds_raised": 15000.0,
                    "ad_spend": 7090.0,
                    "impressions": 489200,
                    "measured_reach": 52400,
                    "clicks": 4120,
                    "est_reach": estimate_reach(15000.0)["estimate"],
                    "is_final": False
                }
            },
            # 14. Transit Map (other - goal_reached)
            {
                "id": "cmp-transit-map",
                "owner_id": "creator-demo",
                "title": "Redraw the bus network around where people actually work",
                "summary": "The bus map has not changed since the factories closed downtown, while 26,000 ring-road jobs have only two buses an hour. Ready for ad launch.",
                "tagline": "The map has not changed since the factories closed.",
                "category": "other",
                "creator_type": "creator",
                "creator_name": "Devin Okonkwo",
                "status": "goal_reached",
                "funding_goal": 12000.0,
                "amount_raised": 12000.0,
                "backer_count": 88,
                "duration_days": 30,
                "cover_url": "https://picsum.photos/seed/transit-bus-stop/800/500",
                "headline": "The buses still go where the jobs used to be.",
                "ad_description": "Twenty-six thousand jobs on the ring road. Two buses an hour. The redesigned network draft is sitting in a drawer.",
                "cta": "View the Redesign",
                "created_at": now - 30 * day,
                "submitted_at": now - 28 * day,
                "approved_at": now - 26 * day,
                "published_at": now - 24 * day,
                "reach": {
                    "locations": ["Metro Area", "Industrial Ring Road", "Transit Corridors"],
                    "interests": ["Public Transportation", "Commuting", "City Planning"],
                    "channels": ["Meta", "Reddit", "YouTube"],
                    "budget_alloc": {"Meta": 50, "Reddit": 30, "YouTube": 20}
                },
                "sources": [
                    {"title": "Regional Employment Shift Study 2014-2024", "url": "https://example.org/metro-jobs-shift"},
                    {"title": "Transit Authority Draft System Redesign 2025", "url": "https://example.org/transit-redesign-draft"}
                ],
                "story_blocks": [
                    {"type": "heading", "content": {"text": "A Map Designed for Yesterday", "level": 1}},
                    {"type": "paragraph", "content": {"text": "The current bus network was built for a downtown that employed 40,000 commuters. Today that downtown employs 11,000."}},
                    {"type": "statistic", "content": {"value": "26,000", "label": "Ring-road workers served by only two hourly buses"}}
                ]
            }
        ]

        for cd in campaigns_data:
            reach_info = cd.pop("reach", None)
            sources_info = cd.pop("sources", [])
            blocks_info = cd.pop("story_blocks", [])
            report_info = cd.pop("report", None)

            est_at_goal = estimate_reach(cd["funding_goal"])["estimate"]
            campaign = Campaign(
                **cd,
                estimated_reach_at_goal=est_at_goal
            )
            db.add(campaign)
            db.flush()

            # Reach
            if reach_info:
                reach = CampaignReach(
                    campaign_id=campaign.id,
                    locations=reach_info.get("locations", []),
                    interests=reach_info.get("interests", []),
                    channels=reach_info.get("channels", []),
                    budget_alloc=reach_info.get("budget_alloc", {}),
                    platform_finalized={}
                )
                db.add(reach)

            # Sources
            for s in sources_info:
                src = Source(
                    id=f"src-{uuid.uuid4().hex[:8]}",
                    campaign_id=campaign.id,
                    title=s["title"],
                    url=s["url"]
                )
                db.add(src)

            # Story Blocks
            for idx, b in enumerate(blocks_info):
                block = StoryBlock(
                    id=f"blk-{uuid.uuid4().hex[:8]}",
                    campaign_id=campaign.id,
                    position=idx,
                    type=b["type"],
                    content=b["content"]
                )
                db.add(block)

            # Report
            if report_info:
                rep = Report(
                    campaign_id=campaign.id,
                    **report_info
                )
                db.add(rep)

        # 3. Seed Contributions
        seed_contribs = [
            Contribution(
                id="con-1",
                campaign_id="cmp-clean-water",
                user_id="backer-demo",
                guest_email=None,
                amount=100.0,
                fee=3.20,
                total=103.20,
                status="succeeded",
                show_name=True,
                receipt_no="REC-2026-0041",
                created_at=now - 12 * day
            ),
            Contribution(
                id="con-2",
                campaign_id="cmp-clean-water",
                user_id=None,
                guest_email="guest.sarah@example.com",
                amount=50.0,
                fee=1.75,
                total=51.75,
                status="succeeded",
                show_name=False,
                receipt_no="REC-2026-0042",
                created_at=now - 10 * day
            ),
            Contribution(
                id="con-3",
                campaign_id="cmp-tree-canopy",
                user_id="backer-demo",
                guest_email=None,
                amount=250.0,
                fee=7.55,
                total=257.55,
                status="succeeded",
                show_name=True,
                receipt_no="REC-2026-0058",
                created_at=now - 8 * day
            ),
            Contribution(
                id="con-4",
                campaign_id="cmp-repair-right",
                user_id=None,
                guest_email="rural.operator@example.com",
                amount=150.0,
                fee=4.65,
                total=154.65,
                status="succeeded",
                show_name=False,
                receipt_no="REC-2026-0089",
                created_at=now - 5 * day
            ),
            Contribution(
                id="con-5",
                campaign_id="cmp-night-shelter",
                user_id="backer-demo",
                guest_email=None,
                amount=200.0,
                fee=6.10,
                total=206.10,
                status="succeeded",
                show_name=False,
                receipt_no="REC-2026-0102",
                created_at=now - 20 * day
            ),
        ]
        for c in seed_contribs:
            db.add(c)

        # 4. Seed Notifications
        seed_notifs = [
            Notification(
                id="notif-1",
                user_id="backer-demo",
                type="milestone",
                campaign_id="cmp-clean-water",
                title="Milestone reached: 65% funded",
                body="Clean drinking water in every public school has raised $5,240 toward its $8,000 goal.",
                read=False,
                created_at=now - datetime.timedelta(hours=2)
            ),
            Notification(
                id="notif-2",
                user_id="creator-demo",
                type="review",
                campaign_id="cmp-airport-noise",
                title="Revisions requested on campaign",
                body="Reviewers requested official municipal study citations for Section 2 before approval.",
                read=False,
                created_at=now - 1 * day
            ),
            Notification(
                id="notif-3",
                user_id="backer-demo",
                type="status",
                campaign_id="cmp-night-shelter",
                title="Advertising distribution is active",
                body="Ads are now delivering to 24,800+ reached residents across Meta and Instagram.",
                read=True,
                created_at=now - 8 * day
            ),
            Notification(
                id="notif-4",
                user_id="backer-demo",
                type="report",
                campaign_id="cmp-school-crossing",
                title="Final distribution report published",
                body="32,100 measured residents reached; pedestrian crossing signals successfully installed.",
                read=True,
                created_at=now - 22 * day
            ),
        ]
        for n in seed_notifs:
            db.add(n)

        # 5. Seed Updates
        seed_updates = [
            CampaignUpdate(
                id="up-1",
                campaign_id="cmp-clean-water",
                title="County School Board officially adds agenda item",
                body="Following the first wave of community awareness, the district superintendent agreed to place lead grant applications on next month's agenda.",
                created_at=now - 3 * day
            ),
            CampaignUpdate(
                id="up-2",
                campaign_id="cmp-tree-canopy",
                title="Thermal heat maps submitted to City Forestry Committee",
                body="We formally presented the comparative heat satellite maps to the municipal climate resilience task force.",
                created_at=now - 5 * day
            )
        ]
        for u in seed_updates:
            db.add(u)

        # 6. Seed System Config
        sys_config = SystemConfig(
            key="demo_assumptions",
            value={
                "cpm_usd": 14.50,
                "avg_frequency": 2.2,
                "platform_fee_pct": 0.05,
                "payment_fee_pct": 0.029,
                "payment_fee_fixed": 0.30,
                "min_goal": 500,
                "max_goal": 50000,
                "preset_amounts": [10, 25, 50, 100, 250],
                "preset_goals": [2500, 5000, 10000, 25000]
            }
        )
        db.add(sys_config)

        db.commit()
        print("Database seeded successfully with 14 campaigns, users, contributions, and notifications.")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed()
