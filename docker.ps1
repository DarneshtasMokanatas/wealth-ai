# Helper script — passes .env.local to Docker Compose for variable substitution
# Usage:  .\docker.ps1 up --build
#         .\docker.ps1 down
#         .\docker.ps1 logs -f app
docker compose --env-file .env.local @args
