import { Server } from "http";
import { app, protocol } from "electron";
import { AddressInfo, ListenOptions } from "net";
import { ElectronIncomingMessage } from "./electron-incoming-message";
import { ElectronServerResponse } from "./electron-server-response";

function normalizeListenArgs(args): [ListenOptions, (() => void)?] {
    if (args.length === 0) {
        return [{ port: 0, host: "localhost" }];
    }

    const cb: (() => void) | undefined =
        typeof args[args.length - 1] === "function" ? args.pop() : undefined;
    const options: ListenOptions = {};

    const firstArg = args[0];
    const argsLength = args.length;
    const lastArg = args[argsLength - 1];
    /* Deal with listen (options) || (handle[, backlog]) */
    if (typeof firstArg === "object" && firstArg !== null) {
        options.backlog = argsLength > 1 ? lastArg : undefined;
        Object.assign(options, firstArg);
    } else if (typeof firstArg === "string" && isNaN(parseInt(firstArg))) {
        /* Deal with listen (pipe[, backlog]) */
        options.path = firstArg;
        options.backlog = argsLength > 1 ? lastArg : undefined;
    } else {
        /* Deal with listen ([port[, host[, backlog]]]) */
        options.port = argsLength >= 1 && firstArg ? parseInt(firstArg) : 0;
        options.host = argsLength >= 2 && args[1] ? args[1] : "localhost";
        options.backlog = argsLength >= 3 ? args[2] : undefined;
    }

    return [options, cb];
}

export class ElectronServer extends Server {
    private _address = "";

    listen(
        port?: number,
        hostname?: string,
        backlog?: number,
        listeningListener?: () => void
    ): this;
    listen(
        port?: number,
        hostname?: string,
        listeningListener?: () => void
    ): this;
    listen(
        port?: number,
        backlog?: number,
        listeningListener?: () => void
    ): this;
    listen(port?: number, listeningListener?: () => void): this;
    listen(
        path: string,
        backlog?: number,
        listeningListener?: () => void
    ): this;
    listen(path: string, listeningListener?: () => void): this;
    listen(options: ListenOptions, listeningListener?: () => void): this;
    listen(handle: any, backlog?: number, listeningListener?: () => void): this;
    listen(handle: any, listeningListener?: () => void): this;
    listen(...args): this {
        const [options, listeningListener] = normalizeListenArgs(args);
        if (typeof listeningListener === "function") {
            this.once("listening", listeningListener);
        }
        const scheme = String(options.port || options.path);
        this._address = `${scheme}://${options.host || "localhost"}`;
        protocol.registerSchemesAsPrivileged([
            {
                scheme,
                privileges: {
                    standard: true,
                    secure: true,
                    bypassCSP: true,
                    allowServiceWorkers: true,
                    supportFetchAPI: true,
                    corsEnabled: true,
                    stream: true,
                },
            },
        ]);
        app.whenReady().then(() => {
            protocol.registerStreamProtocol(scheme, (request, callback) => {
                const req = new ElectronIncomingMessage(request);
                const res = new ElectronServerResponse(req, callback);
                this.emit("request", req, res);
            });
            process.nextTick(() => this.emit("listening"));
        });
        return this;
    }

    address(): string | AddressInfo {
        return this._address;
    }
}
