# Rental Management System API Documentation

## Overview
This is a comprehensive rental management system API that supports product management, quotations, orders, invoicing, payments, and notifications.

## Base URL
```
http://localhost:3000/api
```

## Authentication
Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Roles
- **Customer**: End users who rent products
- **Admin**: System administrators who manage products and track items

## API Endpoints

### 1. Authentication (`/api/auth`)

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "customer@example.com",
  "password": "Password123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "1234567890"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@rental.com",
  "password": "Admin123!"
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

### 2. Products (`/api/products`)

#### Get All Products
```http
GET /api/products
```

#### Get Product by ID
```http
GET /api/products/:id
```

#### Create Product (Admin only)
```http
POST /api/products
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Professional Camera",
  "description": "High-end DSLR camera for photography",
  "category_id": 1,
  "sku_code": "CAM-001",
  "base_price": 500.00,
  "available_quantity": 10,
  "is_rentable": true
}
```

#### Update Product (Admin only)
```http
PUT /api/products/:id
Authorization: Bearer <admin-token>
```

#### Delete Product (Admin only)
```http
DELETE /api/products/:id
Authorization: Bearer <admin-token>
```

### 3. Categories (`/api/categories`)

#### Get All Categories
```http
GET /api/categories
```

#### Create Category (Admin only)
```http
POST /api/categories
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "category_name": "Photography Equipment",
  "description": "Cameras, lenses, and photography accessories"
}
```

### 4. Quotations (`/api/quotations`)

#### Create Quotation
```http
POST /api/quotations
Authorization: Bearer <token>
Content-Type: application/json

{
  "customer_id": 1,
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "rental_start_date": "2024-01-15",
      "rental_end_date": "2024-01-20",
      "unit_id": 2
    }
  ]
}
```

#### Get User's Quotations
```http
GET /api/quotations
Authorization: Bearer <token>
```

#### Approve Quotation
```http
POST /api/quotations/:id/approve
Authorization: Bearer <token>
```

### 5. Orders (`/api/orders`)

#### Get User's Orders
```http
GET /api/orders
Authorization: Bearer <token>
```

#### Get Order by ID
```http
GET /api/orders/:id
Authorization: Bearer <token>
```

#### Confirm Order
```http
POST /api/orders/:id/confirm
Authorization: Bearer <token>
```

### 6. Invoices (`/api/invoices`)

#### Get User's Invoices
```http
GET /api/invoices
Authorization: Bearer <token>
```

#### Create Invoice from Order
```http
POST /api/invoices
Authorization: Bearer <token>
Content-Type: application/json

{
  "order_id": 1,
  "invoice_type": "full"
}
```

### 7. Payments (`/api/payments`)

#### Get Payment History
```http
GET /api/payments
Authorization: Bearer <token>
```

#### Record Payment
```http
POST /api/payments
Authorization: Bearer <token>
Content-Type: application/json

{
  "invoice_id": 1,
  "payment_amount": 500.00,
  "method": "razorpay",
  "transaction_id": "pay_xyz123"
}
```

### 8. Payment Gateway (`/api/payment-gateway`)

#### Get Available Payment Methods
```http
GET /api/payment-gateway/methods
```

#### Create Razorpay Order
```http
POST /api/payment-gateway/razorpay/create-order
Authorization: Bearer <token>
Content-Type: application/json

{
  "invoice_id": 1,
  "amount": 500.00,
  "currency": "INR"
}
```

#### Verify Razorpay Payment
```http
POST /api/payment-gateway/razorpay/verify-payment
Authorization: Bearer <token>
Content-Type: application/json

{
  "razorpay_order_id": "order_xyz",
  "razorpay_payment_id": "pay_xyz",
  "razorpay_signature": "signature_xyz",
  "invoice_id": 1
}
```

### 9. Pickups (`/api/pickups`)

#### Schedule Pickup
```http
POST /api/pickups
Authorization: Bearer <token>
Content-Type: application/json

{
  "order_id": 1,
  "pickup_date": "2024-01-15T10:00:00Z",
  "pickup_address": "123 Main St, City, State"
}
```

#### Get Pickup Schedule
```http
GET /api/pickups
Authorization: Bearer <token>
```

### 10. Returns (`/api/returns`)

#### Schedule Return
```http
POST /api/returns
Authorization: Bearer <token>
Content-Type: application/json

{
  "order_id": 1,
  "return_date": "2024-01-20T10:00:00Z",
  "return_address": "123 Main St, City, State"
}
```

#### Process Return
```http
POST /api/returns/:id/process
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "condition": "good",
  "notes": "All items returned in good condition"
}
```

### 11. Notifications (`/api/notifications`)

#### Get User Notifications
```http
GET /api/notifications
Authorization: Bearer <token>
```

#### Mark Notification as Read
```http
PUT /api/notifications/:id/read
Authorization: Bearer <token>
```

### 12. Reports (`/api/reports`)

#### Get Rental Revenue Report
```http
GET /api/reports/revenue?start_date=2024-01-01&end_date=2024-01-31
Authorization: Bearer <admin-token>
```

#### Get Most Rented Products
```http
GET /api/reports/popular-products?limit=10
Authorization: Bearer <admin-token>
```

#### Get Top Customers
```http
GET /api/reports/top-customers?limit=10
Authorization: Bearer <admin-token>
```

### 13. Availability (`/api/availability`)

#### Check Product Availability
```http
GET /api/availability/product/:id?start_date=2024-01-15&end_date=2024-01-20
```

#### Get Availability Calendar
```http
GET /api/availability/calendar/:product_id?month=2024-01
```

### 14. Contracts (`/api/contracts`)

#### Generate Contract
```http
POST /api/contracts
Authorization: Bearer <token>
Content-Type: application/json

{
  "order_id": 1,
  "terms": "Standard rental terms and conditions"
}
```

#### Get Contract
```http
GET /api/contracts/:id
Authorization: Bearer <token>
```

### 15. Health Check (`/api`)

#### API Health Check
```http
GET /api/health
```

#### System Status
```http
GET /api/status
```

#### API Information
```http
GET /api/info
```

## Default Login Credentials

### Admin Account
- **Email**: admin@rental.com
- **Password**: Admin123!
- **Role**: admin

### Customer Account
- **Email**: customer@example.com
- **Password**: User123!
- **Role**: customer

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## Success Responses

All endpoints return consistent success responses:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- 100 requests per 15 minutes per IP address
- Authentication endpoints: 5 requests per 15 minutes per IP

## File Uploads

File uploads are supported for product images:
- Maximum file size: 10MB
- Supported formats: JPG, PNG, GIF
- Upload path: `/uploads/`

## Webhooks

The system supports webhooks for payment gateways:
- Razorpay: `/api/payment-gateway/razorpay/webhook`
- Stripe: `/api/payment-gateway/stripe/webhook`

## Environment Variables

Key environment variables for configuration:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=rental_db

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Payment Gateways
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

## Testing

Run the API test suite:
```bash
npm test
# or
node test-api.js
```

## Support

For support and questions, please refer to the project documentation or contact the development team.