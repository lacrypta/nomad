<!-- markdownlint-disable-next-line MD041 -->
![Nomad Logo](./assets/logo.png)

# NomadVM

The Nomad Virtual Machine reference implementation

## Install

Simply install via `pnpm`:

```sh
pnpm i --save-dev @lacrypta/nomadvm
```

## Development

Clone the repository as usual:

```sh
git clone https://github.com/lacrypta/nomadvm.git
```

now simply install all dependencies:

```sh
pnpm i
```

After you make the changes you intended to, simply run:

```sh
pnpm format
```

to reformat the whole project, or:

```sh
pnpm lint
```

to check if the formatting is correct.

You can run:

```sh
pnpm build
```

to generate the transpiled files in `./dist/cjs`,  `./dist/esm`, and `./dist/umd`, and types in `./dist/types`.

To run the test suite run:

```sh
pnpm test
```

for the "standard" test suite, or:

```sh
pnpm test:meta
```

to test the test helpers themselves, or:

```sh
pnpm test:regression
```

to run the regression tests.

Finally, run:

```sh
pnpm doc
```

to generate the documentation in `./dist/docs`:

- in `./dist/docs/api` you'll find the "end-user" documentation: only the interfaces available to consumers is documented therein.
- in `./dist/docs/internal` you'll find the "maintainer" documentation: every part of the project is documented therein.

If you're feeling lazy, you may run:

```sh
pnpm all
```

and this will reset the project and update all dependencies, and run the formatting, building, testing, and documentation steps described above.
