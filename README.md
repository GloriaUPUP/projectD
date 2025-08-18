# DeliveryApp Backend

A comprehensive Spring Boot backend service for the delivery application, providing REST APIs for order management, user authentication, address management, and payment processing.

## Features

### 🔐 Authentication & User Management
- JWT-based authentication
- User registration and login
- Profile management
- User settings management

### 📦 Order Management
- Create and manage delivery orders
- Multiple delivery options (Robot, Drone, Standard)
- Order status tracking with real-time updates
- Order history with pagination
- Delivery recommendations

### 📍 Address Management
- CRUD operations for user addresses
- Default address management
- Address validation and suggestions
- Address search functionality

### 💳 Mock Payment Processing
- Mock payment methods for frontend interaction
- Simulated payment flow (no real transactions)
- Payment status simulation for UI testing
- Frontend payment form validation

### 📱 API Features
- RESTful API design
- Comprehensive error handling
- CORS support for frontend integration
- Detailed API documentation

## Tech Stack

- **Framework**: Spring Boot 3.2.0
- **Database**: PostgreSQL with JPA/Hibernate
- **Security**: Spring Security with JWT
- **Build Tool**: Gradle
- **Java Version**: 21

## Project Structure

```
src/main/java/com/flagcamp/delivery/
├── controller/          # REST API controllers
│   ├── UserController.java
│   ├── DeliveryController.java
│   ├── AddressController.java
│   ├── MockPaymentController.java
│   └── SupportController.java
├── entity/             # JPA entities
│   ├── User.java
│   ├── Order.java
│   ├── Address.java
│   ├── Payment.java
│   └── ...
├── repository/         # Data access layer
├── service/           # Business logic layer
├── dto/              # Data transfer objects
├── config/           # Configuration classes
└── exception/        # Custom exceptions
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login  
- `POST /api/auth/logout` - User logout
- `GET /api/auth/settings` - Get user settings
- `PUT /api/auth/settings` - Update user settings

### Orders & Delivery
- `POST /api/orders` - Create new order
- `GET /api/orders/history` - Get order history
- `GET /api/orders/{orderNumber}/details` - Get order details
- `GET /api/orders/{orderNumber}/delivery-options` - Get delivery options
- `PUT /api/orders/{orderNumber}/select-option` - Select delivery option
- `GET /api/orders/{orderNumber}/status` - Get order status
- `GET /api/tracking/{orderNumber}` - Get tracking info

### Address Management
- `GET /api/addresses` - Get user addresses
- `POST /api/addresses` - Add new address
- `PUT /api/addresses/{id}` - Update address
- `DELETE /api/addresses/{id}` - Delete address
- `PATCH /api/addresses/{id}/default` - Set default address
- `POST /api/addresses/validate` - Validate address
- `GET /api/addresses/search` - Search addresses
- `GET /api/addresses/suggestions` - Get address suggestions

### Mock Payment (Frontend Interaction Only)
- `GET /api/payments/methods` - Get mock payment methods
- `POST /api/payments/process` - Process mock payment (no real transaction)

### Support
- `POST /api/support/tickets` - Submit support ticket
- `GET /api/support/faq` - Get FAQ

## Configuration

### Database Configuration
Update `src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/delivery_app
    username: gloriaupup  # or your system username
    password:             # empty for local development
```

### JWT Configuration
Set environment variables or update `application.yml`:

```yaml
jwt:
  secret: your_jwt_secret_key
  expiration: 86400000  # 24 hours
```

## Getting Started

### Prerequisites
- Java 21 or higher
- Gradle 8.5+ (included via wrapper)
- PostgreSQL 12.0+

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd DeliveryAppBackend
```

2. **Install and setup PostgreSQL**
```bash
# Install PostgreSQL
brew install postgresql@14

# Start PostgreSQL service
brew services start postgresql@14

# Create database
/opt/homebrew/opt/postgresql@14/bin/psql -U $(whoami) -d postgres -c "CREATE DATABASE delivery_app;"
```

3. **Configure database connection**
Update the database configuration in `application.yml`

4. **Build and run**
```bash
./gradlew build
./gradlew bootRun
```

The application will start on `http://localhost:8086`

### Testing the API

You can test the API using tools like Postman or curl:

```bash
# Register a new user
curl -X POST http://localhost:8086/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "phone": "+1234567890"
  }'

# Create an order
curl -X POST http://localhost:8086/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "pickupInfo": {
      "address": "123 Pickup Street",
      "contactName": "John Sender",
      "contactPhone": "+1234567890"
    },
    "deliveryInfo": {
      "address": "456 Delivery Avenue", 
      "contactName": "Jane Receiver",
      "contactPhone": "+0987654321"
    },
    "packageInfo": {
      "weight": 2.5,
      "type": "electronics",
      "value": 150.00,
      "description": "iPhone case"
    }
  }'
```

## Database Schema

The application uses the following main entities:

- **Users**: User account information
- **Addresses**: User addresses with location data
- **Orders**: Delivery orders with pickup/delivery details  
- **Payments**: Payment transactions and methods
- **OrderStatusHistory**: Order status change tracking

## Development Notes

### Mock Data
The application includes comprehensive mock data for development and testing:
- Sample users and addresses
- Payment method simulation
- Order status transitions
- Delivery options and pricing

### Security
- Passwords are encrypted using BCrypt
- JWT tokens for stateless authentication
- CORS configuration for frontend integration
- Input validation and error handling

### Future Enhancements
- Real payment gateway integration (Stripe, PayPal)
- Google Maps API integration for address validation
- Real-time order tracking with WebSocket
- Admin dashboard APIs
- Notification service integration
- Comprehensive test coverage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is part of the FlagCamp delivery application system.