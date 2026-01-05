import { recentFirstSort } from '../../../utils/recentFirstSort.js';
import {
  samplePlacesData,
  samplePlacesduplicateElement,
  samplePlacesSingleElement,
  samplePlacesSortedData,
} from './mockData.js';
import { generateUniqueUsername } from '../../../utils/usernameGenerator.js';
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../../../config/db/conn.js', () => ({
  default: {
    query: vi.fn(),
  },
}));
import db from '../../../config/db/conn.js';

describe('recentFirstSort()', () => {
  // functional
  it('should be sorted', () => {
    const sorted = recentFirstSort(samplePlacesData);
    const sortedIds = sorted.map((p) => p.id);
    expect(sortedIds).toEqual([5, 4, 3, 2, 1]);
  });

  // Edge cases --empty , --single element --duplicate element , -already sorted
  it('should be empty', () => {
    expect(recentFirstSort([])).toEqual([]);
  });

  it('should be same for single element array', () => {
    expect(recentFirstSort(samplePlacesSingleElement)).toEqual(
      samplePlacesSingleElement
    );
  });

  it('should be sorted for duplicate element array', () => {
    const sorted = recentFirstSort(samplePlacesduplicateElement);
    const sortedIds = sorted.map((p) => p.id);
    expect(sortedIds).toEqual([4, 4]);
  });

  it('should be same for sorted data', () => {
    const sorted = recentFirstSort(samplePlacesSortedData);
    const sortedIds = sorted.map((p) => p.id);
    expect(sortedIds).toEqual([5, 4, 3, 2, 1]);
  });
});

describe('usernameGenerator() <MockTest>', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('return base username if not taken', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ exists: false }] });

    const username = await generateUniqueUsername('John Doe');
    expect(username).toBe('johndoe');
  });

  it('appends count if username exists once', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ exists: true }] }) // johndoe exists
      .mockResolvedValueOnce({ rows: [{ exists: false }] }); // johndoe1 free

    const username = await generateUniqueUsername('John Doe');
    expect(username).toBe('johndoe1');
  });

  it('handles multiple collisions', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ exists: true }] })
      .mockResolvedValueOnce({ rows: [{ exists: true }] })
      .mockResolvedValueOnce({ rows: [{ exists: false }] });

    const username = await generateUniqueUsername('John Doe');
    expect(username).toBe('johndoe2');
  });

  it('removes spaces and lowercases input', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ exists: false }] });

    const username = await generateUniqueUsername(' Alice Wonderland  ');
    expect(username).toBe('alicewonderland');
  });
});
