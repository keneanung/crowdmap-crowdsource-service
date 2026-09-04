import { injectable } from "inversify";
import { HealthService } from "../../src/services/healthService.js";

@injectable()
export class MockHealthService implements HealthService {
  public checkReadiness(): Promise<void> {
    return Promise.resolve();
  }
}
