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
import { ValidateErrorJSON } from "../models/api/error";
import { ChangeResponse } from "../models/api/response";
import { ChangeSubmission } from "../models/api/submission";
import { AddRoomExit, Change, ChangeRoomName } from "../models/business/change";
import { ChangeService } from "../services/changeService";

function assertUnreachable(x: Change): never {
  throw new Error(`Didn't expect to get here ${x.type}`);
}

@Route("change")
@provideSingleton(ChangeController)
export class ChangeController extends Controller {
  constructor(@inject(ChangeService) private changeService: ChangeService) {
    super();
  }

  @Get("/")
  public getChanges(): ChangeResponse[] {
    const changes = this.changeService.getChanges();
    return changes.map((change) => {
      switch (change.type) {
        case "room-name": {
          const typedChange = change as ChangeRoomName;
          return {
            type: "room-name",
            roomNumber: typedChange.roomNumber,
            reporters: typedChange.reporters.length,
            name: typedChange.name,
          };
        }
        case "add-exit": {
          const typedChange = change as AddRoomExit;
          return {
            type: "add-exit",
            roomNumber: typedChange.roomNumber,
            reporters: typedChange.reporters.length,
            direction: typedChange.direction,
            destination: typedChange.destination,
          };
        }
        default: {
          return assertUnreachable(change);
        }
      }
    });
  }

  @SuccessResponse("201", "Created")
  @Response<ValidateErrorJSON>(422, "Validation Failed")
  @Post("/")
  public addChange(@Body() change: ChangeSubmission): void {
    this.setStatus(201);
    const businessChange = (() => {
      switch (change.type) {
        case "room-name": {
          return new ChangeRoomName(
            change.roomNumber,
            [change.reporter],
            change.name,
          );
        }
        case "add-exit": {
          return new AddRoomExit(
            change.roomNumber,
            [change.reporter],
            change.direction,
            change.destination,
          );
        }
        default: {
          return assertUnreachable(change);
        }
      }
    })();
    this.changeService.addChange(businessChange);
  }
}
