import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  headlineDelivery,
  headlineGameOver,
  headlineGameStart,
  headlineLifeLost,
  headlinePerfectDay,
  headlineVictory,
  headlineZombieKill,
  pushHeadline,
} from "./ticker-bridge";

describe("ticker-bridge", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "ticker-scroll";
    document.body.appendChild(container);
    return () => {
      container.remove();
    };
  });

  it("pushHeadline inserts a span into the ticker container", () => {
    pushHeadline("TEST HEADLINE");
    const spans = container.querySelectorAll("span");
    expect(spans.length).toBeGreaterThan(0);
    expect(spans[0].textContent).toBe("TEST HEADLINE");
  });

  it("pushHeadline uppercases the text", () => {
    pushHeadline("lowercase test");
    const span = container.querySelector("span");
    expect(span?.textContent).toBe("LOWERCASE TEST");
  });

  it("pushHeadline adds ticker-urgent class that is removed after timeout", () => {
    vi.useFakeTimers();
    pushHeadline("URGENT NEWS");
    const span = container.querySelector(".ticker-urgent");
    expect(span).not.toBeNull();

    vi.advanceTimersByTime(5000);
    expect(container.querySelector(".ticker-urgent")).toBeNull();
    vi.useRealTimers();
  });

  it("does nothing when container is missing", () => {
    container.remove();
    // Should not throw
    expect(() => pushHeadline("ORPHAN")).not.toThrow();
  });

  it("headlineDelivery pushes a headline", () => {
    headlineDelivery();
    expect(container.querySelectorAll("span").length).toBeGreaterThan(0);
  });

  it("headlineZombieKill pushes a headline", () => {
    headlineZombieKill();
    expect(container.querySelectorAll("span").length).toBeGreaterThan(0);
  });

  it("headlineLifeLost pushes a headline", () => {
    headlineLifeLost();
    expect(container.querySelectorAll("span").length).toBeGreaterThan(0);
  });

  it("headlinePerfectDay pushes a headline", () => {
    headlinePerfectDay();
    expect(container.querySelectorAll("span").length).toBeGreaterThan(0);
  });

  it("headlineGameStart pushes a headline", () => {
    headlineGameStart();
    expect(container.querySelectorAll("span").length).toBeGreaterThan(0);
  });

  it("headlineGameOver pushes a headline", () => {
    headlineGameOver();
    expect(container.querySelectorAll("span").length).toBeGreaterThan(0);
  });

  it("headlineVictory pushes a headline", () => {
    headlineVictory();
    expect(container.querySelectorAll("span").length).toBeGreaterThan(0);
  });
});
