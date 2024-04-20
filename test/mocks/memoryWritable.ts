import { Writable } from "stream";

export class WriteMemory extends Writable {
  public buffer: string;

  constructor() {
    super();
    this.buffer = "";
  }

  _write(chunk: string, _: unknown, next: () => void) {
    this.buffer += chunk;
    next();
  }

  reset() {
    this.buffer = "";
  }
}
