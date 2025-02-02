import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  JoinColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Book } from '../book/book.entity';

@Entity()
export class Loan {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.loans)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Book, (book) => book.loans)
  @JoinColumn({ name: 'bookId' })
  book: Book;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  score: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  borrowedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  returnedAt: Date | null;
}
