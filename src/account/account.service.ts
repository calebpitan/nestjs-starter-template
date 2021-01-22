import { Injectable } from '@nestjs/common';
import { ReturnModelType } from '@typegoose/typegoose';
import { InjectModel } from 'nestjs-typegoose';
import { UpdateAccountDto } from './dto/update-account.dto';
import { Account } from './entity';
import { FindAllQuery } from './interfaces/find-all.query';

@Injectable()
export class AccountService {
  constructor(@InjectModel(Account) private readonly account: ReturnModelType<typeof Account>) {}

  async findAuthenticated(id: string) {
    const account = await this.account.findOne({ _id: id }).lean();
    return account;
  }

  async findAll(query: FindAllQuery) {
    return await this.account
      .find()
      .skip(query.offset || 0)
      .limit(query.limit || 20)
      .lean();
  }

  async findOne(id: string) {
    const account = await this.account.findOne({ _id: id }).lean();
    return account;
  }

  async update(id: string, updateAccountDto: UpdateAccountDto) {
    const account = await this.account
      .findOneAndUpdate({ _id: id }, { ...updateAccountDto })
      .lean();
    return account;
  }

  async remove(id: string) {
    const account = await this.account.findOneAndDelete({ _id: id }).lean();
    return account;
  }
}
