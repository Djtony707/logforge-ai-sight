
.PHONY: dev test prod clean

dev:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

prod:
	docker-compose up -d

clean:
	docker-compose down
	
reset:
	docker-compose down -v
	rm -rf node_modules **/node_modules
	find . -name "*.pyc" -type f -delete

logs:
	docker-compose logs -f

