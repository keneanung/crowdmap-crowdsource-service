# A service to make crowdsourcing Mudlet maps easier

The current state of the art for a Mudlet crowdmap is to have a repository, to which crowdmap contributors create Pull Requests
in order to submit changes to the crowdmap. However, this proved to be a major hurdle, since git workflows are generally
hard to understand by those that do not work with them daily.

This service simplifies the process by using a base map and a stream of small atomic map change events to build crowdmaps.
The change events are small enough to be recognizable by the service and group changes that are the same together. This
allows for a vetting mechanism: users choose how often a change has been "seen" to include it in their downloaded maps.

## Hosting the service

The service needs to be hosted separately for each different map. To make this easier, it is distributed in form of a
configurable docker image. A sample docker compose file with all variables can be found within the repository.

### Prepare dependencies

The service uses MongoDB as storage backend. You can run MongoDB locally (recommended for simple self-hosting) or use any
managed MongoDB provider. A free-tier Atlas cluster will work.

#### Change IDs

The service generates time-sortable UUIDv7 values (via the `uuid` library) for each `changeId`. These identifiers:

* Are globally unique without coordination
* Maintain insertion-time ordering (sufficient for change ordering/version derivation)
* Avoid the need for counters, triggers, or extra coordination mechanisms

Only a single collection named `changes` is required; it is created automatically on first insert.

#### Local MongoDB (Docker Compose)

The provided `compose.yaml` includes a `mongo` service. By default it runs without authentication bound to an internal
Docker network. For production you should enable authentication, restrict network access, or use a managed provider.

Connection details used by the app service (defaults in the compose file):
* MONGO_CONNECTION_STRING = mongodb://mongo:27017
* MONGO_DB_NAME = crowdmap

You can override these via environment variables or by editing the compose file.

If you enable MongoDB authentication, adjust the connection string accordingly, e.g.:
`mongodb://username:password@mongo:27017/?authSource=admin`.

No manual collection creation is necessary.

### Deploy the service

To deploy the service on a Linux machine with the included local MongoDB, place the repository (or just the `compose.yaml`)
on the host and run:

```shell
export INITIAL_ADMIN_API_KEY="cm1_$(uuidgen).$(openssl rand -hex 32)"
docker compose up -d
```

The initial key is not written to application logs. It contains a public lookup ID before the `.` and a secret after it, but the complete value is one credential and must be kept secret. Store it in a password manager, use it to create individual administrator accounts, and then remove `INITIAL_ADMIN_API_KEY` from the deployment environment. Existing installations that already have an `admin` user do not use this value.

The app will become healthy once both the app and MongoDB healthchecks pass. Access the service on port 3000 by default.

Application logs are newline-delimited JSON. Every HTTP response includes an
`X-Request-ID`, and the matching request log entry contains that ID, status, and
duration. Prometheus-compatible process and HTTP counters are available at
`/utility/metrics`; request paths are deliberately not used as metric labels.

If you prefer using an external/managed MongoDB instance, remove or comment out the `mongo` service in the compose file and
set the environment variables `MONGO_CONNECTION_STRING` and `MONGO_DB_NAME` appropriately (either by editing the compose
file or providing a `.env`).

### Back up and restore

The MongoDB data and the baseline `map`/`version` files form one recovery unit.
Restoring only one side can reapply changes that were already incorporated into
the baseline. The included Compose setup persists them in the `mongo-data` and
`map-data` volumes.

For a small Compose deployment, stop the app while taking a consistent backup:

```shell
backup_dir="backup-$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$backup_dir"
docker compose stop app
docker compose exec -T mongo mongodump --db crowdmap --archive --gzip > "$backup_dir/mongo.archive.gz"
docker compose cp app:/opt/data/map "$backup_dir/map"
docker compose cp app:/opt/data/version "$backup_dir/version"
docker compose start app
```

Verify that all three files exist and retain them according to your recovery
policy. Automate this process and test restores regularly. Managed MongoDB users
should use a provider snapshot while the app is stopped, and archive the two
baseline files from the same maintenance window.

To restore into an existing Compose deployment, first back up its current state.
Then stop the app and restore all three artifacts before starting it again:

```shell
backup_dir="backup-YYYYMMDDTHHMMSSZ"
docker compose stop app
docker compose exec -T mongo mongorestore --drop --archive --gzip < "$backup_dir/mongo.archive.gz"
docker compose cp "$backup_dir/map" app:/opt/data/map
docker compose cp "$backup_dir/version" app:/opt/data/version
docker compose run --rm --no-deps --user root app chown node:node /opt/data/map /opt/data/version
docker compose start app
docker compose exec -T mongo mongosh crowdmap --quiet --eval 'db.runCommand({ ping: 1 }).ok'
curl --fail http://localhost:3000/utility/healthcheck
```

Do not start the app after a partial restore. If any restore command fails, leave
it stopped, correct the failure, and restore the complete recovery unit again.

## Contributing

For code setup and contribution guidelines, see [the Contribution file](CONTRIBUTING.md).
