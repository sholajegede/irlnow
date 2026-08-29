/* ------------------------------------------------------------------
   Sample catalogue for development.

   SAMPLE DATA. These events, organisers and venues are invented. Nothing
   here describes a real event, and none of it should ever reach a
   production deployment — `seed.ts` refuses to run against one.

   It exists to exercise the real domain model: the prototype stored
   "Tonight · 7:30pm" and "£12" as display strings and regex-parsed them
   back. Here the same catalogue is expressed as epoch millis, integer
   minor units and real coordinates, which is what the backend stores.
------------------------------------------------------------------- */

/**
 * Approximate centroids of the London neighbourhoods used below.
 *
 * The prototype's `areaCoords` were stylised map positions as percentages of
 * a viewport, not geography. Distance-to-viewer needs real coordinates.
 */
export const AREA_COORDS: Record<string, { lat: number; lng: number }> = {
  Shoreditch: { lat: 51.5265, lng: -0.0784 },
  Soho: { lat: 51.5137, lng: -0.1341 },
  Hackney: { lat: 51.545, lng: -0.0553 },
  "London Bridge": { lat: 51.5049, lng: -0.0863 },
  Peckham: { lat: 51.4739, lng: -0.0692 },
  Brixton: { lat: 51.4613, lng: -0.1156 },
  Camden: { lat: 51.539, lng: -0.1426 },
};

export interface SeedOrganiser {
  key: string;
  name: string;
  blurb: string;
  avatarSeed: number;
  verified: boolean;
}

export const SEED_ORGANISERS: SeedOrganiser[] = [
  {
    key: "amara",
    name: "Amara",
    blurb: "Rooftop socials & sunset sets across east London.",
    avatarSeed: 4,
    verified: true,
  },
  {
    key: "tomas",
    name: "Tomás",
    blurb: "Long Table Supper Club — five courses, twenty strangers.",
    avatarSeed: 3,
    verified: true,
  },
  {
    key: "josh",
    name: "Josh",
    blurb: "Bridge at Dawn Run Club. All paces, coffee after.",
    avatarSeed: 1,
    verified: true,
  },
  {
    key: "priya",
    name: "Priya",
    blurb: "After Dark Gallery Lates in Peckham warehouses.",
    avatarSeed: 2,
    verified: false,
  },
  {
    key: "marcus",
    name: "Marcus",
    blurb: "Velvet Room jazz nights, Soho basements only.",
    avatarSeed: 2,
    verified: true,
  },
  {
    key: "leo",
    name: "Leo",
    blurb: "Beginner-friendly bouldering socials.",
    avatarSeed: 5,
    verified: false,
  },
  {
    key: "freya",
    name: "Freya",
    blurb: "Board game takeovers in Camden.",
    avatarSeed: 6,
    verified: false,
  },
  {
    key: "nina",
    name: "Nina",
    blurb: "Slow market mornings and golden-hour walks.",
    avatarSeed: 1,
    verified: false,
  },
];

export interface SeedEvent {
  slug: string;
  title: string;
  description: string;
  organiserKey: string;
  category: string;
  interests: string[];
  coverKey: string;
  vibes: string[];
  venueName: string;
  area: string;
  /** Days from the seed date. 0 is today. */
  dayOffset: number;
  /** 24-hour local start time. */
  hour: number;
  minute: number;
  /** How long it runs, in hours. */
  durationHours: number;
  /** Integer pence. 0 is free. */
  priceMinor: number;
  capacity?: number;
}

