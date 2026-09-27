/** Mirrors the Pydantic schemas the API returns. */

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface Message {
  detail: string;
  code: string | null;
}

export interface ApiError {
  code: string;
  detail: string;
  details?: { field: string; message: string }[] | null;
  request_id?: string | null;
  status: number;
}

// ---------------------------------------------------------------- people
export interface UserPublic {
  id: number;
  username: string;
  full_name: string | null;
  display_name: string;
  avatar_url: string | null;
  headline: string | null;
  bio: string | null;
  social_links: Record<string, string>;
}

export interface Role {
  id: number;
  name: string;
  label: string;
  description: string | null;
  permissions: string[];
  is_superuser: boolean;
  priority: number;
  is_system: boolean;
}

export interface UserMe extends UserPublic {
  email: string;
  status: string;
  roles: Role[];
  permissions: string[];
  is_superuser: boolean;
  created_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

// ---------------------------------------------------------------- blocks
export type BlockType =
  | 'rich_text' | 'markdown' | 'heading' | 'code' | 'quote' | 'callout'
  | 'list' | 'table' | 'image' | 'gallery' | 'video' | 'audio' | 'file'
  | 'embed' | 'poll' | 'quiz' | 'divider' | 'button' | 'ad_slot' | 'html'
  | 'math';

export interface ContentBlock {
  id: number;
  type: BlockType;
  position: number;
  /** Shape depends on `type`; each renderer narrows it itself. */
  data: Record<string, any>;
  settings: Record<string, any>;
  anchor: string | null;
  is_hidden: boolean;
}

// ----------------------------------------------------------------- polls
export interface PollOption {
  id: number;
  label: string;
  description: string | null;
  image_url: string | null;
  icon: string | null;
  accent: string;
  position: number;
  vote_count: number;
  percentage: number;
  is_write_in: boolean;
}

export interface Poll {
  id: number;
  question: string;
  description: string | null;
  type: string;
  allow_multiple: boolean;
  max_selections: number;
  allow_anonymous: boolean;
  allow_vote_change: boolean;
  allow_write_in: boolean;
  hide_results_until_voted: boolean;
  hide_results_until_closed: boolean;
  is_open: boolean;
  opens_at: string | null;
  closes_at: string | null;
  options: PollOption[];
  total_votes: number;
  total_voters: number;
  my_votes: number[];
  results_visible: boolean;
}

// ----------------------------------------------------------------- posts
export type PostStatus =
  | 'draft' | 'submitted' | 'scheduled' | 'published' | 'rejected' | 'archived';

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  accent: string;
  post_count: number;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  accent: string;
  usage_count: number;
}

export interface PostSummary {
  id: number;
  title: string;
  slug: string;
  subtitle: string | null;
  excerpt: string | null;
  cover_url: string | null;
  status: PostStatus;
  visibility: string;
  published_at: string | null;
  created_at: string;
  reading_minutes: number;
  word_count: number;
  view_count: number;
  comment_count: number;
  reaction_count: number;
  is_featured: boolean;
  is_pinned: boolean;
  byline: string;
  author: UserPublic | null;
  category: Category | null;
  tags: Tag[];
}

export interface PostDetail extends PostSummary {
  blocks: ContentBlock[];
  polls: Poll[];
  series: { id: number; title: string; slug: string } | null;
  series_position: number | null;
  allow_comments: boolean;
  allow_reactions: boolean;
  show_ads: boolean;
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  og_image_url: string | null;
  language: string;
  layout_options: Record<string, any>;
  rejection_reason: string | null;
  scheduled_for: string | null;
  my_reaction: string | null;
  is_bookmarked: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_moderate: boolean;
}

export interface ReactionSummary {
  counts: Record<string, number>;
  total: number;
  my_reaction: string | null;
}

// -------------------------------------------------------------- comments
export interface Comment {
  id: number;
  post_id: number;
  parent_id: number | null;
  depth: number;
  body: string;
  body_html: string;
  mentions: string[];
  author: UserPublic | null;
  display_name: string;
  moderation_state: string;
  is_pinned: boolean;
  is_edited: boolean;
  is_author_reply: boolean;
  reaction_count: number;
  reply_count: number;
  my_reaction: string | null;
  created_at: string;
  replies: Comment[];
  can_edit: boolean;
  can_delete: boolean;
  can_moderate: boolean;
}

// --------------------------------------------------------- notifications
export interface Notification {
  id: number;
  kind: string;
  title: string;
  body: string | null;
  url: string | null;
  icon: string;
  accent: string;
  group_count: number;
  read_at: string | null;
  created_at: string;
  actor: UserPublic | null;
}

