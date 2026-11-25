const request = require('supertest');
const app = require('../src/app');

describe('GET /health', () => {
  test('responde 200 y status ok (user-service)', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
