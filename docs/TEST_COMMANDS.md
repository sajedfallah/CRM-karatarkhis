# Test Command Inventory

## Canonical automated checks

From `backend/`, install the test tooling and run the deterministic API suite:

```bash
pip install -r requirements.txt
pytest
python -m compileall -q app tests
```

Without `KRT_TEST_DATABASE_URL`, pytest uses an in-memory SQLite database for
fast API regressions. CI supplies disposable PostgreSQL and is the canonical
place where migration compatibility is validated. To reproduce that check
locally, point both variables at a disposable PostgreSQL database:

```bash
DATABASE_URL=postgresql+psycopg://... KRT_TEST_DATABASE_URL=postgresql+psycopg://... alembic downgrade base
DATABASE_URL=postgresql+psycopg://... KRT_TEST_DATABASE_URL=postgresql+psycopg://... alembic upgrade head
DATABASE_URL=postgresql+psycopg://... KRT_TEST_DATABASE_URL=postgresql+psycopg://... pytest
```

The GitHub Actions workflow runs dependency installation, syntax/import checks,
zero-to-head migration validation, pytest, and a repository secret scan.

## Local backend bootstrap
```bash
cd backend
python -m venv .venv
# activate venv
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

Known health checks:
- GET /health
- GET /health/db
- GET /health/sheets

At this baseline there is no verified automated pytest/CI command in the V5 branch. KRT-FOUNDATION-002R must establish canonical test commands and GitHub Actions.

Static baseline verification for KRT-FOUNDATION-001R is therefore limited to repository inspection, unchanged migration paths, unchanged application code and branch diff review.