export interface NotificationCounts {
  total: number;
  unread: number;
  unseen: number;
  by_kind: Record<string, number>;
}

// -------------------------------------------------------------- portfolio
export interface Project {
  id: number;
  title: string;
  slug: string;
  tagline: string | null;
  summary: string | null;
  body?: string | null;
  kind: string;
  role: string | null;
  client: string | null;
  stack: string[];
  highlights?: string[];
  metrics: Record<string, string>;
  cover_url: string | null;
  gallery?: string[];
  icon: string | null;
  accent: string;
  live_url: string | null;
  repo_url: string | null;
  case_study_url?: string | null;
  started_on?: string | null;
  ended_on?: string | null;
  state: string;
  is_featured: boolean;
  is_published: boolean;
  position: number;
  view_count?: number;
}

/** Body for POST /projects and PATCH /projects/{id} — mirrors ProjectWrite. */
export interface ProjectInput {
  title: string;
  slug?: string | null;
  tagline?: string | null;
  summary?: string | null;
  body?: string | null;
  kind: string;
  role?: string | null;
  client?: string | null;
  stack: string[];
  highlights: string[];
  metrics: Record<string, string>;
  cover_url?: string | null;
  gallery: string[];
  icon?: string | null;
  accent: string;
  live_url?: string | null;
  repo_url?: string | null;
  case_study_url?: string | null;
  started_on?: string | null;
  ended_on?: string | null;
  state: string;
  is_featured: boolean;
  is_published: boolean;
  position: number;
}

export interface Service {
  id: number;
  title: string;
  slug: string;
  summary: string;
  body: string | null;
  icon: string;
  accent: string;
  bullets: string[];
  starting_price_minor: number | null;
  currency: string;
  position: number;
  is_published: boolean;
}

/** Mirrors app/schemas/media.py's MediaRead exactly. */
export interface MediaAsset {
  id: number;
  url: string;
  storage_key: string;
  original_filename: string;
  content_type: string;
  kind: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  placeholder_color: string | null;
  variants: Record<string, string>;
  alt_text: string | null;
  caption: string | null;
  credit: string | null;
  labels: string[];
  transcript: string | null;
  is_public: boolean;
  reference_count: number;
  created_at: string;
  owner: UserPublic | null;
}

/** Returned by POST /media — a fresh asset, or the existing one on a checksum match. */
export interface MediaUploadResult {
  asset: MediaAsset;
  deduplicated: boolean;
}

export interface Experience {
  id: number;
  organisation: string;
  title: string;
  location: string | null;
  employment_type: string;
  started_on: string;
  ended_on: string | null;
  is_current: boolean;
  summary: string | null;
  achievements: string[];
  stack: string[];
  logo_url: string | null;
  website: string | null;
  is_published: boolean;
  position: number;
}

export interface SkillGroup {
  id: number;
  name: string;
  icon: string | null;
  accent: string;
  description: string | null;
  skills: { id: number; name: string; level: number; icon: string | null }[];
}

export interface Testimonial {
  id: number;
  author_name: string;
  author_title: string | null;
  author_company: string | null;
  avatar_url: string | null;
  quote: string;
  rating: number;
  source_url: string | null;
  project_id?: number | null;
  is_featured: boolean;
  is_published: boolean;
  position: number;
}

export interface Sponsor {
  id: number;
  name: string;
  logo_url: string;
  website: string | null;
  tier: string;
  opacity: number;
}

// --------------------------------------------------------------- commerce
export interface Plan {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  family: string;
  amount_minor: number;
  amount: number;
  currency: string;
  interval: string;
  features: string[];
  is_highlighted: boolean;
  badge: string | null;
}

export interface AdCreative {
  id: number;
  slot_key: string;
  creative_type: string;
  headline: string | null;
  body: string | null;
  image_url: string | null;
  cta_label: string;
  click_url: string;
  html: string | null;
  accent: string;
}

export interface AdSlotServe {
  slot_key: string;
  placement: string;
  format: string;
  width: number | null;
  height: number | null;
  creatives: AdCreative[];
  fallback_html: string | null;
}

export interface PublicSettings {
  site_title: string;
  site_tagline: string;
  available_for_work: boolean;
  ads_enabled: boolean;
  newsletter_enabled: boolean;
  payments_enabled: boolean;
  guest_posts_enabled: boolean;
  comments_require_login: boolean;
  auto_approve_comments: boolean;
  owner_name: string;
  owner_name_short: string;
  owner_email: string;
  currency: string;
  max_upload_mb: number;
  payment_provider: string;
}

export interface DashboardOverview {
  counters: Record<string, number>;
  revenue_30d_minor: number;
  views_30d: { date: string; value: number }[];
}
