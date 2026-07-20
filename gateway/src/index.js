/**
 * ZooMoney Dify Gateway — Cloudflare Worker
 *
 * 역할:
 *  1. Dify API 키 은닉 — 키는 Worker secret에만 존재, 프론트에는 에이전트 이름만
 *  2. 남용 방지 — IP당 하루 호출 한도 (KV 카운터)
 *  3. 관측성 — 요청별 에이전트/지연시간/토큰 사용량 구조화 로깅 (wrangler tail)
 *
 * 엔드포인트:
 *  POST /chat   { agent, query, conversation_id? }  → Dify /chat-messages 응답 그대로
 *  GET  /health → { ok: true }
 */

const DIFY_BASE = 'https://api.dify.ai/v1';

// 에이전트 슬러그 → secret 이름 (wrangler secret put <NAME>)
const AGENT_SECRETS = {
  goal: 'DIFY_GOAL_KEY',          // 목표 설정
  analysis: 'DIFY_ANALYSIS_KEY',  // 소비 분석
  budget: 'DIFY_BUDGET_KEY',      // 예산 플래닝
  trainer: 'DIFY_TRAINER_KEY',    // 트레이너 챗봇
  summary: 'DIFY_SUMMARY_KEY',    // 소비요약/정산 코멘트
  etf: 'DIFY_ETF_KEY',            // ETF 코치
};

const ALLOWED_ORIGINS = [
  'https://hyunbean.github.io',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

const DAILY_LIMIT = 40; // IP당 하루 호출 한도

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

async function checkRateLimit(env, ip) {
  // KV 미바인딩(로컬 dev 등)이면 제한 없이 통과
  if (!env.RATE_KV) return { ok: true, used: 0 };
  const day = new Date().toISOString().slice(0, 10);
  const key = `rl:${day}:${ip}`;
  const used = parseInt((await env.RATE_KV.get(key)) || '0', 10);
  if (used >= DAILY_LIMIT) return { ok: false, used };
  // 자정 이후 자동 소멸하도록 25시간 TTL
  await env.RATE_KV.put(key, String(used + 1), { expirationTtl: 60 * 60 * 25 });
  return { ok: true, used: used + 1 };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (url.pathname === '/health') {
      return json({ ok: true }, 200, origin);
    }
    if (request.method !== 'POST' || url.pathname !== '/chat') {
      return json({ error: 'not found' }, 404, origin);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'invalid json' }, 400, origin);
    }
    const { agent, query, conversation_id: conversationId } = body || {};
    const secretName = AGENT_SECRETS[agent];
    if (!secretName) return json({ error: `unknown agent: ${agent}` }, 400, origin);
    if (!query || typeof query !== 'string' || query.length > 4000) {
      return json({ error: 'query must be a string (max 4000 chars)' }, 400, origin);
    }
    const apiKey = env[secretName];
    if (!apiKey) return json({ error: `secret ${secretName} not configured` }, 503, origin);

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rl = await checkRateLimit(env, ip);
    if (!rl.ok) {
      console.log(JSON.stringify({ evt: 'rate_limited', agent, ip }));
      return json({ error: 'daily limit reached', limit: DAILY_LIMIT }, 429, origin);
    }

    const t0 = Date.now();
    let difyRes;
    try {
      difyRes = await fetch(`${DIFY_BASE}/chat-messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: {},
          query,
          response_mode: 'blocking',
          ...(conversationId ? { conversation_id: conversationId } : {}),
          user: `gw-${ip}`,
        }),
        signal: AbortSignal.timeout(30000),
      });
    } catch (e) {
      console.log(JSON.stringify({ evt: 'dify_error', agent, err: String(e) }));
      return json({ error: 'upstream timeout/failure' }, 502, origin);
    }

    const data = await difyRes.json().catch(() => ({}));
    console.log(JSON.stringify({
      evt: 'chat', agent, ip,
      status: difyRes.status,
      latency_ms: Date.now() - t0,
      usage: data?.metadata?.usage
        ? { tokens: data.metadata.usage.total_tokens, price: data.metadata.usage.total_price }
        : null,
      rl_used: rl.used,
    }));
    return json(data, difyRes.status, origin);
  },
};
