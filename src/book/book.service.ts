import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from './book.entity';
import { CreateBookDto } from './book.dto';

@Injectable()
export class BookService {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
  ) {}

  public async create(createBookDto: CreateBookDto): Promise<Book> {
    const book = this.bookRepository.create(createBookDto);
    try {
      const savedBook = await this.bookRepository.save(book);
      return savedBook;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  public async findAll(): Promise<Book[]> {
    return this.bookRepository.find();
  }

  public async findOne(id: number, loadRelations = false): Promise<Book> {
    const book = await this.bookRepository.findOne({
      where: { id },
      relations: loadRelations ? ['loans'] : [],
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    const scores = book.loans
      .map((loan) => loan.score)
      .filter((score) => score !== null && score !== undefined);

    const averageScore = scores.length
      ? scores.reduce((a, b) => a + Number(b), 0) / scores.length
      : -1;

    return {
      id: book.id,
      name: book.name,
      averageRating: averageScore,
      loans: loadRelations ? book.loans : [],
    };
  }

  public async updateBook(book: Book): Promise<Book> {
    try {
      return await this.bookRepository.save(book);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
