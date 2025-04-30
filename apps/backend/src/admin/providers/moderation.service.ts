import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditLogService } from "../audit-log/audit-log.service";
import { User } from "src/users/entities/user.entity";

@Injectable()
export class ModerationService {
  constructor(
    // @InjectRepository() //needs post entity from lishman
    // private readonly postRepo: Repository<Post>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    
    private readonly auditService: AuditLogService,

  ) {}

  // public async banPost(postId: string, performedBy: string) {
  //   // const post = await this.postRepo.findOne({ where: { id: postId } });

  //   if (!post) {
  //     throw new NotFoundException('Post not found');
  //   }

  //   post.isBanned = true;
  //   await this.postRepo.save(post);

  //   await this.auditService.logAction({
  //     action: 'BAN_POST',
  //     performedBy,
  //     targetId: postId,
  //     details: `Post "${post.title}" was banned.`,
  //   });

  //   return { message: 'Post has been banned.' };
  // }

  public async shadowbanUser(walletAddress: string, performedBy: string) {
    const user = await this.userRepo.findOne({ where: { walletAddress } });
  
    if (!user) {
      throw new NotFoundException('User not found');
    }
  
    user.isShadowbanned = true;
    await this.userRepo.save(user);
  
    await this.auditService.logAction({
      action: 'SHADOWBAN_USER',
      performedBy,
      targetId: walletAddress,
      details: `User with wallet ${walletAddress} was shadowbanned.`,
    });
  
    return { message: ' This User has been shadowbanned.' };
  }
  
  
}
