import * as express from "express";
import { provide } from "@inversifyjs/binding-decorators";
import { inject } from "inversify";
import { Controller, Get, Request, Route, Tags } from "tsoa";
import { ServiceUnavailableError } from "../models/api/error";
import { HealthService } from "../services/healthService";

@Route("utility")
@Tags("Utility")
@provide(UtilityController)
export class UtilityController extends Controller {
  constructor(@inject(HealthService) private healthService: HealthService) {
    super();
  }

  @Get("healthcheck")
  public async healthCheck(): Promise<{ status: "ok" }> {
    try {
      await this.healthService.checkReadiness();
    } catch (error) {
      throw new ServiceUnavailableError("Service is not ready", {
        cause: error,
      });
    }
    return { status: "ok" };
  }

  @Get("ip")
  public getIp(@Request() request: express.Request) {
    return request.ip;
  }
}
