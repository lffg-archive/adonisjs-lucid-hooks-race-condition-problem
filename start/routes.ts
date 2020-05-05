import Application from '@ioc:Adonis/Core/Application';
import Route from '@ioc:Adonis/Core/Route';
import Database from '@ioc:Adonis/Lucid/Database';
import User from 'App/Models/User';
import sqlite3 from 'sqlite3';

const db = new sqlite3.Database(Application.databasePath('db.sqlite3'));

// This will not bring any problems, as the user is updated sequentially.
Route.get('/exec-test-linear', async () => {
  await reset();
  const id = await getId();

  const nums = Array.from({ length: 50 }).map((_, i) => i + 1);

  for (const num of nums) {
    // eslint-disable-next-line no-await-in-loop
    await update(id, num);
  }

  const user = await User.findOrFail(id);

  return {
    failed: user.count !== 50,
    user
  };
});

// This will demonstrate the race condition problem, as in a real world
// scenario, there are no guarantees that the updates are going to be linear, as
// the other (perfect and not real) example showed.
Route.get('/exec-test-parallel', async () => {
  await reset();
  const id = await getId();

  await Promise.all(
    Array.from({ length: 50 })
      .map((_, i) => i + 1)
      .map((num) => update(id, num))
  );

  const user = await User.findOrFail(id);

  return {
    failed: user.count !== 50,
    user
  };
});

Route.get('/exec-test-parallel-done-right', async () => {
  await reset();
  const id = await getId();

  await Promise.all(
    Array.from({ length: 50 })
      .map((_, i) => i + 1)
      .map((num) => updateForConcurrency(id, num))
  );

  const user = await User.findOrFail(id);

  return {
    failed: user.count !== 50,
    user
  };
});

Route.get('/raw-sqlite-parallel', async () => {
  await reset();
  const id = await getId();

  await Promise.all(
    Array.from({ length: 50 })
      .map((_, i) => i + 1)
      .map((num) => updateRaw(id, num))
  );

  const user = await User.findOrFail(id);

  return {
    failed: user.count !== 50,
    user
  };
});

async function updateRaw(id: number, i: number) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM users WHERE id = ? LIMIT ?',
      [id, 1],
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        db.run(
          'UPDATE users SET count = ?, username = ? WHERE id = ?',
          [result.count + 1, `Foo-${i}`, id],
          (error) => {
            if (error) {
              reject(error);
              return;
            }

            resolve();
          }
        );
      }
    );
  });
}

async function update(id: number, i: number) {
  await User.updateOrCreate({ id }, { username: `Foo-${i}` });
  return 'OK';
}

async function updateForConcurrency(id: number, i: number) {
  const trx = await Database.transaction();
  const user = await User.query({ client: trx }).where('id', id).forUpdate().firstOrFail();
  user.username = `Foo-${i}`;
  await user.save();
  await trx.commit();
  return 'OK';
}

// HELPER FUNCTIONS
// ================

function getId() {
  return User.query()
    .select('id')
    .firstOrFail()
    .then(({ id }) => id);
}

async function reset() {
  await User.query().delete();
  await User.create({
    username: 'Foo',
    count: 0
  });

  return 'Done.';
}
