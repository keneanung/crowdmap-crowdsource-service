import { inject } from "inversify";
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Response,
  Route,
  SuccessResponse,
  Tags,
} from "tsoa";
import { provideSingleton } from "../ioc/provideSingleton";
import { ValidateErrorJSON } from "../models/api/error";
import { ChangeResponse } from "../models/api/response";
import { ChangeSubmission } from "../models/api/submission";
import { AddRoomExit, Change, ChangeRoomName, ModifySpecialExit } from "../models/business/change";
import { ChangeService } from "../services/changeService";

function assertUnreachable(x: Change): never {
  throw new Error(`Didn't expect to get here ${x.type}`);
}

@Route("change")
@Tags("change")
@provideSingleton(ChangeController)
export class ChangeController extends Controller {
  constructor(@inject(ChangeService) private changeService: ChangeService) {
    super();
  }

  /**
   * Get all changes that are applied to the base map file. You can configure, how many different people must have vetted the changes by setting the `timesSeen` parameter.
   * @param timesSeen How often a change has to be seen by different people to return the change.
   * @returns All changes to the map that are considered vetted by the `timesSeen` amount.
   */
  @Get("/")
  public async getChanges(@Query() timesSeen = 0): Promise<ChangeResponse[]> {
    const changes = await this.changeService.getChanges(timesSeen);
    return changes.map((change) => {
      switch (change.type) {
        case "room-name": {
          const typedChange = change as ChangeRoomName;
          return {
            type: "room-name",
            roomNumber: typedChange.roomNumber,
            reporters: typedChange.reporters.size,
            name: typedChange.name,
          };
        }
        case "add-exit": {
          const typedChange = change as AddRoomExit;
          return {
            type: "add-exit",
            roomNumber: typedChange.roomNumber,
            reporters: typedChange.reporters.size,
            direction: typedChange.direction,
            destination: typedChange.destination,
          };
        }
        case "modify-special-exit": {
          const typedChange = change as ModifySpecialExit;
          return {
            type: "modify-special-exit",
            roomNumber: typedChange.roomNumber,
            reporters: typedChange.reporters.size,
            exitCommand: typedChange.exitCommand,
            destination: typedChange.destination,
          };
        }
        default: {
          return assertUnreachable(change);
        }
      }
    });
  }

  /**
   * Adds/registers a change to the base map file.
   * @param change The change that should be registered.
   */
  @SuccessResponse("201", "Created")
  @Response<ValidateErrorJSON>(422, "Validation Failed")
  @Post("/")
  public async addChange(@Body() change: ChangeSubmission): Promise<void> {
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
        case "modify-special-exit": {
          return new ModifySpecialExit(
            change.roomNumber,
            [change.reporter],
            change.exitCommand,
            change.destination,
          );
        }
        default: {
          return assertUnreachable(change);
        }
      }
    })();
    await this.changeService.addChange(businessChange);
  }
}
