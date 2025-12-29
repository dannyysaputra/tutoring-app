import * as sessionService from './sessionService';
import {db} from '../config/firebase';
import * as admin from 'firebase-admin';

jest.mock('../config/firebase', () => {
  const mockCollection = {
    where: jest.fn().mockReturnThis(),
    get: jest.fn(),
    add: jest.fn(),
    doc: jest.fn().mockImplementation((id: string) => ({
      path: `mockPath/${id}`,
    })),
  };
  return {
    db: {
      collection: jest.fn().mockReturnValue(mockCollection),
      runTransaction: jest.fn(),
    },
  };
});

jest.mock('firebase-admin', () => ({
  firestore: {
    Timestamp: {
      now: jest.fn(),
      fromMillis: jest.fn((ms) => ({
        toMillis: () => ms,
      })),
    },
    FieldValue: {
      increment: jest.fn(),
    },
  },
}));

describe('sessionService', () => {
  const mockTutorId = 'tutor123';
  const mockStudentIds = ['student1', 'student2'];
  let mockColl: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockColl = (db.collection as jest.Mock)();
  });

  describe('startSession', () => {
    it('should throw if tutor has an active session', async () => {
      mockColl.get.mockResolvedValue({empty: false});

      await expect(sessionService.startSession(mockTutorId, mockStudentIds))
        .rejects.toThrow('Tutor already has an active session');
    });

    it('should create a new session if no active session exists', async () => {
      mockColl.get.mockResolvedValue({empty: true});
      mockColl.add.mockResolvedValue({id: 'newSessionId'});

      const mockTimestamp = {toMillis: () => Date.now()};
      (admin.firestore.Timestamp.now as jest.Mock)
        .mockReturnValue(mockTimestamp);

      const result = await sessionService
        .startSession(mockTutorId, mockStudentIds);

      expect(result).toEqual({
        sessionId: 'newSessionId',
        tutorId: mockTutorId,
        studentIds: mockStudentIds,
        startTime: mockTimestamp,
        status: 'active',
        isPaid: false,
      });
    });
  });

  describe('endSession', () => {
    const mockSessionId = 'session123';
    let mockTransaction: any;

    beforeEach(() => {
      mockTransaction = {
        get: jest.fn(),
        update: jest.fn(),
        set: jest.fn(),
      };
      (db.runTransaction as jest.Mock)
        .mockImplementation((cb) => cb(mockTransaction));

      // Update doc mock for endSession paths
      mockColl.doc.mockImplementation((id: string) => {
        if (id === mockSessionId) return {path: `sessions/${mockSessionId}`};
        if (id === mockTutorId) return {path: `wallets/${mockTutorId}`};
        return {path: `unknown/${id}`};
      });
    });

    it('should throw error if session does not exist', async () => {
      mockTransaction.get.mockResolvedValue({exists: false});

      await expect(sessionService.endSession(mockSessionId, mockTutorId))
        .rejects.toThrow('Session not found');
    });

    it('should process payment if duration >= 45 minutes', async () => {
      const startMs = Date.now() - 50 * 60 * 1000;
      const endMs = Date.now();

      const startTime = {toMillis: () => startMs};
      const endTime = {toMillis: () => endMs};

      (admin.firestore.Timestamp.now as jest.Mock).mockReturnValue(endTime);

      const mockSessionData = {
        tutorId: mockTutorId,
        startTime: startTime,
        status: 'active',
      };

      mockTransaction.get.mockImplementation((ref: {path: string}) => {
        if (ref.path === `sessions/${mockSessionId}`) {
          return Promise.resolve({exists: true, data: () => mockSessionData});
        }
        if (ref.path === `wallets/${mockTutorId}`) {
          return Promise.resolve({
            exists: true,
            data: () => ({balance: 1000}),
          });
        }
        return Promise.resolve({exists: false});
      });

      const result = await sessionService
        .endSession(mockSessionId, mockTutorId);

      expect(result).toEqual({
        status: 'success',
        paid: true,
        message: 'Session ended, wallet credited.',
      });
      expect(mockTransaction.update).toHaveBeenCalled();
      expect(mockTransaction.set).toHaveBeenCalled();
    });

    it('should NOT process payment if duration < 45 minutes', async () => {
      const startMs = Date.now() - 30 * 60 * 1000;
      const endMs = Date.now();

      const startTime = {toMillis: () => startMs};
      const endTime = {toMillis: () => endMs};

      (admin.firestore.Timestamp.now as jest.Mock).mockReturnValue(endTime);

      const mockSessionData = {
        tutorId: mockTutorId,
        startTime: startTime,
        status: 'active',
      };

      mockTransaction.get.mockImplementation((ref: {path: string}) => {
        if (ref.path === `sessions/${mockSessionId}`) {
          return Promise.resolve({exists: true, data: () => mockSessionData});
        }
        return Promise.resolve({exists: false});
      });

      const result = await sessionService
        .endSession(mockSessionId, mockTutorId);

      expect(result).toEqual({
        status: 'success',
        paid: false,
        message: 'Session ended, duration insufficient.',
      });
      expect(mockTransaction.update).toHaveBeenCalled();
      expect(mockTransaction.set).not.toHaveBeenCalled();
    });
  });
});
