import { buildProviderModule } from "@inversifyjs/binding-decorators";
import { Controller } from "@tsoa/runtime";
import { Container, decorate, injectable } from "inversify";
import { MongoClient } from "mongodb";
import "reflect-metadata";
import { config } from "../config/values.js";

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
iocContainer.loadSync(buildProviderModule());

// export according to convention
export { iocContainer };
