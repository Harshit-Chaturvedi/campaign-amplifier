import datetime
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    JSON,
    UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.database import Base

def utcnow():
    return datetime.datetime.now(datetime.timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    username = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="user", nullable=False)  # 'user', 'creator', 'admin'
    bio = Column(Text, default="", nullable=True)
    photo_url = Column(String, default="", nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    campaigns = relationship("Campaign", back_populates="owner", foreign_keys="Campaign.owner_id")
    contributions = relationship("Contribution", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
    notification_pref = relationship("NotificationPref", back_populates="user", uselist=False)
    saves = relationship("Save", back_populates="user")
    follows = relationship("Follow", back_populates="user")

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(String, primary_key=True, index=True)
    owner_id = Column(String, ForeignKey("users.id"), nullable=True)
    status = Column(String, default="draft", index=True, nullable=False)
    title = Column(String(120), nullable=False)
    category = Column(String, index=True, nullable=False)
    creator_type = Column(String, default="individual", nullable=True)
    creator_name = Column(String, default="Anonymous", nullable=False)
    summary = Column(Text, default="", nullable=True)
    tagline = Column(String, default="", nullable=True)
    cover_url = Column(String, default="", nullable=True)
    headline = Column(String, default="", nullable=True)
    ad_description = Column(Text, default="", nullable=True)
    cta = Column(String, default="Learn More", nullable=True)
    funding_goal = Column(Float, default=1000.0, nullable=False)
    amount_raised = Column(Float, default=0.0, nullable=False)
    currency = Column(String, default="usd", nullable=False)
    duration_days = Column(Integer, default=30, nullable=False)
    deadline = Column(DateTime(timezone=True), nullable=True)
    funding_ends_at = Column(DateTime(timezone=True), nullable=True)
    backer_count = Column(Integer, default=0, nullable=False)
    draft_step = Column(Integer, default=1, nullable=False)
    estimated_reach_at_goal = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime(timezone=True), default=utcnow)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    published_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    owner = relationship("User", back_populates="campaigns", foreign_keys=[owner_id])
    story_blocks = relationship("StoryBlock", back_populates="campaign", cascade="all, delete-orphan", order_by="StoryBlock.position")
    sources = relationship("Source", back_populates="campaign", cascade="all, delete-orphan")
    assets = relationship("CampaignAsset", back_populates="campaign", cascade="all, delete-orphan")
    reach = relationship("CampaignReach", back_populates="campaign", uselist=False, cascade="all, delete-orphan")
    contributions = relationship("Contribution", back_populates="campaign")
    moderation_events = relationship("ModerationEvent", back_populates="campaign", cascade="all, delete-orphan", order_by="desc(ModerationEvent.created_at)")
    updates = relationship("CampaignUpdate", back_populates="campaign", cascade="all, delete-orphan", order_by="desc(CampaignUpdate.created_at)")
    report = relationship("Report", back_populates="campaign", uselist=False, cascade="all, delete-orphan")
    feedback = relationship("Feedback", back_populates="campaign", cascade="all, delete-orphan")

class StoryBlock(Base):
    __tablename__ = "campaign_story_blocks"

    id = Column(String, primary_key=True, index=True)
    campaign_id = Column(String, ForeignKey("campaigns.id"), nullable=False, index=True)
    position = Column(Integer, default=0, nullable=False)
    type = Column(String, nullable=False)  # heading, paragraph, image, statistic, quote, action
    content = Column(JSON, nullable=False)

    campaign = relationship("Campaign", back_populates="story_blocks")

class Source(Base):
    __tablename__ = "campaign_sources"

    id = Column(String, primary_key=True, index=True)
    campaign_id = Column(String, ForeignKey("campaigns.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    url = Column(String, nullable=False)

    campaign = relationship("Campaign", back_populates="sources")

class CampaignAsset(Base):
    __tablename__ = "campaign_assets"

    id = Column(String, primary_key=True, index=True)
    campaign_id = Column(String, ForeignKey("campaigns.id"), nullable=False, index=True)
    kind = Column(String, nullable=False)  # cover, ad_image, video
    url = Column(String, nullable=False)
    meta = Column(JSON, default=dict, nullable=True)

    campaign = relationship("Campaign", back_populates="assets")

class CampaignReach(Base):
    __tablename__ = "campaign_reach"

    campaign_id = Column(String, ForeignKey("campaigns.id"), primary_key=True)
    locations = Column(JSON, default=list, nullable=False)
    interests = Column(JSON, default=list, nullable=False)
    channels = Column(JSON, default=list, nullable=False)
    budget_alloc = Column(JSON, default=dict, nullable=False)
    platform_finalized = Column(JSON, default=dict, nullable=True)

    campaign = relationship("Campaign", back_populates="reach")

class Contribution(Base):
    __tablename__ = "contributions"

    id = Column(String, primary_key=True, index=True)
    campaign_id = Column(String, ForeignKey("campaigns.id"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    guest_email = Column(String, nullable=True)
    amount = Column(Float, nullable=False)
    fee = Column(Float, default=0.0, nullable=False)
    total = Column(Float, nullable=False)
    status = Column(String, default="pending", index=True, nullable=False)  # pending, succeeded, failed, cancelled, rejected, refunded
    show_name = Column(Boolean, default=False, nullable=False)
    receipt_no = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    campaign = relationship("Campaign", back_populates="contributions")
    user = relationship("User", back_populates="contributions")

class ModerationEvent(Base):
    __tablename__ = "moderation_events"

    id = Column(String, primary_key=True, index=True)
    campaign_id = Column(String, ForeignKey("campaigns.id"), nullable=False, index=True)
    actor_id = Column(String, ForeignKey("users.id"), nullable=True)
    from_status = Column(String, nullable=False)
    to_status = Column(String, nullable=False)
    note = Column(Text, default="", nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    campaign = relationship("Campaign", back_populates="moderation_events")
    actor = relationship("User")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    type = Column(String, nullable=False)  # review, milestone, funding, update, system
    campaign_id = Column(String, nullable=True)
    title = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    user = relationship("User", back_populates="notifications")

class NotificationPref(Base):
    __tablename__ = "notification_prefs"

    user_id = Column(String, ForeignKey("users.id"), primary_key=True)
    funding_milestones = Column(Boolean, default=True, nullable=False)
    campaign_updates = Column(Boolean, default=True, nullable=False)
    review_decisions = Column(Boolean, default=True, nullable=False)
    email_summary = Column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="notification_pref")

class Follow(Base):
    __tablename__ = "follows"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    campaign_id = Column(String, ForeignKey("campaigns.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    user = relationship("User", back_populates="follows")
    campaign = relationship("Campaign")

    __table_args__ = (UniqueConstraint("user_id", "campaign_id", name="uq_user_campaign_follow"),)

class Save(Base):
    __tablename__ = "saves"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    campaign_id = Column(String, ForeignKey("campaigns.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    user = relationship("User", back_populates="saves")
    campaign = relationship("Campaign")

    __table_args__ = (UniqueConstraint("user_id", "campaign_id", name="uq_user_campaign_save"),)

class CampaignUpdate(Base):
    __tablename__ = "campaign_updates"

    id = Column(String, primary_key=True, index=True)
    campaign_id = Column(String, ForeignKey("campaigns.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    campaign = relationship("Campaign", back_populates="updates")

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(String, primary_key=True, index=True)
    campaign_id = Column(String, ForeignKey("campaigns.id"), nullable=False, index=True)
    visuals_kept_reading = Column(String, nullable=False)  # "No", "Somewhat", "Yes"
    changed_mind = Column(String, nullable=False)          # "No", "Somewhat", "Yes"
    created_at = Column(DateTime(timezone=True), default=utcnow)

    campaign = relationship("Campaign", back_populates="feedback")

class Report(Base):
    __tablename__ = "reports"

    campaign_id = Column(String, ForeignKey("campaigns.id"), primary_key=True)
    funds_raised = Column(Float, default=0.0, nullable=False)
    ad_spend = Column(Float, default=0.0, nullable=False)
    impressions = Column(Integer, default=0, nullable=False)
    measured_reach = Column(Integer, default=0, nullable=False)
    clicks = Column(Integer, default=0, nullable=False)
    est_reach = Column(Integer, default=0, nullable=False)
    is_final = Column(Boolean, default=False, nullable=False)

    campaign = relationship("Campaign", back_populates="report")

class SystemConfig(Base):
    __tablename__ = "system_config"

    key = Column(String, primary_key=True)
    value = Column(JSON, nullable=False)
