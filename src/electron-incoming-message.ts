import { IncomingMessage } from "http";
import { URL } from "url";
import { ProtocolRequest, UploadData } from "electron";

function getUploadDataContentLength(uploadData: UploadData[]) {
    if (uploadData && uploadData.length) {
        return uploadData.reduce((len, data) => {
            if (data.bytes) {
                return len + data.bytes.length;
            }
            // TODO Upload File
            return len;
        }, 0);
    }
    return 0;
}

export class ElectronIncomingMessage extends IncomingMessage {
    private _uploadData: UploadData[];
    private _readIndex: number;
    private _readPos: number;

    constructor({ url, method, headers, uploadData }: ProtocolRequest) {
        super(null);
        const { pathname, search } = new URL(url);

        this.url = pathname + search;
        this.method = method;
        this.headers = Object.fromEntries(
            Object.entries(headers).map(([key, value]) => [
                key.toLowerCase(),
                value,
            ])
        );
        if (!("content-length" in this.headers)) {
            this.headers["content-length"] =
                getUploadDataContentLength(uploadData).toString();
        }

        this._uploadData = uploadData;
        this._readIndex = 0;
        this._readPos = 0;
        this._read = this._read.bind(this);
    }

    _read(size: number): void {
        while (true) {
            if (this._readIndex >= this._uploadData.length) {
                this.push(null);
                return;
            }

            if (size > 0) {
                const uploadData = this._uploadData[this._readIndex];
                if (uploadData.bytes) {
                    const nextReadSize =
                        size - (uploadData.bytes.length - this._readPos);
                    if (nextReadSize > 0) {
                        this.push(uploadData.bytes.slice(this._readPos));
                        this._readPos = 0;
                        this._readIndex += 1;
                        size = nextReadSize;
                    } else {
                        this.push(uploadData.bytes.slice(this._readPos, size));
                        this._readPos += size;
                        return;
                    }
                } else if (uploadData.file) {
                    console.log(uploadData)
                }
            }
        }
    }

    _destroy(error: Error, callback: (error?: Error) => void): void {
        super._destroy(error, callback);
    }
}
