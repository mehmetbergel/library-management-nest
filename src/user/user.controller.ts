import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  HttpCode,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './user.dto';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ReturnBookDto } from '~/loan/loan.dto';

@UseGuards(ThrottlerGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @HttpCode(201)
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @HttpCode(200)
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @HttpCode(200)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Post(':userId/borrow/:bookId')
  @HttpCode(200)
  borrowBook(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('bookId', ParseIntPipe) bookId: number,
  ) {
    return this.userService.borrowBook(userId, bookId);
  }

  @Post(':userId/return/:bookId')
  @HttpCode(200)
  returnBook(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('bookId', ParseIntPipe) bookId: number,
    @Body() returnBookDto: ReturnBookDto,
  ) {
    return this.userService.returnBook(userId, bookId, returnBookDto);
  }
}
