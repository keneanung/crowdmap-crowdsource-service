import { buildProviderModule } from "@inversifyjs/binding-decorators";
import { Controller } from "@tsoa/runtime";
import { Container, decorate, injectable } from "inversify";
import { MongoClient } from "mongodb";
import "reflect-metadata";
import { config } from "../config/values.js";
import {
  mongoConnectionCheckedIn,
  mongoConnectionCheckedOut,
  mongoConnectionCheckoutFailed,
  mongoConnectionClosed,
  mongoConnectionCreated,
} from "../observability.js";

// Create a new container tsoa can use
const iocContainer = new Container();

decorate(injectable(), Controller); // Makes tsoa's Controller injectable

const scope = iocContainer
  .bind(MongoClient)
  .toDynamicValue(() => {
    if (!config.connectionString) {
      throw new Error("Missing connection string");
    }
    const mongo = new MongoClient(config.connectionString);
    mongo.on("connectionCreated", mongoConnectionCreated);
    mongo.on("connectionClosed", (event) => {
      mongoConnectionClosed(event.address, event.connectionId);
    });
    mongo.on("connectionCheckedOut", (event) => {
      mongoConnectionCheckedOut(
        event.address,
        event.connectionId,
        event.durationMS,
      );
    });
    mongo.on("connectionCheckedIn", (event) => {
      mongoConnectionCheckedIn(event.address, event.connectionId);
    });
    mongo.on("connectionCheckOutFailed", (event) => {
      mongoConnectionCheckoutFailed(event.durationMS);
    });
    return mongo;
  })
  .inSingletonScope();
scope.onDeactivation(async (mongo) => {
  await mongo.close();
});

// make inversify aware of inversify-binding-decorators
iocContainer.load(buildProviderModule());

// export according to convention
export { iocContainer };
