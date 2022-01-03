import { ExpressAdapter } from "@nestjs/platform-express";
import { ElectronServer } from "./electron-server";

export class ElectronExpressAdapter extends ExpressAdapter {
    initHttpServer(): void {
        this.httpServer = new ElectronServer(this.getInstance());
    }
}
