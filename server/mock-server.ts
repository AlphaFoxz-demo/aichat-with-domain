import http from 'node:http';
import { helloText } from './example-reply';

type HttpMethod =
  | 'POST'
  | 'GET'
  | 'PUT'
  | 'DELETE'
  | 'PATCH'
  | 'OPTIONS'
  | 'HEAD'
  | undefined;
type SseWrapper = ReturnType<typeof useWrapper>;

const clientMap: Map<number, SseWrapper> = new Map();

function nextClientId() {
  let id = 0;
  return ++id;
}

function useWrapper(req: http.IncomingMessage, res: http.ServerResponse) {
  let clientId = 0;
  let errorCode = NaN;
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const reqMethod = req.method?.toUpperCase() as HttpMethod;
  const reqPathname = url.pathname;
  console.debug('request with', reqMethod, reqPathname);

  function replyJson(statusCode: number, data: object): void;
  function replyJson(statusCode: number, data: string): void;
  function replyJson(statusCode: number, data: string | object) {
    let dataStr = typeof data === 'string' ? data : JSON.stringify(data);
    res.writeHead(statusCode, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(dataStr);
    console.debug('reply with', statusCode, data);
  }

  function sendMessage(data: string): void;
  function sendMessage(data: Record<string, any>): void;
  function sendMessage(data: string | Record<string, any>) {
    if (typeof data === 'object') {
      data = JSON.stringify(data);
    }
    res.write(`data: ${data}\n\n`);
  }
  return {
    getClientId() {
      return clientId;
    },
    getErrorCode() {
      return errorCode;
    },
    getReqMethod(): HttpMethod {
      return reqMethod;
    },
    getReqPathname() {
      return reqPathname;
    },
    isMatchRoute(method: HttpMethod | undefined, path: string): boolean {
      if (!method) {
        return path === reqPathname;
      }
      return method === reqMethod && path === reqPathname;
    },
    responseStream() {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
      });
    },
    closeResponse() {
      res.end();
    },
    keepAlive() {
      clientId = nextClientId();
      clientMap.set(clientId, this);
      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        // CORS 视情况而定（若浏览器跨域访问）
        'Access-Control-Allow-Origin': '*',
        'X-Accel-Buffering': 'no',
        'X-Accel-Charset': 'utf-8',
      });
      this.sendHeartbeat();
      const intervalId = setInterval(() => {
        this.sendHeartbeat();
      }, 8000);
      req.on('close', () => {
        clientMap.delete(clientId);
        intervalId && clearInterval(intervalId);
      });
    },
    sendHeartbeat() {
      res.write('event: heartbeat\n\n');
    },
    sendMessage,
    getReqParams() {
      return url.searchParams;
    },
    getReqHeaders() {
      return req.headers;
    },
    async readReqBodyJson<T>(): Promise<T> {
      return await new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', () => {
          try {
            resolve(JSON.parse(Buffer.concat(chunks).toString()));
          } catch (error) {
            errorCode = 400;
            reject(error);
          }
        });
        req.on('error', reject);
      });
    },
    replyJson,
    reply(statusCode: number, data: string = '') {
      res.writeHead(statusCode, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(data);
      console.debug('reply with', statusCode, data);
    },
  };
}

export function startServer(serverPort: number = 3000) {
  const server = http.createServer(async (req, res) => {
    const wrapper = useWrapper(req, res);

    try {
      if (wrapper.isMatchRoute('POST', '/api/upload')) {
        wrapper.replyJson(200, {
          id: '123',
          name: '我的文件',
          extension: 'pdf',
          size: 12345,
        });
      } else if (wrapper.isMatchRoute('POST', '/api/query')) {
        console.debug('got params', wrapper.getReqParams());
        // wrapper.responseStream();
        wrapper.keepAlive();
        let delay = 0;
        let step = 80;
        wrapper.sendMessage({ event: 'workflow_started', chatContextId: '1' });
        for (const text of helloText) {
          wrapper.sendMessage({});
          const charArr = text.split('');
          setTimeout(() => {
            wrapper.sendMessage({
              event: 'node_started',
            });
          }, (delay += step));
          for (const char of charArr) {
            setTimeout(() => {
              wrapper.sendMessage({
                event: 'message',
                content: char,
              });
            }, (delay += step));
          }
          setTimeout(() => {
            wrapper.sendMessage({
              event: 'node_finished',
            });
          }, (delay += step));
        }
        setTimeout(() => {
          wrapper.sendMessage({
            event: 'workflow_finished',
          });
          wrapper.closeResponse();
        }, (delay += step));
      } else {
        console.warn('not found', wrapper.getReqPathname());
        wrapper.reply(404, 'Not Found');
      }
    } catch (e) {
      wrapper.replyJson(wrapper.getErrorCode() || 500, { error: e });
      console.error(e);
    }
  });
  server.listen(serverPort, () => {
    console.log(`SSE Server listening on http://localhost:${serverPort}`);
  });
}

startServer(3000);
