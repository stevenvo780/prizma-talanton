import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { User } from '../user/entities/user.entity';
import admin from '../utils/firebase-admin.config';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'] as string;
    const authHeader = request.headers.authorization;

    if (apiKey) {
      const user = await this.userRepository.findOne({
        where: { apiKey },
        relations: ['profile'],
      });
      if (!user) {
        throw new ForbiddenException('API key inválida');
      }
      request['user'] = user;
      request['apiKey'] = apiKey;
      return true;
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.split('Bearer ')[1];

    try {
      // Verify token signature with Firebase Admin SDK (fail-closed)
      const decodedToken = await admin.auth().verifyIdToken(token);
      const userId = decodedToken.uid;

      if (!userId) {
        throw new UnauthorizedException('Invalid token: No user ID found');
      }

      let user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['profile'],
      });

      if (!user) {
        user = this.userRepository.create({
          id: userId,
          email: decodedToken.email,
          name: decodedToken.name,
        });
        await this.userRepository.save(user);
      }

      request['user'] = user;
      request['token'] = token;

      return true;
    } catch (error) {
      if (error.code) {
        switch (error.code) {
          case 'auth/id-token-expired':
            throw new UnauthorizedException('Token has expired');
          case 'auth/invalid-id-token':
            throw new UnauthorizedException('Invalid token');
          case 'auth/argument-error':
            throw new UnauthorizedException('Token argument error');
          case 'auth/user-disabled':
            throw new ForbiddenException('User account is disabled');
          case 'auth/user-not-found':
            throw new UnauthorizedException('User not found');
          case 'auth/requires-recent-login':
            throw new UnauthorizedException('Recent login required');
          case 'auth/invalid-credential':
            throw new UnauthorizedException('Invalid credential');
          default:
            console.error(
              'Unhandled Firebase error code:',
              error.code,
              error.message,
            );
            throw new InternalServerErrorException(
              'Unexpected authentication error',
            );
        }
      } else {
        console.error(
          'Unexpected error during Firebase token verification:',
          error,
        );
        throw new InternalServerErrorException(
          'Unexpected authentication error',
        );
      }
    }
  }

}
