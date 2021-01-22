import { IsString } from 'class-validator';

export class AuthQuery {
  @IsString()
  device_name!: string;
}
