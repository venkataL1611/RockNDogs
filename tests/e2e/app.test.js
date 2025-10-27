/**
 * End-to-End Tests for RockNDogs E-commerce Application
 * Tests authentication, product browsing, cart, and checkout functionality
 */

const puppeteer = require('puppeteer');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const TEST_USER = {
  email: 'test@rockndogs.com',
  password: 'testpass123',
  name: 'Test User'
};

let browser;
let page;

describe('RockNDogs E-Commerce E2E Tests', () => {
  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  describe('Homepage', () => {
    test('should load homepage successfully', async () => {
      const response = await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
      expect(response.status()).toBe(200);

      const title = await page.title();
      expect(title).toContain('Rock');

      // Check for main heading
      const heading = await page.$eval('h1', (el) => el.textContent);
      expect(heading).toContain('Rock');
    });

    test('should display navigation menu', async () => {
      await page.goto(BASE_URL, { waitUntil: 'networkidle2' });

      // Check for navigation elements
      const nav = await page.$('nav.navbar');
      expect(nav).toBeTruthy();

      // Check for Categories dropdown
      const categoriesBtn = await page.$('button#dropdownMenuButton');
      expect(categoriesBtn).toBeTruthy();
    });

    test('should display home page icons', async () => {
      await page.goto(`${BASE_URL}/home`, { waitUntil: 'networkidle2' });

      // Check for Font Awesome icons
      const icons = await page.$$('i.fas');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Authentication', () => {
    test('should navigate to login page', async () => {
      await page.goto(BASE_URL, { waitUntil: 'networkidle2' });

      await page.click('a[href="/login"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });

      const url = page.url();
      expect(url).toContain('/login');
    });

    test('should show validation error for invalid login', async () => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });

      await page.type('input[name="email"]', 'invalid@test.com');
      await page.type('input[name="password"]', 'wrongpass');
      await page.click('button[type="submit"]');

      await page.waitForTimeout(1000);

      // Should still be on login page or show error
      const url = page.url();
      expect(url).toContain('/login');
    });

    test('should navigate to signup page', async () => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });

      const signupLink = await page.$('a[href="/signup"]');
      if (signupLink) {
        await signupLink.click();
        await page.waitForNavigation({ waitUntil: 'networkidle2' });

        const url = page.url();
        expect(url).toContain('/signup');
      }
    });
  });

  describe('Product Browsing', () => {
    test('should display dog food products', async () => {
      await page.goto(`${BASE_URL}/shop/dogfoods`, { waitUntil: 'networkidle2' });

      // Check for products
      const products = await page.$$('.img-thumbnail');
      expect(products.length).toBeGreaterThan(0);
    });

    test('should display supplies', async () => {
      await page.goto(`${BASE_URL}/shop/supply`, { waitUntil: 'networkidle2' });

      // Check for products
      const products = await page.$$('.img-thumbnail');
      expect(products.length).toBeGreaterThan(0);
    });

    test('should open product detail page', async () => {
      await page.goto(`${BASE_URL}/shop/dogfoods`, { waitUntil: 'networkidle2' });

      const productLinks = await page.$$('a[href^="/product/dogfood/"]');
      if (productLinks.length > 0) {
        await productLinks[0].click();
        await page.waitForNavigation({ waitUntil: 'networkidle2' });

        const url = page.url();
        expect(url).toContain('/product/dogfood/');
      }
    });

    test('should show prices on products', async () => {
      await page.goto(`${BASE_URL}/shop/dogfoods`, { waitUntil: 'networkidle2' });

      const prices = await page.$$('.price');
      expect(prices.length).toBeGreaterThan(0);

      const priceText = await page.$eval('.price', (el) => el.textContent);
      expect(priceText).toContain('$');
    });
  });

  describe('Search Functionality', () => {
    test('should perform live search', async () => {
      await page.goto(BASE_URL, { waitUntil: 'networkidle2' });

      const searchInput = await page.$('input[name="q"]');
      expect(searchInput).toBeTruthy();

      await page.type('input[name="q"]', 'Pedigree');
      await page.waitForTimeout(500);

      // Check if search results appear
      const searchBox = await page.$('.live-search-box');
      if (searchBox) {
        const isVisible = await searchBox.isIntersectingViewport();
        expect(isVisible).toBe(true);
      }
    });
  });

  describe('Cart Functionality (Unauthenticated)', () => {
    test('should redirect to login when accessing cart without auth', async () => {
      await page.goto(`${BASE_URL}/cart`, { waitUntil: 'networkidle2' });

      const url = page.url();
      expect(url).toContain('/login');
    });

    test('should show "Login to Buy" button for guest users', async () => {
      await page.goto(`${BASE_URL}/shop/dogfoods`, { waitUntil: 'networkidle2' });

      const loginButtons = await page.$$('a[href="/login"]');
      const hasLoginButton = loginButtons.some(async (btn) => {
        const text = await btn.evaluate((el) => el.textContent);
        return text.includes('Login');
      });

      expect(loginButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Categories Dropdown', () => {
    test('should open categories dropdown', async () => {
      await page.goto(BASE_URL, { waitUntil: 'networkidle2' });

      const dropdown = await page.$('button#dropdownMenuButton');
      await dropdown.click();

      await page.waitForTimeout(300);

      // Check if dropdown menu is visible
      const dropdownMenu = await page.$('.dropdown-menu');
      expect(dropdownMenu).toBeTruthy();
    });

    test('should navigate to dog foods from dropdown', async () => {
      await page.goto(BASE_URL, { waitUntil: 'networkidle2' });

      await page.click('button#dropdownMenuButton');
      await page.waitForTimeout(200);

      await page.click('a[href="/shop/dogfoods"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });

      const url = page.url();
      expect(url).toContain('/shop/dogfoods');
    });
  });

  describe('Security Headers', () => {
    test('should have security headers enabled', async () => {
      const response = await page.goto(BASE_URL, { waitUntil: 'networkidle2' });

      const headers = response.headers();

      // Check for security headers
      expect(headers['x-content-type-options']).toBeDefined();
      expect(headers['x-frame-options']).toBeDefined();
    });
  });

  describe('Responsive Design', () => {
    test('should display properly on mobile', async () => {
      await page.setViewport({ width: 375, height: 667 }); // iPhone SE

      const response = await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
      expect(response.status()).toBe(200);

      const nav = await page.$('nav.navbar');
      expect(nav).toBeTruthy();
    });

    test('should display properly on tablet', async () => {
      await page.setViewport({ width: 768, height: 1024 }); // iPad

      const response = await page.goto(`${BASE_URL}/shop/dogfoods`, { waitUntil: 'networkidle2' });
      expect(response.status()).toBe(200);
    });
  });

  describe('Performance', () => {
    test('should load homepage within acceptable time', async () => {
      const startTime = Date.now();
      await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(5000); // 5 seconds
    });
  });
});
