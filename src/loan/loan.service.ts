import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { Loan } from './loan.entity';
import { User } from '../user/user.entity';
import { Book } from '../book/book.entity';
import { BookService } from '../book/book.service';
import { ReturnBookDto } from './loan.dto';

@Injectable()
export class LoanService {
  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    private readonly bookService: BookService,
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

    try {
      await this.loanRepository.save(loan);
      await this.updateBookAverageRating(bookId);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }

    return loan;
  }

  private async updateBookAverageRating(bookId: number) {
    const book = await this.bookService.findOne(bookId, true);
    const loans = await this.loanRepository.find({
      where: { book: { id: Number(bookId) }, returnedAt: Not(IsNull()) },
      select: ['score'],
    });

    const scores = loans.map((loan) => loan.score);
    const averageRating =
      scores.reduce((sum, score) => sum + Number(score), 0) / scores.length;

    book.averageRating = parseFloat(averageRating.toFixed(2));
    this.bookService.updateBook(book);
  }
}
