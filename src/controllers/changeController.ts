import * as express from "express";
import { inject } from "inversify";
import { provide } from "@inversifyjs/binding-decorators";
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
  ValidateError,
} from "tsoa";
import {
  AuthorizationError,
  ConflictError,
  ValidateErrorJSON,
} from "../models/api/error";
import { ChangeResponse } from "../models/api/response";
import {
  ApplicationSubmission,
  ChangeSubmission,
} from "../models/api/submission";
import {
  Change,
  ChangeRoomName,
  CreateArea,
  CreateRoom,
  DeleteExit,
  DeleteRoomUserData,
  DeleteSpecialExit,
  LockSpecialExit,
  ModifyExitWeight,
  ModifyRoomExit,
  ModifyRoomUserData,
  ModifySpecialExit,
  ModifySpecialExitWeight,
  SetRoomArea,
  SetRoomCoordinates,
  SetRoomEnvironment,
  UnlockSpecialExit,
} from "../models/business/change";
import { User } from "../models/business/user";
import { ChangeService } from "../services/changeService";
import { MapService } from "../services/mapService";

function assertUnreachable(x: Change): never {
  throw new Error(`Didn't expect to get here ${x.type}`);
}

@Route("change")
@Tags("change")
@provide(ChangeController)
export class ChangeController extends Controller {
  constructor(
    @inject(ChangeService) private changeService: ChangeService,
    @inject(MapService) private mapService: MapService,
  ) {
    super();
  }

  /**
   * Get all changes that are applied to the base map file. You can configure, how many different people must have vetted the changes by setting the `timesSeen` parameter.
   * @param timesSeen How often a change has to be seen by different people to return the change.
   * @param include Only include changes with the given changeIds.
   * @param exclude Exclude changes with the given changeIds.
   * @returns All changes to the map that are considered vetted by the `timesSeen` amount.
   */
  @Get("/")
  public async getChanges(
    @Query() timesSeen = 0,
    @Query() include: string[] = [],
    @Query() exclude: string[] = [],
  ): Promise<ChangeResponse[]> {
    if (include.length > 0 && exclude.length > 0) {
      throw new ValidateError(
        {
          include: {
            message: "Unable to include and exclude changes at the same time",
          },
          exclude: {
            message: "Unable to include and exclude changes at the same time",
          },
        },
        "Cannot include and exclude changes at the same time",
      );
    }
    const changes = await this.changeService.getChanges(
      timesSeen,
      include,
      exclude,
    );
    this.setHeader(
      "X-Map-Version",
      await this.mapService.getVersion(timesSeen),
    );
    this.setHeader("X-Map-Version-Raw", await this.mapService.getRawVersion());
    return changes.map((change) => {
      if (!change.changeId) {
        throw new Error("Change does not have a changeId");
      }
      switch (change.type) {
        case "room-name": {
          const typedChange = change as ChangeRoomName;
          return {
            type: "room-name",
            roomNumber: typedChange.roomNumber,
            reporters: typedChange.reporters.size,
            name: typedChange.name,
            changeId: typedChange.changeId,
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
            changeId: typedChange.changeId,
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
            changeId: typedChange.changeId,
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
            changeId: typedChange.changeId,
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
            changeId: typedChange.changeId,
          };
        }
        case "delete-special-exit": {
          const typedChange = change as DeleteSpecialExit;
          return {
            type: "delete-special-exit",
            roomNumber: typedChange.roomNumber,
            reporters: typedChange.reporters.size,
            exitCommand: typedChange.exitCommand,
            changeId: typedChange.changeId,
          };
        }
        case "create-room": {
          const typedChange = change as CreateRoom;
          return {
            type: "create-room",
            roomNumber: typedChange.roomNumber,
            reporters: typedChange.reporters.size,
            changeId: typedChange.changeId,
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
            changeId: typedChange.changeId,
          };
        }
        case "create-area": {
          const typedChange = change as CreateArea;
          return {
            type: "create-area",
            name: typedChange.name,
            areaId: typedChange.areaId,
            reporters: typedChange.reporters.size,
            changeId: typedChange.changeId,
          };
        }
        case "set-room-area": {
          const typedChange = change as SetRoomArea;
          return {
            type: "set-room-area",
            roomNumber: typedChange.roomNumber,
            reporters: typedChange.reporters.size,
            areaId: typedChange.areaId,
            changeId: typedChange.changeId,
          };
        }
        case "delete-exit": {
          const typedChange = change as DeleteExit;
          return {
            type: "delete-exit",
            roomNumber: typedChange.roomNumber,
            reporters: typedChange.reporters.size,
            direction: typedChange.direction,
            changeId: typedChange.changeId,
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
            changeId: typedChange.changeId,
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
            changeId: typedChange.changeId,
          };
        }
        case "set-room-environment": {
          const typedChange = change as SetRoomEnvironment;
          return {
            type: "set-room-environment",
            roomNumber: typedChange.roomNumber,
            reporters: typedChange.reporters.size,
            environmentId: typedChange.environmentId,
            changeId: typedChange.changeId,
          };
        }
        case "modify-room-user-data": {
          const typedChange = change as ModifyRoomUserData;
          return {
            type: "modify-room-user-data",
            roomNumber: typedChange.roomNumber,
            reporters: typedChange.reporters.size,
            key: typedChange.key,
            value: typedChange.value,
            changeId: typedChange.changeId,
          };
        }
        case "delete-room-user-data": {
          const typedChange = change as DeleteRoomUserData;
          return {
            type: "delete-room-user-data",
            roomNumber: typedChange.roomNumber,
            reporters: typedChange.reporters.size,
            key: typedChange.key,
            changeId: typedChange.changeId,
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
        case "set-room-environment": {
          return new SetRoomEnvironment(
            change.roomNumber,
            [change.reporter],
            change.environmentId,
          );
        }
        case "modify-room-user-data": {
          return new ModifyRoomUserData(
            change.roomNumber,
            [change.reporter],
            change.key,
            change.value,
          );
        }
        case "delete-room-user-data": {
          return new DeleteRoomUserData(
            change.roomNumber,
            [change.reporter],
            change.key,
          );
        }
        default: {
          return assertUnreachable(change);
        }
      }
    })();
    await this.changeService.addChange(businessChange);
  }

  /**
   * Apply changes to the base map file. This will apply all changes listed in the submission.
   *
   * @param application The application that should be applied to the base map file.
   */
  @Post("/apply")
  @Security("api_key")
  @Response<AuthorizationError>(403, "Authorization Error")
  @Response<ConflictError>(
    409,
    "The map version provided does not match the current map version",
  )
  public async applyChanges(
    @Request() request: express.Request & { user: User },
    @Body() application: ApplicationSubmission,
  ): Promise<void> {
    if (!request.user.roles.includes("map_admin")) {
      throw new AuthorizationError("Access Denied");
    }
    const serverVersion = await this.mapService.getRawVersion();
    if (application.version !== serverVersion) {
      throw new ConflictError(
        "The map version provided does not match the current map version",
      );
    }
    await this.changeService.applyChanges(application.obsoleteChanges);
    await this.mapService.updateMap();
  }
}
