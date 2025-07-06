import { StakeHistoryDto } from './stake-history.dto';

export class ProfileDto {
  address: string;
  reputation: number;
  votes: number;
  wins: number;
  accuracy: number;
  stakeHistory: StakeHistoryDto[];
}
