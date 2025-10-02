# A service to makae crowdsourcing Mudlet maps easier

The current state of art for Mudlet crowdmap is to have a repository, to which crowdmap contributors create Pull Requests
in order to submit changes to the crowdmap. However, this proved to be a major hurdle, since git workflows are generally
hard to understand by those that do not work with them daily.

This service simplifies the process by using a base map and a stream of small atomic map change events to build crowdmaps.
The change events are small enough to be "recongizable" by the service and group changes that are the same together. This
allows for a vetting mechanism: users choose how often a change has been "seen" to include it in their downloaded maps.

## Hosting the service

The service needs to be hosted separately for each different map. To make this easier, it is distributed in form of a
configurable docker image. A sample docker compose file with all variables can be found within the repository.

### Prepare dependencies

The service uses MongoDB as storage backend. This can be any MongoDB deployment including:
- Self-hosted MongoDB instances
- MongoDB Atlas (MongoDB's cloud offering)
- Other MongoDB cloud providers
- Docker containers running MongoDB

The service should not require too much space and compute power.

Set up a dedicated database and service user for the mongo connection and generate a db connection string for that user.
Please refer to the manual of your chosen Mongo setup how to do that.

The database should contain a `changes` collection. The service will automatically create this collection if it doesn't exist.

**Change ID Generation**: The service uses UUID v7 for change IDs, which are:
- Locally generated (no database triggers required)
- Time-orderable for consistent sorting
- Collision-resistant for distributed environments
- Compatible with any MongoDB deployment

### Deploy the service

To deploy the service on a linux machine, you can use the following commands using `curl` and `docker compose`:
```shell
$ touch .env
# the .env file needs to contain the mongo DB connection string from the step before and the mongo database name
$ curl -o compose.yaml https://raw.githubusercontent.com/keneanung/crowdmap-crowdsource-service/main/compose.yaml
# modify the variables inside the compose to your needs
$ docker compose up -d
```

## Contributing

For code setup and contribution guidelines, see [the Contribution file](CONTRIBUTING.md).
