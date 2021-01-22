import { IsEmail, IsNotEmptyObject, IsString } from 'class-validator';

export class Identifier {
  @IsString()
  username!: string;

  @IsEmail()
  email!: string;
}

export class CredentialDto {
  @IsNotEmptyObject({ nullable: false })
  identifier!: Identifier;

  @IsString()
  password!: string;
}
