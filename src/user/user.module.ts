import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './user.entity';
import { BookModule } from '../book/book.module';
import { LoanModule } from '../loan/loan.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), BookModule, LoanModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
