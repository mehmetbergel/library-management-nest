import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { BookService } from '../book/book.service';
import { LoanService } from '../loan/loan.service';
import { CreateUserDto } from './user.dto';
import { ReturnBookDto } from '~/loan/loan.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly bookService: BookService,
    private readonly loanService: LoanService,
  ) {}

  public async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  public async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  public async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['loans', 'loans.book'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  public async borrowBook(userId: number, bookId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const book = await this.bookService.findOne(bookId);

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    await this.loanService.borrowBook(user, book);
  }

  public async returnBook(
    userId: number,
    bookId: number,
    returnBook: ReturnBookDto,
  ) {
    await this.loanService.returnBook(userId, bookId, returnBook);
  }
}
