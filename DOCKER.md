# Docker Setup for Delivery App Backend

## Prerequisites
- Docker and Docker Compose installed
- Java 17+ installed for running the Spring Boot application

## Database Setup with Docker

### 1. Start PostgreSQL with Docker Compose
```bash
# Start the PostgreSQL container
docker-compose up -d postgres

# Check if the container is running
docker-compose ps

# View logs if needed
docker-compose logs postgres
```

### 2. Stop PostgreSQL
```bash
# Stop the PostgreSQL container
docker-compose down

# Stop and remove volumes (WARNING: This will delete all data)
docker-compose down -v
```

### 3. Connect to PostgreSQL
```bash
# Connect to the PostgreSQL database
docker exec -it delivery-app-postgres psql -U gloriaupup -d delivery_app
```

## Application Setup

### 1. With Docker PostgreSQL
```bash
# Start PostgreSQL
docker-compose up -d postgres

# Wait for PostgreSQL to be ready (check logs)
docker-compose logs -f postgres

# Run the Spring Boot application
./gradlew bootRun
```

### 2. Environment Variables (Optional)
You can override database credentials using environment variables:

```bash
export DB_USERNAME=your_username
export DB_PASSWORD=your_password
./gradlew bootRun
```

## Database Configuration

The application will automatically create the required database schema using Hibernate DDL auto-update.

Default database credentials:
- Database: `delivery_app`
- Username: `gloriaupup`
- Password: `password`
- Port: `5432`

## Troubleshooting

### PostgreSQL Connection Issues
1. Ensure Docker container is running: `docker-compose ps`
2. Check PostgreSQL logs: `docker-compose logs postgres`
3. Verify port 5432 is not occupied by another PostgreSQL instance
4. Test connection: `docker exec -it delivery-app-postgres pg_isready -U gloriaupup`

### Port Conflicts
If port 5432 is already in use, you can change it in `docker-compose.yml`:
```yaml
ports:
  - "5433:5432"  # Use port 5433 on host
```

And update `application.yml`:
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5433/delivery_app
```