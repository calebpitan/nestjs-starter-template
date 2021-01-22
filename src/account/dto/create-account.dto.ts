import { IsEmail, Length } from 'class-validator';

export class CreateAccountDto {
  @Length(3, 24)
  username!: string;

  @Length(1, 32)
  firstname!: string;

  @Length(1, 32)
  lastname!: string;

  @IsEmail()
  email!: string;

  @Length(8)
  password!: string;
}
