import {firestore} from 'firebase-admin';

export interface IUser {
  uid: string;
  role: 'tutor' | 'student';
  name: string;
  email: string;
}

export interface ISession {
    sessionId?: string;
    tutorId: string;
    studentIds: string[];
    startTime: firestore.Timestamp;
    endTime?: firestore.Timestamp;
    status: 'active' | 'completed';
    isPaid: boolean;
    durationMinutes?: number;
}

export interface IWallet {
    tutorId: string;
    balance: number;
    lastUpdated: firestore.Timestamp;
}

export interface ITransaction {
    transactionId?: string;
    walletId: string;
    amount: number;
    type: 'credit';
    sessionId: string;
    createdAt: firestore.Timestamp;
}
