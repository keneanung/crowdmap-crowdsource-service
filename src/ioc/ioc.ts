import { Container, decorate, injectable } from "inversify";
import { buildProviderModule } from "inversify-binding-decorators";
import { MongoClient } from "mongodb";
import "reflect-metadata";
import { Controller } from "tsoa";
import { config } from "../config/values";

// Create a new container tsoa can use
const iocContainer = new Container();

decorate(injectable(), Controller); // Makes tsoa's Controller injectable

const scope = iocContainer
  .bind(MongoClient)
  .toDynamicValue(() => {
    if (!config.connectionString) {
      throw new Error("Missing connection string");
    }
    return new MongoClient(config.connectionString);
  })
  .inSingletonScope();
scope.onDeactivation(async (mongo) => {
  await mongo.close();
});

// make inversify aware of inversify-binding-decorators
iocContainer.load(buildProviderModule());

// export according to convention
export { iocContainer };
