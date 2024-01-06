import { iocContainer } from "../src/ioc/ioc";
import { ChangeService } from "../src/services/changeService";
import { MockChangeService } from "./mocks/mockChangeService";

export const setupChangeServiceMock = (): void => {
  iocContainer
    .rebind<ChangeService>(ChangeService)
    .to(MockChangeService)
    .inSingletonScope();
};
