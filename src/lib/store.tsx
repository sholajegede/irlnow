import type { EventRating } from "@/lib/ratings";
import type { AuthSession } from "@/lib/auth";
import type { InviteRecord } from "@/lib/invite";
import type { OrganiserReview } from "@/lib/reviews";
import type { Order } from "@/lib/tickets";
import { seedMethods, type PaymentMethod } from "@/lib/payments";
import type { Plan } from "@/lib/plans";
import type { PlusOne, TicketTransfer } from "@/lib/attend";
import type { HostTemplate } from "@/lib/hosting";
import type { Boost, Membership, MembershipPlan } from "@/lib/money";
import { renewalDate } from "@/lib/money";
import type { LiveMessage } from "@/lib/live";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

/** A capacity drop published from the venue portal. */
export interface PublishedDrop {
  id: string;
  title: string;
  offer: string;
  slot: string;
  seats: number;
  bid: number;
  budget: number;
  reach: number;
}

export interface CreatedEvent {
  id: string;
  title: string;
  type: string;
  date: string;
  time: string;
  location: string;
  cover: string;
  isPublic: boolean;
  capacity: number;
  price: string;
}

export interface GuestUpload {
  id: string;
  cover: string;
  by: string;
  justNow: boolean;
}

export interface SentMessage {
  id: string;
  text: string;
  minutesAgo: number;
}

export interface PrivacySettings {
  profileVisibility: "public" | "attendees" | "connections" | "private";
  showGoing: boolean;
  allowMessagesFrom: "connections" | "attendees" | "nobody";
  appearInPhotos: boolean;
  showBirthdayNudges: boolean;
  locationPrecision: "exact" | "area" | "city";
  tagApproval: boolean;
  hideFromSearch: boolean;
}

export interface ReportRecord {
  id: string;
  targetId: string;
  targetName: string;
  reason: string;
  detail: string;
  when: string;
  status: "reviewing" | "actioned";
}

export interface AppSettings {
  language: string;
  units: "metric" | "imperial";
  reducedMotion: boolean;
  highContrast: boolean;
  emailDigest: boolean;
}

export interface Broadcast {
  id: string;
  eventId: string;
  text: string;
  when: string;
  urgent: boolean;
  /** ISO-ish label of when it goes out; undefined = sent immediately */
  scheduledFor?: string | undefined;
  /** still queued, not delivered yet */
  scheduled?: boolean;
  readBy?: boolean;
}

export interface EventEdit {
  title: string;
  time: string;
  location: string;
  note: string;
}

export interface CancelledEvent {
  reason: string;
  message: string;
  refunded: boolean;
  when: string;
}

export interface NotificationPrefs {
  eventReminders: boolean;
  walls: boolean;
  connections: boolean;
  messages: boolean;
  suggestions: boolean;
  quietHours: boolean;
}

/** How long each notification type is kept in the in-app centre, in days. */
export interface NotifRetention {
  eventReminders: number;
  walls: number;
  connections: number;
  messages: number;
  hostUpdates: number;
}

export interface DevicePush {
  optedIn: boolean;
  /** how long this device keeps delivered notifications */
  retentionDays: number;
  decidedAt: string | null;
}

export interface KeepReceipt {
  id: string;
  eventId: string;
  plan: MembershipPlan;
  amount: number;
  when: string;
  photos: number;
  card: string;
}


