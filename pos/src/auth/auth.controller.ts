import {
  Controller,
  Post,
  Body,
  ConflictException,
  InternalServerErrorException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiCreatedResponse,
  ApiBody,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { User } from '../user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import admin from '../utils/firebase-admin.config';
import { RegisterUserDto } from './dto/register-user.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user in Firebase and local DB' })
  @ApiBody({ type: RegisterUserDto })
  @ApiCreatedResponse({
    description: 'User registered successfully in Firebase and DB.',
    type: User,
  })
  @ApiConflictResponse({ description: 'Email already exists in Firebase.' })
  async register(@Body() registerUserDto: RegisterUserDto): Promise<User> {
    const { email, password, companyName } = registerUserDto;

    let firebaseUserRecord;
    try {
      firebaseUserRecord = await admin.auth().createUser({
        email: email,
        password: password,
        displayName: companyName,
      });
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        throw new ConflictException('Email already exists.');
      }
      console.error('Firebase user creation failed:', error);
      throw new InternalServerErrorException(
        'Failed to create user in Firebase.',
      );
    }

    const userId = firebaseUserRecord.uid;

    const existingDbUser = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (existingDbUser) {
      console.warn(`User with Firebase UID ${userId} already exists in DB.`);
      return existingDbUser;
    }

    try {
      const newUser = this.userRepository.create({
        id: userId,
        email: email,
        name: companyName,
      });

      return await this.userRepository.save(newUser);
    } catch (dbError) {
      console.error('Database user creation failed:', dbError);
      try {
        await admin.auth().deleteUser(userId);
        console.log(
          `Successfully rolled back Firebase user creation for UID: ${userId}`,
        );
      } catch (rollbackError) {
        console.error(
          `Failed to rollback Firebase user creation for UID: ${userId}`,
          rollbackError,
        );
      }
      throw new InternalServerErrorException(
        'Failed to save user to database.',
      );
    }
  }
}
