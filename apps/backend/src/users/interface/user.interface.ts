import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: { walletAddress: string }; // Define the expected user structure
}