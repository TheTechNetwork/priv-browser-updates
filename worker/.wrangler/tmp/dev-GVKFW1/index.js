var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-62GGwx/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// src/update-service.ts
async function processUpdateRequest(request, db) {
  await logUpdateRequest(request, db);
  const latestRelease = await getLatestVersion(request.platform, request.channel, db);
  return generateUpdateXml(latestRelease, request);
}
__name(processUpdateRequest, "processUpdateRequest");
async function logUpdateRequest(request, db) {
  await db.prepare(`
    INSERT INTO updateRequests (version, platform, channel, ip, userAgent)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    request.version,
    request.platform,
    request.channel,
    request.ip,
    request.userAgent
  ).run();
}
__name(logUpdateRequest, "logUpdateRequest");
async function getLatestVersion(platform, channel, db) {
  const releases = await db.prepare(`
    SELECT version, downloadUrl, sha256, fileSize FROM releases
    WHERE platform = ?
    AND channel = ?
    AND isActive = 1
    ORDER BY id DESC
    LIMIT 1
  `).bind(platform, channel).all();
  if (releases.results.length === 0) {
    return null;
  }
  const result = releases.results[0];
  return {
    version: result.version,
    downloadUrl: result.downloadUrl,
    sha256: result.sha256,
    fileSize: result.fileSize
  };
}
__name(getLatestVersion, "getLatestVersion");
function compareVersions(v1, v2) {
  const parts1 = v1.split(".").map((part) => parseInt(part, 10) || 0);
  const parts2 = v2.split(".").map((part) => parseInt(part, 10) || 0);
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }
  return 0;
}
__name(compareVersions, "compareVersions");
function generateUpdateXml(release, request) {
  if (!release || compareVersions(request.version, release.version) >= 0) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<response protocol="3.0">
  <app appid="chromium">
    <updatecheck status="noupdate"/>
  </app>
</response>`;
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<response protocol="3.0">
  <app appid="chromium">
    <updatecheck status="ok">
      <urls>
        <url codebase="${release.downloadUrl}"/>
      </urls>
      <manifest version="${release.version}">
        <packages>
          <package name="chromium-${release.version}" hash_sha256="${release.sha256 || ""}" size="${release.fileSize || 0}" required="true"/>
        </packages>
      </manifest>
    </updatecheck>
  </app>
</response>`;
}
__name(generateUpdateXml, "generateUpdateXml");

// src/auth.ts
async function handleGitHubCallback(request, env) {
  try {
    let code = null;
    if (request.method === "GET") {
      const url = new URL(request.url);
      code = url.searchParams.get("code");
      if (!code) {
        const error = url.searchParams.get("error_description") || "No code provided";
        return Response.redirect("http://localhost:5173/login?error=" + encodeURIComponent(error));
      }
    } else if (request.method === "POST") {
      const body = await request.json();
      code = body.code;
    } else {
      return new Response("Method not allowed", { status: 405 });
    }
    if (!code) {
      return new Response(JSON.stringify({ error: "No code provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    console.log("GitHub Client ID:", env.GITHUB_CLIENT_ID ? "Set" : "Not set");
    console.log("GitHub Client Secret:", env.GITHUB_CLIENT_SECRET ? "Set" : "Not set");
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "Cloudflare-Worker"
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code
      })
    });
    console.log("Token response status:", tokenResponse.status);
    const data = await tokenResponse.json();
    console.log("Token response data:", {
      error: data.error,
      error_description: data.error_description,
      has_token: !!data.access_token
    });
    if (data.error || !data.access_token) {
      const error = data.error_description || "Failed to get access token";
      if (request.method === "GET") {
        return Response.redirect("http://localhost:5173/login?error=" + encodeURIComponent(error));
      }
      return new Response(JSON.stringify({ error }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (request.method === "GET") {
      return Response.redirect("http://localhost:5173/auth/callback?token=" + data.access_token);
    }
    return new Response(JSON.stringify({ access_token: data.access_token }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error in GitHub callback:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    if (request.method === "GET") {
      return Response.redirect("http://localhost:5173/login?error=" + encodeURIComponent(errorMessage));
    }
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handleGitHubCallback, "handleGitHubCallback");

// src/index.ts
function corsify(response) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "http://localhost:5173");
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
__name(corsify, "corsify");
var src_default = {
  // ctx is required by Cloudflare Workers runtime but not used in our code
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return corsify(new Response(null, { status: 204 }));
    }
    const url = new URL(request.url);
    const path = url.pathname;
    try {
      let response;
      if (path === "/api/auth/github/callback") {
        response = await handleGitHubCallback(request, env);
        return corsify(response);
      }
      if (path === "/update") {
        const version = url.searchParams.get("version");
        const platform = url.searchParams.get("platform");
        const channel = url.searchParams.get("channel");
        if (!version || !platform || !channel) {
          response = new Response("Missing required parameters", { status: 400 });
          return corsify(response);
        }
        const updateRequest = {
          version,
          platform,
          channel,
          ip: request.headers.get("cf-connecting-ip") || "unknown",
          userAgent: request.headers.get("user-agent") || "unknown"
        };
        const xml = await processUpdateRequest(updateRequest, env.DB);
        response = new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "no-cache"
          }
        });
        return corsify(response);
      }
      if (path.startsWith("/api/")) {
        response = await handleApiRequest(request, url, env);
        return corsify(response);
      }
      response = new Response("Not found", { status: 404 });
      return corsify(response);
    } catch (error) {
      const response = new Response(error instanceof Error ? error.message : "Internal server error", {
        status: 500
      });
      return corsify(response);
    }
  }
};
async function handleApiRequest(request, url, env) {
  const apiKey = request.headers.get("X-API-Key");
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!apiKey && !token) {
    return new Response("Authentication required", { status: 401 });
  }
  if (url.pathname === "/api/releases") {
    const releases = await env.DB.prepare("SELECT * FROM releases ORDER BY id DESC").all();
    return new Response(JSON.stringify(releases.results), {
      headers: { "Content-Type": "application/json" }
    });
  }
  if (url.pathname === "/api/stats") {
    const requestsCount = await env.DB.prepare("SELECT COUNT(*) as count FROM updateRequests").first();
    const latestRequest = await env.DB.prepare(`
      SELECT * FROM updateRequests 
      ORDER BY timestamp DESC 
      LIMIT 1
    `).first();
    return new Response(JSON.stringify({
      requestsCount: requestsCount?.count || 0,
      latestRequest
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }
  if (url.pathname === "/api/config") {
    if (request.method === "GET") {
      return new Response(JSON.stringify({
        // Add your config fields here
        githubToken: "***",
        // Don't expose the actual token
        githubOwner: env.GITHUB_CLIENT_ID,
        githubRepo: "your-repo",
        releasePattern: "*",
        autoSync: true,
        syncInterval: 3600
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }
  }
  return new Response("API endpoint not found", { status: 404 });
}
__name(handleApiRequest, "handleApiRequest");

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-62GGwx/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-62GGwx/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
