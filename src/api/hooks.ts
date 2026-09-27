import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';

import { api, isSignedIn } from './client';
import type {
  AdSlotServe,
  Comment,
  DashboardOverview,
  Experience,
  MediaUploadResult,
  Message,
  Notification,
  NotificationCounts,
  Page,
  Plan,
  Poll,
  PostDetail,
  PostSummary,
  Project,
  ProjectInput,
  PublicSettings,
  ReactionSummary,
  Role,
  Service,
  SkillGroup,
  Sponsor,
  Category,
  Tag,
  Testimonial,
  UserMe,
} from './types';

/** Central key registry, so invalidation never guesses at a string. */
export const keys = {
  settings: ['settings', 'public'] as const,
  me: ['auth', 'me'] as const,
  posts: (filters: Record<string, unknown> = {}) => ['posts', filters] as const,
  post: (slug: string) => ['post', slug] as const,
  related: (slug: string) => ['post', slug, 'related'] as const,
  comments: (postId: number) => ['comments', postId] as const,
  poll: (id: number) => ['poll', id] as const,
  categories: ['categories'] as const,
  tags: ['tags'] as const,
  projects: ['projects'] as const,
  project: (slug: string) => ['project', slug] as const,
  services: ['services'] as const,
  experience: ['experience'] as const,
  skills: ['skills'] as const,
  testimonials: ['testimonials'] as const,
  sponsors: ['sponsors'] as const,
  plans: ['plans'] as const,
  adSlot: (key: string, ctx: Record<string, unknown>) => ['ad', key, ctx] as const,
  notifications: ['notifications'] as const,
  notificationCounts: ['notifications', 'counts'] as const,
  reviewQueue: ['review', 'queue'] as const,
  commentQueue: (state: string) => ['comments', 'queue', state] as const,
  overview: ['dashboard', 'overview'] as const,
  roles: ['roles'] as const,
  search: (q: string) => ['search', q] as const,
};

// ----------------------------------------------------------------- site
export function usePublicSettings() {
  return useQuery({
    queryKey: keys.settings,
    queryFn: () => api.get<PublicSettings>('/settings/public'),
    staleTime: 5 * 60_000,
  });
}

export function useMe(options?: Partial<UseQueryOptions<UserMe>>) {
  return useQuery({
    queryKey: keys.me,
    queryFn: () => api.get<UserMe>('/auth/me'),
    enabled: isSignedIn(),
    retry: false,
    staleTime: 60_000,
    ...options,
  });
}

