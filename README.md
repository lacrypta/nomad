<!-- markdownlint-disable-next-line MD033 MD041 -->
<img width="100%" src="./assets/images/logo.png" alt="Nomad logo" />

# Nomad

The Nomad Virtual Machine reference implementation and NIP proposals.

- [**NIP-XX-1: Nomad**](./assets/docs/nip-XX-1/nomad.md).
- [**NIP-XX-2: Nostracts**](./assets/docs/nip-XX-2/nostracts.md).

<!-- markdownlint-disable-next-line MD033 -->
<details><summary>

## Install

</summary>

Simply install via `pnpm`:

```sh
pnpm i --save-dev @lacrypta/nomad
```

</details>

<!-- markdownlint-disable-next-line MD033 -->
<details><summary>

## Development

</summary>

Clone the repository as usual:

```sh
git clone https://github.com/lacrypta/nomad.git
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

</details>

<!-- markdownlint-disable-next-line MD033 -->
<details><summary>

## Usage

</summary>

The [demo](./test/demo/index.html) has a minimal example, but this simply consists of (a variation on):

```html
<!doctype html>
<html lang="en-US">
  <head>
    <meta charset="UTF-8" />
    <title>...</title>
    <script referrerpolicy="no-referrer" src="https://unpkg.com/@lacrypta/nomad"></script>
    <!-- or, alternatively:
    <script referrerpolicy="no-referrer" src="https://cdn.jsdelivr.net/npm/@lacrypta/nomad"></script>
    -->
    <script type="module" referrerpolicy="no-referrer">
      'use strict';

      // take a hold of the relevant entry points
      const { vmCreate, dependencyFrom } = nomad;

      // build a new VM
      const vm = vmCreate();

      // listen on every event cast on it
      vm.on('**', (...args) => console.log(args));

      // define some functions
      // (note how the first closure establishes the dependencies and the returned function uses those same dependencies)
      const duplicate = () =>
        (x) => 2 * x;
      const quadruple = (dupA = duplicate, dupB = duplicate) =>
        (x) => dupA(dupB(x));

      const root = await vm.start();

      console.log('BOOTED');

      await root.install(dependencyFrom(duplicate));
      await root.install(dependencyFrom(quadruple));

      const result = await root.execute(dependencyFrom(
        function x(quad = quadruple) {
          return quad(42);
        }),
      );

      console.log(`RESULT = ${result}`);

      await vm.shutdown();
    </script>
  </head>
  <body></body>
</html>
```

</details>
