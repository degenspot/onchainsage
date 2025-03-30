import { UserService } from "src/users/user.service";
import { NotificationService } from "./notification.service";
import { TradingSignal } from "src/signals/interfaces/trading-signal.interface";
import { SignalType } from "../dto/notification-preference.dto";
import { Injectable } from "@nestjs/common";


@Injectable()
export class TradingSignalService {
  constructor(
    private notificationService: NotificationService,
    private userService: UserService
  ) {}

  async processHighConfidenceSignal(signal: TradingSignal) {
    const interestedUsers = await this.userService.findByWalletAddress(
      SignalType.HIGH_CONFIDENCE
    );

    // for (const user of interestedUsers) {
    //   await this.notificationService.sendNotification(
    //     user, 
    //     SignalType.HIGH_CONFIDENCE, 
    //     // `High-confidence signal detected: ${signal.details}`
    //   );
    // }
  }
}