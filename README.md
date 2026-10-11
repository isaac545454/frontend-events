# frontend-events

Barramento de eventos para o frontend. A lib não declara eventos. O projeto consumidor define o nome e o payload, e `pub` / `sub` seguem esse contrato.

Pacote: [`@isaac545454/frontend-events`](https://github.com/isaac545454/frontend-events/releases/tag/v0.1.0)

## Instalação

```bash
pnpm add github:isaac545454/frontend-events
```

```bash
npm install github:isaac545454/frontend-events
```

```bash
yarn add github:isaac545454/frontend-events
```

A instalação a partir do GitHub roda o build e gera `dist`.

## Uso

```ts
import { createEventBus } from "@isaac545454/frontend-events";

type AppEvents = {
  "user:login": { userId: string };
  "cart:add": { sku: string; quantity: number };
  "app:ready": void;
};

export const eventBus = createEventBus<AppEvents>();

eventBus.pub("user:login", { userId: "42" });

const stop = eventBus.sub("user:login", ({ userId }) => {
  console.log(userId);
});

stop();
```

`createEventBus()` sem o generic não publica nada. O mapa de eventos fica no projeto que usa a lib.

Evento com payload `void` publica sem segundo argumento:

```ts
eventBus.pub("app:ready");
eventBus.sub("app:ready", () => {});
```

## API

| Método | Efeito |
| --- | --- |
| `pub(event, payload)` | Entrega o payload a quem escuta esse evento |
| `sub(event, handler)` | Escuta. Devolve função que remove o handler |
| `once(event, handler)` | Escuta uma vez. Devolve função que cancela antes do disparo |
| `off(event, handler)` | Remove o handler passado para `sub` |
| `clear(event?)` | Remove os handlers de um evento, ou de todos |

Handlers rodam na ordem de registro. Se um lança, os seguintes ainda rodam. Um erro sobe como está. Dois ou mais sobem como `AggregateError`.

## Desenvolvimento

```bash
pnpm install
pnpm test
pnpm run typecheck
pnpm run build
```
