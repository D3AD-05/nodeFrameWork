post

# User API Documentation

**Base URL:**

```
/api/v1/users
```

---

## Public Endpoints

### Register User

- **POST** `/register`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }
  ```
- **Response:** 201 Created, user object (without password)

### Login

- **POST** `/login`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response:** 200 OK, user object and JWT token

---

## Protected Endpoints (Require `Authorization: Bearer <token>`)

### Get Profile

- **GET** `/profile`
- **Response:** 200 OK, user object

### Update Profile

- **PUT** `/profile`
- **Body:** (any of the fields)
  ```json
  {
    "email": "new@example.com",
    "firstName": "Jane",
    "lastName": "Smith"
  }
  ```
- **Response:** 200 OK, updated user object

### Change Password

- **PUT** `/change-password`
- **Body:**
  ```json
  {
    "currentPassword": "oldpassword",
    "newPassword": "newpassword123"
  }
  ```
- **Response:** 200 OK, success message

---

## Admin Endpoints (Require admin role)

### Get All Users

- **GET** `/`
- **Query Params:** `page`, `limit`, `search`, `role`, `isActive`
- **Response:** 200 OK, list of users with pagination

### Get User by ID

- **GET** `/:id`
- **Response:** 200 OK, user object

### Update User

- **PUT** `/:id`
- **Body:** (any updatable user fields)
- **Response:** 200 OK, updated user object

### Delete User

- **DELETE** `/:id`
- **Response:** 200 OK, success message

---

**Notes:**

- All protected and admin endpoints require a valid JWT token in the `Authorization` header.
- Admin endpoints require the user to have the `admin` role.
- Input validation is enforced on all endpoints.
- Responses are wrapped in a standard format with a message and data.
