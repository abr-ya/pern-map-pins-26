import { PointVisibility } from '../../src/generated/prisma/enums.js';
import type { Point } from '../../src/generated/prisma/client.js';

/** Minimal `Point` row for tests (Prisma 7 / Postgres). */
export function makePoint(over: Partial<Point> = {}): Point {
  const now = new Date();
  return {
    id: '00000000-0000-4000-8000-000000000001',
    userId: '00000000-0000-4000-8000-000000000002',
    folderId: null,
    groupId: null,
    visibility: PointVisibility.public,
    title: 'Test point',
    description: null,
    photoKey: null,
    latitude: 45.0,
    longitude: -120.0,
    createdAt: now,
    updatedAt: now,
    ...over,
  };
}
