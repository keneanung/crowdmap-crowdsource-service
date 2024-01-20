import { inject } from "inversify";
import { provide } from "inversify-binding-decorators";
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
import { ValidateErrorJSON } from "../models/api/error";
import { ChangeResponse } from "../models/api/response";
import { ChangeSubmission } from "../models/api/submission";
import {
  Change,
  ChangeRoomName,
  CreateArea,
  CreateRoom,
  DeleteExit,
  DeleteSpecialExit,
  LockSpecialExit,
  ModifyExitWeight,
  ModifyRoomExit,
  ModifySpecialExit,
  ModifySpecialExitWeight,
  SetRoomArea,
  SetRoomCoordinates,
  UnlockSpecialExit,
} from "../models/business/change";
import { ChangeService } from "../services/changeService";

function assertUnreachable(x: Change): never {
  throw new Error(`Didn't expect to get here ${x.type}`);
}

@Route("change")
@Tags("change")
@provide(ChangeController)
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
        case "modify-exit": {
          const typedChange = change as ModifyRoomExit;
          return {
            type: "modify-exit",
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
        case "lock-special-exit": {
          const typedChange = change as LockSpecialExit;
          return {
            type: "lock-special-exit",
            roomNumber: typedChange.roomNumber,
            reporters: typedChange.reporters.size,
            exitCommand: typedChange.exitCommand,
            destination: typedChange.destination,
          };
        }
        case "unlock-special-exit": {
          const typedChange = change as UnlockSpecialExit;
          return {
            type: "unlock-special-exit",
            roomNumber: typedChange.roomNumber,
            reporters: typedChange.reporters.size,
            exitCommand: typedChange.exitCommand,
            destination: typedChange.destination,
          };
        }
        case "delete-special-exit": {
          const typedChange = change as DeleteSpecialExit;
          return {
            type: "delete-special-exit",
            roomNumber: typedChange.roomNumber,
            reporters: typedChange.reporters.size,
            exitCommand: typedChange.exitCommand,
          };
        }
        case "create-room": {
          const typedChange = change as CreateRoom;
          return {
            type: "create-room",
            roomNumber: typedChange.roomNumber,
            reporters: typedChange.reporters.size,
          };
        }
        case "set-room-coordinates": {
          const typedChange = change as SetRoomCoordinates;
          return {
            type: "set-room-coordinates",
            roomNumber: typedChange.roomNumber,
            reporters: typedChange.reporters.size,
            x: typedChange.x,
            y: typedChange.y,
            z: typedChange.z,
          };
        }
        case "create-area": {
          const typedChange = change as CreateArea;
          return {
            type: "create-area",
            name: typedChange.name,
            areaId: typedChange.areaId,
            reporters: typedChange.reporters.size,
          };
        }
        case "set-room-area": {
          const typedChange = change as SetRoomArea;
          return {
            type: "set-room-area",
            roomNumber: typedChange.roomNumber,
            reporters: typedChange.reporters.size,
            areaId: typedChange.areaId,
          };
        }
        case "delete-exit": {
          const typedChange = change as DeleteExit;
          return {
            type: "delete-exit",
            roomNumber: typedChange.roomNumber,
            reporters: typedChange.reporters.size,
            direction: typedChange.direction,
          };
        }
        case "modify-exit-weight": {
          const typedChange = change as ModifyExitWeight;
          return {
            type: "modify-exit-weight",
            roomNumber: typedChange.roomNumber,
            reporters: typedChange.reporters.size,
            direction: typedChange.direction,
            weight: typedChange.weight,
          };
        }
        case "modify-special-exit-weight": {
          const typedChange = change as ModifySpecialExitWeight;
          return {
            type: "modify-special-exit-weight",
            roomNumber: typedChange.roomNumber,
            reporters: typedChange.reporters.size,
            exitCommand: typedChange.exitCommand,
            weight: typedChange.weight,
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
        case "modify-exit": {
          return new ModifyRoomExit(
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
        case "lock-special-exit": {
          return new LockSpecialExit(
            change.roomNumber,
            [change.reporter],
            change.exitCommand,
            change.destination,
          );
        }
        case "unlock-special-exit": {
          return new UnlockSpecialExit(
            change.roomNumber,
            [change.reporter],
            change.exitCommand,
            change.destination,
          );
        }
        case "delete-special-exit": {
          return new DeleteSpecialExit(
            change.roomNumber,
            [change.reporter],
            change.exitCommand,
          );
        }
        case "create-room": {
          return new CreateRoom(change.roomNumber, [change.reporter]);
        }
        case "set-room-coordinates": {
          return new SetRoomCoordinates(
            change.roomNumber,
            [change.reporter],
            change.x,
            change.y,
            change.z,
          );
        }
        case "create-area": {
          return new CreateArea(change.name, change.areaId, [change.reporter]);
        }
        case "set-room-area": {
          return new SetRoomArea(
            change.roomNumber,
            [change.reporter],
            change.areaId,
          );
        }
        case "delete-exit": {
          return new DeleteExit(
            change.roomNumber,
            [change.reporter],
            change.direction,
          );
        }
        case "modify-exit-weight": {
          return new ModifyExitWeight(
            change.roomNumber,
            [change.reporter],
            change.direction,
            change.weight,
          );
        }
        case "modify-special-exit-weight": {
          return new ModifySpecialExitWeight(
            change.roomNumber,
            [change.reporter],
            change.exitCommand,
            change.weight,
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
