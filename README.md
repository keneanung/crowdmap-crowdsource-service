# A service to make crowdsourcing Mudlet maps easier

The current state of the art for a Mudlet crowdmap is to have a repository, to which crowdmap contributors create Pull Requests
in order to submit changes to the crowdmap. However, this proved to be a major hurdle, since git workflows are generally
hard to understand by those that do not work with them daily.

This service simplifies the process by using a base map and a stream of small atomic map change events to build crowdmaps.
The change events are small enough to be recognizable by the service and group changes that are the same together. This
allows for a vetting mechanism: users choose how often a change has been "seen" to include it in their downloaded maps.

Mapping clients submit atomic changes to `POST /change`. They can source the
vetted binary map from `GET /map?format=binary&timesSeen=N` and its version from
`GET /map/version?timesSeen=N`. The API covers room and area creation, deletion,
and metadata updates as well as normal and special-exit mutations.

## Hosting the service

One process can host one or many independent map projects. MongoDB, users,
privacy pages, sponsorship state, and process observability are platform-wide;
baselines, pending changes, review state, health, and map administration are
scoped to a configured `MapProject`. The same image can still be deployed once
per map, but that is no longer required.

### Prepare dependencies

The service uses MongoDB as storage backend. You can run MongoDB locally (recommended for simple self-hosting) or use any
managed MongoDB provider. A free-tier Atlas cluster will work.

#### Change IDs

The service generates time-sortable UUIDv7 values (via the `uuid` library) for each `changeId`. These identifiers:

- Are globally unique without coordination
- Maintain insertion-time ordering (sufficient for change ordering/version derivation)
- Avoid the need for counters, triggers, or extra coordination mechanisms

Only a single collection named `changes` is required; it is created automatically
on first insert. Every document carries a configured `projectId`, and all reads,
writes, deletes, and unique indexes are compound-scoped by that value. Keeping a
single collection makes index migration and coherent backups less error-prone;
the project-bound repository prevents callers from issuing unscoped operations.

#### Project configuration

All runtime configuration lives in `config.yaml`; the former service environment
variables are not supported. Start from the tracked example:

```shell
cp config.example.yaml config.yaml
chmod 600 config.yaml
```

`projects.resolver: single` requires exactly one definition and needs no DNS
mapping. For multiple projects, select the host resolver and map exact hostnames
to project IDs. Every project must have unique baseline paths:

```yaml
projects:
  resolver: host
  platformHost: maps.example.org
  hosts:
    north.maps.example.org: north
    south.maps.example.org: south
  definitions:
    - id: north
      name: Northern Map
      baseline:
        mapFile: /opt/data/north/map
        versionFile: /opt/data/north/version
      upstream:
        mapUrl: https://maps.example.net/north/map
        versionUrl: https://maps.example.net/north/version
    - id: south
      name: Southern Map
      baseline:
        mapFile: /opt/data/south/map
        versionFile: /opt/data/south/version
      upstream:
        mapUrl: https://maps.example.net/south/map
        versionUrl: https://maps.example.net/south/version
```

Only exact lowercase hostnames in `projects.hosts` resolve to projects;
arbitrary `Host` values are rejected. `projects.platformHost` serves the shared
landing, privacy, and funding experience. Project hosts keep the existing relative
`/map` and `/change` API URLs and use the explorer as their landing page.
Express resolves `X-Forwarded-Host` only through `platform.trustProxy`, so set
that value narrowly to the actual reverse-proxy hop count.

Relative baseline paths are resolved from the directory containing the YAML
file. To use a different filename or location outside Compose, set only the
bootstrap variable `CONFIG_FILE`; it defaults to `config.yaml` in the working
directory.

Do not add a production project called `test`. Run tests as a separate deployment
of the same image with its own Mongo database, volume, host mappings, and secrets.

#### Local MongoDB (Docker Compose)

The provided `compose.yaml` includes a `mongo` service. By default it runs without authentication bound to an internal
Docker network. For production you should enable authentication, restrict network access, or use a managed provider.

Configure the connection under `platform.mongo` in `config.yaml`:

```yaml
platform:
  mongo:
    connectionString: mongodb://mongo:27017
    database: crowdmap
```

If you enable MongoDB authentication, adjust the connection string accordingly, e.g.:
`mongodb://username:password@mongo:27017/?authSource=admin`.

No manual collection creation is necessary.

### Deploy the service

To deploy the service on a Linux machine with the included local MongoDB, place the repository (or just the `compose.yaml`)
on the host and run:

```shell
cp config.example.yaml config.yaml
# Edit every example value, including platform privacy details and the initial key.
$EDITOR config.yaml
chmod 600 config.yaml
docker compose up -d
```

The `platform.privacy` fields are intentionally required. Each deployment is its own
data controller and must publish accurate controller/contact, log-retention,
and processor/transfer information; the source repository never contains a
maintainer's personal address. `platform.privacy.contactUrl` must be an HTTPS contact
page or a `mailto:` URL. If you use a third-country provider, state the country
and transfer safeguard (for example an adequacy decision or SCCs) in
`platform.privacy.processorsAndTransfers`.

The initial key is not written to application logs. It contains a public lookup ID before the `.` and a secret after it, but the complete value is one credential and must be kept secret. Store it in a password manager, use it to create individual administrator accounts, and then remove `platform.initialAdminApiKey` from `config.yaml`. Existing installations that already have an `admin` user do not use this value.

The app will become healthy once both the app and MongoDB healthchecks pass. Access the service on port 3000 by default.

Application logs are newline-delimited JSON. Every HTTP response includes an
`X-Request-ID`, and the matching request log entry contains that ID, status, and
duration. Prometheus-compatible process and HTTP counters are available at
`/utility/metrics`; request paths are deliberately not used as metric labels.

