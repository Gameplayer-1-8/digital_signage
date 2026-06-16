import { createEventStream } from 'h3';
import { addSSEClient } from '../../utils/sse';

export default defineEventHandler((event) => {
  const eventStream = createEventStream(event);
  addSSEClient(eventStream);

  eventStream.push({
    event: 'ping',
    data: 'connected'
  });

  return eventStream.send();
});
