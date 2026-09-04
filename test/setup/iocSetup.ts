import { iocContainer } from "../../src/ioc/ioc.js";
import { ChangeService } from "../../src/services/changeService.js";
import { HealthService } from "../../src/services/healthService.js";
import { UserDbService } from "../../src/services/userDbService.js";
import { MockChangeService } from "../mocks/mockChangeService.js";
import { MockHealthService } from "../mocks/mockHealthService.js";
import { MockUserDbService } from "../mocks/mockUserDbService.js";

export const setupChangeServiceMock = (): void => {
  iocContainer
    .rebindSync<ChangeService>(ChangeService)
    .toConstantValue(new MockChangeService());
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
