export interface ErrorReport {
  event: 'error_caught' | 'unhandled_rejection' | 'unhandled_exception';
  message: string;
  stack?: string;
  componentStack?: string;
  context?: Record<string, unknown>;
  timestamp: string;
  url: string;
  userAgent: string;
  sessionId: string;
  userId?: string;
}

export interface MetricReport {
  event: 'metric';
  name: string;
  value: number;
  unit: 'ms' | 'count' | 'bytes' | 'fps';
  tags?: Record<string, string>;
  timestamp: string;
  sessionId: string;
}

export interface PerformanceReport {
  event: 'performance';
  type: 'navigation' | 'paint' | 'frame' | 'ws_latency' | 'game_loop';
  metrics: Record<string, number>;
  timestamp: string;
  sessionId: string;
}

type Report = ErrorReport | MetricReport | PerformanceReport;

let sessionId: string;
let reportEndpoint: string | null = null;
let flushTimer: ReturnType<typeof setInterval> | null = null;
void flushTimer;
const buffer: Report[] = [];
const MAX_BUFFER = 50;
const FLUSH_INTERVAL = 10000;
let userId: string | null = null;

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function getSessionId(): string {
  if (!sessionId) {
    sessionId = generateSessionId();
  }
  return sessionId;
}

export function initObservability(options: { endpoint?: string; userId?: string } = {}) {
  if (typeof window === 'undefined') return;

  sessionId = generateSessionId();
  reportEndpoint = options.endpoint ?? null;
  userId = options.userId ?? null;

  if (reportEndpoint) {
    flushTimer = setInterval(flush, FLUSH_INTERVAL);
    window.addEventListener('beforeunload', flush);
  }

  window.addEventListener('error', event => {
    captureError({
      event: 'unhandled_exception',
      message: event.message,
      stack: event.error?.stack,
      context: { filename: event.filename, lineno: event.lineno, colno: event.colno },
    });
  });

  window.addEventListener('unhandledrejection', event => {
    captureError({
      event: 'unhandled_rejection',
      message: event.reason?.message ?? String(event.reason),
      stack: event.reason?.stack,
      context: {},
    });
  });

  if ('PerformanceObserver' in window) {
    try {
      const paintObserver = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint' || entry.name === 'first-paint') {
            reportPerformance({
              event: 'performance',
              type: 'paint',
              metrics: { [entry.name]: entry.startTime },
            });
          }
        }
      });
      paintObserver.observe({ type: 'paint', buffered: true });
    } catch {
      // Ignore performance observer errors
    }

    try {
      const navObserver = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            reportPerformance({
              event: 'performance',
              type: 'navigation',
              metrics: {
                dns: navEntry.domainLookupEnd - navEntry.domainLookupStart,
                tcp: navEntry.connectEnd - navEntry.connectStart,
                tls:
                  navEntry.secureConnectionStart > 0
                    ? navEntry.connectEnd - navEntry.secureConnectionStart
                    : 0,
                ttfb: navEntry.responseStart - navEntry.requestStart,
                download: navEntry.responseEnd - navEntry.responseStart,
                domInteractive: navEntry.domInteractive - navEntry.startTime,
                domComplete: navEntry.domComplete - navEntry.startTime,
                loadComplete: navEntry.loadEventEnd - navEntry.startTime,
              },
            });
          }
        }
      });
      navObserver.observe({ type: 'navigation', buffered: true });
    } catch {
      // Ignore performance observer errors
    }
  }

  log('info', 'observability_initialized', { sessionId: getSessionId() });
}

export function setUserId(id: string) {
  userId = id;
}

export function captureError(
  error: Omit<ErrorReport, 'timestamp' | 'url' | 'userAgent' | 'sessionId' | 'userId'>
) {
  const report: ErrorReport = {
    ...error,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    sessionId: getSessionId(),
    userId: userId ?? undefined,
  };
  buffer.push(report);
  if (buffer.length >= MAX_BUFFER) flush();
  log('error', 'error_captured', { event: report.event, message: report.message });
}

export function reportMetric(
  name: string,
  value: number,
  unit: MetricReport['unit'],
  tags?: Record<string, string>
) {
  const report: MetricReport = {
    event: 'metric',
    name,
    value,
    unit,
    tags,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
  };
  buffer.push(report);
  if (buffer.length >= MAX_BUFFER) flush();
}

export function reportPerformance(perf: Omit<PerformanceReport, 'timestamp' | 'sessionId'>) {
  const report: PerformanceReport = {
    ...perf,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
  };
  buffer.push(report);
  if (buffer.length >= MAX_BUFFER) flush();
}

export function reportWsLatency(latencyMs: number) {
  reportMetric('ws_latency', latencyMs, 'ms', { direction: 'roundtrip' });
}

export function reportFrameTime(frameMs: number) {
  reportMetric('frame_time', frameMs, 'ms');
}

export function reportFps(fps: number) {
  reportMetric('fps', fps, 'fps');
}

export function reportGameLoopPhase(phase: string, durationMs: number) {
  reportMetric(`game_loop_${phase}`, durationMs, 'ms');
}

function flush() {
  if (buffer.length === 0 || !reportEndpoint) return;

  const payload = buffer.splice(0, buffer.length);
  const body = JSON.stringify(payload);

  if (navigator.sendBeacon) {
    navigator.sendBeacon(reportEndpoint, body);
  } else {
    fetch(reportEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  }
}

function log(
  level: 'info' | 'warn' | 'error',
  event: string,
  fields: Record<string, unknown> = {}
) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    service: 'zombiesweep-client',
    sessionId: getSessionId(),
    ...fields,
  };
  // eslint-disable-next-line no-console
  console[level === 'error' ? 'error' : level](JSON.stringify(entry));
}

export function getObservabilityStatus() {
  return {
    sessionId: getSessionId(),
    bufferSize: buffer.length,
    endpointConfigured: !!reportEndpoint,
    userId: userId ?? null,
  };
}
