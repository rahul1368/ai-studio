import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { prisma } from '@repo/database';

describe('Auth E2E', () => {
  let app: INestApplication;
  const email = `e2e_${Date.now()}@example.com`;
  const password = 'Password123!';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true })
    );
    await app.init();
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  it('registers a user', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password, name: 'E2E' })
      .expect(201);

    expect(res.body?.user?.email).toBe(email);
    expect(typeof res.body?.token).toBe('string');
  });

  it('logs in the user', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    expect(typeof res.body?.token).toBe('string');
  });

  it('returns profile with /auth/me', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    const token = login.body.token as string;
    const me = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(me.body?.user?.email).toBe(email);
  });
});


