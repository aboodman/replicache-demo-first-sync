// This file defines our Todo domain type in TypeScript, and a related helper
// function to get all Todos. You'd typically have one of these files for each
// domain object in your application.

import type {ReadTransaction} from 'replicache';

export type Todo = {
  id: string;
  text: string;
  completed: boolean;
  sort: number;
};

export type TodoUpdate = Partial<Todo> & Pick<Todo, 'id'>;

export async function listTodos(tx: ReadTransaction) {
  return (await tx
    .scan({
      start: {
        // Our todos are have IDs with the alphabet [a-zA-Z0-9-_],
        // so start scanning at -.
        key: '-',
        exclusive: false,
      },
    })
    .values()
    .toArray()) as Todo[];
}
