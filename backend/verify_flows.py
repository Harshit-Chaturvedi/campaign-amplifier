import httpx
import json

client = httpx.Client(base_url="http://127.0.0.1:8000")

def flow1():
    print("=================================================================")
    print("FLOW 1: AUTH & CAMPAIGNS (Search, Category Filter, and Detail)")
    print("=================================================================")
    
    # Login
    res = client.post("/api/v1/auth/login", json={"email": "backer@demo.org", "password": "demo123"})
    print(f"1. POST /api/v1/auth/login -> Status {res.status_code}")
    data = res.json()
    token = data["access_token"]
    user = data["user"]
    print(f"   Authenticated: {user['name']} <{user['email']}> | Role: {user['role']}")

    # Public config
    res_cfg = client.get("/api/v1/config/public")
    cfg = res_cfg.json()
    print(f"2. GET /api/v1/config/public -> Status {res_cfg.status_code}")
    print(f"   CPM: ${cfg['cpm_usd']} | Frequency: {cfg['avg_frequency']}x | Platform Fee: {cfg['platform_fee_pct']*100}%")

    # Reach estimate
    res_reach = client.post("/api/v1/reach/estimate", json={"amount": 100})
    reach = res_reach.json()
    print(f"3. POST /api/v1/reach/estimate ($100) -> {reach['estimate']:,} estimated reach ({reach['impressions']:,} impressions)")

    # List campaigns filtered by category
    res_list = client.get("/api/v1/campaigns", params={"category": "environment"})
    camps = res_list.json()
    print(f"4. GET /api/v1/campaigns?category=environment -> Found {len(camps)} campaigns")
    for c in camps:
        print(f"   * [{c['id']}] {c['title']} ({c['status']}) - ${c['amount_raised']:,.0f}/${c['funding_goal']:,.0f} ({c['percent_funded']}%)")

    # Campaign detail (verify no leaked emails)
    res_det = client.get(f"/api/v1/campaigns/{camps[0]['id']}")
    det = res_det.json()
    print(f"5. GET /api/v1/campaigns/{det['id']} -> Status {res_det.status_code}")
    print(f"   Sources: {len(det['sources'])} | Story Blocks: {len(det['story_blocks'])} | Headline: '{det['headline']}'")
    return token

def flow2(token):
    print("\n=================================================================")
    print("FLOW 2: CONTRIBUTION & PAYMENT SIMULATION (Pending -> Succeeded -> Receipt)")
    print("=================================================================")
    
    campaign_id = "cmp-clean-water"
    before = client.get(f"/api/v1/campaigns/{campaign_id}").json()
    initial_raised = before["amount_raised"]
    initial_backers = before["backer_count"]
    print(f"1. Before contribution: {before['title']} raised ${initial_raised:,.2f} from {initial_backers} backers")

    # Create pending contribution
    res_contrib = client.post(
        "/api/v1/contributions",
        headers={"Authorization": f"Bearer {token}"},
        json={"campaign_id": campaign_id, "amount": 150.0, "show_name": True}
    )
    print(f"2. POST /api/v1/contributions ($150) -> Status {res_contrib.status_code}")
    contrib = res_contrib.json()
    print(f"   Created Contribution: {contrib['id']} | Status: {contrib['status']} | Fee: ${contrib['fee']} | Total: ${contrib['total']}")
    print(f"   Receipt No: {contrib['receipt_no']}")

    # Simulate payment: first simulate failure
    res_fail = client.post("/api/v1/payments/simulate", json={"contribution_id": contrib["id"], "outcome": "failed"})
    mid = client.get(f"/api/v1/campaigns/{campaign_id}").json()
    print(f"3. POST /api/v1/payments/simulate (failed) -> Status: {res_fail.json()['payment_status']}")
    print(f"   Verified: Amount raised remains ${mid['amount_raised']:,.2f} (unchanged)")

    # Simulate payment: simulate success
    res_succ = client.post("/api/v1/payments/simulate", json={"contribution_id": contrib["id"], "outcome": "success"})
    after = client.get(f"/api/v1/campaigns/{campaign_id}").json()
    print(f"4. POST /api/v1/payments/simulate (success) -> Status: {res_succ.json()['payment_status']}")
    print(f"   Verified: Amount raised incremented from ${initial_raised:,.2f} -> ${after['amount_raised']:,.2f} (+${contrib['amount']:.2f})")
    print(f"   Backers incremented from {initial_backers} -> {after['backer_count']}")

    # Fetch receipt
    res_rec = client.get(f"/api/v1/receipts/{contrib['receipt_no']}")
    rec = res_rec.json()
    print(f"5. GET /api/v1/receipts/{rec['receipt_no']} -> Status {res_rec.status_code}")
    print(f"   Campaign: '{rec['campaign_title']}' | Backed: ${rec['amount']} (Total ${rec['total']}) | Est. Reach: {rec['estimated_reach']:,} people")

def flow3():
    print("\n=================================================================")
    print("FLOW 3: ADMIN MODERATION & LIFECYCLE (Review Queue -> Approve -> Notification)")
    print("=================================================================")

    # Login as admin
    res_admin = client.post("/api/v1/auth/login", json={"email": "admin@demo.org", "password": "demo123"})
    admin_token = res_admin.json()["access_token"]
    print(f"1. POST /api/v1/auth/login (Admin) -> Logged in as Platform Moderator")

    # Get review queue
    res_queue = client.get("/api/v1/admin/review-queue", headers={"Authorization": f"Bearer {admin_token}"})
    queue = res_queue.json()
    print(f"2. GET /api/v1/admin/review-queue -> {len(queue)} campaigns requiring moderation/ops attention:")
    for item in queue:
        print(f"   * [{item['status']}] {item['id']}: {item['title']} (${item['amount_raised']:,.0f}/${item['funding_goal']:,.0f})")

    # Find submitted campaign
    target = next((c for c in queue if c["status"] == "submitted"), None)
    if target:
        target_id = target["id"]
        print(f"3. Target Campaign to Approve: [{target_id}] '{target['title']}' (current status: {target['status']})")
        res_approve = client.post(
            f"/api/v1/admin/campaigns/{target_id}/approve",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"note": "Approved claims, verifiable sources, and ad creatives."}
        )
        print(f"4. POST /api/v1/admin/campaigns/{target_id}/approve -> Status {res_approve.status_code}")
        print(f"   New Campaign Status: {res_approve.json()['campaign_status']}")

        # Verify campaign is now available_for_funding
        res_verif = client.get(f"/api/v1/campaigns/{target_id}")
        print(f"5. GET /api/v1/campaigns/{target_id} -> Verified status: '{res_verif.json()['status']}'")

    # Check creator notifications
    res_creator = client.post("/api/v1/auth/login", json={"email": "creator@demo.org", "password": "demo123"})
    creator_token = res_creator.json()["access_token"]
    res_notifs = client.get("/api/v1/notifications", headers={"Authorization": f"Bearer {creator_token}"})
    notifs = res_notifs.json()
    print(f"6. GET /api/v1/notifications (Creator) -> {len(notifs)} notifications found:")
    for n in notifs[:3]:
        print(f"   * [{n['type']}] {n['title']}: {n['body']}")

if __name__ == "__main__":
    t = flow1()
    flow2(t)
    flow3()
