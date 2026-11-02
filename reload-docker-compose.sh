docker compose -f "docker-compose.yml.local" down
docker compose -f "docker-compose.yml.local" build --pull
docker compose -f "docker-compose.yml.local" up -d
docker compose -f "docker-compose.yml.local" logs -f