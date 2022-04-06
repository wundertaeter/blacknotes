makemigrations:
	docker-compose exec web /app/manage.py makemigrations

migrate:
	docker-compose exec web /app/manage.py migrate

createsuperuser:
	docker-compose exec web /app/manage.py createsuperuser