
.PHONY: dev test prod clean

dev:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

test:
	docker-compose -f docker-compose.test.yml up --abort-on-container-exit

prod:
	docker-compose up -d

clean:
	docker-compose down -v
	rm -rf node_modules **/node_modules
	find . -name "*.pyc" -type f -delete
