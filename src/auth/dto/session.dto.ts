import { IsUUID } from 'class-validator';

export class RevokeSessionDto {
  @IsUUID(4)
  sid!: string;
}
