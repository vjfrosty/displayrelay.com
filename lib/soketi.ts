import Pusher from "pusher";

let client: Pusher | null = null;

function getSoketiClient(): Pusher {
  if (!client) {
    client = new Pusher({
      appId: process.env.SOKETI_APP_ID!,
      key: process.env.SOKETI_APP_KEY!,
      secret: process.env.SOKETI_APP_SECRET!,
      host: process.env.SOKETI_HOST!,
      port: process.env.SOKETI_PORT!,
      useTLS: false,
    });
  }
  return client;
}

// Call only after the triggering DB write has committed, per
// .github/instructions/realtime-cache.instructions.md.
export async function publishEvent(clientId: string, event: string, payload: object): Promise<void> {
  await getSoketiClient().trigger(`client-${clientId}`, event, payload);
}
