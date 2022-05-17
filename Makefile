include .env

makemigrations:
	docker-compose exec web /app/manage.py makemigrations

migrate:
	docker-compose exec web /app/manage.py migrate

createsuperuser:
	docker-compose exec web /app/manage.py createsuperuser

console:
	cd hasura; hasura console --admin-secret=${HASURA_SECRET};

hs-migrate:
	cd hasura; hasura migrate apply --admin-secret=${HASURA_SECRET};

hs-metadata:
	cd hasura; hasura metadata apply --admin-secret=${HASURA_SECRET};

hs-metadata-reload:
	cd hasura; hasura metadata reload --admin-secret=${HASURA_SECRET};
