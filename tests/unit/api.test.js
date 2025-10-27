/**
 * Unit Tests for API Routes
 */

const request = require('supertest');
const app = require('../../app');

describe('API Routes', () => {
  describe('GET /api/search', () => {
    test('should return empty results for empty query', async () => {
      const response = await request(app)
        .get('/api/search?q=')
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    test('should return search results for valid query', async () => {
      const response = await request(app)
        .get('/api/search?q=dog')
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    test('should handle special characters in search', async () => {
      const response = await request(app)
        .get('/api/search?q=test%20search')
        .expect(200);

      expect(response.body).toHaveProperty('results');
    });
  });

  describe('GET /home', () => {
    test('should return homepage', async () => {
      const response = await request(app)
        .get('/home')
        .expect(200);

      expect(response.text).toContain('Rock');
    });
  });

  describe('GET /shop/dogfoods', () => {
    test('should return dog foods page', async () => {
      const response = await request(app)
        .get('/shop/dogfoods')
        .expect(200);

      expect(response.text).toContain('DOG FOOD');
    });
  });

  describe('GET /shop/supply', () => {
    test('should return supplies page', async () => {
      const response = await request(app)
        .get('/shop/supply')
        .expect(200);

      expect(response.text).toBeDefined();
    });
  });

  describe('GET /login', () => {
    test('should return login page', async () => {
      const response = await request(app)
        .get('/login')
        .expect(200);

      expect(response.text).toContain('login');
    });
  });

  describe('GET /cart (unauthenticated)', () => {
    test('should redirect to login', async () => {
      const response = await request(app)
        .get('/cart')
        .expect(302);

      expect(response.headers.location).toContain('/login');
    });
  });

  describe('GET /checkout (unauthenticated)', () => {
    test('should redirect to login', async () => {
      const response = await request(app)
        .get('/checkout')
        .expect(302);

      expect(response.headers.location).toContain('/login');
    });
  });

  describe('Security Headers', () => {
    test('should have X-Content-Type-Options header', async () => {
      const response = await request(app)
        .get('/home');

      expect(response.headers['x-content-type-options']).toBeDefined();
    });

    test('should have X-Frame-Options header', async () => {
      const response = await request(app)
        .get('/home');

      expect(response.headers['x-frame-options']).toBeDefined();
    });

    test('should have Cache-Control for authenticated pages', async () => {
      const response = await request(app)
        .get('/home');

      expect(response.headers['cache-control']).toContain('no-store');
    });
  });

  describe('404 Handling', () => {
    test('should return 404 for non-existent routes', async () => {
      await request(app)
        .get('/nonexistent-page')
        .expect(404);
    });
  });
});
