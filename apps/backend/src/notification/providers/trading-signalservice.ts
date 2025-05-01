import { UserService } from "src/users/user.service";
import { NotificationService } from "./notification.service";
import { TradingSignal } from "src/signals/interfaces/trading-signal.interface";
import { SignalType } from "../entities/notification.entity"
import { Injectable } from "@nestjs/common";


@Injectable()
export class TradingSignalService {
  constructor(
    private notificationService: NotificationService,
    private userService: UserService
  ) {}

  async processHighConfidenceSignal(signal: TradingSignal) {
    // Fetch users interested in this type of signal.
    // Assuming a method like findBySignalPreference exists and returns User[]
    const interestedUsers: User[] = await this.userService.findBySignalPreference(
      SignalType.HIGH_CONFIDENCE
    );

    // Iterate over the array of interested users
    for (const user of interestedUsers) {
      await this.notificationService.sendNotification(
        user,
        SignalType.HIGH_CONFIDENCE,
        `High-confidence signal detected: ${signal.details}` // Example message content
      );
    // }
  }
}