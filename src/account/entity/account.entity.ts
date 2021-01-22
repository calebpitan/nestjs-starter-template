import { modelOptions, prop } from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { timestamps: true, versionKey: false } })
export class Account {
  @prop({ required: true })
  firstname!: string;

  @prop({ required: true })
  lastname!: string;

  @prop({ required: true, unique: true, lowercase: true })
  username!: string;

  @prop({ required: true, unique: true, lowercase: true })
  email!: string;

  @prop({ required: true, select: false })
  password!: string;

  @prop({ default: null })
  avatar?: string;
}
