import { provide } from "@inversifyjs/binding-decorators";
import * as express from "express";
import { inject } from "inversify";
import { Controller, Get, Produces, Request, Route, Tags } from "tsoa";
import { ServiceUnavailableError } from "../models/api/error.js";
import { renderMetrics } from "../observability.js";
import { HealthService } from "../services/healthService.js";

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

  @Get("metrics")
  @Produces("text/plain")
  public getMetrics(): string {
    this.setHeader("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
    return renderMetrics();
  }
}
