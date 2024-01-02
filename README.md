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

The service uses MongoDB as storage backend. For example, you can get one hosted Atlas cluster (the MongoDB cloud offering)
with 512MB space for free. The service should not require too much space and compute power.

Set up a dedicated database and service user for the mongo connection and generate a db connection string for that user.
Please refer to the manual of your chosen Mongo setup how to do that.

The database should contain both a `changes` and a `change-counter` collection.

Additionally, the `changeId` requires a insert trigger on the `change` collection to be set up. This was tested on Atlas
with the following code:
```js
exports = async function(changeEvent) {
    var docId = changeEvent.fullDocument._id;
    
    const countercollection = context.services.get("Cluster0").db(changeEvent.ns.db).collection("change-counter");
    const changecollection = context.services.get("Cluster0").db(changeEvent.ns.db).collection(changeEvent.ns.coll);
    
    var counter = await countercollection.findOneAndUpdate({_id: changeEvent.ns },{ $inc: { seq_value: 1 }}, { returnNewDocument: true, upsert : true});
    var updateRes = await changecollection.updateOne({_id : docId},{ $set : {changeId : counter.seq_value}});
    
    console.log(`Updated ${JSON.stringify(changeEvent.ns)} with counter ${counter.seq_value} result : ${JSON.stringify(updateRes)}`);
    };
```

Replace `Cluster0` with your clusters name.

On-Premise Mongo does not seem to support triggers, but alternatives for those deployment types were not explored yet.

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
