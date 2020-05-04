# AdonisJs Lucid Hooks Race Condition Problem

I created this repository in order to demonstrate a race condition problem that Lucid Hooks are susceptible for. As you can check in `start/routes.ts` file, when a lucid model with a hook is updated multiple times at once, the hook does not "catch" the new states, causing a race condition problem.

If you start a server and go to http://localhost:3333/exec-test-linear, you will see that the `count` field matches the times that the record was updated (50). However, when the record is updated at the same time (I've used `Promise.all` to achieve that), the hook suffers from a race-condition problem.

You can test for this wrong behavior at http://localhost:3333/exec-test-parallel.

I think that a type of FIFO queue should be implemented to avoid this kind of problems.
