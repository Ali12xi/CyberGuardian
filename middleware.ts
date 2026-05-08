import { NextRequest, NextResponse } from "next/server";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const DEFAULT_RATE_LIMIT_REQUESTS = 10;
const DEFAULT_RATE_LIMIT_WINDOW_SECONDS = 60;

const rateLimitStore = new Map<string, RateLimitEntry>();

const staticAssetPattern =
  /\.(?:avif|css|gif|ico|jpg|jpeg|js|map|png|svg|txt|webmanifest|webp|woff|woff2)$/i;

function getRateLimitConfig() {
  const requests = Number(process.env.RATE_LIMIT_REQUESTS);
  const windowSeconds = Number(process.env.RATE_LIMIT_WINDOW);

  return {
    maxRequests:
      Number.isFinite(requests) && requests > 0
        ? requests
        : DEFAULT_RATE_LIMIT_REQUESTS,
    windowMs:
      (Number.isFinite(windowSeconds) && windowSeconds > 0
        ? windowSeconds
        : DEFAULT_RATE_LIMIT_WINDOW_SECONDS) * 1000,
  };
}

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

function isStaticOrInternalPath(pathname: string) {
  return (
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    staticAssetPattern.test(pathname)
  );
}

function addSecurityHeaders(response: NextResponse) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=()");
  response.headers.set("Strict-Transport-Security", "max-age=63072000");

  return response;
}

function jsonResponse(body: Record<string, string>, status: number) {
  return addSecurityHeaders(NextResponse.json(body, { status }));
}

function logSuspiciousRequest(_request: NextRequest, _reason: string) {
  // Intentionally silent in production middleware.
}

function applyRateLimit(request: NextRequest) {
  const { maxRequests, windowMs } = getRateLimitConfig();
  const now = Date.now();
  const ip = getClientIp(request);
  const current = rateLimitStore.get(ip);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(ip, {
      count: 1,
      resetAt: now + windowMs,
    });
    return null;
  }

  if (current.count >= maxRequests) {
    logSuspiciousRequest(request, "rate_limit_exceeded");

    return jsonResponse(
      {
        error: "Too many requests",
        message: "Rate limit exceeded. Please try again later.",
      },
      429,
    );
  }

  current.count += 1;
  rateLimitStore.set(ip, current);

  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isStaticOrInternalPath(pathname)) {
    return NextResponse.next();
  }

  const userAgent = request.headers.get("user-agent")?.trim();

  if (!userAgent) {
    logSuspiciousRequest(request, "missing_user_agent");
    return jsonResponse({ error: "User-Agent header is required" }, 400);
  }

  if (pathname.startsWith("/api/") && request.method !== "POST") {
    logSuspiciousRequest(request, "invalid_api_method");
    return jsonResponse({ error: "Only POST requests are allowed for API routes" }, 405);
  }

  const rateLimitResponse = applyRateLimit(request);

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
