const request = require('supertest');
const app = require('../src/app');

describe('Payment API Tests', () => {
  test('Health check endpoint', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body.status).toBe('ok');
    expect(response.body.service).toBe('Folding Billing Solution');
  });

  test('Create payment attempt validation', async () => {
    const response = await request(app)
      .post('/api/payments/attempts')
      .send({})
      .expect(500);
    
    expect(response.body.success).toBe(false);
  });

  test('Get payment attempts endpoint', async () => {
    const response = await request(app)
      .get('/api/payments/attempts')
      .expect(500); // Expected since no DB connection in test
    
    expect(response.body.success).toBe(false);
  });
});