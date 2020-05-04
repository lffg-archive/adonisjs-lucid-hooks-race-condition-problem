import Route from '@ioc:Adonis/Core/Route';
import User from 'App/Models/User';

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

async function update(id: number, i: number) {
  await User.updateOrCreate({ id }, { username: `Foo-${i}` });
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
