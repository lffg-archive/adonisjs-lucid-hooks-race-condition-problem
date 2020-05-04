import Route from '@ioc:Adonis/Core/Route';
import User from 'App/Models/User';

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
