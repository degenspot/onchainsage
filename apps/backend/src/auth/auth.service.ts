import { Injectable } from '@nestjs/common';
import { RegisterDto, LoginDto, AuthResponseDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  register(registerDto: RegisterDto): Promise<RegisterDto> {
    return Promise.resolve({
      username: registerDto.username,
      email: registerDto.email,
      password: registerDto.password,
    });
  }

  login(loginDto: LoginDto): Promise<AuthResponseDto> {
    return Promise.resolve({
      accessToken: 'access-token',
      user: {
        id: 1,
        username: loginDto.username,
      },
    });
  }
}
