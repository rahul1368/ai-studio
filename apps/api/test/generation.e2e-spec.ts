import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { prisma } from '@repo/database';
import fs from 'fs';
import path from 'path';

function createTinyPng(tmpPath: string) {
  const data = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    'base64'
  );
  fs.writeFileSync(tmpPath, data);
}

describe('Generation & Uploads E2E', () => {
  let app: INestApplication;
  const email = `gen_${Date.now()}@example.com`;
  const password = 'Password123!';
  let token = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true })
    );
    await app.init();

    // Register and login to obtain token
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password, name: 'GenE2E' })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);
    token = login.body.token as string;
  });

  afterAll(async () => {
    await prisma.generation.deleteMany({ where: { user: { email } } });
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  it('creates a generation and lists history', async () => {
    const tmp = path.join(__dirname, 'tiny.png');
    createTinyPng(tmp);

    const genRes = await request(app.getHttpServer())
      .post('/generation')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', tmp)
      .field('prompt', 'vintage style')
      .expect(201);

    expect(genRes.body?.generation?.status).toBeDefined();
    expect(typeof genRes.body?.generation?.originalImage).toBe('string');
    expect(typeof genRes.body?.generation?.resultImage).toBe('string');

    const list = await request(app.getHttpServer())
      .get('/generation')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(list.body.generations)).toBe(true);
    expect(list.body.count).toBeGreaterThan(0);
  });

  it('serves files from /uploads/*', async () => {
    const history = await request(app.getHttpServer())
      .get('/generation')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const originalPath: string = history.body.generations[0].originalImage;
    const generatedPath: string = history.body.generations[0].resultImage;

    await request(app.getHttpServer())
      .get(`/${originalPath}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/${generatedPath}`)
      .expect(200);
  });
});


