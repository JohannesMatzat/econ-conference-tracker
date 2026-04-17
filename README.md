# Econ Conference Tracker

This repository is the public GitHub Pages site for economics conference tracking.

## Operating model

Codex automation maintains the conference tracker locally, including planning, evidence collection, merge validation, retry queues, and benchmark checks.
GitHub Actions is deploy-only: it publishes the already-built `site/` folder to GitHub Pages.
Local pipeline files and raw working data stay local and are excluded via `.gitignore`.

## Published contents

- `site/index.html`
- `site/styles.css`
- `site/app.js`
- `site/data/conferences.json` (sanitized, public-safe fields only)
- `.github/workflows/monthly-update-and-deploy.yml` (deploy-only Pages workflow)

## Deployment

GitHub Actions deploys the `site/` folder to GitHub Pages only. It does not refresh conference data.

The workflow runs on:

- `workflow_dispatch`
- pushes to `main` that change `site/**` or the workflow file

## Local update flow

1. Run the staged local refresh flow: `plan_refresh.py`, `suggest_similar_conferences.py`, `codex_research.py`, and `merge_validate.py`.
2. Complete any blocking Codex retry work from `prepare_codex_retry.py` before publish.
3. Rebuild `site/data/conferences.json` only after validation passes.
4. Run `score_benchmark.py` and stop if quality is below the configured threshold.
5. Use `publish_site.bat` to stage only public site files, then push to `main`.
6. Let GitHub Actions deploy the updated site.