interface AppState {
  onboarded: boolean;
  name: string;
  email: string;
  city: string;
  interests: string[];
  goingIds: string[];
  savedIds: string[];
  connectedIds: string[];
  goingSoloIds: string[];
  createdEvents: CreatedEvent[];
  guestName: string;
  guestEmail: string;
  checkedInIds: string[];
  uploads: Record<string, GuestUpload[]>;
  waitlistIds: string[];
  crews: Record<string, string[]>; // eventId -> invited connection ids
  followedSeriesIds: string[];
  claimedWallIds: string[];
  birthday: string;
  recapDismissed: boolean;
  // social graph
  incomingRequests: string[];
  outgoingRequests: string[];
  blockedIds: string[];
  reportedIds: string[];
  sentMessages: Record<string, SentMessage[]>; // threadId -> your messages
  mutedThreads: string[];
  readNotificationIds: string[];
  liveReplies: Record<string, LiveMessage[]>;
  unreadThreads: string[];
  pinnedMessages: Record<string, string>;
  reactions: Record<string, string[]>;
  dismissedNotificationIds: string[];
  privacy: PrivacySettings;
  notifPrefs: NotificationPrefs;
  orders: Record<string, Order>;
  claimedDropIds: string[];
  myPlans: Plan[];
  joinedPlanIds: string[];
  planVotes: Record<string, string>;
  publishedDrops: PublishedDrop[];
  confirmedTags: string[];
  skippedTags: string[];
  downloadedPacks: string[];
  eventRatings: Record<string, EventRating>;
  metRequests: Record<string, number>; // personId -> expiry timestamp
  dismissedMetPrompts: string[];
  sharedRecaps: string[];
  waitlistHolds: Record<string, number>; // eventId -> hold expiry timestamp
  declinedHolds: string[];
  plusOnes: Record<string, PlusOne>;
  transfers: Record<string, TicketTransfer>;
  calendarAdded: string[];
  lockedPlans: string[];
  planSplitsIn: string[]; // plan ids where you've agreed to chip in
  // host depth
  doorCheckins: Record<string, string[]>; // eventId -> guest ids checked in at the door
  savedTemplates: HostTemplate[];
  templateDraft: HostTemplate | null;
  verifiedSteps: string[];
  repeatSchedules: Record<string, string[]>; // eventId -> future dates published
  // monetisation
  membership: Membership | null;
  boosts: Record<string, Boost>;
  paidInvoices: string[];
  cards: PaymentMethod[];
  defaultCardId: string;
  addCard: (m: PaymentMethod) => void;
  removeCard: (id: string) => void;
  setDefaultCard: (id: string) => void;
  completeOnboarding: (p: { name: string; email: string; city: string; interests: string[] }) => void;
  toggleGoing: (id: string) => void;
  toggleSaved: (id: string) => void;
  toggleConnected: (id: string) => void;
  toggleGoingSolo: (id: string) => void;
  addCreatedEvent: (e: CreatedEvent) => void;
  setGuest: (p: { name: string; email?: string }) => void;
  checkIn: (eventId: string) => void;
  addUploads: (eventId: string, items: GuestUpload[]) => void;
  toggleWaitlist: (id: string) => void;
  toggleCrewInvite: (eventId: string, personId: string) => void;
  toggleFollowSeries: (id: string) => void;
  claimWall: (eventId: string, identity: { name: string; email: string }) => void;
  setBirthday: (d: string) => void;
  dismissRecap: () => void;
  requestConnection: (id: string) => void;
  cancelRequest: (id: string) => void;
  acceptRequest: (id: string) => void;
  declineRequest: (id: string) => void;
  removeConnection: (id: string) => void;
  blockPerson: (id: string) => void;
  unblockPerson: (id: string) => void;
  reportPerson: (id: string) => void;
  sendMessage: (threadId: string, text: string) => void;
  toggleMute: (threadId: string) => void;
  markNotificationsRead: (ids: string[]) => void;
  dismissNotification: (id: string) => void;
  pushLiveReply: (m: LiveMessage) => void;
  markThreadRead: (threadId: string) => void;
  markThreadUnread: (threadId: string) => void;
  togglePinned: (threadId: string, messageId: string) => void;
  toggleReaction: (key: string, emoji: string) => void;
  updatePrivacy: (p: Partial<PrivacySettings>) => void;
  updateNotifPrefs: (p: Partial<NotificationPrefs>) => void;
  placeOrder: (order: Order) => void;
  refundOrder: (eventId: string) => void;
  claimDrop: (id: string) => void;
  releaseDrop: (id: string) => void;
  addPlan: (p: Plan) => void;
  togglePlanIn: (id: string) => void;
  votePlan: (planId: string, optionId: string) => void;
  publishDrop: (d: PublishedDrop) => void;
  confirmTag: (key: string) => void;
  skipTag: (key: string) => void;
  markPackDownloaded: (key: string) => void;
  rateEvent: (r: EventRating) => void;
  sendMetRequest: (personId: string) => void;
  dismissMetPrompt: (eventId: string) => void;
  markRecapShared: (eventId: string) => void;
  offerWaitlistHold: (eventId: string, minutes: number) => void;
  acceptWaitlistHold: (eventId: string) => void;
  declineWaitlistHold: (eventId: string) => void;
  setPlusOne: (p: PlusOne) => void;
  removePlusOne: (eventId: string) => void;
  transferTicket: (t: TicketTransfer) => void;
  cancelTransfer: (eventId: string) => void;
  markCalendarAdded: (eventId: string) => void;
  lockPlan: (planId: string) => void;
  togglePlanSplit: (planId: string) => void;
  doorCheckIn: (eventId: string, guestId: string) => void;
  doorUndo: (eventId: string, guestId: string) => void;
  saveTemplate: (t: HostTemplate) => void;
  removeTemplate: (id: string) => void;
  useTemplate: (t: HostTemplate) => void;
  clearTemplateDraft: () => void;
  completeVerification: (id: string) => void;
  scheduleRepeats: (eventId: string, dates: string[]) => void;
  joinMembership: (plan: MembershipPlan) => void;
  cancelMembership: () => void;
  startBoost: (b: Boost) => void;
  stopBoost: (eventId: string) => void;
  payInvoice: (id: string) => void;
  // auth
  session: AuthSession | null;
  signIn: (s: AuthSession) => void;
  signOut: () => void;
  // safety
  reports: ReportRecord[];
  addReport: (r: ReportRecord) => void;
  // cancellations
  cancelledEvents: Record<string, CancelledEvent>;
  cancelEvent: (eventId: string, c: CancelledEvent) => void;
  restoreEvent: (eventId: string) => void;
  // invites
  invites: InviteRecord[];
  logInvite: (r: InviteRecord) => void;
  // reviews
  reviews: Record<string, OrganiserReview>;
  addReview: (r: OrganiserReview) => void;
  noShows: Record<string, string[]>;
  toggleNoShow: (eventId: string, guestId: string) => void;
  // host + venue onboarding
  hostOnboardSteps: string[];
  completeHostStep: (id: string) => void;
  venueClaim: { name: string; area: string; capacity: number } | null;
  claimVenue: (v: { name: string; area: string; capacity: number }) => void;
  // host comms + edits
  broadcasts: Broadcast[];
  sendBroadcast: (b: Broadcast) => void;
  eventEdits: Record<string, EventEdit>;
  saveEventEdit: (eventId: string, e: EventEdit) => void;
  // memories kept
  keptForever: string[];
  keepForever: (eventId: string) => void;
  // settings
  // notification retention + device opt-in
  notifRetention: NotifRetention;
  updateNotifRetention: (r: Partial<NotifRetention>) => void;
  devicePush: DevicePush;
  setDevicePush: (d: Partial<DevicePush>) => void;
  // keep-forever receipts
  keepReceipts: Record<string, KeepReceipt>;
  recordKeepReceipt: (r: KeepReceipt) => void;
  markBroadcastRead: (id: string) => void;
  settings: AppSettings;
  updateSettings: (s: Partial<AppSettings>) => void;
}