export function useSearch(term: string) {
  return useQuery({
    queryKey: keys.search(term),
    queryFn: () =>
      api.get<{ posts: PostSummary[]; projects: Project[] }>('/search', { q: term }),
    enabled: term.trim().length >= 2,
    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------- posts
export interface PostFilters {
  /** Index signature so the object can be passed straight to the query builder. */
  [key: string]: string | number | boolean | undefined;
  page?: number;
  perPage?: number;
  q?: string;
  category?: string;
  tag?: string;
  author?: string;
  status?: string;
  featured?: boolean;
  sort?: 'recent' | 'popular' | 'trending' | 'oldest' | 'commented';
}

export function usePosts(filters: PostFilters = {}) {
  return useQuery({
    queryKey: keys.posts(filters as Record<string, unknown>),
    queryFn: () => api.get<Page<PostSummary>>('/posts', filters),
    staleTime: 30_000,
  });
}

export function usePost(slug: string) {
  return useQuery({
    queryKey: keys.post(slug),
    queryFn: () => api.get<PostDetail>(`/posts/${slug}`),
    enabled: Boolean(slug),
  });
}

export function useUpdatePost(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.patch<PostDetail>(`/posts/${slug}`, payload),
    onSuccess: (post) => {
      queryClient.setQueryData(keys.post(slug), post);
      if (post.slug !== slug) queryClient.removeQueries({ queryKey: keys.post(slug) });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => api.delete<Message>(`/posts/${slug}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });
}

export function usePollVoters(pollId: number | undefined) {
  return useQuery({
    queryKey: ['poll-voters', pollId],
    queryFn: () =>
      api.get<
        { option_id: number; option_label: string; voter_name: string; is_registered: boolean; voted_at: string }[]
      >(`/polls/${pollId}/voters`),
    enabled: Boolean(pollId),
  });
}

export function useRelatedPosts(slug: string) {
  return useQuery({
    queryKey: keys.related(slug),
    queryFn: () => api.get<PostSummary[]>(`/posts/${slug}/related`),
    enabled: Boolean(slug),
    staleTime: 5 * 60_000,
  });
}

export function useReact(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, type }: { postId: number; type: string }) =>
      api.post<ReactionSummary>(`/posts/${postId}/reactions`, { type }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.post(slug) }),
  });
}

/** Records a read. Deliberately fire-and-forget — a failure must not surface. */
export function useRecordView() {
  return useMutation({
    mutationFn: (payload: { postId: number; seconds?: number; scroll?: number }) =>
      api.post<Message>(`/posts/${payload.postId}/view`, {
        seconds_on_page: payload.seconds,
        scroll_depth: payload.scroll,
        referrer: document.referrer || null,
      }),
    onError: () => undefined,
  });
}

export function useSubmitGuestPost() {
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post<Message>('/posts/submit', payload),
  });
}

// ------------------------------------------------------------------ media
export interface UploadMediaInput {
  file: File;
  altText?: string;
  caption?: string;
  labels?: string[];
  postId?: number;
  /** Which subtree to file this under — must match the backend's allow-list (default 'uploads'). */
  folder?: string;
}

/**
 * Direct file upload — image, video, audio, or document, per the backend's
 * allow-list (app/services/storage.py). Hits the real media library
 * (POST /media), not a made-up /media/upload route.
 *
 * "Attach via link" needs no endpoint of its own — every image/video/audio
 * block already has a plain URL field the person can paste into directly.
 */
export function useUploadMedia() {
  return useMutation({
    mutationFn: ({ file, altText, caption, labels, postId, folder }: UploadMediaInput) => {
      const form = new FormData();
      form.append('file', file);
      if (altText) form.append('alt_text', altText);
      if (caption) form.append('caption', caption);
      if (labels?.length) form.append('labels', labels.join(','));
      if (postId != null) form.append('post_id', String(postId));
      if (folder) form.append('folder', folder);
      return api.upload<MediaUploadResult>('/media', form);
    },
  });
}

// -------------------------------------------------------------- comments
export function useComments(postId: number | undefined) {
  return useQuery({
    queryKey: keys.comments(postId ?? 0),
    queryFn: () => api.get<Comment[]>(`/posts/${postId}/comments`),
    enabled: Boolean(postId),
  });
}

export function useCreateComment(postId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post<Comment>(`/posts/${postId}/comments`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.comments(postId) }),
  });
}

export function useDeleteComment(postId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: number) => api.delete<Message>(`/comments/${commentId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.comments(postId) }),
  });
}

export function useModerateComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, state, cascade }: { id: number; state: string; cascade?: boolean }) =>
      api.post<Message>(`/comments/${id}/moderate`, { state, cascade: cascade ?? false }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments'] }),
  });
}

export function useCommentQueue(state: string) {
  return useQuery({
    queryKey: keys.commentQueue(state),
    queryFn: () => api.get<Page<Comment>>('/comments/queue', { state, perPage: 50 }),
  });
}

// ----------------------------------------------------------------- polls
export function useVote(postSlug?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pollId, optionIds }: { pollId: number; optionIds: number[] }) =>
      api.post<Poll>(`/polls/${pollId}/vote`, { option_ids: optionIds }),
    onSuccess: (poll) => {
      queryClient.setQueryData(keys.poll(poll.id), poll);
      if (postSlug) queryClient.invalidateQueries({ queryKey: keys.post(postSlug) });
    },
  });
}

export function useRetractVote(postSlug?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pollId: number) => api.delete<Poll>(`/polls/${pollId}/vote`),
    onSuccess: () => {
      if (postSlug) queryClient.invalidateQueries({ queryKey: keys.post(postSlug) });
    },
  });
}

// -------------------------------------------------------------- taxonomy
export function useCategories() {
  return useQuery({
    queryKey: keys.categories,
    queryFn: () => api.get<Category[]>('/categories'),
    staleTime: 5 * 60_000,
  });
}

export function useTags() {
  return useQuery({
    queryKey: keys.tags,
    queryFn: () => api.get<Tag[]>('/tags'),
    staleTime: 5 * 60_000,
  });
}

// ------------------------------------------------------------- portfolio
export function useProjects(featured?: boolean) {
  return useQuery({
    queryKey: [...keys.projects, featured],
    queryFn: () => api.get<Project[]>('/projects', { featured }),
    staleTime: 5 * 60_000,
  });
}

