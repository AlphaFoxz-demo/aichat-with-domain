import type { DeepReadonly } from 'vue';
import type { QueryBo, SseEvent } from './domain/define';

export function aiChatQuery(
  query: QueryBo | DeepReadonly<QueryBo>,
  onChunkReceived: (event: SseEvent) => void,
  onSuccess = () => void 0,
  onFail = () => void 0
) {
  const requestTask = uni.request({
    url: `/api/query`,
    method: 'POST',
    header: {
      Connection: 'keep-alive',
    },
    data: query,
    responseType: 'arraybuffer',
    enableChunked: true,
    success: onSuccess,
    fail: onFail,
  });
  (requestTask as any).onChunkReceived((res: any) => {
    const text = decode(res.data).trim();
    for (const line of text.split('\n\n')) {
      if (line.trim()) {
        const sseEvent = parseSseEvent(line);
        if (!sseEvent) {
          continue;
        }
        onChunkReceived(sseEvent);
      }
    }
  });
}

function parseSseEvent(line: string): SseEvent | null {
  const prefix = 'data:';
  while (line.startsWith(prefix)) {
    line = line.slice(prefix.length).trim();
  }
  try {
    return JSON.parse(line);
  } catch (e) {
    console.error('parse sseEvent error', e, line);
    return null;
  }
}
function decode(arraybuffer: ArrayBuffer) {
  const str = decodeURIComponent(
    escape(String.fromCharCode(...new Uint8Array(arraybuffer)))
  );
  console.debug('decode', str);

  return str;
}
