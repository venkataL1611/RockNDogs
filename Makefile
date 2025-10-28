.PHONY: help compose-up compose-down k8s-pf-start k8s-pf-stop test test-unit test-e2e seed-user seed-test

help:
	@echo "Targets:"
	@echo "  compose-up        - Start local services with Docker Compose"
	@echo "  compose-down      - Stop local services"
	@echo "  k8s-pf-start      - Start kubectl port-forwards (app, db, es, redis, argocd)"
	@echo "  k8s-pf-stop       - Stop all kubectl port-forwards"
	@echo "  test              - Run all tests (unit + e2e)"
	@echo "  test-unit         - Run unit/integration tests"
	@echo "  test-e2e          - Run end-to-end tests"
	@echo "  seed-user         - Seed test user"
	@echo "  seed-test         - Seed test products"

compose-up:
	docker compose up -d

compose-down:
	docker compose down

k8s-pf-start:
	bash scripts/port-forward-start.sh

k8s-pf-stop:
	bash scripts/port-forward-stop.sh

seed-user:
	node tests/seed-user.js

seed-test:
	node tests/seed-test-data.js

test:
	npm run test

test-unit:
	npm run test:unit

test-e2e:
	npm run test:e2e
