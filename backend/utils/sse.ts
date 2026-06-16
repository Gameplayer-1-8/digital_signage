import type { EventStream } from 'h3';

const clients = new Set<EventStream>();

export function addSSEClient(client: EventStream) {
  clients.add(client);
  client.onClosed(() => {
    clients.delete(client);
  });
}

export function broadcastSSE(event: string, data: any) {
  for (const client of clients) {
    client.push({
      event,
      data: JSON.stringify(data)
    });
  }
}