export function waitlistPosition(eventId: string): number {
  const seed = eventId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return 2 + (seed % 5);
}

/** Connection state between you and a person. */
export type ConnectionState = "connected" | "requested" | "incoming" | "none" | "blocked";

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [onboarded, setOnboarded] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("London");
  const [interests, setInterests] = useState<string[]>([]);
  const [goingIds, setGoingIds] = useState<string[]>(["rooftop-golden-hour"]);
  const [savedIds, setSavedIds] = useState<string[]>(["supper-club"]);
  const [connectedIds, setConnectedIds] = useState<string[]>(["marcus"]);
  const [goingSoloIds, setGoingSoloIds] = useState<string[]>([]);
  const [createdEvents, setCreatedEvents] = useState<CreatedEvent[]>([]);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [checkedInIds, setCheckedInIds] = useState<string[]>([]);
  const [uploads, setUploads] = useState<Record<string, GuestUpload[]>>({});
  const [waitlistIds, setWaitlistIds] = useState<string[]>([]);
  const [crews, setCrews] = useState<Record<string, string[]>>({});
  const [followedSeriesIds, setFollowedSeriesIds] = useState<string[]>(["dawn-run"]);
  const [claimedWallIds, setClaimedWallIds] = useState<string[]>([]);
  const [birthday, setBirthdayState] = useState("");
  const [recapDismissed, setRecapDismissed] = useState(false);
  const [incomingRequests, setIncomingRequests] = useState<string[]>(["maya", "freya"]);
  const [outgoingRequests, setOutgoingRequests] = useState<string[]>(["dev"]);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [reportedIds, setReportedIds] = useState<string[]>([]);
  const [sentMessages, setSentMessages] = useState<Record<string, SentMessage[]>>({});
  const [mutedThreads, setMutedThreads] = useState<string[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [liveReplies, setLiveReplies] = useState<Record<string, LiveMessage[]>>({});
  const [unreadThreads, setUnreadThreads] = useState<string[]>(["event:rooftop-golden-hour", "dm:marcus"]);
  const [pinnedMessages, setPinnedMessages] = useState<Record<string, string>>({});
  const [reactions, setReactions] = useState<Record<string, string[]>>({});
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>([]);
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    profileVisibility: "attendees",
    showGoing: true,
    allowMessagesFrom: "attendees",
    appearInPhotos: true,
    showBirthdayNudges: true,
    locationPrecision: "area",
    tagApproval: true,
    hideFromSearch: false,
  });
  const [orders, setOrders] = useState<Record<string, Order>>({});
  const [claimedDropIds, setClaimedDropIds] = useState<string[]>([]);
  const [myPlans, setMyPlans] = useState<Plan[]>([]);
  const [joinedPlanIds, setJoinedPlanIds] = useState<string[]>([]);
  const [planVotes, setPlanVotes] = useState<Record<string, string>>({});
  const [publishedDrops, setPublishedDrops] = useState<PublishedDrop[]>([]);
  const [confirmedTags, setConfirmedTags] = useState<string[]>([]);
  const [skippedTags, setSkippedTags] = useState<string[]>([]);
  const [downloadedPacks, setDownloadedPacks] = useState<string[]>([]);
  const [eventRatings, setEventRatings] = useState<Record<string, EventRating>>({});
  const [metRequests, setMetRequests] = useState<Record<string, number>>({});
  const [dismissedMetPrompts, setDismissedMetPrompts] = useState<string[]>([]);
  const [sharedRecaps, setSharedRecaps] = useState<string[]>([]);
  const [waitlistHolds, setWaitlistHolds] = useState<Record<string, number>>({});
  const [declinedHolds, setDeclinedHolds] = useState<string[]>([]);
  const [plusOnes, setPlusOnes] = useState<Record<string, PlusOne>>({});
  const [transfers, setTransfers] = useState<Record<string, TicketTransfer>>({});
  const [calendarAdded, setCalendarAdded] = useState<string[]>([]);
  const [lockedPlans, setLockedPlans] = useState<string[]>([]);
  const [planSplitsIn, setPlanSplitsIn] = useState<string[]>([]);
  const [doorCheckins, setDoorCheckins] = useState<Record<string, string[]>>({});
  const [savedTemplates, setSavedTemplates] = useState<HostTemplate[]>([]);
  const [templateDraft, setTemplateDraft] = useState<HostTemplate | null>(null);
  const [verifiedSteps, setVerifiedSteps] = useState<string[]>(["email"]);
  const [repeatSchedules, setRepeatSchedules] = useState<Record<string, string[]>>({});
  const [membership, setMembership] = useState<Membership | null>(null);
  const [boosts, setBoosts] = useState<Record<string, Boost>>({});
  const [paidInvoices, setPaidInvoices] = useState<string[]>([]);
  const [cards, setCards] = useState<PaymentMethod[]>(seedMethods);
  const [defaultCardId, setDefaultCardId] = useState<string>(seedMethods[1]!.id);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>({
    eventReminders: true,
    walls: true,
    connections: true,
    messages: true,
    suggestions: false,
    quietHours: false,
  });
  const [session, setSession] = useState<AuthSession | null>(null);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [cancelledEvents, setCancelledEvents] = useState<Record<string, CancelledEvent>>({});
  const [invites, setInvites] = useState<InviteRecord[]>([]);
  const [reviews, setReviews] = useState<Record<string, OrganiserReview>>({});
  const [noShows, setNoShows] = useState<Record<string, string[]>>({});
  const [hostOnboardSteps, setHostOnboardSteps] = useState<string[]>([]);
  const [venueClaim, setVenueClaim] = useState<{ name: string; area: string; capacity: number } | null>(null);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [eventEdits, setEventEdits] = useState<Record<string, EventEdit>>({});
  const [keptForever, setKeptForever] = useState<string[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    language: "English (UK)",
    units: "metric",
    reducedMotion: false,
    highContrast: false,
    emailDigest: true,
  });
  const [notifRetention, setNotifRetention] = useState<NotifRetention>({
    eventReminders: 7,
    walls: 30,
    connections: 90,
    messages: 30,
    hostUpdates: 14,
  });
  const [devicePush, setDevicePushState] = useState<DevicePush>({
    optedIn: false,
    retentionDays: 30,
    decidedAt: null,
  });
  const [keepReceipts, setKeepReceipts] = useState<Record<string, KeepReceipt>>({});



  const value = useMemo<AppState>(
    () => ({
      onboarded,
      name,
      email,
      city,
      interests,
      goingIds,
      savedIds,
      connectedIds,
      goingSoloIds,
      createdEvents,
      guestName,
      guestEmail,
      checkedInIds,
      uploads,
      waitlistIds,
      crews,
      followedSeriesIds,
      claimedWallIds,
      birthday,
      recapDismissed,
      incomingRequests,
      outgoingRequests,
      blockedIds,
      reportedIds,
      sentMessages,
      mutedThreads,
      readNotificationIds,
      liveReplies,
      unreadThreads,
      pinnedMessages,
      reactions,
      dismissedNotificationIds,
      privacy,
      notifPrefs,
      orders,
      claimedDropIds,
      myPlans,
      joinedPlanIds,
      planVotes,
      publishedDrops,
      confirmedTags,
      skippedTags,
      downloadedPacks,
      eventRatings,
      metRequests,
      dismissedMetPrompts,
      sharedRecaps,
      waitlistHolds,
      declinedHolds,
      plusOnes,
      transfers,
      calendarAdded,
      lockedPlans,
      planSplitsIn,
      doorCheckins,
      savedTemplates,
      templateDraft,
      verifiedSteps,
      repeatSchedules,
      membership,
      boosts,
      paidInvoices,
      cards,
      defaultCardId,
      addCard: (m) => {
        setCards((prev) => [...prev, m]);
        setDefaultCardId(m.id);
      },
      removeCard: (id) =>
        setCards((prev) => {
          const next = prev.filter((c) => c.id !== id);
          setDefaultCardId((cur) => (cur === id ? (next[0]?.id ?? "") : cur));
          return next;
        }),
      setDefaultCard: (id) => setDefaultCardId(id),
      completeOnboarding: (p) => {
        setName(p.name);
        setEmail(p.email);
        setCity(p.city);
        setInterests(p.interests);
        setOnboarded(true);
      },
      toggleGoing: (id) =>
        setGoingIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
      toggleSaved: (id) =>
        setSavedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
      toggleConnected: (id) =>
        setConnectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
      toggleGoingSolo: (id) =>
        setGoingSoloIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
      addCreatedEvent: (e) => setCreatedEvents((prev) => [...prev, e]),
      setGuest: (p) => {
        setGuestName(p.name);
        if (p.email !== undefined) setGuestEmail(p.email);
      },
      checkIn: (eventId) =>
        setCheckedInIds((prev) => (prev.includes(eventId) ? prev : [...prev, eventId])),
      addUploads: (eventId, items) =>
        setUploads((prev) => ({ ...prev, [eventId]: [...items, ...(prev[eventId] ?? [])] })),
      toggleWaitlist: (id) =>
        setWaitlistIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
      toggleCrewInvite: (eventId, personId) =>
        setCrews((prev) => {
          const cur = prev[eventId] ?? [];
          return {
            ...prev,
            [eventId]: cur.includes(personId) ? cur.filter((x) => x !== personId) : [...cur, personId],
          };
        }),
      toggleFollowSeries: (id) =>
        setFollowedSeriesIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
      claimWall: (eventId, identity) => {
        setGuestName(identity.name);
        setGuestEmail(identity.email);
        setClaimedWallIds((prev) => (prev.includes(eventId) ? prev : [...prev, eventId]));
      },
      setBirthday: (d) => setBirthdayState(d),
      dismissRecap: () => setRecapDismissed(true),
      requestConnection: (id) =>
        setOutgoingRequests((prev) => (prev.includes(id) ? prev : [...prev, id])),
      cancelRequest: (id) => setOutgoingRequests((prev) => prev.filter((x) => x !== id)),
      acceptRequest: (id) => {
        setIncomingRequests((prev) => prev.filter((x) => x !== id));
        setConnectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      },
      declineRequest: (id) => setIncomingRequests((prev) => prev.filter((x) => x !== id)),
      removeConnection: (id) => setConnectedIds((prev) => prev.filter((x) => x !== id)),
      blockPerson: (id) => {
        setBlockedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
        setConnectedIds((prev) => prev.filter((x) => x !== id));
        setIncomingRequests((prev) => prev.filter((x) => x !== id));
        setOutgoingRequests((prev) => prev.filter((x) => x !== id));
      },
      unblockPerson: (id) => setBlockedIds((prev) => prev.filter((x) => x !== id)),
      reportPerson: (id) => setReportedIds((prev) => (prev.includes(id) ? prev : [...prev, id])),
      sendMessage: (threadId, text) => {
        setSentMessages((prev) => ({
          ...prev,
          [threadId]: [...(prev[threadId] ?? []), { id: `${threadId}-${Date.now()}`, text, minutesAgo: 0 }],
        }));
        setUnreadThreads((prev) => prev.filter((x) => x !== threadId));
      },
      pushLiveReply: (m) =>
        setLiveReplies((prev) => ({ ...prev, [m.threadId]: [...(prev[m.threadId] ?? []), m] })),
      markThreadRead: (threadId) => setUnreadThreads((prev) => prev.filter((x) => x !== threadId)),
      markThreadUnread: (threadId) =>
        setUnreadThreads((prev) => (prev.includes(threadId) ? prev : [...prev, threadId])),
      togglePinned: (threadId, messageId) =>
        setPinnedMessages((prev) => ({
          ...prev,
          [threadId]: prev[threadId] === messageId ? "" : messageId,
        })),
      toggleReaction: (key, emoji) =>
        setReactions((prev) => {
          const list = prev[key] ?? [];
          return { ...prev, [key]: list.includes(emoji) ? list.filter((x) => x !== emoji) : [...list, emoji] };
        }),
      dismissNotification: (id) =>
        setDismissedNotificationIds((prev) => (prev.includes(id) ? prev : [...prev, id])),
      toggleMute: (threadId) =>
        setMutedThreads((prev) =>
          prev.includes(threadId) ? prev.filter((x) => x !== threadId) : [...prev, threadId],
        ),
      markNotificationsRead: (ids) =>
        setReadNotificationIds((prev) => Array.from(new Set([...prev, ...ids]))),
      updatePrivacy: (p) => setPrivacy((prev) => ({ ...prev, ...p })),
      updateNotifPrefs: (p) => setNotifPrefs((prev) => ({ ...prev, ...p })),
      placeOrder: (order) => {
        setOrders((prev) => ({ ...prev, [order.eventId]: order }));
        setGoingIds((prev) => (prev.includes(order.eventId) ? prev : [...prev, order.eventId]));
        setWaitlistIds((prev) => prev.filter((x) => x !== order.eventId));
      },
      refundOrder: (eventId) => {
        setOrders((prev) => {
          const next = { ...prev };
          delete next[eventId];
          return next;
        });
        setGoingIds((prev) => prev.filter((x) => x !== eventId));
      },
      claimDrop: (id) => setClaimedDropIds((prev) => (prev.includes(id) ? prev : [...prev, id])),
      releaseDrop: (id) => setClaimedDropIds((prev) => prev.filter((x) => x !== id)),
      addPlan: (p) => setMyPlans((prev) => [p, ...prev]),
      togglePlanIn: (id) =>
        setJoinedPlanIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
      votePlan: (planId, optionId) => setPlanVotes((prev) => ({ ...prev, [planId]: optionId })),
      publishDrop: (d) => setPublishedDrops((prev) => [d, ...prev]),
      confirmTag: (key) => setConfirmedTags((prev) => (prev.includes(key) ? prev : [...prev, key])),
      skipTag: (key) => setSkippedTags((prev) => (prev.includes(key) ? prev : [...prev, key])),
      markPackDownloaded: (key) =>
        setDownloadedPacks((prev) => (prev.includes(key) ? prev : [...prev, key])),
      rateEvent: (r) => setEventRatings((prev) => ({ ...prev, [r.eventId]: r })),
      sendMetRequest: (personId) => {
        setOutgoingRequests((prev) => (prev.includes(personId) ? prev : [...prev, personId]));
        setMetRequests((prev) => ({ ...prev, [personId]: Date.now() + 48 * 3_600_000 }));
      },
      dismissMetPrompt: (eventId) =>
        setDismissedMetPrompts((prev) => (prev.includes(eventId) ? prev : [...prev, eventId])),
      markRecapShared: (eventId) =>
        setSharedRecaps((prev) => (prev.includes(eventId) ? prev : [...prev, eventId])),
      offerWaitlistHold: (eventId, minutes) =>
        setWaitlistHolds((prev) =>
          prev[eventId] ? prev : { ...prev, [eventId]: Date.now() + minutes * 60_000 },
        ),
      acceptWaitlistHold: (eventId) => {
        setWaitlistHolds((prev) => {
          const next = { ...prev };
          delete next[eventId];
          return next;
        });
        setWaitlistIds((prev) => prev.filter((x) => x !== eventId));
        setGoingIds((prev) => (prev.includes(eventId) ? prev : [...prev, eventId]));
      },
      declineWaitlistHold: (eventId) => {
        setWaitlistHolds((prev) => {
          const next = { ...prev };
          delete next[eventId];
          return next;
        });
        setWaitlistIds((prev) => prev.filter((x) => x !== eventId));
        setDeclinedHolds((prev) => (prev.includes(eventId) ? prev : [...prev, eventId]));
      },
      setPlusOne: (p) => setPlusOnes((prev) => ({ ...prev, [p.eventId]: p })),
      removePlusOne: (eventId) =>
        setPlusOnes((prev) => {
          const next = { ...prev };
          delete next[eventId];
          return next;
        }),
      transferTicket: (t) => {
        setTransfers((prev) => ({ ...prev, [t.eventId]: t }));
        setGoingIds((prev) => prev.filter((x) => x !== t.eventId));
      },
      cancelTransfer: (eventId) => {
        setTransfers((prev) => {
          const next = { ...prev };
          delete next[eventId];
          return next;
        });
        setGoingIds((prev) => (prev.includes(eventId) ? prev : [...prev, eventId]));
      },
      markCalendarAdded: (eventId) =>
        setCalendarAdded((prev) => (prev.includes(eventId) ? prev : [...prev, eventId])),
      lockPlan: (planId) => setLockedPlans((prev) => (prev.includes(planId) ? prev : [...prev, planId])),
      togglePlanSplit: (planId) =>
        setPlanSplitsIn((prev) =>
          prev.includes(planId) ? prev.filter((x) => x !== planId) : [...prev, planId],
        ),
      doorCheckIn: (eventId, guestId) =>
        setDoorCheckins((prev) => {
          const list = prev[eventId] ?? [];
          return list.includes(guestId) ? prev : { ...prev, [eventId]: [...list, guestId] };
        }),
      doorUndo: (eventId, guestId) =>
        setDoorCheckins((prev) => ({
          ...prev,
          [eventId]: (prev[eventId] ?? []).filter((x) => x !== guestId),
        })),
      saveTemplate: (t) =>
        setSavedTemplates((prev) => (prev.some((x) => x.id === t.id) ? prev : [t, ...prev])),
      removeTemplate: (id) => setSavedTemplates((prev) => prev.filter((t) => t.id !== id)),
      useTemplate: (t) => setTemplateDraft(t),
      clearTemplateDraft: () => setTemplateDraft(null),
      completeVerification: (id) =>
        setVerifiedSteps((prev) => (prev.includes(id) ? prev : [...prev, id])),
      scheduleRepeats: (eventId, dates) =>
        setRepeatSchedules((prev) => ({ ...prev, [eventId]: dates })),
      joinMembership: (plan) =>
        setMembership({
          plan,
          startedAt: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
          renewsOn: renewalDate(plan),
        }),
      cancelMembership: () => setMembership(null),
      startBoost: (b) => setBoosts((prev) => ({ ...prev, [b.eventId]: b })),
      stopBoost: (eventId) =>
        setBoosts((prev) => {
          const next = { ...prev };
          delete next[eventId];
          return next;
        }),
      payInvoice: (id) => setPaidInvoices((prev) => (prev.includes(id) ? prev : [...prev, id])),
      session,
      signIn: (s) => {
        setSession(s);
        if (!name && s.method === "email") setEmail(s.handle);
      },
      signOut: () => {
        setSession(null);
        setOnboarded(false);
      },
      reports,
      addReport: (r) => {
        setReports((prev) => [r, ...prev]);
        setReportedIds((prev) => (prev.includes(r.targetId) ? prev : [...prev, r.targetId]));
      },
      cancelledEvents,
      cancelEvent: (eventId, c) => {
        setCancelledEvents((prev) => ({ ...prev, [eventId]: c }));
        if (c.refunded) {
          setOrders((prev) => {
            const next = { ...prev };
            delete next[eventId];
            return next;
          });
        }
      },
      restoreEvent: (eventId) =>
        setCancelledEvents((prev) => {
          const next = { ...prev };
          delete next[eventId];
          return next;
        }),
      invites,
      logInvite: (r) => setInvites((prev) => [r, ...prev]),
      reviews,
      addReview: (r) => setReviews((prev) => ({ ...prev, [r.eventId]: r })),
      noShows,
      toggleNoShow: (eventId, guestId) =>
        setNoShows((prev) => {
          const list = prev[eventId] ?? [];
          return {
            ...prev,
            [eventId]: list.includes(guestId) ? list.filter((x) => x !== guestId) : [...list, guestId],
          };
        }),
      hostOnboardSteps,
      completeHostStep: (id) =>
        setHostOnboardSteps((prev) => (prev.includes(id) ? prev : [...prev, id])),
      venueClaim,
      claimVenue: (v) => setVenueClaim(v),
      broadcasts,
      sendBroadcast: (b) => setBroadcasts((prev) => [b, ...prev]),
      eventEdits,
      saveEventEdit: (eventId, e) => setEventEdits((prev) => ({ ...prev, [eventId]: e })),
      keptForever,
      keepForever: (eventId) =>
        setKeptForever((prev) => (prev.includes(eventId) ? prev : [...prev, eventId])),
      markBroadcastRead: (id) =>
        setBroadcasts((prev) => prev.map((b) => (b.id === id ? { ...b, readBy: true } : b))),
      notifRetention,
      updateNotifRetention: (r) => setNotifRetention((prev) => ({ ...prev, ...r })),
      devicePush,
      setDevicePush: (d) => setDevicePushState((prev) => ({ ...prev, ...d })),
      keepReceipts,
      recordKeepReceipt: (r) => setKeepReceipts((prev) => ({ ...prev, [r.eventId]: r })),
      settings,
      updateSettings: (s) => setSettings((prev) => ({ ...prev, ...s })),
    }),
    [onboarded, name, email, city, interests, goingIds, savedIds, connectedIds, goingSoloIds, createdEvents, guestName, guestEmail, checkedInIds, uploads, waitlistIds, crews, followedSeriesIds, claimedWallIds, birthday, recapDismissed, incomingRequests, outgoingRequests, blockedIds, reportedIds, sentMessages, mutedThreads, readNotificationIds, liveReplies, unreadThreads, pinnedMessages, reactions, dismissedNotificationIds, privacy, notifPrefs, orders, claimedDropIds, myPlans, joinedPlanIds, planVotes, publishedDrops, confirmedTags, skippedTags, downloadedPacks, eventRatings, metRequests, dismissedMetPrompts, sharedRecaps, waitlistHolds, declinedHolds, plusOnes, transfers, calendarAdded, lockedPlans, planSplitsIn, doorCheckins, savedTemplates, templateDraft, verifiedSteps, repeatSchedules, membership, boosts, paidInvoices, cards, defaultCardId, session, reports, cancelledEvents, invites, reviews, noShows, hostOnboardSteps, venueClaim, broadcasts, eventEdits, keptForever, notifRetention, devicePush, keepReceipts, settings],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

export function useConnectionState(personId: string): ConnectionState {
  const { connectedIds, outgoingRequests, incomingRequests, blockedIds } = useApp();
  if (blockedIds.includes(personId)) return "blocked";
  if (connectedIds.includes(personId)) return "connected";
  if (incomingRequests.includes(personId)) return "incoming";
  if (outgoingRequests.includes(personId)) return "requested";
  return "none";
}
