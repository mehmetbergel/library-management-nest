import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Loan } from '../loan/loan.entity';

@Entity()
export class Book {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 250, nullable: false })
  name: string;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  averageRating: number;

  @OneToMany(() => Loan, (loan) => loan.book)
  loans: Loan[];
}
