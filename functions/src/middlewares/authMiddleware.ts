import {Request, Response, NextFunction} from 'express';
import {auth, db} from '../config/firebase';
import {IUser} from '../models/types';

/**
 * Middleware to verify if the user is a valid Tutor.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next function.
 * @return {Promise<void | Response>} Returns void or response error.
 */
export const verifyTutor = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({error: 'Unauthorized: No token provided'});
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);

    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data() as IUser | undefined;

    if (!userData || userData.role !== 'tutor') {
      return res.status(403).json({
        error: 'Forbidden: Access restricted to Tutors',
      });
    }

    req.user = {uid: decodedToken.uid, role: userData.role};
    next();
  } catch (error) {
    return res.status(401).json({error: 'Unauthorized: Invalid token'});
  }
};
