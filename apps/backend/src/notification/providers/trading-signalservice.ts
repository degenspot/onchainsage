import { UserService } from "../../users/user.service";
import { Injectable } from "@nestjs/common";
import { SignalType } from "../entities/notification.entity";

// Placeholder interfaces
interface User {
  id: string;
  email: string;
}

interface TradingSignal {
  id: string;
  type: string;
  message: string;
  confidence: number;
}

interface NotificationService {
  sendNotification(user: User, type: SignalType, message: string): Promise<void>;
}

@Injectable()
export class TradingSignalService {
  constructor(
    private notificationService: NotificationService,
    private userService: UserService
  ) {}

  async processHighConfidenceSignal(signal: TradingSignal) {
    // Fetch users interested in this type of signal.
    // Assuming a method like findBySignalPreference exists and returns User[]
    const interestedUsers: User[] = await (this.userService as any).findBySignalPreference(
      SignalType.HIGH_CONFIDENCE
    );

    // Iterate over the array of interested users
    for (const user of interestedUsers) {
      await this.notificationService.sendNotification(
        user,
        SignalType.HIGH_CONFIDENCE,
        `High-confidence signal detected: ${signal.message}` // Example message content
      );
    }
  }
}