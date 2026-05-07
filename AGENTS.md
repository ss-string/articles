<INSTRUCTIONS>
@/Users/sunghyun/.codex/RTK.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

- 모든 설계서와 디자인 스펙은 한글로 작성하세요.
- `docs/superpowers/specs/` 아래의 신규 설계 문서는 한글 제목과 한글 본문을 사용하세요.
- 기존 설계서를 수정할 때도 영어 본문을 남기지 말고 한글로 정리하세요.
- PR을 생성할 때 제목은 한글로 작성하고, 설명에는 한글 `TL;DR` 요약을 포함하세요.
- 브라우저를 이용한 디자인 작업은 항상 현재 CSS 스타일과 현재 구조를 먼저 이해한 뒤 시안을 제공하세요.
- 디자인은 기존 맥락과 구조를 이어가야 합니다.
- 작업이 모두 완료된 경우 워킹트리에서 새로운 개발 서버를 띄워 확인할 수 있는 링크를 제공하세요.


</INSTRUCTIONS>
