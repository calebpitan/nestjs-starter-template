// import { PartialType } from '@nestjs/mapped-types';
import { Length } from 'class-validator';
import { CreateAccountDto } from './create-account.dto';

// export class UpdateAccountDto extends PartialType(CreateAccountDto) {}
export class UpdateAccountDto implements Partial<CreateAccountDto> {
  @Length(3, 24)
  username!: string;

  @Length(1, 32)
  firstname!: string;

  @Length(1, 32)
  lastname!: string;
}
