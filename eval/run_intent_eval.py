"""ZooMoney 트레이너챗봇 의도 분류 정확도 측정.

트레이너챗봇은 질문을 6개 유형으로 분류한다(class-1~5는 처리, class-6은 금융 무관 → 거절).
DSL 콘솔에서 분기 결과를 직접 뽑을 수 없으므로, 배포된 게이트웨이를 호출해
'응답이 거절 형태인가(rejected) / 정상 처리인가(handled)'를 결정론적으로 판정한다.

이 방식의 한계: class-1~5 사이의 세부 오분류(예: 절약팁을 예산분석으로)는 잡지 못한다.
정상 질문을 거절해버리는 오분류(가장 사용자 피해가 큰 유형)와 그 반대만 측정한다.
"""
import json
import time
import urllib.request

GATEWAY = "https://zoomoney-gateway.guszhd95.workers.dev/chat"
GOLDEN = "eval/intent_golden.jsonl"

# 거절 응답의 특징 문구 (class-6 분기의 고정 응답 패턴).
# 응답이 실행마다 미세하게 달라지므로 여러 변형을 포괄하고, 1개만 걸려도 거절로 본다.
REJECT_MARKERS = [
    "답하기 어려", "답하기 곤란", "저축 트레이너라", "저축 트레이너로",
    "그 질문엔", "그 질문에는", "도와드리기 어려", "답변드리기 어려",
]


def call(query):
    body = json.dumps({"agent": "trainer", "query": query}).encode()
    req = urllib.request.Request(
        GATEWAY, data=body, headers={
            "Content-Type": "application/json",
            # Cloudflare가 Python-urllib 기본 UA를 봇으로 차단하므로 브라우저 UA로 위장
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                          "AppleWebKit/537.36 (KHTML, like Gecko) "
                          "Chrome/126.0 Safari/537.36",
        }
    )
    with urllib.request.urlopen(req, timeout=40) as r:
        data = json.loads(r.read())
    return data.get("answer", ""), data.get("metadata", {})


def is_rejected(answer):
    return any(m in answer for m in REJECT_MARKERS)


def main():
    cases = [json.loads(l) for l in open(GOLDEN, encoding="utf-8") if l.strip()]
    tp = fp = fn = tn = 0
    wrong = []
    RUNS = 3  # LLM 변동성 때문에 케이스마다 3회 돌려 다수결로 판정
    for c in cases:
        votes = []
        last_ans = ""
        for _ in range(RUNS):
            try:
                ans, _m = call(c["query"])
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
        # handled를 positive로 두고 혼동행렬
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
