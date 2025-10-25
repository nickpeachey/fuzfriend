# Fuzfriend Products API (Spring Boot)

A Spring Boot Web API that mirrors the .NET Products API in this repo. It exposes the same endpoints and semantics for product search, filtering, sorting, pagination, and caching (Redis-backed or in-memory fallback).

## Endpoints

- GET `/api/products?page=1&pageSize=20` → ProductResponse
- GET `/api/products/count` → integer
- POST `/api/products/search` (JSON body: ProductQueryDto) → ProductResponse
- GET `/api/products/{id}` → Product

Cache-bypass headers supported:
- `X-Bypass-Cache: 1`
- `Cache-Control: no-cache`
- `Pragma: no-cache`

Responses include cache diagnostics headers similar to the .NET API:
- `X-Cache-Status: HIT|MISS|BYPASS`
- `X-Cache-Key: <key>`

## Tech

- Java 21, Spring Boot 3
- Spring Web, Spring Data JPA, Hibernate
- PostgreSQL (dev/prod), H2 (tests)
- Optional Redis for distributed caching

## Configuration

Edit `src/main/resources/application.yml` or use environment variables.

- Datasource: `spring.datasource.url`, `spring.datasource.username`, `spring.datasource.password` (defaults to local Postgres)
- Redis (optional): `spring.data.redis.host`, `spring.data.redis.port`
- CORS: `cors.allowed-origins` (array)
- Cache TTL: `app.cache.ttl-seconds` (default 120s)

## Run

Requires JDK 21 and Maven.

```bash
# From repo root
cd backend/fuzfriend-products-api-java
mvn spring-boot:run
```

The server listens on port 8081 by default.

If you don't have Postgres/Redis locally, run with the H2 'local' profile:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

## API docs (Swagger/OpenAPI)

With the app running, visit:

- Swagger UI: http://localhost:8081/swagger-ui/index.html
- OpenAPI JSON: http://localhost:8081/v3/api-docs

### Optional: Docker Compose for Postgres + Redis

Use the compose file in the .NET backend or create one with Postgres and Redis listening on localhost ports 5432 and 6379, respectively.

## Notes

- On first run (non-test profile), the app seeds ~1000 fake products with safe image URLs.
- When Redis isn't configured, a simple in-memory cache is used.
- Hibernate `ddl-auto: update` is enabled for convenience; consider Flyway/Liquibase and stricter settings for production.