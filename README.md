# Hex TypeORM fork

An internal fork of typeorm to provide some capabilities not found in our version of typeorm.

This was forked from version `0.2.31`.
The main branch for this fork is `hex-fork`.
The `master` branch tracks the original repository's `master` branch.

### Development

docker

This repo uses `npm` as the package manager.
You need at least version `10.8.2`.

Setup:
- `npm install`
- `docker-compose up -d`
- Verify with `npm run compile && npm run test`

See [`DEVELOPER.md`](./DEVELOPER.md) for original dev setup

### Publishing

- Checkout latest `hex-fork`
- Checkout new branch with name like `hex-fork.3` (check existing branches for what number to use)
- `npm run package`
- `./scripts/make-publish-branch.sh`
- Commit and push branch
- Update the main `hex` repo to use the new branch
