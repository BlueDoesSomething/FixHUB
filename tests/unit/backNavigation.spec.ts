import { describe, expect, test } from 'vitest';
import { backDestination } from '@/utils/backNavigation';

describe('in-app back buttons', () => {
  test.each([
    ['/client/request/location', 'client', '/client/request'],
    ['/client/request/review', 'client', '/client/request/location'],
    ['/client/requests/123', 'client', '/client/history'],
    ['/client/messages/chat/123', 'client', '/client/messages'],
    ['/technician/messages/chat/123', 'technician', '/technician/messages'],
    ['/client/care/charging', 'client', '/client/care'],
    ['/technician/active', 'technician', '/technician/requests'],
    ['/admin/unknown', 'admin', '/admin/dashboard'],
  ])('routes %s back to its own workspace', (path, role, expected) => {
    expect(backDestination(path, role)).toBe(expected);
  });
});
