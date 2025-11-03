"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server/mock-server.ts
var mock_server_exports = {};
__export(mock_server_exports, {
  startServer: () => startServer
});
module.exports = __toCommonJS(mock_server_exports);
var import_node_http = __toESM(require("node:http"));

// server/example-reply.ts
var helloText = [
  "\u4F60\u597D\uFF01\u5F88\u9AD8\u5174\u89C1\u5230\u4F60\uFF01\u{1F60A}",
  "\u6211\u662FDeepSeek\uFF0C\u7531\u6DF1\u5EA6\u6C42\u7D22\u516C\u53F8\u521B\u9020\u7684AI\u52A9\u624B\u3002\u6211\u53EF\u4EE5\u5E2E\u4F60\u89E3\u7B54\u95EE\u9898\u3001\u5904\u7406\u6587\u6863\u3001\u8FDB\u884C\u5BF9\u8BDD\u4EA4\u6D41\uFF0C\u8FD8\u6709\u5F88\u591A\u5176\u4ED6\u529F\u80FD\u5462\uFF01",
  "\u6709\u4EC0\u4E48\u6211\u53EF\u4EE5\u5E2E\u4F60\u7684\u5417\uFF1F\u65E0\u8BBA\u662F\u5B66\u4E60\u3001\u5DE5\u4F5C\u8FD8\u662F\u751F\u6D3B\u4E0A\u7684\u95EE\u9898\uFF0C\u6211\u90FD\u5F88\u4E50\u610F\u4E3A\u4F60\u63D0\u4F9B\u5E2E\u52A9\uFF01\u2728"
];

// server/mock-server.ts
var clientMap = /* @__PURE__ */ new Map();
function nextClientId() {
  let id = 0;
  return ++id;
}
function useWrapper(req, res) {
  var _a;
  let clientId = 0;
  let errorCode = NaN;
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const reqMethod = (_a = req.method) == null ? void 0 : _a.toUpperCase();
  const reqPathname = url.pathname;
  console.debug("request with", reqMethod, reqPathname);
  function replyJson(statusCode, data) {
    let dataStr = typeof data === "string" ? data : JSON.stringify(data);
    res.writeHead(statusCode, {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*"
    });
    res.end(dataStr);
    console.debug("reply with", statusCode, data);
  }
  function sendMessage(data) {
    if (typeof data === "object") {
      data = JSON.stringify(data);
    }
    res.write(`data: ${data}

`);
  }
  return {
    getClientId() {
      return clientId;
    },
    getErrorCode() {
      return errorCode;
    },
    getReqMethod() {
      return reqMethod;
    },
    getReqPathname() {
      return reqPathname;
    },
    isMatchRoute(method, path) {
      if (!method) {
        return path === reqPathname;
      }
      return method === reqMethod && path === reqPathname;
    },
    responseStream() {
      res.writeHead(200, {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform"
      });
    },
    closeResponse() {
      res.end();
    },
    keepAlive() {
      clientId = nextClientId();
      clientMap.set(clientId, this);
      res.writeHead(200, {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        // CORS 视情况而定（若浏览器跨域访问）
        "Access-Control-Allow-Origin": "*",
        "X-Accel-Buffering": "no",
        "X-Accel-Charset": "utf-8"
      });
      this.sendHeartbeat();
      const intervalId = setInterval(() => {
        this.sendHeartbeat();
      }, 8e3);
      req.on("close", () => {
        clientMap.delete(clientId);
        intervalId && clearInterval(intervalId);
      });
    },
    sendHeartbeat() {
      res.write("event: heartbeat\n\n");
    },
    sendMessage,
    getReqParams() {
      return url.searchParams;
    },
    getReqHeaders() {
      return req.headers;
    },
    async readReqBodyJson() {
      return await new Promise((resolve, reject) => {
        const chunks = [];
        req.on("data", (c) => chunks.push(c));
        req.on("end", () => {
          try {
            resolve(JSON.parse(Buffer.concat(chunks).toString()));
          } catch (error) {
            errorCode = 400;
            reject(error);
          }
        });
        req.on("error", reject);
      });
    },
    replyJson,
    reply(statusCode, data = "") {
      res.writeHead(statusCode, {
        "Content-Type": "text/plain; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      });
      res.end(data);
      console.debug("reply with", statusCode, data);
    }
  };
}
function startServer(serverPort = 3e3) {
  const server = import_node_http.default.createServer(async (req, res) => {
    const wrapper = useWrapper(req, res);
    try {
      if (wrapper.isMatchRoute("POST", "/api/upload")) {
        wrapper.replyJson(200, {
          id: "123",
          name: "\u6211\u7684\u6587\u4EF6",
          extension: "pdf",
          size: 12345
        });
      } else if (wrapper.isMatchRoute("POST", "/api/query")) {
        console.debug("got params", wrapper.getReqParams());
        wrapper.keepAlive();
        let delay = 0;
        let step = 80;
        wrapper.sendMessage({ event: "workflow_started", chatContextId: "1" });
        for (const text of helloText) {
          wrapper.sendMessage({});
          const charArr = text.split("");
          setTimeout(() => {
            wrapper.sendMessage({
              event: "node_started"
            });
          }, delay += step);
          for (const char of charArr) {
            setTimeout(() => {
              wrapper.sendMessage({
                event: "message",
                content: char
              });
            }, delay += step);
          }
          setTimeout(() => {
            wrapper.sendMessage({
              event: "node_finished"
            });
          }, delay += step);
        }
        setTimeout(() => {
          wrapper.sendMessage({
            event: "workflow_finished"
          });
          wrapper.closeResponse();
        }, delay += step);
      } else {
        console.warn("not found", wrapper.getReqPathname());
        wrapper.reply(404, "Not Found");
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
startServer(3e3);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  startServer
});
