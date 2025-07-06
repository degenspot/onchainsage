import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FeatureFlagsService implements OnModuleInit {
  private flags: Record<string, boolean> = {};
  private readonly flagsFilePath = path.join(
    process.cwd(),
    'config',
    'flags.json',
  );

  async onModuleInit() {
    await this.loadFlags();
  }

  private async loadFlags(): Promise<void> {
    try {
      const data = await fs.promises.readFile(this.flagsFilePath, 'utf8');
      this.flags = JSON.parse(data);
      console.log('Feature flags loaded:', this.flags);
    } catch (error) {
      console.error('Error loading feature flags:', error);
      // Default all flags to enabled if file can't be read
      this.flags = { signals_enabled: true, user_preferences_enabled: true };
    }
  }

  async saveFlags(): Promise<void> {
    try {
      await fs.promises.writeFile(
        this.flagsFilePath,
        JSON.stringify(this.flags, null, 2),
        'utf8',
      );
    } catch (error) {
      console.error('Error saving feature flags:', error);
    }
  }

  isEnabled(flagName: string): boolean {
    return this.flags[flagName] === true;
  }

  async setFlag(flagName: string, value: boolean): Promise<void> {
    this.flags[flagName] = value;
    await this.saveFlags();
  }

  getAllFlags(): Record<string, boolean> {
    return { ...this.flags };
  }
}
