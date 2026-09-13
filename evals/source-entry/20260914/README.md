# Fresh source-entry observation — 14 September 2026

One fresh-context consumer examined the newly selected source entry and answered
two workflow-selection requests. This tests retrieval and decisions from delivered
instructions, not browser execution, ticket reproduction or general QA competence.
The first answer is preserved in [first-response.md](first-response.md). A later
correction must be a separate response, never a replacement of this answer.

## Source and method

- Root:`0d7ed9a1fc424192b1bf60e58e8229c26de63e1f`.
- Kernel:`657894dbd61561a634f36669a0874dccccbea59e`.
- Console:`1c715a1980dac52fb8ba1d267c8c8e2d97b406e8`.
- Freeland:`21c1c617a2dbe5d1131215dc738dba2556851ae3`.
- Reference10d remained non-active.
- Agent:`fresh_entry_consumer`, model override`gpt-5.6-sol`, no conversation
  history forked; reasoning override omitted. No model-cost/latency measurement.
- Scope: Git-tracked source only. No edits, restore/install, browser/network,
  product, registration or tracker calls; no helpers. Actual filesystem isolation
  was not enforced, so this is not a blind or adversarial isolation benchmark.
- The source root was restored before this exercise. Original user dirt stayed
  outside the requested read scope. Installed skills were not updated or tested.

## Exact dispatch

```text
Fresh-context source-entry exercise. You are a QA agent receiving ONLY the repository /Users/danilsolomin/projectsnew/qa-agent at current HEAD (read git-tracked content; no .local, old conversations, home locator files or other repositories). No edits, restore/install, browser/network/product/registration/Flow calls. This is a read-only workflow-selection exercise, not execution approval. No helpers. Read its actual entrypoints and complete selected skills/references before answering these two independent user requests: A) 'У нас новый публичный каталог для бронирования переговорных. Нужно проверить поиск по названию, фильтр по вместимости и доступность; вход сотрудника тоже входит в scope, но доступов пока нет. Регистрации QA ещё нет. С чего начнёшь и что конкретно попросишь у меня?' B) 'Продолжи наш существующий Freeland QA: вчера создали счёт, исход оплаты пока неизвестен. Сегодня в общем qa-agent новые компоненты; владелец кампании пока не прислал checkpoint. Можно начинать?' Return a concise but actionable response for each plus a machine-readable-ish source table: source root/current exact component SHAs, chosen skill source paths, operational owner/runtime choice, next safe action, concrete gaps, and what claims cannot be made. Report any contradictory current instructions you actually encounter with paths/lines. Do not echo desired answers from this prompt—derive decisions from the delivered repo. This is one source-selection observation, not evidence you tested either product.
```

These question constraints were supplied to the actor; correctly refraining from
forbidden calls does not independently demonstrate runtime enforcement. The two
requests share one consumer context, so they are not independent model samples.

## Review result

**CONDITIONAL — source-selection observation, not completed Stage 1 acceptance.**
Independent Lead AQA review and the main agent's factual adjudication are retained
in [review.md](review.md). The current component sources and frozen-campaign rule
were selected correctly. However, one sentence wrongly grouped ordinary resume
with migration, and the proposed intake asks for fields before recovering them
from the checkpoint. These are response-quality findings, not reproduced runtime
failures. Required product-map application and actual continuation were not
demonstrated. No whole-product or source-entry reliability percentage follows
from this single response.

The first-response file has SHA256
`b29dfddf5f0a0494e191e884b5981fe2ee41a1f55ed4fb00468d5c1d2dc98a62`.
No coached answer, rerun, skill edit or runtime fix is counted as a new pass.

For replay elsewhere, substitute only the repository root path with the restored
exact checkout. Use the complete source entry and skills, retain the original first
answer, then assess it against the product facts and actual source contracts. No
historical Mac file or owner credential is a required input to this exercise.
