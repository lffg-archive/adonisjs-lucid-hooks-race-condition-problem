import { BaseModel, column, beforeUpdate } from '@ioc:Adonis/Lucid/Orm';
import { DateTime } from 'luxon';

export default class User extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column()
  public username: string;

  @column()
  public count?: number = 0;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @beforeUpdate()
  public static async incrementCount(user: User) {
    if (typeof user.count !== 'number') {
      throw new Error('Error: `user.count` is undefined.');
    }

    console.log('@previous', user.count);
    user.count = user.count + 1;
    console.log('@next', user.count);
    console.log('---');
  }
}
