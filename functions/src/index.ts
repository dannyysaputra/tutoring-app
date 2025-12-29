import * as functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import routerV1 from './routes/v1';

const app = express();

// Automatically allow cross-origin requests
app.use(cors({origin: true}));
app.use(express.json());

// Mount V1 Routes
app.use('/api/v1', routerV1);

/**
 * Global Error Handler Middleware.
 * @param {Error} err - Error object.
 * @param {express.Request} req - Express request object.
 * @param {express.Response} res - Express response object.
 * @param {express.NextFunction} next - Express next function.
 */
app.use((
  err: Error,
  req: express.Request,
  res: express.Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: express.NextFunction
) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

export const api = functions.https.onRequest(app);
