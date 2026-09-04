import { iocContainer } from "../../src/ioc/ioc";
import { ChangeService } from "../../src/services/changeService";
import { UserDbService } from "../../src/services/userDbService";
import { MockChangeService } from "../mocks/mockChangeService";
import { MockUserDbService } from "../mocks/mockUserDbService";
import { HealthService } from "../../src/services/healthService";
import { MockHealthService } from "../mocks/mockHealthService";

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
