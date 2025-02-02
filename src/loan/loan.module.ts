import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanService } from './loan.service';
import { Loan } from './loan.entity';
import { BookModule } from '../book/book.module';

@Module({
  imports: [TypeOrmModule.forFeature([Loan]), BookModule],
  providers: [LoanService],
  exports: [LoanService],
})
export class LoanModule {}