export const SEED_EVENTS: SeedEvent[] = [
  {
    slug: "rooftop-golden-hour",
    title: "Golden Hour Rooftop Social",
    description:
      "Sunset DJ set, skyline views and a crowd that's actually up for talking. First drink included before 8pm.",
    organiserKey: "amara",
    category: "Nightlife",
    interests: ["nightlife", "music", "photo"],
    coverKey: "rooftop",
    vibes: ["Sunset", "DJ set", "Open air"],
    venueName: "The Parallax",
    area: "Shoreditch",
    dayOffset: 0,
    hour: 19,
    minute: 30,
    durationHours: 4,
    priceMinor: 1200,
    capacity: 100,
  },
  {
    slug: "jazz-late",
    title: "Velvet Room Jazz Late",
    description:
      "A candlelit basement quartet, two sets, no phones during the second. The best-kept secret in Soho.",
    organiserKey: "marcus",
    category: "Live music",
    interests: ["music", "food"],
    coverKey: "jazz",
    vibes: ["Candlelit", "Quartet", "Late"],
    venueName: "The Velvet Room",
    area: "Soho",
    dayOffset: 0,
    hour: 21,
    minute: 0,
    durationHours: 3,
    priceMinor: 800,
  },
  {
    slug: "street-food-crawl",
    title: "Neon Market Food Crawl",
    description:
      "Six stalls, one mission: find the best dish on the lane. Group vote at the end, loser buys churros.",
    organiserKey: "tomas",
    category: "Food & drink",
    interests: ["food", "comedy"],
    coverKey: "streetfood",
    vibes: ["Crawl", "Group vote", "Street food"],
    venueName: "Arcade Lane",
    area: "Soho",
    dayOffset: 0,
    hour: 18,
    minute: 30,
    durationHours: 3,
    priceMinor: 0,
  },
  {
    slug: "board-game-night",
    title: "Board Game Café Takeover",
    description:
      "Whole back room reserved. Party games first, strategy table for the brave. Hot chocolate on tap.",
    organiserKey: "freya",
    category: "Games",
    interests: ["games", "comedy"],
    coverKey: "games",
    vibes: ["Party games", "Strategy table", "Cozy"],
    venueName: "Dice & Beans",
    area: "Camden",
    dayOffset: 2,
    hour: 18,
    minute: 30,
    durationHours: 4,
    priceMinor: 500,
  },
  {
    slug: "boulder-social",
    title: "Boulder & Banter Night",
    description:
      "Beginner-friendly social session. Comp shoe hire included, plus pizza downstairs after. No grades chat.",
    organiserKey: "leo",
    category: "Climbing",
    interests: ["climbing", "wellness"],
    coverKey: "climb",
    vibes: ["Beginner friendly", "Pizza after", "Social"],
    venueName: "Substation",
    area: "Brixton",
    dayOffset: 3,
    hour: 19,
    minute: 0,
    durationHours: 3,
    priceMinor: 1400,
  },
  {
    slug: "gallery-late",
    title: "After Dark Gallery Opening",
    description:
      "New show from three emerging painters, wine in hand, artist Q&A at 9. Warehouse space, big colour.",
    organiserKey: "priya",
    category: "Art",
    interests: ["art", "photo"],
    coverKey: "gallery",
    vibes: ["Opening night", "Artist Q&A", "Wine"],
    venueName: "Unit 9 Gallery",
    area: "Peckham",
    dayOffset: 4,
    hour: 20,
    minute: 0,
    durationHours: 3,
    priceMinor: 0,
  },
  {
    slug: "market-morning",
    title: "Broadway Market Morning Loop",
    description:
      "Coffee first, then a slow loop of the stalls — produce, pastries, flowers. We split up and regroup to compare finds.",
    organiserKey: "nina",
    category: "Food & drink",
    interests: ["food", "photo"],
    coverKey: "market",
    vibes: ["Daytime", "Coffee first", "Slow loop"],
    venueName: "Broadway Market",
    area: "Hackney",
    dayOffset: 5,
    hour: 10,
    minute: 0,
    durationHours: 2,
    priceMinor: 0,
  },
  {
    slug: "supper-club",
    title: "Long Table Supper Club",
    description:
      "One long table, five sharing courses, twenty strangers who won't be strangers by dessert. BYOB welcome.",
    organiserKey: "tomas",
    category: "Food & drink",
    interests: ["food"],
    coverKey: "supper",
    vibes: ["Sharing plates", "One table", "BYOB"],
    venueName: "Studio Kitchen",
    area: "Hackney",
    dayOffset: 5,
    hour: 19,
    minute: 0,
    durationHours: 4,
    priceMinor: 3500,
    capacity: 20,
  },
  {
    slug: "sunrise-run",
    title: "Bridge at Dawn Run Club",
    description:
      "5k or 10k, all paces, coffee and pastries after. Beat the city waking up — it's worth the alarm.",
    organiserKey: "josh",
    category: "Running",
    interests: ["running", "wellness"],
    coverKey: "run",
    vibes: ["All paces", "Coffee after", "5k / 10k"],
    venueName: "Tower Bridge (south side)",
    area: "London Bridge",
    dayOffset: 6,
    hour: 6,
    minute: 45,
    durationHours: 2,
    priceMinor: 0,
  },
  {
    slug: "pottery-sunday",
    title: "Sunday Clay & Coffee",
    description:
      "Two hours on the wheel, no experience needed. Aprons provided, coffee on the house, your wonky first bowl shipped to you after firing.",
    organiserKey: "priya",
    category: "Art",
    interests: ["art", "wellness"],
    coverKey: "gallery",
    vibes: ["Beginner friendly", "Daytime", "Take your bowl home"],
    venueName: "Turning Earth",
    area: "Shoreditch",
    dayOffset: 6,
    hour: 11,
    minute: 0,
    durationHours: 2,
    priceMinor: 2200,
  },
];

