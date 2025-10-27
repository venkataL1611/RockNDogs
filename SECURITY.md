# Security Implementation

## Overview
This document outlines the security measures implemented in the RockNDogs e-commerce application.

## Implemented Security Features

### 1. Authentication & Authorization
- ✅ **Session-based authentication** using Passport.js
- ✅ **Protected routes** - Cart and checkout require login
- ✅ **Password hashing** using bcrypt
- ✅ **Session security** with httpOnly, sameSite, and secure cookies

### 2. HTTP Security Headers (Helmet.js)
- ✅ **X-Frame-Options** - Prevents clickjacking attacks
- ✅ **X-Content-Type-Options** - Prevents MIME-sniffing
- ✅ **X-XSS-Protection** - Enables browser XSS protection
- ✅ **Content-Security-Policy** - Restricts resource loading
- ✅ **Strict-Transport-Security (HSTS)** - Forces HTTPS (in production)
- ✅ **Upgrade Insecure Requests** - Automatically upgrades HTTP to HTTPS

### 3. MITM (Man-in-the-Middle) Attack Protection
- ✅ **HSTS Headers** - max-age: 1 year, includeSubDomains, preload
- ✅ **Secure cookies** - Only transmitted over HTTPS in production
- ✅ **Subresource Integrity (SRI)** - Integrity checks on CDN resources
- ✅ **Trust proxy configuration** - Proper HTTPS detection behind proxies
- ⚠️ **Environment-based session secrets** - Must set SESSION_SECRET in production
- ⚠️ **HTTPS required in production** - See deployment guide below

### 4. Rate Limiting
- ✅ **Login rate limiting** - Max 5 attempts per 15 minutes per IP
- ✅ **API rate limiting** - Max 100 requests per 15 minutes per IP
- ✅ **Prevents brute force attacks** and DoS attempts

### 4. Input Validation & Sanitization
- ✅ **Email validation** - Ensures valid email format
- ✅ **Password validation** - Minimum 6 characters required
- ✅ **MongoDB sanitization** - Prevents NoSQL injection attacks
- ✅ **Express-validator** - Validates all form inputs

### 5. NoSQL Injection Prevention
- ✅ **express-mongo-sanitize** - Removes MongoDB operators from user input
- ✅ **Parameterized queries** - All MongoDB queries use proper models
- ✅ **Input validation** - All inputs are validated before database operations

### 6. Session Security
```javascript
{
  httpOnly: true,        // Prevents XSS by making cookies inaccessible to JavaScript
  secure: production,    // Only send over HTTPS in production
  sameSite: 'strict',    // Prevents CSRF attacks
  maxAge: 24hrs         // Session expires after 24 hours
}
```

## Security Best Practices

### For Development
- Never commit `.env` files with secrets
- Use different secrets for development and production
- Test rate limiting in development
- Keep dependencies updated: `npm audit fix`

### For Production Deployment
1. **Set NODE_ENV=production**
   ```bash
   export NODE_ENV=production
   ```

2. **Generate and use strong session secret**
   ```bash
   # Generate a secure random secret
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   
   # Set it in .env file
   SESSION_SECRET=your_generated_secret_here
   ```

3. **Enable HTTPS (CRITICAL for MITM Protection)**
   
   **Option A: Using nginx as reverse proxy**
   ```nginx
   server {
       listen 443 ssl http2;
       server_name yourdomain.com;
       
       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;
       
       # Strong SSL configuration
       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_ciphers HIGH:!aNULL:!MD5;
       ssl_prefer_server_ciphers on;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header Host $host;
       }
   }
   
   # Redirect HTTP to HTTPS
   server {
       listen 80;
       server_name yourdomain.com;
       return 301 https://$server_name$request_uri;
   }
   ```
   
   **Option B: Using Let's Encrypt (Free SSL)**
   ```bash
   # Install certbot
   sudo apt-get install certbot
   
   # Get certificate
   sudo certbot certonly --standalone -d yourdomain.com
   ```
   
   **Option C: Node.js with HTTPS module**
   ```javascript
   // In bin/www or server file
   const https = require('https');
   const fs = require('fs');
   
   const options = {
     key: fs.readFileSync('path/to/private-key.pem'),
     cert: fs.readFileSync('path/to/certificate.pem')
   };
   
   https.createServer(options, app).listen(443);
   ```

4. **Use MongoDB with authentication**
   ```javascript
   mongodb://username:password@host:port/database
   ```

5. **Use environment variables**
   ```bash
   SESSION_SECRET=your-secret-key
   MONGODB_URI=your-mongodb-connection-string
   NODE_ENV=production
   ```

6. **Set up monitoring**
   - Monitor failed login attempts
   - Track rate limit violations
   - Log security events

## Additional Recommendations

### Not Yet Implemented (Consider for Production)

1. **CSRF Protection**
   - Use `csrf-csrf` package (modern alternative to deprecated csurf)
   - Add CSRF tokens to all forms

2. **Two-Factor Authentication (2FA)**
   - Use `speakeasy` or `otplib` for TOTP
   - Implement backup codes

3. **Email Verification**
   - Verify email addresses on signup
   - Use `nodemailer` for sending verification emails

4. **Password Reset**
   - Implement secure password reset flow
   - Use time-limited, single-use tokens

5. **Account Lockout**
   - Lock accounts after multiple failed attempts
   - Implement unlock mechanism

6. **Audit Logging**
   - Log all authentication events
   - Track order changes and payment attempts
   - Use `winston` or similar for structured logging

7. **Database Encryption**
   - Encrypt sensitive data at rest
   - Use MongoDB encryption features

8. **Payment Security (When using real payments)**
   - Never store credit card numbers
   - Use PCI-compliant payment processors (Stripe, PayPal)
   - Implement 3D Secure verification

9. **API Security**
   - Implement API keys for external access
   - Use OAuth2 for third-party integrations
   - Add request signing for sensitive operations

10. **Regular Security Audits**
    ```bash
    npm audit
    npm audit fix
    ```

## Security Checklist

- [x] Passwords are hashed (bcrypt)
- [x] Sessions are secured (httpOnly, sameSite, secure)
- [x] Rate limiting on login endpoints
- [x] Input validation on all forms
- [x] NoSQL injection prevention
- [x] Security headers configured (Helmet)
- [x] Authentication required for sensitive operations
- [ ] CSRF protection
- [ ] Email verification
- [ ] Password reset functionality
- [ ] Two-factor authentication
- [ ] Audit logging
- [ ] Automated security testing

## Reporting Security Issues

If you discover a security vulnerability, please email: security@rockndogs.com

**Do not** create public GitHub issues for security vulnerabilities.

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)
