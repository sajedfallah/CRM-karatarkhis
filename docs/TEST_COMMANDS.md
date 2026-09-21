# Test Command Inventory

Current V5 docs define local backend bootstrap:
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
