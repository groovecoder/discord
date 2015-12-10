# Setup

Install some dependencies before getting started:

1. Run `npm install`
2. Install a standalone Redis server
    * Mac: Run `brew install redis`
3. Install a standalone PostgreSQL server
    * Mac: Run `brew install postgres`

# Run tests

1. Start the local Redis server
    * Mac: Run `redis-server`
2. Start the local PostgreSQL server
    * Mac: Run `PGDATA=/usr/local/var/postgres postgres`
3. Create the testing database: `createdb discord_test`
4. Run `npm test`
