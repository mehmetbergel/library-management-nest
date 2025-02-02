import { Test, TestingModule } from '@nestjs/testing';
import { LoanService } from './loan.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Loan } from './loan.entity';
import { Repository } from 'typeorm';
import {
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { User } from '../user/user.entity';
import { Book } from '../book/book.entity';
import { BookService } from '../book/book.service';
import { ReturnBookDto } from './loan.dto';

const mockLoanRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
});

const mockBookService = () => ({
  findOne: jest.fn(),
  updateBook: jest.fn(),
});

describe('LoanService', () => {
  let service: LoanService;
  let loanRepository: jest.Mocked<Repository<Loan>>;
  let bookService: jest.Mocked<BookService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoanService,
        { provide: getRepositoryToken(Loan), useFactory: mockLoanRepository },
        { provide: BookService, useFactory: mockBookService },
      ],
    }).compile();

    service = module.get<LoanService>(LoanService);
    loanRepository = module.get<Repository<Loan>>(
      getRepositoryToken(Loan),
    ) as jest.Mocked<Repository<Loan>>;
    bookService = module.get<BookService>(
      BookService,
    ) as jest.Mocked<BookService>;
  });

  it('should borrow a book if not already borrowed', async () => {
    const user = { id: 1, name: 'Mehmet Bergel' } as User;
    const book = { id: 1, name: 'Book Title' } as Book;

    loanRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    loanRepository.create.mockReturnValue({ user, book } as Loan);
    loanRepository.save.mockResolvedValue({ id: 1, user, book } as Loan);

    const result = await service.borrowBook(user, book);

    expect(result).toEqual({ id: 1, user, book });
    expect(loanRepository.create).toHaveBeenCalledWith({ user, book });
    expect(loanRepository.save).toHaveBeenCalledWith({ user, book });
  });

  it('should throw BadRequestException if book is already borrowed by this user', async () => {
    const user = { id: 1, name: 'Mehmet Bergel' } as User;
    const book = { id: 1, name: 'Book Title' } as Book;

    loanRepository.findOne.mockResolvedValueOnce({ id: 1, user, book } as Loan);

    await expect(service.borrowBook(user, book)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw BadRequestException if book is already borrowed by another user', async () => {
    const user = { id: 1, name: 'Mehmet Bergel' } as User;
    const book = { id: 1, name: 'Book Title' } as Book;

    loanRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 2, user: { id: 2 }, book } as Loan);

    await expect(service.borrowBook(user, book)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should return a book if loan exists', async () => {
    const userId = 1;
    const bookId = 1;
    const returnBookDto: ReturnBookDto = { score: 5 };
    const loan = {
      id: 1,
      user: { id: userId },
      book: { id: bookId },
      returnedAt: null,
    } as Loan;

    loanRepository.findOne.mockResolvedValue(loan);
    loanRepository.save.mockResolvedValue({
      ...loan,
      returnedAt: new Date(),
      score: 5,
    } as Loan);
    bookService.findOne.mockResolvedValue({
      id: bookId,
      name: 'Book Title',
      averageRating: 0,
      loans: [],
    });
    loanRepository.find.mockResolvedValue([
      {
        id: 2,
        user: { id: 2 },
        book: { id: bookId },
        borrowedAt: new Date(),
        returnedAt: new Date(),
        score: 5,
      } as Loan,
    ]);

    const result = await service.returnBook(userId, bookId, returnBookDto);

    expect(result.returnedAt).toBeInstanceOf(Date);
    expect(result.score).toBe(5);
    expect(bookService.updateBook).toHaveBeenCalledWith(
      expect.objectContaining({ averageRating: 5 }),
    );
  });

  it('should throw NotFoundException if loan does not exist', async () => {
    loanRepository.findOne.mockResolvedValue(null);

    await expect(service.returnBook(1, 1, { score: 5 })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw BadRequestException if book is already returned', async () => {
    const loan = { id: 1, returnedAt: new Date() } as Loan;
    loanRepository.findOne.mockResolvedValue(loan);

    await expect(service.returnBook(1, 1, { score: 5 })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw InternalServerErrorException if save fails during return', async () => {
    const loan = { id: 1, returnedAt: null } as Loan;
    loanRepository.findOne.mockResolvedValue(loan);
    loanRepository.save.mockRejectedValue(new Error('Save failed'));

    await expect(service.returnBook(1, 1, { score: 5 })).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
