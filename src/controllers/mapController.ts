import { Controller, Get, Produces, Route } from "tsoa";
import { provideSingleton } from "../ioc/provideSingleton";
import { Readable } from "stream";
import * as fs from "fs";

@Route("map")
@provideSingleton(MapController)
export class MapController extends Controller{

    @Get("/")
    @Produces("application/octet-stream")
    public async getMap(): Promise<Readable> {
        this.setHeader("Content-Type", "application/octet-stream")
        this.setHeader("Content-Disposition", "attachment; filename=map.html")
        
        const s = fs.createReadStream(__dirname + "/index.html")
        s.on("close", () => {
            fs.unlink(__dirname + "/index.html", ()=>{})
        })
        return s;
    }

}