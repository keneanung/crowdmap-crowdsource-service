import { iocContainer } from "../../src/ioc/ioc.js";
import { ChangeService } from "../../src/services/changeService.js";
import { HealthService } from "../../src/services/healthService.js";
import { MapService } from "../../src/services/mapService.js";
import { UserDbService } from "../../src/services/userDbService.js";
import { MockChangeService } from "../mocks/mockChangeService.js";
import { MockHealthService } from "../mocks/mockHealthService.js";
import { MockUserDbService } from "../mocks/mockUserDbService.js";

export const setupChangeServiceMock = (): void => {
  iocContainer
    .rebind<ChangeService>(ChangeService)
    .toConstantValue(new MockChangeService());
  // MapService is a singleton and captures the change service passed to its
  // constructor. Recreate it with each fresh repository double so test cases
  // cannot share changes or per-project runtime state.
  iocContainer.rebind<MapService>(MapService).toSelf().inSingletonScope();
};

export const setupUserDbServiceMock = (): void => {
  iocContainer
    .rebind<UserDbService>(UserDbService)
    .toConstantValue(new MockUserDbService());
};

export const setupHealthServiceMock = (): void => {
  iocContainer
    .rebind<HealthService>(HealthService)
    .toConstantValue(new MockHealthService());
};
