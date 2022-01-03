import { ServerResponse } from "http";
import { ProtocolResponse } from "electron";
import { PassThrough } from "stream";
import { ElectronIncomingMessage } from "./electron-incoming-message";

export class ElectronServerResponse extends ServerResponse {
    private _hasBody: boolean;
    private _responseData: PassThrough;
    private _headerSent = false;

    constructor(
        req: ElectronIncomingMessage,
        private readonly callback: (
            response: ProtocolResponse | NodeJS.ReadableStream
        ) => void
    ) {
        super(req);
        if (req.method === "HEAD") this._hasBody = false;
        this._headerSent = false;
        this._responseData = new PassThrough();
        this._send = this._send.bind(this);
        this._writeRaw = this._writeRaw.bind(this);
        this.once("finish", () => {
            this._responseData.push(null);
        });
    }

    _send(data, encoding, callback) {
        if (!this._headerSent) {
            const response: ProtocolResponse = {
                headers: this.getHeaders() as Record<string, string | string[]>,
                statusCode: this.statusCode,
            };
            if (this._hasBody) {
                response.data = this._responseData;
            }
            this.callback(response);
            this._headerSent = true;
        }
        this._writeRaw(data, encoding, callback);
    }

    _writeRaw(data, encoding, callback) {
        if (typeof encoding === "function") {
            callback = encoding;
            encoding = null;
        }
        this._responseData.push(data, encoding);
        if (typeof callback === "function") {
            process.nextTick(callback);
        }
    }
}
