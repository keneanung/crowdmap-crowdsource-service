import { iocContainer } from "../../src/ioc/ioc";
import { ChangeService } from "../../src/services/changeService";
import { UserDbService } from "../../src/services/userDbService";
import { MockChangeService } from "../mocks/mockChangeService";
import { MockUserDbService } from "../mocks/mockUserDbService";

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
