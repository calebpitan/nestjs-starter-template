import { IsNumberString } from 'class-validator';

export class FindAllQuery {
  @IsNumberString()
  offset?: number;

  @IsNumberString()
  limit?: number;
}
