"""ZooMoney 트레이너챗봇 의도 분류 정확도 측정 — 로컬 직접 호출판.

run_intent_eval.py와 로직은 동일하지만, 공개 배포된 Cloudflare 게이트웨이
(IP당 하루 40회 한도)를 거치지 않고 Dify API를 직접 호출한다.
사용자 본인의 Dify API 키(.env의 DIFY_TRAINER_KEY)를 쓰므로 그 한도 제약이 없다.

.env에 DIFY_TRAINER_KEY=app-... 를 채워 넣고 실행:
    python eval/run_intent_eval_local.py
"""
import json
import os
import time
import urllib.request

DIFY_CHAT_ENDPOINT = "https://api.dify.ai/v1/chat-messages"
GOLDEN = "eval/intent_golden.jsonl"


def load_env(path=".env"):
    if not os.path.exists(path):
        return
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            os.environ.setdefault(key.strip(), value.strip())


REJECT_MARKERS = [
    "답하기 어려", "답하기 곤란", "저축 트레이너라", "저축 트레이너로",
    "그 질문엔", "그 질문에는", "도와드리기 어려", "답변드리기 어려",
]


def call(query, api_key):
    body = json.dumps({
        "inputs": {},
        "query": query,
        "response_mode": "blocking",
        "user": "local-eval",
    }).encode()
    req = urllib.request.Request(
        DIFY_CHAT_ENDPOINT, data=body, headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
    )
    with urllib.request.urlopen(req, timeout=40) as r:
        data = json.loads(r.read())
    return data.get("answer", ""), data.get("metadata", {})


def is_rejected(answer):
    return any(m in answer for m in REJECT_MARKERS)


def main():
    load_env()
    api_key = os.environ.get("DIFY_TRAINER_KEY", "").strip()
    if not api_key:
        print("[ERR] .env의 DIFY_TRAINER_KEY가 비어있습니다. Dify 콘솔 → 트레이너챗봇 앱 → "
              "API 접근에서 키를 발급받아 채워넣으세요.")
        return

    cases = [json.loads(l) for l in open(GOLDEN, encoding="utf-8") if l.strip()]
    tp = fp = fn = tn = 0
    wrong = []
    RUNS = 3  # LLM 변동성 때문에 케이스마다 3회 돌려 다수결로 판정
    for c in cases:
        votes = []
        last_ans = ""
        for _ in range(RUNS):
            try:
                ans, _m = call(c["query"], api_key)
                votes.append("rejected" if is_rejected(ans) else "handled")
                last_ans = ans
                time.sleep(0.4)
            except Exception as e:
                print(f"[ERR] {c['id']}: {e}")
        if not votes:
            continue
        got = max(set(votes), key=votes.count)  # 다수결
        unstable = len(set(votes)) > 1
        ok = got == c["expect"]
        mark = "OK " if ok else "XX "
        flag = f"  ⚠불안정{votes}" if unstable else ""
        print(f"  [{mark}] {c['id']} 기대={c['expect']:<8} 실제={got:<8} {c['note']}{flag}")
        if not ok:
            wrong.append((c, got, last_ans[:70], votes))
        if c["expect"] == "handled" and got == "handled":
            tp += 1
        elif c["expect"] == "handled" and got == "rejected":
            fn += 1  # 정상 질문을 거절 — 가장 나쁜 오류
        elif c["expect"] == "rejected" and got == "rejected":
            tn += 1
        else:
            fp += 1  # 무관 질문을 처리

    n = tp + fp + fn + tn
    acc = (tp + tn) / n if n else 0
    print(f"\n=== 결과 (n={n}) ===")
    print(f"정확도: {(tp+tn)}/{n} = {acc:.0%}")
    print(f"정상질문 처리(TP) {tp} / 정상질문 오거절(FN) {fn}  "
          f"← FN이 사용자 피해 가장 큼")
    print(f"무관질문 거절(TN) {tn} / 무관질문 오처리(FP) {fp}")
    if wrong:
        print("\n오분류 상세:")
        for c, got, ans, votes in wrong:
            print(f"  - {c['id']} \"{c['query']}\" (기대 {c['expect']} → {got}, votes={votes})")
            print(f"      응답: {ans}")


if __name__ == "__main__":
    main()
