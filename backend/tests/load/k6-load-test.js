/**
 * K6 Load Test Script for NJ Stars API
 *
 * Installation: brew install k6 (macOS) or https://k6.io/docs/getting-started/installation/
 *
 * Usage:
 *   # Run against local dev
 *   k6 run k6-load-test.js
 *
 *   # Run against production with 50 virtual users for 30 seconds
 *   k6 run --env BASE_URL=https://api.njstarselite.com -u 50 -d 30s k6-load-test.js
 *
 *   # Run smoke test (quick validation)
 *   k6 run --env SMOKE=true k6-load-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const eventsTrend = new Trend('events_duration');
const productsTrend = new Trend('products_duration');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';
const IS_SMOKE = __ENV.SMOKE === 'true';

// Test scenarios
export const options = IS_SMOKE ? {
  // Smoke test: Quick validation
  vus: 1,
  duration: '10s',
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    errors: ['rate<0.1'],              // Error rate under 10%
  },
} : {
  // Load test: Realistic traffic simulation
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m', target: 25 },    // Ramp up to 25 users
    { duration: '2m', target: 25 },    // Stay at 25 users
    { duration: '30s', target: 50 },   // Spike to 50 users
    { duration: '1m', target: 50 },    // Stay at 50 users
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests under 1s
    http_req_failed: ['rate<0.05'],    // Less than 5% failed requests
    errors: ['rate<0.05'],
  },
};

// Test data
const testEmail = `loadtest_${Date.now()}@example.com`;

export default function() {
  // ============================================
  // PUBLIC ENDPOINTS (No auth required)
  // ============================================

  group('Public API Endpoints', function() {

    // Events listing - Critical for event calendar page
    group('Events API', function() {
      const eventsStart = Date.now();
      const eventsRes = http.get(`${BASE_URL}/api/events/`);
      eventsTrend.add(Date.now() - eventsStart);

      const eventsOk = check(eventsRes, {
        'events: status 200': (r) => r.status === 200,
        'events: has results': (r) => {
          try {
            const body = JSON.parse(r.body);
            return Array.isArray(body.results) || Array.isArray(body);
          } catch {
            return false;
          }
        },
        'events: response time < 500ms': (r) => r.timings.duration < 500,
      });
      errorRate.add(!eventsOk);
    });

    // Products listing - Critical for shop page
    group('Products API', function() {
      const productsStart = Date.now();
      const productsRes = http.get(`${BASE_URL}/api/payments/products/`);
      productsTrend.add(Date.now() - productsStart);

      const productsOk = check(productsRes, {
        'products: status 200': (r) => r.status === 200,
        'products: has results': (r) => {
          try {
            const body = JSON.parse(r.body);
            return Array.isArray(body.results) || Array.isArray(body);
          } catch {
            return false;
          }
        },
        'products: response time < 500ms': (r) => r.timings.duration < 500,
      });
      errorRate.add(!productsOk);
    });

    // Coaches listing - For about/coaches page
    group('Coaches API', function() {
      const coachesRes = http.get(`${BASE_URL}/api/coaches/`);

      const coachesOk = check(coachesRes, {
        'coaches: status 200': (r) => r.status === 200,
        'coaches: response time < 500ms': (r) => r.timings.duration < 500,
      });
      errorRate.add(!coachesOk);
    });

    // Instagram/News feed - For news page
    group('Instagram API', function() {
      const igRes = http.get(`${BASE_URL}/api/instagram/`);

      // Instagram might return 200 with empty data if not configured
      const igOk = check(igRes, {
        'instagram: status 200 or 404': (r) => r.status === 200 || r.status === 404,
        'instagram: response time < 1000ms': (r) => r.timings.duration < 1000,
      });
      errorRate.add(!igOk);
    });

  });

  // ============================================
  // NEWSLETTER SIGNUP (POST endpoint)
  // ============================================

  group('Newsletter Signup', function() {
    const payload = JSON.stringify({
      email: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@example.com`,
      source: 'load_test',
    });

    const params = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const res = http.post(`${BASE_URL}/api/newsletter/subscribe/`, payload, params);

    // Could be 201 (created) or 400 (already exists) - both are valid responses
    const newsletterOk = check(res, {
      'newsletter: valid response': (r) => r.status === 201 || r.status === 400,
      'newsletter: response time < 500ms': (r) => r.timings.duration < 500,
    });
    errorRate.add(!newsletterOk);
  });

  // ============================================
  // WAGTAIL CMS ENDPOINTS
  // ============================================

  group('Wagtail CMS API', function() {
    // Homepage content
    const homeRes = http.get(`${BASE_URL}/api/v2/pages/?type=cms.HomePage&fields=*`);
    check(homeRes, {
      'cms home: status 200': (r) => r.status === 200,
      'cms home: response time < 1000ms': (r) => r.timings.duration < 1000,
    });

    // Blog posts
    const blogRes = http.get(`${BASE_URL}/api/v2/pages/?type=cms.BlogPage&fields=*`);
    check(blogRes, {
      'cms blog: status 200': (r) => r.status === 200,
      'cms blog: response time < 1000ms': (r) => r.timings.duration < 1000,
    });
  });

  // Simulate user think time between requests
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}

// Summary output
export function handleSummary(data) {
  console.log('\n=== Load Test Summary ===');
  console.log(`Total requests: ${data.metrics.http_reqs.values.count}`);
  console.log(`Failed requests: ${data.metrics.http_req_failed.values.rate * 100}%`);
  console.log(`Avg response time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms`);
  console.log(`95th percentile: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms`);

  return {
    'stdout': textSummary(data, { indent: '  ', enableColors: true }),
  };
}

// Import for summary
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
