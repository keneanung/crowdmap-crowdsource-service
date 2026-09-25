# Contributing to the crowdmap service

Contributions of code, documentation, bug reports, and ideas are welcome. The
goal is to make it easier for players to improve shared Mudlet maps without
requiring a Git workflow for every map change.

## Before you start

- Search the existing issues and pull requests before opening a new one.
- For a bug report, include the service version, deployment setup, steps to
  reproduce the problem, expected behaviour, and what happened instead. Do not
  include API keys, reporter values, or other personal data.
- For a larger feature or a change to the public API, configuration format, or
  mapping-client behaviour, open an issue first so the approach can be agreed
  before implementation.

## Development setup

The service requires Node.js 22 or newer and MongoDB. Start with the deployment
and configuration instructions in the [README](README.md), then install the
project dependencies:

```shell
npm install
cp config.example.yaml config.yaml
```

Edit `config.yaml` with suitable local paths and MongoDB settings. It contains
deployment-specific information and must not be committed. Run the development
server with:

```shell
npm run dev
```

## Making a change

Keep changes focused and include tests when behaviour changes. In particular:

- Update the static pages in `website/` when a user-facing workflow changes.
- Keep API controllers, models, and generated OpenAPI routes in sync. The build
  regenerates the routes and specification.
- Add or update Jest tests in `test/` for server-side behaviour.
- Use clear, accessible HTML for website changes; test the page on narrow
  screens as well as desktop widths.

Use [Conventional Commits](https://www.conventionalcommits.org/) for commit
messages and pull request titles. Pull requests are squash-merged, so the title
becomes the commit that Release Please uses to calculate the next version and
build the changelog. Common examples are:

```text
feat(api): add project status endpoint
fix: reject an unknown project host
docs: explain test deployments
```

Use `feat` for a backward-compatible feature, `fix` for a bug fix, and add `!`
or a `BREAKING CHANGE:` footer for an incompatible change. The accepted
maintenance types are `build`, `chore`, `ci`, `docs`, `perf`, `refactor`,
`revert`, `style`, and `test`.

Before opening a pull request, run:

```shell
npm run lint
npm test
```

`npm test` runs the build first. If you only need to compile the project, run
`npm run build`.

## Pull requests

Use a short Conventional Commit title and explain what changed and why. Link
the relevant issue when there is one, describe any configuration or migration
steps, and mention the checks you ran. Keep unrelated formatting or refactoring
out of the pull request where possible; it makes review and future
troubleshooting much easier.

By submitting a contribution, you agree that it may be distributed under this
repository's [MIT License](LICENSE).
