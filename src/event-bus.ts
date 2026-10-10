export type EventMap = Record<string, unknown>;

type EmptyPayload<TPayload> = [TPayload] extends [void | undefined] ? true : false;

export type EventHandler<TPayload> = EmptyPayload<TPayload> extends true
  ? () => void
  : (payload: TPayload) => void;

export type EventArgs<TPayload> = EmptyPayload<TPayload> extends true
  ? []
  : [payload: TPayload];

export interface EventBus<TEvents extends EventMap> {
  pub<K extends keyof TEvents & string>(
    event: K,
    ...payload: EventArgs<TEvents[K]>
  ): void;
  sub<K extends keyof TEvents & string>(
    event: K,
    handler: EventHandler<TEvents[K]>
  ): () => void;
  once<K extends keyof TEvents & string>(
    event: K,
    handler: EventHandler<TEvents[K]>
  ): () => void;
  off<K extends keyof TEvents & string>(
    event: K,
    handler: EventHandler<TEvents[K]>
  ): void;
  clear(event?: keyof TEvents & string): void;
}

type AnyHandler = (payload?: unknown) => void;

function deliver(handlers: ReadonlySet<AnyHandler>, payload: unknown): void {
  const errors: unknown[] = [];

  for (const handler of [...handlers]) {
    try {
      handler(payload);
    } catch (error) {
      errors.push(error);
    }
  }

  if (errors.length === 1) {
    throw errors[0];
  }

  if (errors.length > 1) {
    throw new AggregateError(errors, "Event handlers failed");
  }
}

export function createEventBus<TEvents extends EventMap = never>(): EventBus<TEvents> {
  const listeners = new Map<keyof TEvents & string, Set<AnyHandler>>();

  function listenersFor(event: keyof TEvents & string): Set<AnyHandler> {
    let set = listeners.get(event);
    if (!set) {
      set = new Set();
      listeners.set(event, set);
    }
    return set;
  }

  function remove(
    event: keyof TEvents & string,
    handler: AnyHandler
  ): void {
    const set = listeners.get(event);
    if (!set) return;
    set.delete(handler);
    if (set.size === 0) listeners.delete(event);
  }

  const bus: EventBus<TEvents> = {
    pub(event, ...payload) {
      const set = listeners.get(event);
      if (!set || set.size === 0) return;
      deliver(set, payload[0]);
    },

    sub(event, handler) {
      const listener = handler as AnyHandler;
      listenersFor(event).add(listener);
      return () => remove(event, listener);
    },

    once(event, handler) {
      const listener: AnyHandler = (payload) => {
        remove(event, listener);
        (handler as AnyHandler)(payload);
      };
      listenersFor(event).add(listener);
      return () => remove(event, listener);
    },

    off(event, handler) {
      remove(event, handler as AnyHandler);
    },

    clear(event) {
      if (event === undefined) {
        listeners.clear();
        return;
      }
      listeners.delete(event);
    },
  };

  return bus;
}