If you prefer using an external/managed MongoDB instance, remove or comment out the `mongo` service in the compose file and
update `platform.mongo.connectionString` and `platform.mongo.database` in the
YAML file.

### Optional Ko-fi sponsorships

Add `platform.sponsorship` to `config.yaml` to enable `/sponsor.html`:

```yaml
platform:
  sponsorship:
    profileUrl: https://ko-fi.com/example
    monthlyGoal: 20
    currency: EUR
    currencyDecimalPlaces: 2
    webhookToken: replace-with-the-ko-fi-verification-token
```

`currencyDecimalPlaces` is the number of minor-unit
digits for the configured currency (default `2` for USD/EUR; set `0` for JPY).
The profile URL must
be an HTTPS `ko-fi.com` URL; the goal is a positive number in the configured
three-letter currency. When no profile is configured, the Sponsor navigation
entry, sponsorship API, and sponsorship page are unavailable.

In Ko-fi, configure a webhook to `https://your-service.example/sponsorship/webhook/kofi`
and use the same verification token as `platform.sponsorship.webhookToken`. The
service accepts Donation and Subscription notifications in the configured currency. It stores
only the amount, currency, received time, remaining sponsorship credit, and a
hash of the payment identifier—never the notification's raw payload or donor
fields. Unused credit carries into later calendar months; at each reset, one
monthly goal is consumed from the outstanding credit. Fully used payment records
are deleted, while the hashed identifier is retained for 30 days to prevent
delayed duplicate webhooks. The current outstanding credit is displayed against
the goal.
The endpoint returns the HTTP `200` response Ko-fi requires before it stops
retrying a notification.

#### Sponsorship tracking limits

Sponsorship progress is an informational, best-effort estimate of operating
cost coverage; it is not a payment ledger or accounting system. The included
standalone MongoDB deployment does not provide multi-document transactions.
Run one application replica when sponsorships are enabled. After an unexpected
process or database failure during a month transition, a delayed duplicate
notification or cleanup can temporarily leave the displayed credit inaccurate
until it is reviewed. Do not use this feature to make financial commitments,
allocate donor benefits, or determine access to a service.

### Review map changes

Open `/review.html` to inspect pending reports. The review workspace can search
and filter changes, highlights changes that touch or depend on the same map
target, and previews one or more selected changes against the current baseline.
Each related-change hint identifies the other report and explains the shared
target or dependency. These relationships are review hints rather than
automatic conflict decisions.

After publishing a new upstream map/version pair, mark only reports already
represented by that pair and apply the baseline update with a `map_admin` API
key assigned to that project. Project assignments are stored in
`mapAdminProjects`; `site_admin` remains platform-wide and may administer every
project. A legacy `map_admin` is migrated to the sole configured project during
a single-project startup. The key remains in page memory and is not stored in browser storage. The
server verifies the displayed baseline version, validates the downloaded pair,
and compares every pending report with the old and downloaded maps before
replacing the baseline. Reports already satisfied by the downloaded map are
removed automatically. Reports whose target changed upstream to a different
value remain pending and are flagged for the current review with the upstream
baseline version and a reason. A baseline update can also be applied with nothing marked when the
upstream update is unrelated to pending reports.

### Back up and restore

The YAML configuration, MongoDB data, and every configured project baseline
`map`/`version` pair form one recovery unit.
Restoring only one side can reapply changes that were already incorporated into
the baseline. The included Compose setup persists them in the `mongo-data` and
`map-data` volumes.

For a small Compose deployment, stop the app while taking a consistent backup:

```shell
backup_dir="backup-$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$backup_dir"
docker compose stop app
docker compose exec -T mongo mongodump --db crowdmap --archive --gzip > "$backup_dir/mongo.archive.gz"
docker compose cp app:/opt/data "$backup_dir/data"
cp config.yaml "$backup_dir/config.yaml"
chmod 600 "$backup_dir/config.yaml"
docker compose start app
```

Verify that the Mongo archive and every configured baseline pair exist and retain them according to your recovery
policy. Automate this process and test restores regularly. Managed MongoDB users
should use a provider snapshot while the app is stopped, and archive the complete
baseline data directory from the same maintenance window.

To restore into an existing Compose deployment, first back up its current state.
Then stop the app and restore the complete recovery set before starting it again:

```shell
backup_dir="backup-YYYYMMDDTHHMMSSZ"
docker compose stop app
cp "$backup_dir/config.yaml" config.yaml
chmod 600 config.yaml
docker compose exec -T mongo mongorestore --drop --archive --gzip < "$backup_dir/mongo.archive.gz"
docker compose cp "$backup_dir/data/." app:/opt/data
docker compose run --rm --no-deps --user root app chown -R node:node /opt/data
docker compose start app
docker compose exec -T mongo mongosh crowdmap --quiet --eval 'db.runCommand({ ping: 1 }).ok'
curl --fail http://localhost:3000/utility/healthcheck
```

Do not start the app after a partial restore. If any restore command fails, leave
it stopped, correct the failure, and restore the complete recovery unit again.

#### Safe migration from older releases

At startup, legacy `changes` without `projectId` and legacy `map_admin` users
without project assignments are migrated only when exactly one project is
configured. If more than one project makes assignment ambiguous, startup fails
with instructions to run the image once in single-project mode, verify the
assignment, and only then enable multi-project configuration. No legacy records
are deleted. Old global unique indexes are replaced after document migration
with project-compound indexes.

The container health check covers required platform dependencies such as MongoDB.
`GET /utility/status` additionally reports every configured project as `ok` or
`unavailable`; one broken baseline does not make healthy project hosts unavailable.

## Contributing

For code setup and contribution guidelines, see [the Contribution file](CONTRIBUTING.md).
