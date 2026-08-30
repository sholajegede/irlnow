import { screen, fireEvent } from "@testing-library/react-native";
import { renderScreen } from "../helpers/render";
import { FEED_CAP } from "@irlnow/domain";
import type { PublicEventShape } from "@/features/discovery/format";

/* ------------------------------------------------------------------
   The discovery screen, composed.

   The card and the ranking engine are tested on their own. This is the
   assembly: a Convex result going through formatting, ranking, the cap
   and into a paging list. It is the closest thing to running the app
   that exists without a simulator.
------------------------------------------------------------------- */

const HOUR = 3_600_000;

let mockQueryResult: PublicEventShape[] | undefined = [];
const mockSetStatus = jest.fn();

jest.mock("convex/react", () => ({
  useQuery: () => mockQueryResult,
  useMutation: () => mockSetStatus,
}));

// Anonymous by default — the state a first-time visitor is in, and the one
// the whole front door has to work in.
let mockAuthState = { status: "anonymous" as string, user: null as { id: string } | null };
jest.mock("@/lib/auth/AuthProvider", () => ({
  useAuth: () => ({ ...mockAuthState, error: null, isConfigured: false }),
}));

// Location is a convenience; the default here is "no fix", which must not
// stop anything rendering.
let mockCoords: { lat: number; lng: number } | null = null;
jest.mock("@/hooks/useViewerLocation", () => ({
  useViewerLocation: () => ({ coords: mockCoords, isResolving: false, isDenied: true }),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DiscoverScreen } = require("@/features/discovery/DiscoverScreen") as {
  DiscoverScreen: () => JSX.Element;
};

function makeEvent(overrides: Partial<PublicEventShape> = {}): PublicEventShape {
  return {
    id: `evt_${overrides.slug ?? "base"}`,
    slug: "base",
    title: "Base Event",
    description: "Something to do.",
    startsAt: Date.now() + 24 * HOUR,
    place: { name: "Studio Kitchen", area: "Hackney", lat: 51.545, lng: -0.0553 },
    priceMinor: 0,
    currency: "GBP",
    category: "Food & drink",
    interests: ["food"],
    coverKey: "supper",
    goingCount: 12,
    spotsLeft: null,
    organiser: { name: "Tomás" },
    ...overrides,
  };
}

beforeEach(() => {
  mockQueryResult = [];
  mockCoords = null;
  mockAuthState = { status: "anonymous", user: null };
  mockSetStatus.mockClear();
});

describe("DiscoverScreen", () => {
  it("offers the four ways of looking at what's on", async () => {
    await renderScreen(<DiscoverScreen />);

    expect(screen.getByText("For you")).toBeOnTheScreen();
    expect(screen.getByText("Tonight")).toBeOnTheScreen();
    expect(screen.getByText("This weekend")).toBeOnTheScreen();
    expect(screen.getByText("Trending")).toBeOnTheScreen();
  });

  it("says it is looking before the query answers", async () => {
    mockQueryResult = undefined;
    await renderScreen(<DiscoverScreen />);
    expect(screen.getByText("Finding what's on…")).toBeOnTheScreen();
  });

  it("renders events from the backend", async () => {
    mockQueryResult = [
      makeEvent({ slug: "jazz-late", title: "Velvet Room Jazz Late" }),
      makeEvent({ slug: "supper-club", title: "Long Table Supper Club" }),
    ];
    await renderScreen(<DiscoverScreen />);

    expect(screen.getByText("Velvet Room Jazz Late")).toBeOnTheScreen();
  });

  it("formats stored values into copy a person can read", async () => {
    mockQueryResult = [
      makeEvent({ slug: "rooftop", startsAt: Date.now() + 4 * HOUR, priceMinor: 1200 }),
    ];
    await renderScreen(<DiscoverScreen />);

    // 1200 pence and an epoch go in; "£12" and "Tonight · …" come out.
    expect(screen.getByText("£12")).toBeOnTheScreen();
    expect(screen.getByText(/^Tonight · /)).toBeOnTheScreen();
  });

  it("shows the area alone when there is no location fix", async () => {
    mockQueryResult = [makeEvent({ slug: "rooftop" })];
    await renderScreen(<DiscoverScreen />);

    expect(screen.getByText("Hackney")).toBeOnTheScreen();
  });

  it("adds distance once the viewer's location is known", async () => {
    mockCoords = { lat: 51.5074, lng: -0.1278 };
    mockQueryResult = [makeEvent({ slug: "rooftop" })];
    await renderScreen(<DiscoverScreen />);

    expect(screen.getByText(/^Hackney · /)).toBeOnTheScreen();
  });

  /**
   * The constraint the whole product turns on. Twenty events in, ten out,
   * and an explicit ending — never a request for more.
   */
  it("stops at the feed cap however many events the backend returns", async () => {
    mockQueryResult = Array.from({ length: 20 }, (_, i) =>
      makeEvent({ slug: `event-${i}`, title: `Event ${i}`, startsAt: Date.now() + (i + 1) * HOUR }),
    );
    await renderScreen(<DiscoverScreen />);

    // The list virtualises, so counting rendered rows would measure the
    // render window rather than the feed. Its data is the feed.
    const list = screen.getByTestId("discovery-feed");
    const rows = (list.props as { data: { kind: string }[] }).data;

    expect(mockQueryResult.length).toBeGreaterThan(FEED_CAP);
    expect(rows.filter((r) => r.kind === "event")).toHaveLength(FEED_CAP);
    // Exactly one ending, always last.
    expect(rows.filter((r) => r.kind === "end")).toHaveLength(1);
    expect(rows.at(-1)!.kind).toBe("end");
  });

  it("ends with 'Go outside' rather than loading more", async () => {
    mockQueryResult = [makeEvent({ slug: "only" })];
    await renderScreen(<DiscoverScreen />);

    expect(screen.getByText(/Go outside\./)).toBeOnTheScreen();
    expect(screen.queryByText(/loading more/i)).toBeNull();
  });

  it("shows no end card when there is nothing to end", async () => {
    mockQueryResult = [];
    await renderScreen(<DiscoverScreen />);

    expect(screen.queryByText(/That's it for now\./)).toBeNull();
  });

  it("explains an empty view and offers a way out of it", async () => {
    mockQueryResult = [];
    await renderScreen(<DiscoverScreen />);

    expect(screen.getByText("Nothing on in this view")).toBeOnTheScreen();
    expect(screen.getByText("Show me everything")).toBeOnTheScreen();
  });

  /**
   * Anonymous discovery is the front door. Someone with no account must see
   * the whole feed, and no claim implying we know them.
   */
  it("renders the full feed for someone with no account", async () => {
    mockQueryResult = [makeEvent({ slug: "rooftop", title: "Golden Hour Rooftop Social" })];
    await renderScreen(<DiscoverScreen />);

    expect(screen.getByText("Golden Hour Rooftop Social")).toBeOnTheScreen();
    expect(screen.getByText("I'm Going")).toBeOnTheScreen();
    expect(screen.queryByText(/sign in/i)).toBeNull();
    expect(screen.queryByText(/same things as you/i)).toBeNull();
  });

  it("does not write to the backend when an anonymous visitor says they're going", async () => {
    mockQueryResult = [makeEvent({ slug: "rooftop" })];
    await renderScreen(<DiscoverScreen />);

    fireEvent.press(screen.getByLabelText("I'm going"));

    // Their intent is kept on the device until there is an account to attach
    // it to. Nobody is stopped mid-gesture to sign up.
    expect(mockSetStatus).not.toHaveBeenCalled();
  });

  it("switches view when another way of looking is chosen", async () => {
    const now = Date.now();
    mockQueryResult = [
      makeEvent({ slug: "tonight", title: "Tonight Thing", startsAt: now + 4 * HOUR }),
      makeEvent({ slug: "next-week", title: "Next Week Thing", startsAt: now + 8 * 24 * HOUR }),
    ];
    await renderScreen(<DiscoverScreen />);

    expect(screen.getByText("Next Week Thing")).toBeOnTheScreen();

    fireEvent.press(screen.getByText("Tonight"));

    expect(screen.getByText("Tonight Thing")).toBeOnTheScreen();
    expect(screen.queryByText("Next Week Thing")).toBeNull();
  });
});
