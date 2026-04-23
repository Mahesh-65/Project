# Database Assets (MongoDB)

This folder is now fully MongoDB-native.

## Structure

- `schemas/`: collection contracts and index definitions in JSON
- `migrations/`: JavaScript migration scripts (Mongo shell / Node driver style)
- `seeds/`: seed script for local/dev environments
- `backups/`: backup artifact placeholder directory

## Service Databases

- `user_db`
- `player_db`
- `team_db`
- `tournament_db`
- `ground_db`
- `shop_db`
- `admin_db`

## Running Seeds

From project root (with Mongo running):

- `Get-Content database/seeds/seed.mongo.js | docker compose exec -T mongo mongosh`

Or open `mongosh` and run the script manually.

## Migration Approach

- Keep migrations idempotent.
- Add a new numbered file per change in `migrations/`.
- Each migration should create required indexes and backfill documents safely.
