import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@clerk/nextjs/server', () => ({ currentUser: vi.fn() }));
vi.mock('../../../../lib/subscription-service', () => ({
  subscriptionService: {
    getUserSubscription: vi.fn(),
    hasActiveSubscription: vi.fn(),
    isVipUser: vi.fn(),
    upsertUserSubscription: vi.fn(),
  },
}));

import { currentUser } from '@clerk/nextjs/server';
import { subscriptionService } from '../../../../lib/subscription-service';
import { GET, POST } from './route';

const makeRequest = (url: string, init?: RequestInit) => new NextRequest(new Request(url, init));

describe('subscription/check route', () => {
  beforeEach(() => vi.clearAllMocks());

  it('GET 401 unauthenticated', async () => {
    (currentUser as any).mockResolvedValue(null);
    const res = await GET(makeRequest('http://localhost/api/subscription/check') as any);
    expect(res.status).toBe(401);
  });

  it('GET returns vip/subscription flags', async () => {
    (currentUser as any).mockResolvedValue({ id: 'u1' });
    (subscriptionService.getUserSubscription as any).mockResolvedValue({ id: 's1' });
    (subscriptionService.hasActiveSubscription as any).mockResolvedValue(true);
    (subscriptionService.isVipUser as any).mockResolvedValue(true);
    const res = await GET(makeRequest('http://localhost/api/subscription/check?email=a@b.com') as any);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.hasActiveSubscription).toBe(true);
    expect(body.isVip).toBe(true);
  });

  it('POST requires auth', async () => {
    (currentUser as any).mockResolvedValue(null);
    const res = await POST(makeRequest('http://localhost/api/subscription/check', { method: 'POST', body: JSON.stringify({ email: 'x@y.com' }) }) as any);
    expect(res.status).toBe(401);
  });

  it('POST requires email', async () => {
    (currentUser as any).mockResolvedValue({ id: 'u1' });
    const res = await POST(makeRequest('http://localhost/api/subscription/check', { method: 'POST', body: JSON.stringify({}) }) as any);
    expect(res.status).toBe(400);
  });

  it('POST creates free subscription if missing', async () => {
    (currentUser as any).mockResolvedValue({ id: 'u1' });
    (subscriptionService.getUserSubscription as any).mockResolvedValue(null);
    (subscriptionService.upsertUserSubscription as any).mockResolvedValue({ id: 's2' });
    const res = await POST(makeRequest('http://localhost/api/subscription/check', { method: 'POST', body: JSON.stringify({ email: 'x@y.com' }) }) as any);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.subscription).toEqual({ id: 's2' });
  });
});


