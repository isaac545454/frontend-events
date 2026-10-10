import { describe, expect, it, vi } from "vitest";

import { createEventBus } from "./event-bus";

type AppEvents = {
  "user:login": { userId: string };
  "cart:add": { sku: string; quantity: number };
  "app:ready": void;
};

describe("createEventBus", () => {
  it("delivers the typed payload to subscribers of that event", () => {
    const bus = createEventBus<AppEvents>();
    const onLogin = vi.fn();
    const onCart = vi.fn();

    bus.sub("user:login", onLogin);
    bus.sub("cart:add", onCart);
    bus.pub("user:login", { userId: "42" });

    expect(onLogin).toHaveBeenCalledOnce();
    expect(onLogin).toHaveBeenCalledWith({ userId: "42" });
    expect(onCart).not.toHaveBeenCalled();
  });

  it("calls subscribers in registration order", () => {
    const bus = createEventBus<AppEvents>();
    const order: string[] = [];

    bus.sub("user:login", () => order.push("first"));
    bus.sub("user:login", () => order.push("second"));
    bus.pub("user:login", { userId: "1" });

    expect(order).toEqual(["first", "second"]);
  });

  it("stops a subscriber when the returned function runs", () => {
    const bus = createEventBus<AppEvents>();
    const onLogin = vi.fn();
    const stop = bus.sub("user:login", onLogin);

    bus.pub("user:login", { userId: "1" });
    stop();
    bus.pub("user:login", { userId: "2" });

    expect(onLogin).toHaveBeenCalledOnce();
  });

  it("removes a subscriber with off", () => {
    const bus = createEventBus<AppEvents>();
    const onLogin = vi.fn();

    bus.sub("user:login", onLogin);
    bus.off("user:login", onLogin);
    bus.pub("user:login", { userId: "1" });

    expect(onLogin).not.toHaveBeenCalled();
  });

  it("runs a once subscriber a single time", () => {
    const bus = createEventBus<AppEvents>();
    const onLogin = vi.fn();

    bus.once("user:login", onLogin);
    bus.pub("user:login", { userId: "1" });
    bus.pub("user:login", { userId: "2" });

    expect(onLogin).toHaveBeenCalledOnce();
    expect(onLogin).toHaveBeenCalledWith({ userId: "1" });
  });

  it("publishes an event without payload", () => {
    const bus = createEventBus<AppEvents>();
    const onReady = vi.fn();

    bus.sub("app:ready", onReady);
    bus.pub("app:ready");

    expect(onReady).toHaveBeenCalledOnce();
  });

  it("ignores publish when nobody is listening", () => {
    const bus = createEventBus<AppEvents>();

    expect(() => bus.pub("app:ready")).not.toThrow();
  });

  it("clears one event and leaves the others", () => {
    const bus = createEventBus<AppEvents>();
    const onLogin = vi.fn();
    const onCart = vi.fn();

    bus.sub("user:login", onLogin);
    bus.sub("cart:add", onCart);
    bus.clear("user:login");
    bus.pub("user:login", { userId: "1" });
    bus.pub("cart:add", { sku: "sku-1", quantity: 2 });

    expect(onLogin).not.toHaveBeenCalled();
    expect(onCart).toHaveBeenCalledWith({ sku: "sku-1", quantity: 2 });
  });

  it("clears every subscriber", () => {
    const bus = createEventBus<AppEvents>();
    const onLogin = vi.fn();
    const onReady = vi.fn();

    bus.sub("user:login", onLogin);
    bus.sub("app:ready", onReady);
    bus.clear();
    bus.pub("user:login", { userId: "1" });
    bus.pub("app:ready");

    expect(onLogin).not.toHaveBeenCalled();
    expect(onReady).not.toHaveBeenCalled();
  });

  it("keeps later subscribers running when an earlier one throws", () => {
    const bus = createEventBus<AppEvents>();
    const onLogin = vi.fn();

    bus.sub("user:login", () => {
      throw new Error("broken listener");
    });
    bus.sub("user:login", onLogin);

    expect(() => bus.pub("user:login", { userId: "1" })).toThrow(
      "broken listener"
    );
    expect(onLogin).toHaveBeenCalledOnce();
  });

  it("throws AggregateError when more than one subscriber throws", () => {
    const bus = createEventBus<AppEvents>();

    bus.sub("app:ready", () => {
      throw new Error("first");
    });
    bus.sub("app:ready", () => {
      throw new Error("second");
    });

    expect(() => bus.pub("app:ready")).toThrow(AggregateError);
  });

  it("does not call the same function twice for one subscription", () => {
    const bus = createEventBus<AppEvents>();
    const onLogin = vi.fn();

    bus.sub("user:login", onLogin);
    bus.sub("user:login", onLogin);
    bus.pub("user:login", { userId: "1" });

    expect(onLogin).toHaveBeenCalledOnce();
  });
});
