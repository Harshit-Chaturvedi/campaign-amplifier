from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr, ConfigDict

# Auth & User Schemas
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=2)
    role: Optional[str] = "user"  # 'user', 'creator', 'admin'

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    username: Optional[str] = None
    role: str
    bio: Optional[str] = ""
    photo_url: Optional[str] = ""
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Story Blocks & Sources
class StoryBlockBase(BaseModel):
    id: Optional[str] = None
    position: int = 0
    type: str  # heading, paragraph, image, statistic, quote, action
    content: Dict[str, Any]

class SourceBase(BaseModel):
    id: Optional[str] = None
    title: str
    url: str

class AssetBase(BaseModel):
    id: Optional[str] = None
    kind: str  # cover, ad_image, video
    url: str
    meta: Optional[Dict[str, Any]] = None

class ReachBase(BaseModel):
    locations: List[str] = []
    interests: List[str] = []
    channels: List[str] = []
    budget_alloc: Dict[str, float] = {}
    platform_finalized: Optional[Dict[str, Any]] = None

# Campaign Schemas
class CampaignBase(BaseModel):
    title: str = Field(max_length=120)
    category: str
    creator_type: Optional[str] = "individual"
    creator_name: str
    summary: Optional[str] = ""
    tagline: Optional[str] = ""
    funding_goal: float = Field(ge=500, le=50000)

class DraftCreate(BaseModel):
    title: Optional[str] = "Untitled Campaign"
    category: Optional[str] = "community"
    creator_name: Optional[str] = "Organizer"
    creator_type: Optional[str] = "individual"
    summary: Optional[str] = ""
    tagline: Optional[str] = ""
    funding_goal: Optional[float] = 1000.0
    duration_days: Optional[int] = 30

class DraftPatch(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    creator_name: Optional[str] = None
    creator_type: Optional[str] = None
    summary: Optional[str] = None
    tagline: Optional[str] = None
    funding_goal: Optional[float] = None
    duration_days: Optional[int] = None
    draft_step: Optional[int] = None
    cover_url: Optional[str] = None
    headline: Optional[str] = None
    ad_description: Optional[str] = None
    cta: Optional[str] = None
    story_blocks: Optional[List[StoryBlockBase]] = None
    sources: Optional[List[SourceBase]] = None
    assets: Optional[List[AssetBase]] = None
    reach: Optional[ReachBase] = None

class ModerationNoteRequest(BaseModel):
    note: Optional[str] = ""

class SimulateDeliveryRequest(BaseModel):
    impressions: int
    clicks: int
    measured_reach: int

class ReportResponse(BaseModel):
    campaign_id: str
    funds_raised: float
    ad_spend: float
    impressions: int
    measured_reach: int
    clicks: int
    est_reach: int
    is_final: bool

    model_config = ConfigDict(from_attributes=True)

class CampaignPublic(BaseModel):
    id: str
    title: str
    category: str
    creator_name: str
    creator_type: Optional[str] = None
    summary: Optional[str] = None
    tagline: Optional[str] = None
    cover_url: Optional[str] = None
    status: str
    funding_goal: float
    amount_raised: float
    percent_funded: int
    backer_count: int
    estimated_reach_at_goal: int
    duration_days: int
    created_at: datetime
    published_at: Optional[datetime] = None
    deadline: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class CampaignDetail(CampaignPublic):
    headline: Optional[str] = None
    ad_description: Optional[str] = None
    cta: Optional[str] = None
    draft_step: int
    story_blocks: List[StoryBlockBase] = []
    sources: List[SourceBase] = []
    assets: List[AssetBase] = []
    reach: Optional[ReachBase] = None
    report: Optional[ReportResponse] = None

    model_config = ConfigDict(from_attributes=True)

# Reach Calculation Schemas
class ReachEstimateRequest(BaseModel):
    amount: float = Field(ge=1)

class ReachEstimateResponse(BaseModel):
    estimate: int
    ad_budget: float
    impressions: int
    assumptions: Dict[str, Any]
    label: str = "Estimate"

# Contribution & Payment Simulation Schemas
class ContributionCreate(BaseModel):
    campaign_id: str
    amount: float = Field(ge=1)
    guest_email: Optional[EmailStr] = None
    show_name: bool = False

class PaymentSimulateRequest(BaseModel):
    contribution_id: str
    outcome: str = Field(description="success, pending, failed, cancelled, rejected")

class ContributionResponse(BaseModel):
    id: str
    campaign_id: str
    amount: float
    fee: float
    total: float
    status: str
    show_name: bool
    receipt_no: str
    created_at: datetime
    backer_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class ReceiptResponse(BaseModel):
    receipt_no: str
    campaign_id: str
    campaign_title: str
    amount: float
    fee: float
    total: float
    status: str
    estimated_reach: int
    created_at: datetime
    show_name: bool

# Notification & Preferences Schemas
class NotificationResponse(BaseModel):
    id: str
    user_id: str
    type: str
    campaign_id: Optional[str] = None
    title: str
    body: str
    read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class NotificationPrefSchema(BaseModel):
    funding_milestones: bool = True
    campaign_updates: bool = True
    review_decisions: bool = True
    email_summary: bool = False

# Campaign Update & Feedback Schemas
class CampaignUpdateCreate(BaseModel):
    title: str
    body: str

class CampaignUpdateResponse(BaseModel):
    id: str
    campaign_id: str
    title: str
    body: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class FeedbackRequest(BaseModel):
    visuals_kept_reading: str = Field(pattern="^(No|Somewhat|Yes)$")
    changed_mind: str = Field(pattern="^(No|Somewhat|Yes)$")

# AI Generation Schemas
class AIDraftRequest(BaseModel):
    text: str = Field(min_length=10)

class AIVoiceDraftRequest(BaseModel):
    transcript: str = Field(min_length=10)

class AISuggestRequest(BaseModel):
    topic_or_problem: str

class AIDraftResponse(BaseModel):
    title: str
    category: str
    summary: str
    tagline: str
    target_audience: str
    ad_headline: str
    ad_description: str
    suggested_sources: List[str]
    suggested_channels: List[str]
    demo_mode: bool = True

class AISuggestResponse(BaseModel):
    suggested_titles: List[str]
    suggested_categories: List[str]
    suggested_summaries: List[str]
    demo_mode: bool = True
