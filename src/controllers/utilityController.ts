import { Controller, Get, Route, Tags, Request } from "tsoa";
import * as express from "express";
import { provideSingleton } from "../ioc/provideSingleton";

@Route("utility")
@Tags("Utility")
@provideSingleton(UtilityController)
export class UtilityController extends Controller{

  @Get("healthcheck")
  public healthCheck() {
    return true;
  }

  @Get("ip")
  public getIp(@Request() request: express.Request) {
    return request.ip;
  }
}