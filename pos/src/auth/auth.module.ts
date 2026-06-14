import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { User } from '../user/entities/user.entity';
import { FirebaseAuthGuard } from './firebase-auth.guard';

@Module({
  imports: [UserModule, TypeOrmModule.forFeature([User])],
  providers: [AuthService, FirebaseAuthGuard],
  controllers: [AuthController],
  exports: [FirebaseAuthGuard, AuthService],
})
export class AuthModule {}
