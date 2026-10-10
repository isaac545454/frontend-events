import { createEventBus } from "./event-bus";

type AppEvents = {
  "user:login": { userId: string };
  "cart:add": { sku: string; quantity: number };
  "app:ready": void;
};

const eventBus = createEventBus<AppEvents>();

eventBus.pub("user:login", { userId: "42" });
eventBus.pub("cart:add", { sku: "sku-1", quantity: 1 });
eventBus.pub("app:ready");

eventBus.sub("user:login", (payload) => {
  const userId: string = payload.userId;
  void userId;
});

eventBus.sub("app:ready", () => {});

const stop = eventBus.once("cart:add", (payload) => {
  const quantity: number = payload.quantity;
  void quantity;
});
stop();
eventBus.off("user:login", () => {});
eventBus.clear("app:ready");
eventBus.clear();

// @ts-expect-error nome de evento fora do mapa
eventBus.pub("unknown", {});

// @ts-expect-error payload sem userId
eventBus.pub("user:login", {});

// @ts-expect-error campo extra no payload
eventBus.pub("user:login", { userId: "1", role: "admin" });

// @ts-expect-error evento sem payload não aceita argumento
eventBus.pub("app:ready", { ok: true });

// @ts-expect-error handler recebe o payload declarado, não outro tipo
eventBus.sub("user:login", (payload: { email: string }) => {
  void payload;
});

const unconfigured = createEventBus();

// @ts-expect-error bus sem mapa de eventos não aceita publish
unconfigured.pub("user:login", { userId: "1" });
