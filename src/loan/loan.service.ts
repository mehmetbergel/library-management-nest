import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository, QueryRunner } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Loan } from './loan.entity';
import { User } from '../user/user.entity';
import { Book } from '../book/book.entity';
import { ReturnBookDto } from './loan.dto';

@Injectable()
export class LoanService {
  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  public async borrowBook(user: User, book: Book): Promise<Loan> {
    const existingLoan = await this.loanRepository.findOne({
      where: {
        user: { id: user.id },
        book: { id: book.id },
        returnedAt: IsNull(),
      },
    });

    if (existingLoan) {
      throw new BadRequestException('Book is already borrowed by this user');
    }

    const bookAlreadyBorrowed = await this.loanRepository.findOne({
      where: {
        book: { id: book.id },
        returnedAt: IsNull(),
      },
    });

    if (bookAlreadyBorrowed) {
      throw new BadRequestException('Book is already borrowed by another user');
    }

    const loan = this.loanRepository.create({ user, book });
    return this.loanRepository.save(loan);
  }

  public async returnBook(
    userId: number,
    bookId: number,
    returnBook: ReturnBookDto,
  ): Promise<Loan> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const loan = await this.loanRepository.findOne({
        where: {
          user: { id: userId },
          book: { id: bookId },
          returnedAt: IsNull(),
        },
      });

      if (!loan) {
        throw new NotFoundException(
          'Active loan not found for this user and book',
        );
      }

      if (loan.returnedAt) {
        throw new BadRequestException('Book has already been returned');
      }

      loan.returnedAt = new Date();
      loan.score = returnBook.score;

      await queryRunner.manager.save(Loan, loan);
      await this.updateBookAverageRating(bookId, queryRunner);

      await queryRunner.commitTransaction();
      return loan;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(error);
    } finally {
      await queryRunner.release();
    }
  }

  private async updateBookAverageRating(
    bookId: number,
    queryRunner: QueryRunner,
  ) {
    const book = await queryRunner.manager.findOne(Book, {
      where: { id: bookId },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    const loans = await queryRunner.manager.find(Loan, {
      where: { book: { id: Number(bookId) }, returnedAt: Not(IsNull()) },
      select: ['score'],
    });

    const scores = loans.map((loan) => loan.score);
    const averageRating =
      scores.reduce((sum, score) => sum + Number(score), 0) / scores.length;

    book.averageRating = parseFloat(averageRating.toFixed(2));

    await queryRunner.manager.save(Book, book);
  }
}
