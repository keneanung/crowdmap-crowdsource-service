import { provide } from "@inversifyjs/binding-decorators";
import { inject } from "inversify";
import { MongoClient } from "mongodb";
import { config } from "../config/values.js";
import { MapService } from "./mapService.js";

export abstract class HealthService {
  abstract checkReadiness(): Promise<void>;
}

@provide(HealthService)
export class ServiceHealthService implements HealthService {
  constructor(
    @inject(MongoClient) private readonly mongo: MongoClient,
    @inject(MapService) private readonly mapService: MapService,
  ) {}

  public async checkReadiness(): Promise<void> {
    await this.mongo.connect();
    await Promise.all([
      this.mongo.db(config.dbName).command({ ping: 1 }),
      this.mapService.validateBaseline(),
    ]);
  }
}
