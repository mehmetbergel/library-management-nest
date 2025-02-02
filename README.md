# Library Management API

This project is a Library Management System built with **NestJS**, **TypeORM**, and **PostgreSQL**. It allows you to manage users, books, and book loans through a RESTful API.

## Technologies Used

- **NestJS**: For building scalable server-side applications.
- **TypeORM**: For database operations and migrations.
- **PostgreSQL**: Relational database system.
- **Docker & Docker Compose**: For containerization and environment setup.
- **Jest**: For unit testing.

---

## Prerequisites

Ensure you have the following installed on your machine:

1. **Node.js** (v16.x or later)
2. **Docker** & **Docker Compose**
3. **npm** (comes with Node.js)

---

## Getting Started

Follow the steps below to set up and run the application on your local machine.

### 1. Clone the Repository

```bash
git clone https://github.com/mehmetbergel/library-management.git
cd library-management
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory and add the following content:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=library_db
```

### 3. Start PostgreSQL with Docker Compose

Ensure Docker is running on your machine, then start PostgreSQL:

```bash
docker-compose up -d
```

This will pull the PostgreSQL image, create a container named `postgres_library`, and start the database service.

### 4. Install Dependencies

Install all required Node.js dependencies:

```bash
npm install
```

### 5. Start the Application

Now you can start the NestJS application:

```bash
npm run start
```

The application will run on [http://localhost:3000](http://localhost:3000).

---

## API Endpoints

Here are the key API endpoints available:

### Users

- `GET /users`: List all users.
- `GET /users/:id`: Get detailed information about a user, including borrowed books and ratings.
- `POST /users`: Create a new user.
- `POST /users/:userId/borrow/:bookId`: Borrow a book.
- `POST /users/:userId/return/:bookId`: Return a book with a rating.

### Books

- `GET /books`: List all books.
- `GET /books/:id`: Get book details, including the average rating.
- `POST /books`: Add a new book.

---

## Testing

Run unit tests using Jest:

```bash
npm run test
```

---

## Troubleshooting

### 1. Unable to Connect to PostgreSQL

If you encounter an error like `Unable to connect to the database`, try the following:

- Ensure Docker is running and PostgreSQL container is active:

  ```bash
  docker ps
  ```

- Restart Docker containers:

  ```bash
  docker-compose down
  docker-compose up -d
  ```

### 2. Database Initialization Issues

If you see errors like `Database is uninitialized and superuser password is not specified`, ensure your `.env` file has the correct `POSTGRES_PASSWORD` set.
