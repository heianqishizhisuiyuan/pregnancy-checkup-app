import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../app.js';

const ownerPayload = {
  username: 'owner1',
  email: 'owner@test.com',
  password: 'pass123',
  nickname: '准妈妈',
  lastPeriod: '2026-01-01',
};

const recordPayload = {
  checkupDate: '2026-03-15',
  gestationalWeek: 10,
  gestationalDay: 2,
  hospital: '市妇婴医院',
  doctor: '张医生',
  notes: '一切正常',
};

describe('API integration', () => {
  let mongoServer;
  let ownerToken;
  let inviteCode;
  let recordId;
  let familyToken;
  let familyUserId;

  before(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'integration-test-secret';
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  after(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  it('registers owner and creates family', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(ownerPayload)
      .expect(201);

    assert.equal(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.user.role, 'owner');
    ownerToken = res.body.data.token;
  });

  it('returns current user profile', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    assert.equal(res.body.data.email, ownerPayload.email);
  });

  it('creates a checkup record', async () => {
    const res = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(recordPayload)
      .expect(201);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.hospital, recordPayload.hospital);
    recordId = res.body.data._id;
  });

  it('lists records with hospital filter', async () => {
    const res = await request(app)
      .get('/api/records')
      .query({ hospital: '妇婴' })
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    assert.equal(res.body.success, true);
    assert.ok(res.body.data.length >= 1);
    assert.ok(res.body.data.every((r) => r.hospital.includes('妇婴')));
  });

  it('supports paginated record list', async () => {
    const res = await request(app)
      .get('/api/records')
      .query({ page: 1, limit: 10 })
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    assert.equal(res.body.success, true);
    assert.equal(res.body.pagination.page, 1);
    assert.equal(res.body.pagination.limit, 10);
    assert.ok(res.body.pagination.total >= 1);
  });

  it('exposes family invite code for owner', async () => {
    const res = await request(app)
      .get('/api/family/invite')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    assert.equal(res.body.success, true);
    assert.ok(res.body.data.inviteCode);
    inviteCode = res.body.data.inviteCode;
  });

  it('registers family member via invite code', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'family1',
        email: 'family@test.com',
        password: 'pass123',
        inviteCode,
      })
      .expect(201);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.role, 'family');
    familyToken = res.body.data.token;
    familyUserId = res.body.data.user._id;
  });

  it('blocks family member from creating records', async () => {
    const res = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${familyToken}`)
      .send(recordPayload)
      .expect(403);

    assert.equal(res.body.error.code, 'FORBIDDEN');
  });

  it('allows owner to grant edit permission to family member', async () => {
    const res = await request(app)
      .put(`/api/family/members/${familyUserId}/permissions`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ canEdit: true })
      .expect(200);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.canEdit, true);
  });

  it('blocks family member from changing permissions', async () => {
    const res = await request(app)
      .put(`/api/family/members/${familyUserId}/permissions`)
      .set('Authorization', `Bearer ${familyToken}`)
      .send({ canEdit: false })
      .expect(403);

    assert.equal(res.body.error.code, 'FORBIDDEN');
  });

  it('allows family member with canEdit to create records after re-login', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'family@test.com', password: 'pass123' })
      .expect(200);

    familyToken = loginRes.body.data.token;
    assert.equal(loginRes.body.data.user.canEdit, true);

    const res = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${familyToken}`)
      .send({ ...recordPayload, hospital: '家人录入医院' })
      .expect(201);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.hospital, '家人录入医院');
  });

  it('allows family member with canEdit to update family info', async () => {
    const res = await request(app)
      .put('/api/family')
      .set('Authorization', `Bearer ${familyToken}`)
      .send({ name: '我们的家庭' })
      .expect(200);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.name, '我们的家庭');
  });

  it('blocks family member from viewing invite code', async () => {
    const res = await request(app)
      .get('/api/family/invite')
      .set('Authorization', `Bearer ${familyToken}`)
      .expect(403);

    assert.equal(res.body.error.code, 'FORBIDDEN');
  });

  it('allows family member to read records', async () => {
    const res = await request(app)
      .get(`/api/records/${recordId}`)
      .set('Authorization', `Bearer ${familyToken}`)
      .expect(200);

    assert.equal(res.body.data._id, recordId);
  });

  it('allows owner to remove family member', async () => {
    const res = await request(app)
      .delete(`/api/family/members/${familyUserId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    assert.equal(res.body.success, true);

    await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${familyToken}`)
      .expect(401);
  });

  it('updates and deletes record as owner', async () => {
    await request(app)
      .put(`/api/records/${recordId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ notes: '复查正常' })
      .expect(200);

    const updated = await request(app)
      .get(`/api/records/${recordId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    assert.equal(updated.body.data.notes, '复查正常');

    await request(app)
      .delete(`/api/records/${recordId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    await request(app)
      .get(`/api/records/${recordId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(404);
  });
});
