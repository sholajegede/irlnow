import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import {
  clearPersisted,
  isBoolean,
  isRecordOf,
  isString,
  isStringArray,
  readPersisted,
  usePersistentObject,
  usePersistentState,
  writePersisted,
} from "@/lib/storage/persistent-state";

const KEY_PREFIX = "irlnow:v1:";

beforeEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("readPersisted / writePersisted", () => {
  it("round-trips a value", () => {
    writePersisted("interests", ["food", "music"]);
    expect(readPersisted("interests", isStringArray)).toEqual(["food", "music"]);
  });

  it("namespaces and versions its keys", () => {
    writePersisted("interests", ["food"]);
    expect(window.localStorage.getItem(`${KEY_PREFIX}interests`)).toBe('["food"]');
  });

  it("returns null for a key that was never written", () => {
    expect(readPersisted("nothing-here", isString)).toBeNull();
  });

  it("rejects a stored value of the wrong shape rather than returning it", () => {
    window.localStorage.setItem(`${KEY_PREFIX}interests`, '{"not":"an array"}');
    expect(readPersisted("interests", isStringArray)).toBeNull();
  });

  it("rejects an array containing the wrong element type", () => {
    window.localStorage.setItem(`${KEY_PREFIX}interests`, "[1,2,3]");
    expect(readPersisted("interests", isStringArray)).toBeNull();
  });

  it("survives corrupt JSON", () => {
    window.localStorage.setItem(`${KEY_PREFIX}interests`, "{not json at all");
    expect(() => readPersisted("interests", isStringArray)).not.toThrow();
    expect(readPersisted("interests", isStringArray)).toBeNull();
  });

  it("does not throw when storage rejects a write", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => writePersisted("interests", ["food"])).not.toThrow();
  });

  it("does not throw when storage rejects a read", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    expect(() => readPersisted("interests", isStringArray)).not.toThrow();
  });

  it("treats null and arrays as invalid records", () => {
    const isMap = isRecordOf<string>();
    expect(isMap(null)).toBe(false);
    expect(isMap([])).toBe(false);
    expect(isMap({ a: "b" })).toBe(true);
  });
});

describe("clearPersisted", () => {
  it("removes everything the app wrote", () => {
    writePersisted("interests", ["food"]);
    writePersisted("onboarded", true);
    clearPersisted();

    expect(readPersisted("interests", isStringArray)).toBeNull();
    expect(readPersisted("onboarded", isBoolean)).toBeNull();
  });

  it("leaves keys belonging to other applications alone", () => {
    window.localStorage.setItem("someone-elses-key", "keep me");
    writePersisted("interests", ["food"]);
    clearPersisted();

    expect(window.localStorage.getItem("someone-elses-key")).toBe("keep me");
  });
});

describe("usePersistentState", () => {
  it("starts from the initial value when nothing is stored", () => {
    const { result } = renderHook(() => usePersistentState<string[]>("saved", [], isStringArray));
    expect(result.current[0]).toEqual([]);
  });

  it("hydrates a stored value after mount", () => {
    writePersisted("saved", ["supper-club"]);
    const { result } = renderHook(() => usePersistentState<string[]>("saved", [], isStringArray));
    expect(result.current[0]).toEqual(["supper-club"]);
  });

  it("persists an update so a later mount sees it", () => {
    const first = renderHook(() => usePersistentState<string[]>("saved", [], isStringArray));
    act(() => first.result.current[1](["jazz-late"]));

    const second = renderHook(() => usePersistentState<string[]>("saved", [], isStringArray));
    expect(second.result.current[0]).toEqual(["jazz-late"]);
  });

  it("supports functional updates", () => {
    const { result } = renderHook(() => usePersistentState<string[]>("saved", [], isStringArray));
    act(() => result.current[1]((prev) => [...prev, "jazz-late"]));
    expect(result.current[0]).toEqual(["jazz-late"]);
  });

  it("does not overwrite stored data with the initial value on mount", () => {
    writePersisted("saved", ["supper-club"]);
    renderHook(() => usePersistentState<string[]>("saved", [], isStringArray));
    expect(readPersisted("saved", isStringArray)).toEqual(["supper-club"]);
  });

  it("falls back to the initial value when the stored shape is invalid", () => {
    window.localStorage.setItem(`${KEY_PREFIX}saved`, '"a string, not an array"');
    const { result } = renderHook(() =>
      usePersistentState<string[]>("saved", ["default"], isStringArray),
    );
    expect(result.current[0]).toEqual(["default"]);
  });
});

interface Settings {
  reducedMotion: boolean;
  highContrast: boolean;
  language: string;
}

const DEFAULTS: Settings = {
  reducedMotion: false,
  highContrast: false,
  language: "en-GB",
};

describe("usePersistentObject", () => {
  it("returns the defaults when nothing is stored", () => {
    const { result } = renderHook(() => usePersistentObject("settings", DEFAULTS));
    expect(result.current[0]).toEqual(DEFAULTS);
  });

  it("fills in a key an older build never wrote", () => {
    // A build that predates `language` would have stored only these two.
    writePersisted("settings", { reducedMotion: true, highContrast: false });
    const { result } = renderHook(() => usePersistentObject("settings", DEFAULTS));

    expect(result.current[0].reducedMotion).toBe(true);
    expect(result.current[0].language).toBe("en-GB");
  });

  it("drops keys the current build no longer recognises", () => {
    writePersisted("settings", { ...DEFAULTS, retiredSetting: "gone" });
    const { result } = renderHook(() => usePersistentObject("settings", DEFAULTS));

    expect(result.current[0]).toEqual(DEFAULTS);
    expect("retiredSetting" in result.current[0]).toBe(false);
  });

  it("ignores a stored object sharing no keys with the defaults", () => {
    writePersisted("settings", { totallyUnrelated: true });
    const { result } = renderHook(() => usePersistentObject("settings", DEFAULTS));
    expect(result.current[0]).toEqual(DEFAULTS);
  });

  it("persists an update", () => {
    const first = renderHook(() => usePersistentObject("settings", DEFAULTS));
    act(() => first.result.current[1]((prev) => ({ ...prev, highContrast: true })));

    const second = renderHook(() => usePersistentObject("settings", DEFAULTS));
    expect(second.result.current[0].highContrast).toBe(true);
  });
});
