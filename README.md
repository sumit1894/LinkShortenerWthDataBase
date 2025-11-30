I built a full-stack URL Shortener with advanced authentication features.
The project uses Express 5 with a clean MVC architecture, Drizzle ORM for type-safe SQL, and MySQL as the database.
Users can register, login, verify email, reset password, and also sign in with Google or GitHub using OAuth 2.0 handled by Arctic.

Short URLs are generated with unique short codes and stored in the database with timestamps. Each user can manage their own links from the dashboard.

Authentication is hybrid — I use express-session to maintain user sessions and JWT tokens stored as HttpOnly cookies.

I also implemented Multer for avatar uploads, MJML email templates for email verification and password reset, and Zod for validating all input data.

Security-wise, passwords are hashed using bcrypt, cookies are HttpOnly and secure, CSRF attacks are prevented using OAuth state verification, and reset-password tokens are hashed before storage.

The project helped me learn real-world backend skills including authentication, ORM, security, sessions, cookies, and clean architecture.