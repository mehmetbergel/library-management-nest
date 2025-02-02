import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';
import { BookService } from '../book/book.service';
import { LoanService } from '../loan/loan.service';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './user.dto';
import { ReturnBookDto } from '~/loan/loan.dto';

const mockUserRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
});

const mockBookService = () => ({
  findOne: jest.fn(),
});

const mockLoanService = () => ({
  borrowBook: jest.fn(),
  returnBook: jest.fn(),
});

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<Repository<User>>;
  let bookService: jest.Mocked<BookService>;
  let loanService: jest.Mocked<LoanService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useFactory: mockUserRepository },
        { provide: BookService, useFactory: mockBookService },
        { provide: LoanService, useFactory: mockLoanService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<Repository<User>>(
      getRepositoryToken(User),
    ) as jest.Mocked<Repository<User>>;
    bookService = module.get<BookService>(
      BookService,
    ) as jest.Mocked<BookService>;
    loanService = module.get<LoanService>(
      LoanService,
    ) as jest.Mocked<LoanService>;
  });

  it('should create a user', async () => {
    const createUserDto: CreateUserDto = { name: 'Mehmet Bergel' };
    const userEntity: User = { id: 1, name: 'Mehmet Bergel', loans: [] };

    userRepository.create.mockReturnValue(userEntity);
    userRepository.save.mockResolvedValue(userEntity);

    expect(await service.create(createUserDto)).toEqual(userEntity);
  });

  it('should find all users', async () => {
    userRepository.find.mockResolvedValue([
      { id: 1, name: 'Mehmet Bergel', loans: [] } as User,
    ]);

    expect(await service.findAll()).toEqual([
      { id: 1, name: 'Mehmet Bergel', loans: [] },
    ]);
  });

  it('should find a user by id', async () => {
    userRepository.findOne.mockResolvedValue({
      id: 1,
      name: 'Mehmet Bergel',
      loans: [],
    } as User);

    expect(await service.findOne(1)).toEqual({
      id: 1,
      name: 'Mehmet Bergel',
      loans: [],
    });
  });

  it('should throw NotFoundException if user not found', async () => {
    userRepository.findOne.mockResolvedValue(null);

    await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
  });

  it('should borrow a book for a user', async () => {
    userRepository.findOne.mockResolvedValue({
      id: 1,
      name: 'Mehmet Bergel',
      loans: [],
    } as User);
    bookService.findOne.mockResolvedValue({
      id: 1,
      name: 'Book Title',
      averageRating: 0,
      loans: [],
    });

    await service.borrowBook(1, 1);

    expect(loanService.borrowBook).toHaveBeenCalledWith(
      { id: 1, name: 'Mehmet Bergel', loans: [] },
      { id: 1, name: 'Book Title', averageRating: 0, loans: [] },
    );
  });

  it('should throw NotFoundException if user not found when borrowing a book', async () => {
    userRepository.findOne.mockResolvedValue(null);

    await expect(service.borrowBook(1, 1)).rejects.toThrow(NotFoundException);
  });

  it('should return a book for a user', async () => {
    const returnBookDto: ReturnBookDto = { score: 5 };
    await service.returnBook(1, 1, returnBookDto);

    expect(loanService.returnBook).toHaveBeenCalledWith(1, 1, returnBookDto);
  });
});
