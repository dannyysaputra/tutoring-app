import {Timestamp, FieldValue} from 'firebase-admin/firestore';
import {db} from '../config/firebase';
import {ISession, ITransaction} from '../models/types';

const PAYMENT_AMOUNT = 50000;
const MIN_DURATION_MINUTES = 45;

/**
 * Starts a new tutoring session.
 * @param {string} tutorId - The ID of the tutor.
 * @param {string[]} studentIds - List of student IDs.
 * @return {Promise<ISession>} The created session data.
 */
export const startSession = async (
  tutorId: string,
  studentIds: string[]
): Promise<ISession> => {
  // Check for existing active session
  const activeSessionQuery = await db.collection('sessions')
    .where('tutorId', '==', tutorId)
    .where('status', '==', 'active')
    .get();

  if (!activeSessionQuery.empty) {
    throw new Error('Tutor already has an active session');
  }

  const newSession: ISession = {
    tutorId,
    studentIds,
    startTime: Timestamp.now(),
    status: 'active',
    isPaid: false,
  };

  const docRef = await db.collection('sessions').add(newSession);
  return {sessionId: docRef.id, ...newSession};
};

/**
 * Ends a tutoring session and processes payment if applicable.
 * @param {string} sessionId - The ID of the session.
 * @param {string} tutorId - The ID of the tutor requesting end session.
 * @return {Promise<object>} The result of the transaction.
 */
export const endSession = async (sessionId: string, tutorId: string) => {
  return await db.runTransaction(async (transaction) => {
    const sessionRef = db.collection('sessions').doc(sessionId);
    const walletRef = db.collection('wallets').doc(tutorId);

    const sessionDoc = await transaction.get(sessionRef);

    if (!sessionDoc.exists) {
      throw new Error('Session not found');
    }

    const sessionData = sessionDoc.data() as ISession;

    if (sessionData.tutorId !== tutorId) {
      throw new Error('Unauthorized: You do not own this session');
    }

    if (sessionData.status === 'completed') {
      throw new Error('Session is already completed');
    }

    // Logic Duration Calculation
    const endTime = Timestamp.now();
    const startTime = sessionData.startTime;
    const durationMillis = endTime.toMillis() - startTime.toMillis();
    const durationMinutes = durationMillis / (1000 * 60);

    const sessionUpdateData = {
      endTime: endTime,
      status: 'completed',
      durationMinutes: durationMinutes,
      isPaid: false, // Default false
    };

    // Check Qualification for Payment
    if (durationMinutes >= MIN_DURATION_MINUTES) {
      const walletDoc = await transaction.get(walletRef);
      sessionUpdateData.isPaid = true;
      transaction.update(sessionRef, sessionUpdateData);

      if (!walletDoc.exists) {
        transaction.set(walletRef, {
          tutorId,
          balance: PAYMENT_AMOUNT,
          lastUpdated: endTime,
        });
      } else {
        transaction.update(walletRef, {
          balance: FieldValue.increment(PAYMENT_AMOUNT),
          lastUpdated: endTime,
        });
      }

      const transactionRef = db.collection('transactions').doc();
      const newTransaction: ITransaction = {
        walletId: tutorId,
        amount: PAYMENT_AMOUNT,
        type: 'credit',
        sessionId: sessionId,
        createdAt: endTime,
      };
      transaction.set(transactionRef, newTransaction);

      return {
        status: 'success',
        paid: true,
        message: 'Session ended, wallet credited.',
      };
    }
    transaction.update(sessionRef, sessionUpdateData);

    return {
      status: 'success',
      paid: false,
      message: 'Session ended, duration insufficient.',
    };
  });
};