export function useProject(slug: string) {
  return useQuery({
    queryKey: keys.project(slug),
    queryFn: () => api.get<Project>(`/projects/${slug}`),
    enabled: Boolean(slug),
  });
}

export function useServices() {
  return useQuery({
    queryKey: keys.services,
    queryFn: () => api.get<Service[]>('/services'),
    staleTime: 5 * 60_000,
  });
}

export function useExperience() {
  return useQuery({
    queryKey: keys.experience,
    queryFn: () => api.get<Experience[]>('/experience'),
    staleTime: 5 * 60_000,
  });
}

export function useSkills() {
  return useQuery({
    queryKey: keys.skills,
    queryFn: () => api.get<SkillGroup[]>('/skills'),
    staleTime: 5 * 60_000,
  });
}

// ---------------------------------------------------------- portfolio admin
// Every dashboard mutation below invalidates both its own admin list and the
// public read query for the same resource, since /dashboard/projects and
// the live /projects page would otherwise disagree until a hard refresh.

export function useAdminProjects() {
  return useQuery({
    queryKey: ['admin', 'projects'],
    queryFn: () => api.get<Project[]>('/projects/admin'),
  });
}

export function useAdminProject(id: number | undefined) {
  return useQuery({
    queryKey: ['admin', 'project', id],
    queryFn: () => api.get<Project>(`/projects/id/${id}`),
    enabled: id != null,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProjectInput) => api.post<Project>('/projects', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'projects'] });
      queryClient.invalidateQueries({ queryKey: keys.projects });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<ProjectInput> & { id: number }) =>
      api.patch<Project>(`/projects/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'projects'] });
      queryClient.invalidateQueries({ queryKey: keys.projects });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<Message>(`/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'projects'] });
      queryClient.invalidateQueries({ queryKey: keys.projects });
    },
  });
}

export function useReorderProjects() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => api.post<Message>('/projects/reorder', { ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'projects'] });
      queryClient.invalidateQueries({ queryKey: keys.projects });
    },
  });
}

export interface ExperienceInput {
  organisation: string;
  title: string;
  location?: string | null;
  employment_type: string;
  started_on: string;
  ended_on?: string | null;
  is_current: boolean;
  summary?: string | null;
  achievements: string[];
  stack: string[];
  logo_url?: string | null;
  website?: string | null;
  position: number;
  is_published: boolean;
}

export function useAdminExperience() {
  return useQuery({
    queryKey: ['admin', 'experience'],
    queryFn: () => api.get<Experience[]>('/experience/admin'),
  });
}

export function useCreateExperience() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ExperienceInput) => api.post<Experience>('/experience', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'experience'] });
      queryClient.invalidateQueries({ queryKey: keys.experience });
    },
  });
}

export function useUpdateExperience() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<ExperienceInput> & { id: number }) =>
      api.patch<Experience>(`/experience/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'experience'] });
      queryClient.invalidateQueries({ queryKey: keys.experience });
    },
  });
}

export function useDeleteExperience() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<Message>(`/experience/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'experience'] });
      queryClient.invalidateQueries({ queryKey: keys.experience });
    },
  });
}

export function useReorderExperience() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => api.post<Message>('/experience/reorder', { ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'experience'] });
      queryClient.invalidateQueries({ queryKey: keys.experience });
    },
  });
}

export interface ServiceInput {
  title: string;
  slug?: string | null;
  summary: string;
  body?: string | null;
  icon: string;
  accent: string;
  bullets: string[];
  starting_price_minor?: number | null;
  currency: string;
  position: number;
  is_published: boolean;
}

export function useAdminServices() {
  return useQuery({
    queryKey: ['admin', 'services'],
    queryFn: () => api.get<Service[]>('/services/admin'),
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ServiceInput) => api.post<Service>('/services', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'services'] });
      queryClient.invalidateQueries({ queryKey: keys.services });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<ServiceInput> & { id: number }) =>
      api.patch<Service>(`/services/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'services'] });
      queryClient.invalidateQueries({ queryKey: keys.services });
    },
  });
}

/** Didn't exist before — the backend had no DELETE for services. */
export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<Message>(`/services/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'services'] });
      queryClient.invalidateQueries({ queryKey: keys.services });
    },
  });
}

export function useReorderServices() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => api.post<Message>('/services/reorder', { ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'services'] });
      queryClient.invalidateQueries({ queryKey: keys.services });
    },
  });
}

