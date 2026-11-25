# Repository-owned implementation of the make-v2 execution phases.
#
# CI parity:
#   setup     -> "Sync the locked environment" in l9-lint-test.yml and deep-plan.yml
#   validate  -> the static half of scripts/ci.py: protocol bundle, schemas,
#                registries, boundaries, alignment, fixtures, inventory, meta
#                and completeness
#   check     -> ruff check and ruff format --check
#   test-fast -> the bounded selection l9-lint-test.yml runs on a pull request
#   test      -> the whole pytest suite plus the replay verification deep-plan
#                runs on an apply
#
# Core runs each phase as its own make process, so every recipe resolves the
# environment it needs rather than relying on state a previous phase exported.
# The development extra does not carry ruff, so the pin the toolchain check
# expects is installed explicitly. Bytecode and caches are suppressed because
# the repository's own gates fail on residue inside the tree.
PYTHON ?= python3
VENV := $(CURDIR)/.venv
BIN := $(VENV)/bin
export PATH := $(BIN):$(PATH)
export PYTHONDONTWRITEBYTECODE := 1

.PHONY: repo-setup repo-validate repo-check repo-test-fast repo-test

repo-setup: ## Create .venv and install the project with its development extra
	@test -x "$(BIN)/python" || $(PYTHON) -m venv "$(VENV)"
	@"$(BIN)/pip" install --quiet --upgrade pip
	@"$(BIN)/pip" install --quiet -e ".[dev]"
	@"$(BIN)/pip" install --quiet "ruff==0.15.5"

repo-validate: ## Run the static repository gates
	@"$(BIN)/python" -B scripts/sync_protocol_bundle.py --check
	@"$(BIN)/python" -B scripts/validate_schemas.py
	@"$(BIN)/python" -B scripts/validate_registries.py
	@"$(BIN)/python" -B scripts/validate_boundaries.py
	@"$(BIN)/python" -B scripts/validate_l9_alignment.py
	@"$(BIN)/python" -B scripts/validate_fixtures.py
	@"$(BIN)/python" -B scripts/generate_inventory.py --check
	@"$(BIN)/python" -B scripts/generate_l9_meta.py --check
	@"$(BIN)/python" -B scripts/validate_completeness.py

repo-check: ## Ruff lint and format check
	@ruff check .
	@ruff format --check .

repo-test-fast: ## Bounded pull-request test selection
	@pytest -q -p no:cacheprovider tests/unit tests/contract tests/architecture

repo-test: ## Whole pytest suite and replay verification
	@pytest -q -p no:cacheprovider
	@"$(BIN)/python" -B scripts/verify_replay.py
