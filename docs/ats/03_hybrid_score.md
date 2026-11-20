# 03 — Hybrid ATS Score (v2)

## Production algorithm

Weights start at required = 1.0 and preferred = 0.5. Direct wording and verified genuine aliases earn `eᵢ=1`; an alias is shown as a recognized equivalent term. A related phrase found by embeddings is never labeled an exact match: it receives only qualified semantic supporting credit `gᵢ=clamp((cosᵢ−τ_low)/(τ_high−τ_low),0,1)` with initial `τ_low=0.55`, `τ_high=0.80`. A cosine at or below `τ_low` earns zero; a value at or above `τ_high` earns one. Semantic similarity is not proof of proficiency or equivalence.

`R = Σ(wᵢeᵢ)/Σwᵢ`; `M = Σ(wᵢ max(eᵢ,gᵢ))/Σwᵢ`; `S = 100(βR+(1−β)M)`, initially `β=0.6`. The former flat rule (cosine ≥0.80 gives 0.5) is an offline ablation baseline only.

## Required-skill policy

No verified required skill means no score: return `422 NO_REQUIRED_SKILLS`. If the model marks required skills but none of their evidence quotes can be verified in the job text, return `422 REQUIRED_UNVERIFIED`. Both checks happen before resume matching. This intentionally overrides the earlier preferred-only normalization proposal.

## Response and confidence

The API returns an `atsScore` object containing `score`, `ruleCoverage`, `hybridCoverage`, `matched`, `semantic`, `missing`, `confidence`, `algorithmVersion`, `params`, and an explanation. Each semantic detail exposes `similarity`, `credit`, `status: "supporting"`, and the CV evidence section/text. Confidence is heuristic, not a probability: fewer than five verified job skills is `low`; otherwise at most `medium`. `high` is withheld until evaluation/calibration. Missing items are ordered by weighted uncredited impact.

The response also includes `excludedSkillCount`. The UI reports when extracted rows were omitted because they were malformed, duplicated, beyond the extraction cap, or their quoted evidence could not be verified in the job description. Excluded rows never contribute to the score.

The example in the original proposal is retained as a unit-test fixture: required weights 1, preferred weights .5, total weight 6; exact weight 3.5; semantic credits .6 and .4×.5; `R=0.5833`, `M=0.7167`, `S=63.67`, rounded to 64. Tests must state each cosine/credit explicitly.

Algorithm version: `hybrid-linear-v1`. Initial parameters are returned with each response. Thresholds and β are starting values, not calibrated findings. Successful analyses are persisted as user-owned history records so the user can reopen or delete them later; the result and job-description text are stored, while no resume snapshot is stored. Records expire after 90 days and are capped at the latest 50 per account, whichever limit is reached first; backend access performs opportunistic expiry cleanup and a daily Vercel cron performs scheduled cleanup.
