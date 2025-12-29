import {Router} from 'express';
import {verifyTutor} from '../middlewares/authMiddleware';
import * as sessionController from '../controllers/sessionController';

// eslint-disable-next-line new-cap
const router = Router();

// Protect all routes below with Tutor verification
router.use(verifyTutor);

router.post('/sessions/start', sessionController.start);
router.post('/sessions/end', sessionController.end);

export default router;
