.PHONY: install dev server frontend test audit build clean help

PYTHON ?= ./.venv/bin/python
PIP ?= ./.venv/bin/pip
PYTEST ?= ./.venv/bin/pytest

help:
	@echo "TRUTHLENS-AI Build & Development CLI"
	@echo "-------------------------------------"
	@echo "make install    : Install Python and Node dependencies"
	@echo "make server     : Run FastAPI backend server on :8000"
	@echo "make frontend   : Run Vite frontend development server on :3000"
	@echo "make dev        : Run backend and frontend concurrently"
	@echo "make test       : Execute full pytest test suite"
	@echo "make audit      : Run Data Leakage Mitigation Audit (Section 5.2)"
	@echo "make build      : Build production frontend bundle"
	@echo "make clean      : Remove temporary caches and build artifacts"

install:
	python3 -m venv .venv
	$(PIP) install -r requirements.txt
	cd frontend && npm install

server:
	$(PYTHON) -m uvicorn truthlens.api.main:app --host 0.0.0.0 --port 8000 --reload

frontend:
	cd frontend && npm run dev

build:
	cd frontend && npm run build

test:
	$(PYTEST) tests/ -v

audit:
	$(PYTHON) scripts/run_audit.py

clean:
	rm -rf .pytest_cache __pycache__ truthlens/**/__pycache__ frontend/dist frontend/node_modules/.vite
