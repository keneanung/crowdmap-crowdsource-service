import { inject } from "inversify";
import {
  Body,
  Controller,
  Get,
  Post,
  Response,
  Route,
  SuccessResponse,
} from "tsoa";
import { provideSingleton } from "../ioc/provideSingleton";
import { Change } from "../models/change";
import { ValidateErrorJSON } from "../models/error";
import { ChangeService } from "../services/changeService";

@Route("change")
@provideSingleton(ChangeController)
export class ChangeController extends Controller {
  constructor(@inject(ChangeService) private changeService: ChangeService) {
    super();
  }

  @Get("/")
  public async getChanges(): Promise<Change[]> {
    return this.changeService.getChanges();
  }

  @SuccessResponse("201", "Created")
  @Response<ValidateErrorJSON>(422, "Validation Failed")
  @Post("/")
  public async addChange(@Body() change: Change): Promise<void> {
    this.setStatus(201);
    this.changeService.addChange(change);
  }
}