export interface TestimonialInput {
  author_name: string;
  author_title?: string | null;
  author_company?: string | null;
  avatar_url?: string | null;
  quote: string;
  rating: number;
  source_url?: string | null;
  project_id?: number | null;
  is_featured: boolean;
  is_published: boolean;
  position: number;
}

export function useAdminTestimonials() {
  return useQuery({
    queryKey: ['admin', 'testimonials'],
    queryFn: () => api.get<Testimonial[]>('/testimonials/admin'),
  });
}

export function useCreateTestimonial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TestimonialInput) => api.post<Testimonial>('/testimonials', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'testimonials'] });
      queryClient.invalidateQueries({ queryKey: keys.testimonials });
    },
  });
}

/** Didn't exist before — the backend had no PATCH for testimonials. */
export function useUpdateTestimonial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<TestimonialInput> & { id: number }) =>
      api.patch<Testimonial>(`/testimonials/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'testimonials'] });
      queryClient.invalidateQueries({ queryKey: keys.testimonials });
    },
  });
}

export function useDeleteTestimonial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<Message>(`/testimonials/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'testimonials'] });
      queryClient.invalidateQueries({ queryKey: keys.testimonials });
    },
  });
}

export function useReorderTestimonials() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => api.post<Message>('/testimonials/reorder', { ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'testimonials'] });
      queryClient.invalidateQueries({ queryKey: keys.testimonials });
    },
  });
}

export function useReplaceSkills() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; icon: string | null; accent: string; description: string | null; skills: { name: string; level: number; icon: string | null }[] }[]) =>
      api.put<SkillGroup[]>('/skills', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.skills }),
  });
}

export function useTestimonials() {
  return useQuery({
    queryKey: keys.testimonials,
    queryFn: () => api.get<Testimonial[]>('/testimonials'),
    staleTime: 5 * 60_000,
  });
}

export function useSponsors() {
  return useQuery({
    queryKey: keys.sponsors,
    queryFn: () => api.get<Sponsor[]>('/sponsors'),
    staleTime: 5 * 60_000,
  });
}

export function usePlans() {
  return useQuery({
    queryKey: keys.plans,
    queryFn: () => api.get<Plan[]>('/plans'),
    staleTime: 5 * 60_000,
  });
}

// ---------------------------------------------------------------- inbox
export function useSendContact() {
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post<Message>('/contact', payload),
  });
}

export function useSubmitRequest() {
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post<{ id: number; reference: string; message: string }>('/requests', payload),
  });
}

export function useSubscribe() {
  return useMutation({
    mutationFn: (payload: { email: string; name?: string; source?: string }) =>
      api.post<Message>('/newsletter/subscribe', payload),
  });
}

// -------------------------------------------------------------- adverts
export interface AdSlotOption {
  id: number;
  key: string;
  name: string;
  placement: string;
  pricing_model: string;
  base_price_minor: number;
  currency: string;
  is_active: boolean;
}

export function useAdSlotList(activeOnly = true) {
  return useQuery({
    queryKey: ['ad-slots', activeOnly],
    queryFn: () => api.get<AdSlotOption[]>('/ad-slots', { active_only: activeOnly }),
    staleTime: 5 * 60_000,
  });
}

export interface AdvertBooking {
  id: number;
  name: string;
  status: string;
  slot_id: number;
}

export function useBookAdvert() {
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post<AdvertBooking>('/adverts', payload),
  });
}

export interface CheckoutSession {
  reference: string;
  checkout_url: string;
  provider: string;
  amount_minor: number;
  currency: string;
}

export function useCreateCheckout() {
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post<CheckoutSession>('/payments/checkout', payload),
  });
}

export interface PaymentRecord {
  id: number;
  reference: string;
  provider: string;
  status: string;
  amount_minor: number;
  amount: number;
  currency: string;
  description: string | null;
  subject_type: string | null;
  subject_id: number | null;
}

export function usePayment(reference: string | undefined) {
  return useQuery({
    queryKey: ['payment', reference],
    queryFn: () => api.get<PaymentRecord>(`/payments/${reference}`),
    enabled: Boolean(reference),
    // Cheap poll so a settled payment (and the advert it unlocks) reflects
    // here without the person needing to refresh.
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? 3000 : false),
  });
}

export function useSimulatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reference, succeed = true }: { reference: string; succeed?: boolean }) =>
      api.post<PaymentRecord>(`/payments/${reference}/simulate`, undefined, { succeed }),
    onSuccess: (payment) => {
      queryClient.setQueryData(['payment', payment.reference], payment);
    },
  });
}

