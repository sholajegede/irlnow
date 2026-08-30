import { render, screen, fireEvent } from "@testing-library/react-native";
import { FEED_CAP, goingGraph } from "@irlnow/domain";
import { EventFeedCard } from "@/features/discovery/EventFeedCard";
import { FeedEndCard } from "@/features/discovery/FeedEndCard";
import { makeFeedEvent } from "../helpers/factories";

/* ------------------------------------------------------------------
   The feed is the product. These tests defend the decisions that make
   it IRL NOW rather than another infinite scroll.
------------------------------------------------------------------- */

const PAGE_HEIGHT = 800;

function renderCard(overrides: Parameters<typeof makeFeedEvent>[0] = {}, props = {}) {
  const event = makeFeedEvent(overrides);
  const onToggleGoing = jest.fn();
  const onToggleSaved = jest.fn();

  const utils = render(
    <EventFeedCard
      event={event}
      graph={goingGraph(event.slug)}
      isGoing={false}
      isSaved={false}
      onToggleGoing={onToggleGoing}
      onToggleSaved={onToggleSaved}
      height={PAGE_HEIGHT}
      {...props}
    />,
  );
  return { ...utils, event, onToggleGoing, onToggleSaved };
}

describe("EventFeedCard", () => {
  it("shows what someone needs to decide: what, where, when, how much", () => {
    renderCard({
      title: "Golden Hour Rooftop Social",
      areaLabel: "Shoreditch · 1.2 km",
      whenLabel: "Tonight · 7:30pm",
      priceLabel: "£12",
    });

    expect(screen.getByText("Golden Hour Rooftop Social")).toBeOnTheScreen();
    expect(screen.getByText("Shoreditch · 1.2 km")).toBeOnTheScreen();
    expect(screen.getByText("Tonight · 7:30pm")).toBeOnTheScreen();
    expect(screen.getByText("£12")).toBeOnTheScreen();
  });

  it("offers the going action by name", () => {
    renderCard();
    expect(screen.getByText("I'm Going")).toBeOnTheScreen();
  });

  it("confirms in the past tense once someone is going", () => {
    renderCard({}, { isGoing: true });
    expect(screen.getByText("You're going")).toBeOnTheScreen();
    expect(screen.queryByText("I'm Going")).toBeNull();
  });

  it("hands the whole event to the callback, so a mutation can address it by id", () => {
    const { onToggleGoing, event } = renderCard();
    fireEvent.press(screen.getByLabelText("I'm going"));
    expect(onToggleGoing).toHaveBeenCalledWith(event);
  });

  it("saves without going, because saving is a different intent", () => {
    const { onToggleSaved, onToggleGoing, event } = renderCard();
    fireEvent.press(screen.getByLabelText("Save for later"));

    expect(onToggleSaved).toHaveBeenCalledWith(event);
    expect(onToggleGoing).not.toHaveBeenCalled();
  });

  it("labels the going control for screen readers in both states", () => {
    const { rerender, event } = renderCard();
    expect(screen.getByLabelText("I'm going")).toBeOnTheScreen();

    rerender(
      <EventFeedCard
        event={event}
        graph={goingGraph(event.slug)}
        isGoing
        isSaved={false}
        onToggleGoing={jest.fn()}
        onToggleSaved={jest.fn()}
        height={PAGE_HEIGHT}
      />,
    );
    expect(screen.getByLabelText("You're going. Tap to cancel.")).toBeOnTheScreen();
  });

  it("shows scarcity only when spots are genuinely low", () => {
    renderCard({ spotsLeft: 4 });
    expect(screen.getByText("4 spots left")).toBeOnTheScreen();
  });

  it("says nothing about capacity when an event is uncapped", () => {
    renderCard({ spotsLeft: null });
    expect(screen.queryByText(/spots left/)).toBeNull();
  });

  it("says nothing about capacity when an event is full", () => {
    // "0 spots left" is not urgency, it is a dead end. The detail screen
    // handles waitlisting.
    renderCard({ spotsLeft: 0 });
    expect(screen.queryByText(/spots left/)).toBeNull();
  });

  it("marks a trending event", () => {
    renderCard({ trending: true });
    expect(screen.getByText("TRENDING")).toBeOnTheScreen();
  });

  it("does not mark an ordinary event as trending", () => {
    renderCard({ trending: false });
    expect(screen.queryByText("TRENDING")).toBeNull();
  });

  /**
   * The people block is the whole reason the card works. The photograph
   * sells the night; the faces and the headline are what earn the tap.
   */
  it("leads with who is going", () => {
    const event = makeFeedEvent({ slug: "rooftop-golden-hour" });
    const graph = goingGraph(event.slug);

    render(
      <EventFeedCard
        event={event}
        graph={graph}
        isGoing={false}
        isSaved={false}
        onToggleGoing={jest.fn()}
        onToggleSaved={jest.fn()}
        height={PAGE_HEIGHT}
      />,
    );

    expect(screen.getByText(graph.headline)).toBeOnTheScreen();
    expect(screen.getByText(graph.subline)).toBeOnTheScreen();
  });

  it("describes the cover photograph rather than leaving it unlabelled", () => {
    renderCard({ title: "Velvet Room Jazz Late", areaLabel: "Soho" });
    expect(screen.getByLabelText("Velvet Room Jazz Late, Soho")).toBeOnTheScreen();
  });
});

/**
 * The finite feed is the product thesis made literal: every other feed is
 * built so you never reach the bottom, and reaching it here is the point.
 */
describe("FeedEndCard", () => {
  it("tells people to leave", () => {
    render(<FeedEndCard height={PAGE_HEIGHT} />);
    expect(screen.getByText(/That's it for now\./)).toBeOnTheScreen();
    expect(screen.getByText(/Go outside\./)).toBeOnTheScreen();
  });

  it("says plainly that there is no more, rather than implying a loading state", () => {
    render(<FeedEndCard height={PAGE_HEIGHT} />);
    expect(screen.getByText(/don't do infinite scroll/i)).toBeOnTheScreen();
  });

  it("offers somewhere to go from the end", () => {
    render(<FeedEndCard height={PAGE_HEIGHT} />);
    expect(screen.getByText("What I'm going to")).toBeOnTheScreen();
    expect(screen.getByText("Search something specific")).toBeOnTheScreen();
  });
});

describe("the feed cap", () => {
  it("is a small, deliberate number", () => {
    // Guards against someone "fixing" the feed by raising the cap. Ten is a
    // product decision; see docs/MOBILE-ARCHITECTURE.md.
    expect(FEED_CAP).toBe(10);
  });
});
