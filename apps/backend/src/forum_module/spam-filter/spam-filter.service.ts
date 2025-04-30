import { Injectable } from '@nestjs/common';
import { Filter } from 'bad-words';

@Injectable()
export class SpamFilterService {
  private filter = new Filter();

  score(content: string): number {
    let score = 0;
    // profanity
    if (this.filter.isProfane(content)) {
      score += 0.5;
    }
    // links
    const linkCount = (content.match(/https?:\/\//g) || []).length;
    score += Math.min(linkCount * 0.1, 0.3);
    // repetition
    const words = content.split(/\s+/);
    const unique = new Set(words).size;
    if (unique / words.length < 0.5) {
      score += 0.2;
    }
    return Math.min(score, 1);
  }
}
