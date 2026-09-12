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
    .rebindSync<ChangeService>(ChangeService)
    .toConstantValue(new MockChangeService());
  // MapService is a singleton and captures the change service passed to its
  // constructor. Recreate it with each fresh repository double so test cases
  // cannot share changes or per-project runtime state.
  iocContainer.rebindSync<MapService>(MapService).toSelf().inSingletonScope();
};

export const setupUserDbServiceMock = (): void => {
  iocContainer
    .rebindSync<UserDbService>(UserDbService)
    .toConstantValue(new MockUserDbService());
};

export const setupHealthServiceMock = (): void => {
  iocContainer
    .rebindSync<HealthService>(HealthService)
    .toConstantValue(new MockHealthService());
};
