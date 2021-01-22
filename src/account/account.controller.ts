import { Controller, Get, Body, Put, Param, Delete, Req, UseGuards, Query } from '@nestjs/common';
import { AccountService } from './account.service';
import { UpdateAccountDto } from './dto/update-account.dto';
import { FindOneParam } from './interfaces/find-one.param';
import { AuthGuard } from '../auth.guard';
import { Request } from 'express';
import { FindAllQuery } from './interfaces/find-all.query';

@Controller('accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get(':id')
  async findOne(@Param() { id }: FindOneParam) {
    const account = await this.accountService.findOne(id);
    return { account };
  }

  @Get()
  async findAll(@Query() query: FindAllQuery) {
    const account = await this.accountService.findAll(query);
    return { account };
  }

  @Put()
  @UseGuards(AuthGuard)
  async update(@Req() req: Request, @Body() updateAccountDto: UpdateAccountDto) {
    const auth = req.auth!;
    const account = await this.accountService.update(auth.id, updateAccountDto);
    return { account, success: true, message: 'Account info updated successfully!' };
  }

  @Delete(':id')
  async remove(@Param() { id }: FindOneParam) {
    return await this.accountService.remove(id);
  }
}
