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
docker compose up -d
```

The app will become healthy once both the app and MongoDB healthchecks pass. Access the service on port 3000 by default.

If you prefer using an external/managed MongoDB instance, remove or comment out the `mongo` service in the compose file and
set the environment variables `MONGO_CONNECTION_STRING` and `MONGO_DB_NAME` appropriately (either by editing the compose
file or providing a `.env`).

## Contributing

For code setup and contribution guidelines, see [the Contribution file](CONTRIBUTING.md).
