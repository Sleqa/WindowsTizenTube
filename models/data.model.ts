import { DataModel } from "./data.interface";
import { DataWatcher } from "./observer.model";

export class Data {

    private _resolution: DataModel['resolution'];
    private _userAgent: DataModel['userAgent'];
    private _keepSize: DataModel['keepSize'];
    private _background: DataModel['background'];
    private _adBlock: DataModel['adBlock'];
    private _DIAL: DataModel['DIAL'];

    private timeout: NodeJS.Timeout | null = null;

    constructor(public _data: DataModel, private _saveCallback: () => void) {

        const { resolution, keepSize, DIAL, userAgent, background, adBlock } = _data;
        this._resolution = resolution;
        this._keepSize = new DataWatcher(keepSize, this.onChangeEvent.bind(this)) as unknown as DataModel['keepSize'];
        this._DIAL = new DataWatcher(DIAL, this.onChangeEvent.bind(this)) as unknown as DataModel['DIAL'];
        this._userAgent = new DataWatcher(userAgent, this.onChangeEvent.bind(this)) as unknown as DataModel['userAgent'];
        this._background = background;
        // Los ficheros de configuración anteriores a esta versión no incluyen adBlock.
        this._adBlock = typeof adBlock === 'boolean' ? adBlock : true;

    }

    private onChangeEvent(path: string[], value: any): void {

        // Prepara un timeout para realizar una única escritura.
        // Si el timeout no está establecido, significa que no hay ninguna operación de escritura reciente.
        // Por lo tanto, crea uno.
        if(!this.timeout) {
            this.timeout = setTimeout(() => {
                this._saveCallback();
                this.timeout = null;
            }, 100);
        } else {
            // Si hay una operación de escitura, y llega otra, se detiene la anterior y se crea una nueva
            // con los nuevos parámetros.
            clearTimeout(this.timeout);
            this.timeout = null;
            this.onChangeEvent(path, value);
        }
    }

    public get resolution(): DataModel['resolution'] {
        return this._resolution;
    }
    public get keepSize(): DataModel['keepSize'] {
        return this._keepSize;
    }
    public get DIAL(): DataModel['DIAL'] {
        return this._DIAL;
    }
    public get userAgent(): DataModel['userAgent'] {
        return this._userAgent;
    }
    public get background(): DataModel['background'] {
        return this._background;
    }
    public get adBlock(): DataModel['adBlock'] {
        return this._adBlock;
    }

    public set resolution(newResolution) {
        this._resolution = newResolution;
        this._saveCallback();
    }
    public set background(newbackground) {
        this._background = newbackground;
        this._saveCallback();
    }
    public set adBlock(newAdBlock) {
        this._adBlock = newAdBlock;
        this._saveCallback();
    }

    public toJSON(): DataModel {
        return {
            resolution: this._resolution,
            keepSize: this._keepSize,
            DIAL: this._DIAL,
            background: this._background,
            adBlock: this._adBlock,
            userAgent: this._userAgent
        }
    }

}