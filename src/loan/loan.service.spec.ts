import { Test, TestingModule } from '@nestjs/testing';
import { LoanService } from './loan.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Loan } from './loan.entity';
import { User } from '../user/user.entity';
import { Book } from '../book/book.entity';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import {
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ReturnBookDto } from './loan.dto';

const mockLoanRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
});

const mockDataSource = () => ({
  createQueryRunner: jest.fn(),
});

describe('LoanService', () => {
  let service: LoanService;
  let loanRepository: jest.Mocked<Repository<Loan>>;
  let dataSource: jest.Mocked<DataSource>;
  let queryRunner: jest.Mocked<QueryRunner>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoanService,
        { provide: getRepositoryToken(Loan), useFactory: mockLoanRepository },
        { provide: DataSource, useFactory: mockDataSource },
      ],
    }).compile();

    service = module.get<LoanService>(LoanService);
    loanRepository = module.get<Repository<Loan>>(
      getRepositoryToken(Loan),
    ) as jest.Mocked<Repository<Loan>>;
    dataSource = module.get<DataSource>(DataSource) as jest.Mocked<DataSource>;

    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest.fn(),
        findOne: jest.fn(),
        find: jest.fn(),
      },
    } as unknown as jest.Mocked<QueryRunner>;

    dataSource.createQueryRunner.mockReturnValue(queryRunner);
  });

  describe('borrowBook', () => {
    it('should borrow a book if not already borrowed by the user', async () => {
      const user = { id: 1 } as User;
      const book = { id: 1 } as Book;
      const loan = { user, book } as Loan;

      loanRepository.findOne.mockResolvedValueOnce(null);
      loanRepository.findOne.mockResolvedValueOnce(null);
      loanRepository.create.mockReturnValue(loan);
      loanRepository.save.mockResolvedValue(loan);

      expect(await service.borrowBook(user, book)).toEqual(loan);
    });

    it('should throw BadRequestException if book is already borrowed by the user', async () => {
      const user = { id: 1 } as User;
      const book = { id: 1 } as Book;
      const existingLoan = { id: 1 } as Loan;

      loanRepository.findOne.mockResolvedValue(existingLoan);

      await expect(service.borrowBook(user, book)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if book is already borrowed by another user', async () => {
      const user = { id: 1 } as User;
      const book = { id: 1 } as Book;

      loanRepository.findOne.mockResolvedValueOnce(null);
      loanRepository.findOne.mockResolvedValueOnce({ id: 2 } as Loan);

      await expect(service.borrowBook(user, book)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('returnBook', () => {
    it('should return a book and update the rating', async () => {
      const userId = 1;
      const bookId = 1;
      const returnBookDto: ReturnBookDto = { score: 5 };
      const loan = { id: 1, returnedAt: null, score: null } as unknown as Loan;
      const book = { id: bookId, averageRating: 0 } as Book;

      loanRepository.findOne.mockResolvedValueOnce(loan);

      (queryRunner.manager.findOne as jest.Mock).mockResolvedValueOnce(book);
      (queryRunner.manager.save as jest.Mock).mockResolvedValueOnce(loan);
      (queryRunner.manager.findOne as jest.Mock).mockResolvedValueOnce(book);
      (queryRunner.manager.find as jest.Mock).mockResolvedValueOnce([
        { score: 5 },
        { score: 4 },
      ]);
      (queryRunner.manager.findOne as jest.Mock).mockResolvedValueOnce(book);

      await expect(
        service.returnBook(userId, bookId, returnBookDto),
      ).resolves.toEqual({
        ...loan,
        returnedAt: expect.any(Date),
        score: 5,
      });

      expect(queryRunner.manager.save).toHaveBeenCalledWith(
        Loan,
        expect.objectContaining({ score: 5 }),
      );
      expect(queryRunner.manager.save).toHaveBeenCalledWith(
        Book,
        expect.objectContaining({ averageRating: 4.5 }),
      );
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if active loan is not found', async () => {
      const userId = 1;
      const bookId = 1;
      const returnBookDto: ReturnBookDto = { score: 5 };

      loanRepository.findOne.mockResolvedValue(null);

      await expect(
        service.returnBook(userId, bookId, returnBookDto),
      ).rejects.toThrow(
        new NotFoundException('Active loan not found for this user and book'),
      );
    });

    it('should throw BadRequestException if book is already returned', async () => {
      const userId = 1;
      const bookId = 1;
      const returnBookDto: ReturnBookDto = { score: 5 };
      const loan = { id: 1, returnedAt: new Date() } as Loan;

      loanRepository.findOne.mockResolvedValue(loan);

      await expect(
        service.returnBook(userId, bookId, returnBookDto),
      ).rejects.toThrow(
        new BadRequestException('Book has already been returned'),
      );
    });

    it('should rollback transaction on error', async () => {
      const userId = 1;
      const bookId = 1;
      const returnBookDto: ReturnBookDto = { score: 5 };
      const loan = { id: 1, returnedAt: null } as Loan;

      loanRepository.findOne.mockResolvedValue(loan);
      (queryRunner.manager.save as jest.Mock).mockRejectedValue(
        new Error('Save failed'),
      );

      await expect(
        service.returnBook(userId, bookId, returnBookDto),
      ).rejects.toThrow(InternalServerErrorException);
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });
});
