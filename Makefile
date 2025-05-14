
.PHONY: dev test prod clean reset logs

# Default target for production
prod:
	docker-compose up -d

# Development mode with hot reloading
dev:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Test mode
test:
	docker-compose -f docker-compose.yml -f docker-compose.test.yml up -d

# Stop all containers
clean:
	docker-compose down
	
# Reset everything, including volumes and node_modules
reset:
	docker-compose down -v
	rm -rf node_modules **/node_modules
	find . -name "*.pyc" -type f -delete

# View logs from all services
logs:
	docker-compose logs -f

# View logs for a specific service, e.g. make logs-api
logs-%:
	docker-compose logs -f $*

# Build all images without starting containers
build:
	docker-compose build

# Update to latest dependencies
update:
	docker-compose build --no-cache
