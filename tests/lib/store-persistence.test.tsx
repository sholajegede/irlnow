import { beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { AppProvider, useApp } from "@/lib/store";

/**
 * End-to-end persistence through the real store, not the hook in isolation.
 *
 * Each test mounts a provider, acts, then mounts a *fresh* provider — which is
 * what a page reload actually does. Before this, every one of these
 * assertions failed: nothing survived a refresh, which made the web app
 * unusable for the private testing it exists to support.
 */
function mountApp() {
  return renderHook(() => useApp(), {
    wrapper: ({ children }: { children: ReactNode }) => <AppProvider>{children}</AppProvider>,
  });
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("state that survives a reload", () => {
  it("keeps an 'I'm going'", () => {
    const first = mountApp();
    expect(first.result.current.goingIds).not.toContain("jazz-late");
    act(() => first.result.current.toggleGoing("jazz-late"));
    expect(first.result.current.goingIds).toContain("jazz-late");

    expect(mountApp().result.current.goingIds).toContain("jazz-late");
  });

  it("keeps a removed 'I'm going' removed", () => {
    const first = mountApp();
    // The store seeds one going event; un-going it must also survive.
    act(() => first.result.current.toggleGoing("rooftop-golden-hour"));
    expect(first.result.current.goingIds).not.toContain("rooftop-golden-hour");

    expect(mountApp().result.current.goingIds).not.toContain("rooftop-golden-hour");
  });

  it("keeps a saved event", () => {
    const first = mountApp();
    act(() => first.result.current.toggleSaved("sunrise-run"));

    expect(mountApp().result.current.savedIds).toContain("sunrise-run");
  });

  it("keeps completed onboarding, so nobody is asked twice", () => {
    const first = mountApp();
    act(() =>
      first.result.current.completeOnboarding({
        name: "Shola",
        email: "shola@example.com",
        city: "London",
        interests: ["tech", "food"],
      }),
    );

    const reloaded = mountApp().result.current;
    expect(reloaded.onboarded).toBe(true);
    expect(reloaded.name).toBe("Shola");
    expect(reloaded.interests).toEqual(["tech", "food"]);
  });

  it("keeps accessibility preferences", () => {
    const first = mountApp();
    act(() => first.result.current.updateSettings({ reducedMotion: true }));

    const reloaded = mountApp().result.current;
    expect(reloaded.settings.reducedMotion).toBe(true);
    // Untouched settings keep their defaults rather than becoming undefined.
    expect(reloaded.settings.highContrast).toBe(false);
  });

  it("keeps privacy choices", () => {
    const first = mountApp();
    act(() => first.result.current.updatePrivacy({ profileVisibility: "private" }));

    const reloaded = mountApp().result.current;
    expect(reloaded.privacy.profileVisibility).toBe("private");
    expect(reloaded.privacy.showGoing).toBe(true);
  });

  it("keeps a connection", () => {
    const first = mountApp();
    act(() => first.result.current.toggleConnected("maya"));

    expect(mountApp().result.current.connectedIds).toContain("maya");
  });

  it("keeps a created event", () => {
    const first = mountApp();
    act(() =>
      first.result.current.addCreatedEvent({
        id: "my-birthday",
        title: "My Birthday",
        type: "Birthday",
        date: "2026-09-14",
        time: "19:00",
        location: "Dalston",
        cover: "rooftop",
        isPublic: true,
        capacity: 30,
        price: "Free",
      }),
    );

    const reloaded = mountApp().result.current.createdEvents;
    expect(reloaded).toHaveLength(1);
    expect(reloaded[0]?.title).toBe("My Birthday");
  });

  it("keeps a guest identity captured at a door", () => {
    const first = mountApp();
    act(() => first.result.current.setGuest({ name: "Ada", email: "ada@example.com" }));

    expect(mountApp().result.current.guestName).toBe("Ada");
  });
});

describe("signing out", () => {
  it("leaves nothing behind for the next person on the device", () => {
    const first = mountApp();
    act(() => {
      first.result.current.completeOnboarding({
        name: "Shola",
        email: "shola@example.com",
        city: "London",
        interests: ["tech"],
      });
      first.result.current.toggleSaved("jazz-late");
    });

    act(() => first.result.current.signOut());

    const next = mountApp().result.current;
    expect(next.onboarded).toBe(false);
    expect(next.name).toBe("");
    expect(next.interests).toEqual([]);
    expect(next.savedIds).not.toContain("jazz-late");
  });
});