export interface SeedPerson {
  key: string;
  name: string;
  avatarSeed: number;
  bio: string;
  interests: string[];
  goingSolo: boolean;
  /** Event slugs this person is going to. */
  going: string[];
}

export const SEED_PEOPLE: SeedPerson[] = [
  {
    key: "maya",
    name: "Maya",
    avatarSeed: 0,
    bio: "Jazz bars, natural wine and my film camera.",
    interests: ["music", "food", "photo"],
    goingSolo: false,
    going: ["rooftop-golden-hour", "jazz-late", "gallery-late", "market-morning"],
  },
  {
    key: "josh",
    name: "Josh",
    avatarSeed: 1,
    bio: "Sunrise runs and strong coffee.",
    interests: ["running", "wellness", "tech"],
    goingSolo: true,
    going: ["sunrise-run", "boulder-social"],
  },
  {
    key: "priya",
    name: "Priya",
    avatarSeed: 2,
    bio: "Gallery lates > everything.",
    interests: ["art", "film", "food"],
    goingSolo: false,
    going: ["jazz-late", "gallery-late", "board-game-night", "pottery-sunday"],
  },
  {
    key: "tomas",
    name: "Tomás",
    avatarSeed: 3,
    bio: "Will travel for dumplings.",
    interests: ["food", "comedy", "games"],
    goingSolo: false,
    going: ["supper-club", "street-food-crawl", "board-game-night"],
  },
  {
    key: "amara",
    name: "Amara",
    avatarSeed: 4,
    bio: "A&R by day, dancefloor by night.",
    interests: ["nightlife", "music", "art"],
    goingSolo: true,
    going: ["jazz-late", "boulder-social", "pottery-sunday"],
  },
  {
    key: "leo",
    name: "Leo",
    avatarSeed: 5,
    bio: "Slab enthusiast. Terrible at resting.",
    interests: ["climbing", "running", "wellness"],
    goingSolo: false,
    going: ["boulder-social", "sunrise-run", "pottery-sunday"],
  },
  {
    key: "freya",
    name: "Freya",
    avatarSeed: 6,
    bio: "Undefeated at Catan (ask anyone).",
    interests: ["games", "film", "comedy"],
    goingSolo: false,
    going: ["supper-club", "street-food-crawl", "board-game-night", "market-morning"],
  },
  {
    key: "dev",
    name: "Dev",
    avatarSeed: 7,
    bio: "Building things, eating things.",
    interests: ["tech", "food", "running"],
    goingSolo: false,
    going: ["supper-club", "sunrise-run"],
  },
  {
    key: "nina",
    name: "Nina",
    avatarSeed: 1,
    bio: "Chasing golden hour.",
    interests: ["photo", "art", "wellness"],
    goingSolo: false,
    going: ["rooftop-golden-hour", "gallery-late", "market-morning"],
  },
  {
    key: "marcus",
    name: "Marcus",
    avatarSeed: 2,
    bio: "Here for the encore.",
    interests: ["music", "nightlife", "comedy"],
    goingSolo: false,
    going: ["rooftop-golden-hour", "street-food-crawl"],
  },
];
