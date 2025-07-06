// src/signals/dto/create-signal-audit.dto.ts
export class CreateSignalAuditDto {
  inputPrompt: string;
  modelName: string;
  modelVersion: string;
  confidenceScore: number;
  importantTokens?: any;
  ownerId: string;
}
