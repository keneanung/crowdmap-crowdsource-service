import * as express from "express";
import { Controller, Get, Request, Route, Tags } from "tsoa";
import { provideSingleton } from "../ioc/provideSingleton";

@Route("utility")
@Tags("Utility")
@provideSingleton(UtilityController)
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
