import { IsMongoId } from 'class-validator';

export class FindOneParam {
  @IsMongoId()
  id!: string;
}
