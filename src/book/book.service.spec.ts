import { Test, TestingModule } from '@nestjs/testing';
import { BookService } from './book.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Book } from './book.entity';
import { Repository } from 'typeorm';
import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateBookDto } from './book.dto';

const mockBookRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
});

describe('BookService', () => {
  let service: BookService;
  let bookRepository: jest.Mocked<Repository<Book>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookService,
        { provide: getRepositoryToken(Book), useFactory: mockBookRepository },
      ],
    }).compile();

    service = module.get<BookService>(BookService);
    bookRepository = module.get<Repository<Book>>(
      getRepositoryToken(Book),
    ) as jest.Mocked<Repository<Book>>;
  });

  it('should create a book', async () => {
    const createBookDto: CreateBookDto = { name: 'New Book' };
    const savedBook = { id: 1, name: 'New Book', averageRating: -1, loans: [] };

    bookRepository.create.mockReturnValue({
      id: 1,
      averageRating: -1,
      loans: [],
      ...createBookDto,
    });
    bookRepository.save.mockResolvedValue(savedBook);

    expect(await service.create(createBookDto)).toEqual(savedBook);
  });

  it('should throw InternalServerErrorException on save error', async () => {
    const createBookDto: CreateBookDto = { name: 'New Book' };
    bookRepository.create.mockReturnValue({
      id: 1,
      averageRating: -1,
      loans: [],
      ...createBookDto,
    });
    bookRepository.save.mockRejectedValue(new Error('Save failed'));

    await expect(service.create(createBookDto)).rejects.toThrow(
      InternalServerErrorException,
    );
  });

  it('should find all books', async () => {
    const books = [{ id: 1, name: 'Book One', averageRating: -1, loans: [] }];
    bookRepository.find.mockResolvedValue(books);

    expect(await service.findAll()).toEqual(books);
  });

  it('should find a book by id', async () => {
    const book = { id: 1, name: 'Book One', averageRating: -1, loans: [] };
    bookRepository.findOne.mockResolvedValue(book);

    expect(await service.findOne(1)).toEqual({ ...book, averageRating: -1 });
  });

  it('should throw NotFoundException if book not found', async () => {
    bookRepository.findOne.mockResolvedValue(null);

    await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
  });

  it('should update a book', async () => {
    const book = { id: 1, name: 'Updated Book' } as Book;
    bookRepository.save.mockResolvedValue(book);

    expect(await service.updateBook(book)).toEqual(book);
  });

  it('should throw InternalServerErrorException on update error', async () => {
    const book = { id: 1, name: 'Updated Book' } as Book;
    bookRepository.save.mockRejectedValue(new Error('Update failed'));

    await expect(service.updateBook(book)).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