export function useAdSlot(
  slotKey: string,
  context: { category?: string; postId?: number; tags?: string[] } = {},
) {
  return useQuery({
    queryKey: keys.adSlot(slotKey, context),
    queryFn: () =>
      api.get<AdSlotServe | null>(`/ad-slots/${slotKey}/serve`, {
        category: context.category,
        postId: context.postId,
        tags: context.tags,
      }),
    // Each mount is a fresh impression, so this must not be served from cache.
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
}

// --------------------------------------------------------- notifications
export function useNotifications(unreadOnly = false) {
  return useQuery({
    queryKey: [...keys.notifications, unreadOnly],
    queryFn: () => api.get<Page<Notification>>('/notifications', { unreadOnly, perPage: 30 }),
    enabled: isSignedIn(),
  });
}

export function useNotificationCounts() {
  return useQuery({
    queryKey: keys.notificationCounts,
    queryFn: () => api.get<NotificationCounts>('/notifications/counts'),
    enabled: isSignedIn(),
    // A fallback for browsers that drop the SSE connection.
    refetchInterval: 60_000,
  });
}

export function useMarkNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => api.post<Message>('/notifications/read', { ids, read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.notifications }),
  });
}

// ------------------------------------------------------------ dashboard
export function useOverview() {
  return useQuery({
    queryKey: keys.overview,
    queryFn: () => api.get<DashboardOverview>('/dashboard/overview'),
  });
}

export function useReviewQueue() {
  return useQuery({
    queryKey: keys.reviewQueue,
    queryFn: () => api.get<Page<PostSummary>>('/posts/review/queue', { perPage: 50 }),
  });
}

export function useReviewPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      approve,
      publish,
      reason,
    }: {
      id: number;
      approve: boolean;
      publish?: boolean;
      reason?: string;
    }) =>
      api.post<Message>(`/posts/${id}/review`, {
        approve,
        publish: publish ?? true,
        reason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.reviewQueue });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useRoles() {
  return useQuery({ queryKey: keys.roles, queryFn: () => api.get<Role[]>('/roles') });
}

// ------------------------------------------------------------ user admin
export interface AdminUser {
  id: number;
  username: string;
  display_name: string;
  email: string;
  status: string;
  avatar_url: string | null;
  last_login_at: string | null;
  created_at: string;
  roles: { id: number; name: string; label: string }[];
}

export interface AdminUserFilters {
  page?: number;
  perPage?: number;
  q?: string;
  role?: string;
  status?: string;
  [key: string]: string | number | undefined;
}

export function useAdminUsers(filters: AdminUserFilters = {}) {
  return useQuery({
    queryKey: ['admin', 'users', filters],
    queryFn: () => api.get<Page<AdminUser>>('/admin/users', filters),
  });
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number; [key: string]: unknown }) =>
      api.patch<AdminUser>(`/admin/users/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<Message>(`/admin/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

// -------------------------------------------------------------- advert admin
export interface AdminAdvert {
  id: number;
  slot_id: number;
  name: string;
  creative_type: string;
  headline: string | null;
  body: string | null;
  target_url: string;
  status: string;
  advertiser_id: number | null;
  impression_count: number;
  click_count: number;
  spend_minor: number;
  created_at: string;
}

export function useAdminAdverts(status?: string) {
  return useQuery({
    queryKey: ['admin', 'adverts', status],
    queryFn: () => api.get<Page<AdminAdvert>>('/adverts', { status, perPage: 100 }),
  });
}

export function useReviewAdvert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approve, reason }: { id: number; approve: boolean; reason?: string }) =>
      api.post<Message>(`/adverts/${id}/review`, { approve, reason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'adverts'] }),
  });
}

export function useUpdateAdvert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number; [key: string]: unknown }) =>
      api.patch<AdminAdvert>(`/adverts/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'adverts'] }),
  });
}

export function useAdminAdSlots() {
  return useQuery({
    queryKey: ['admin', 'ad-slots'],
    queryFn: () => api.get<AdSlotOption[]>('/ad-slots', { active_only: false }),
  });
}

export function useUpdateAdSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number; [key: string]: unknown }) =>
      api.patch<AdSlotOption>(`/ad-slots/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'ad-slots'] }),
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ['settings', 'all'],
    queryFn: () => api.get<Record<string, any>[]>('/settings'),
  });
}

export function useWriteSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.put<Message>('/settings', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}
