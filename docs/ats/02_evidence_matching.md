# 02: Resume Evidence and Semantic Matching

## Purpose

For each verified job skill, find the best relevant evidence in the resume. A direct wording or recognized equivalent-name match is rule-based. A related phrase or concept found through embeddings is shown only as **semantic supporting evidence**; it is never presented as proof that the candidate has the skill.

The score is a job-fit indicator, not a hiring decision or probability. The user decides whether a suggested skill accurately reflects their experience before adding it to the resume.

## Evidence sources

The matcher reads resume text from summary, experience, projects, skills, education, custom sections, languages, and certificates. Evidence is divided into readable units. Long text is split into chunks of at most about 70 words so meaning is retained while evidence remains reviewable.

Semantic candidates are compared with evidence from sections appropriate to the extracted skill category. The skills list is eligible semantic evidence as well as direct-match evidence; this helps find related terms and cross-language phrasing. The selected evidence section and a short quote are returned to the UI.

## Normalization and direct matches

- Text is normalized for case, Turkish dotted/dotless I, punctuation, whitespace, and common formatting differences.
- Phrase matching respects word boundaries: `Java` does not match inside `JavaScript`.
- Only the requested skill wording, an evidence-verified job-ad alias, or a maintained genuine synonym/format variant can produce a direct match.
- Direct matches are displayed as **Direct wording match**. A recognized synonym or abbreviation is displayed as **Recognized equivalent term** and includes the CV wording used as evidence.
- Similarity alone never upgrades a related or broader/narrower term to a direct match. For example, `SQL` in a CV is not an exact `MySQL` match; if the embedding comparison considers it relevant, it can only appear as semantic support. The same rule applies to ambiguous or nearby technology names such as `Node` and `Node.js`.

## Semantic supporting evidence

Only skills without a direct match are sent to semantic comparison. The query includes the job skill name, its category, and the verified job-ad evidence. The best eligible resume evidence is compared using cosine similarity. Initial thresholds are `τ_low=0.55` and `τ_high=0.80`; the linear credit formula is documented in [03: Hybrid Score](03_hybrid_score.md). Values below the lower threshold receive no credit. A positive credit is returned with `status: "supporting"`, the similarity, credit, evidence section, and evidence quote.

This is intentionally a relevance suggestion, not a claim of equivalence or proficiency. The UI labels it **Semantic support**, states that similarity does not prove the skill is present, and invites the user to add the job wording only if it reflects their actual experience. Adding it changes the editor draft; the user must save the resume.

The implementation does not use a large hand-written positive relation table for every profession. Such a table would be incomplete and could turn unreviewed examples into false equivalences. A small denylist blocks known confusable pairs in semantic comparison (currently Java/JavaScript, SQL/NoSQL, and Docker/Kubernetes). All other relatedness is treated as uncertain semantic evidence, never as an exact match. This reduces false claims while still allowing useful suggestions across fields and languages.

Short skill names of two or fewer alphanumeric characters are restricted to direct matching because embeddings are unreliable for them.

## Caching

Job-skill extraction and resume evidence embeddings use bounded in-process caches. Evidence vectors are keyed by a hash of the complete ordered evidence-text batch together with the embedding model/task. If any evidence text changes, the batch key changes and the vectors are recalculated; unchanged batches can be reused within that application process. This is not persistent storage or a per-fragment cache. Cache behavior is an optimization and does not change matching semantics.

## Known limits

- Embedding similarity can confuse related concepts, broad categories, and specialized technologies. Such a result remains supporting evidence and can contribute partial score credit, so the UI must keep the qualification visible.
- A short or generic resume phrase may not provide enough context to assess a specific skill. Users should review the quoted evidence before accepting a suggestion.
- The denylist covers known confusable pairs, not every possible pair. Additional failures should inform future evaluation and carefully reviewed denylist changes.
- Thresholds and weights are starting values, not empirically calibrated results. Evaluation and calibration belong to the later labeled-data phase.

## Current implementation status

The direct/alias and semantic-support paths, evidence quotes, category-aware evidence selection, score credit, cache, and user-reviewed add-to-resume action are implemented. Semantic similarities are not labeled as exact matches. Evaluation metrics and automated embedding/cache regression checks are follow-up quality work; they are not represented here as completed measurements.
