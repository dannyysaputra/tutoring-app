import {Request, Response} from 'express';
import Joi from 'joi';
import * as sessionService from '../services/sessionService';

const startSchema = Joi.object({
  studentIds: Joi.array().items(Joi.string()).min(1).max(6).required(),
});

const endSchema = Joi.object({
  sessionId: Joi.string().required(),
});

/**
 * Handle request to start a session.
 * @param {Request} req - Express request.
 * @param {Response} res - Express response.
 * @return {Promise<Response>} API Response.
 */
export const start = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({error: 'Unauthorized'});
    }

    const {error} = startSchema.validate(req.body);
    if (error) {
      return res.status(400).json({error: error.details[0].message});
    }

    const {uid} = req.user;
    const {studentIds} = req.body;

    const result = await sessionService.startSession(uid, studentIds);
    return res.status(201).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).json({error: message});
  }
};

/**
 * Handle request to end a session.
 * @param {Request} req - Express request.
 * @param {Response} res - Express response.
 * @return {Promise<Response>} API Response.
 */
export const end = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({error: 'Unauthorized'});
    }

    const {error} = endSchema.validate(req.body);
    if (error) {
      return res.status(400).json({error: error.details[0].message});
    }

    const {uid} = req.user;
    const {sessionId} = req.body;

    const result = await sessionService.endSession(sessionId, uid);
    return res.status(200).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('Unauthorized') || message.includes('not found')) {
      return res.status(400).json({error: message});
    }
    console.error('Error ending session:', error);
    return res.status(500).json({error: 'Internal Server Error'});
  }
};
