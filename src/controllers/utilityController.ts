import * as express from "express";
import { Controller, Get, Request, Route, Tags } from "tsoa";
import { provide } from "inversify-binding-decorators";

@Route("utility")
@Tags("Utility")
@provide(UtilityController)
export class UtilityController extends Controller {
  @Get("healthcheck")
  public healthCheck() {
    return true;
  }

  @Get("ip")
  public getIp(@Request() request: express.Request) {
    return request.ip;
  }
}
