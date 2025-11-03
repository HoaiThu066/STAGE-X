# StageX Theatre Booking Site (Version 1)

This project provides a complete booking system for **StageX**.  It is built with **plain PHP** (no frameworks), **Bootstrap**, and **MySQL**, following a lightweight **MVC** structure inspired by the provided demos.  As of the current revision the data access layer has been refactored to use **MySQL routines** rather than embedding raw SQL inside the PHP models.  Stored procedures live in `stagex_db.sql` and are imported alongside the schema.  The application supports three roles:

* **Guest** – can browse shows and performances without logging in.
* **Customer** – can create an account (or be auto‑registered on first login), select seats for a performance, review an order summary and complete payment via **VNPay**.  Customers can also view their past bookings.
* **Staff** – logs in via a dedicated role and sees an internal dashboard listing all bookings.  (Further management functionality could be added here, such as editing shows or managing performances.)

In version 2 the authentication flow has been extended to include **one‑time password (OTP) verification**.  When a customer registers or logs in with an unverified account, StageX generates a six‑digit code, emails it using **PHPMailer** and requires the user to enter the code to complete the process.  The OTP expires after ten minutes.  A minimal PHPMailer implementation is bundled under `vendor/PHPMailer/src` to avoid external dependencies; you can replace this with the full library if desired.

### Stored procedures and migrations

The PHP models no longer embed complex SQL queries.  Instead, common queries have been encapsulated into stored procedures defined at the end of `stagex_db.sql`.  Examples include `proc_get_all_shows()`, `proc_get_user_bookings_detailed(in_user_id)`, `proc_get_all_bookings()` and others.  When the models need to retrieve data they now call these routines via `CALL proc_name(...)` using PDO.  This design improves maintainability, centralises the business logic in the database and meets coursework requirements.

When deploying the database you **must** import the complete `stagex_db.sql` file which now contains the table schema **and** all stored procedures.  In phpMyAdmin choose **Import** and select the file.  The `DROP PROCEDURE IF EXISTS` directives ensure procedures are replaced on subsequent imports.  After importing the routines you can inspect them under the **Routines** section in phpMyAdmin.

### Controller refactoring

To better normalise the folder structure, customer‑facing actions are kept in their own controllers (`HomeController`, `ShowController`, `PerformanceController`, `OrderController`, `PaymentController`, `AuthController`, `BookingsController`).  Administrative and staff actions are consolidated in a single **AdminController**.  Only one dashboard is provided for the administrative area: the transaction list located at `app/views/admin/ad_transaction/transactions.php`.  There is no longer a separate `AdController` or `StaffController`; both roles (legacy `staff` and `admin`) are treated as administrators and share the same interface.  Legacy dashboard files (`dashboard.php`, `staff_dashboard.php`, `index.php`) have been removed to avoid confusion.

The public router (`public/index.php`) dispatches administrative requests (e.g. `?pg=admin-index`, `?pg=admin-transactions`, `?pg=admin-category-show`, etc.) to `AdminController`.  Legacy `staff-dashboard` links have been removed; there is only a single dashboard for the administrative area.

## Folder structure

```
stagex_v1/
├── app/              # PHP source code (models, controllers, views)
│   ├── controllers/  # Route logic for each page (Home, Show, Performance, Order, Payment, Auth, Bookings, Ad)
│   ├── models/       # Database models for Shows, Performances, Seats, Categories, Bookings, Users
│   └── views/        # PHP templates (partials and full pages) rendered by controllers
├── config/           # Configuration constants (database credentials, BASE_URL, session start)
├── public/           # Web root; contains index.php front controller and static assets
│   ├── assets/
│   │   ├── css/      # Custom CSS styling
│   │   ├── js/       # Client‑side JS for seat selection, countdown timer and login modal
│   │   └── images/   # Poster images for each show and a QR code placeholder
│   └── index.php     # Entry point that dispatches to appropriate controller based on query string
└── stagex_db.sql  # SQL dump with full schema and sample data (v4 + payments table)
```

## Key changes and features

* **Roles & Authentication** – Users choose either **customer** or **staff** before logging in.  Customers who provide a new email will be registered automatically.  Staff credentials must already exist in the database (a default account is included in the SQL dump).

* **OTP Verification & Email** – After registration and before first login, customers must verify their email address.  The application sends a six‑digit code via PHPMailer using SMTP credentials defined in `config/mail.php`.  You must configure SMTP to send real emails (see below).  Unverified users cannot proceed until they enter the correct code.  Staff accounts created in the SQL dump are already verified.
* **Dynamic Home page** – Lists all plays with a carousel hero and grid of cards.  Each card displays the play title, genres and a poster image.  Clicking **Chi tiết** shows play information and upcoming performances.
* **Seat selection** – The performance page displays a seat map grouped by row, coloured by seat category (A, B, C).  Selecting seats updates the total cost in real time.  Already booked seats are disabled.
* **Order summary** – After choosing seats, the order page summarises the selection with seat labels and prices.  A customer must be logged in to proceed.
* **VNPay Payment** – After reviewing the order summary, customers pay via VNPay.  A five‑minute countdown cancels the booking if time expires and the payment is not completed.  The system computes a signed VNPay URL, redirects the user to the VNPay sandbox and updates the booking and payment status once VNPay returns.
  Only a single **Thanh toán tại cổng VNPay** button is shown; other bank‑specific options have been removed for clarity.
* **Bookings list** – Customers can view their past orders under **Vé của tôi**.  Staff see all bookings in **Quản trị**.
* **Updated styling** – Colours, dark theme and typography are adapted from the provided templates for a modern theatre atmosphere.  Poster images are stored locally under `public/assets/images` and referenced in the database.

## Database

The provided `stagex_db.sql` defines all necessary tables (shows, performances, seats, seat categories, genres, bookings, tickets, users, reviews and **payments**) and seeds them with sample data:

* Six plays with their own descriptions, directors, durations, and poster image paths under `assets/images/`.
* Several scheduled performances for each play with base pricing.
* Seat definitions for three theatres along with categories (A, B, C) and price modifiers.
* One default staff account (`staff@example.com` / password hash for `admin123`).  Customers are created automatically when logging in with a new email.

When deploying locally with XAMPP:

1. Create a database named `stagex_db` in phpMyAdmin.
2. Import the `stagex_db.sql` file using phpMyAdmin.  This file contains the complete schema and seed data (no need to run multiple scripts).

   > **Note**: The SQL file now defines a series of stored procedures used by the PHP models.  When importing the database ensure that your MySQL user has permission to create routines.  If procedures fail to import, check the privileges of your MySQL account.
3. Copy the `stagex_v1/public` folder contents into your web server’s document root (e.g. `htdocs`).
4. Update `config/config.php` to point to your MySQL credentials and adjust `BASE_URL`.
5. Update `config/vnpay.php` with your VNPay test terminal code and secret key.
6. Update `config/mail.php` with the SMTP credentials you want to use for sending OTP emails.  A Gmail SMTP configuration is provided by default.  If you use Gmail, you may need to enable “Less secure app access” or create an application‑specific password.
6. Access the site via `http://localhost/stagex_v1/public/index.php`.

Enjoy exploring StageX!#   S T A G E - X  
 