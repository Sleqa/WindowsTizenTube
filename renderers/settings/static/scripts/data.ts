import { DataModel } from '../../../../models/data.interface';
import { DataWatcher } from '../../../../models/observer.model';
import { ipc } from './ipc';

export class Data {

    private _resolution: DataModel['resolution'];
    private _userAgent: DataModel['userAgent'];
    private _keepSize: DataModel['keepSize'];
    private _background: DataModel['background'];
    private _adBlock: DataModel['adBlock'];
    private _DIAL: DataModel['DIAL'];

    constructor(private _data: DataModel) {

        const { resolution, keepSize, DIAL, userAgent, background, adBlock } = _data;
        this._resolution = resolution;
        this._keepSize = new DataWatcher(keepSize, this.onSave.bind(this)) as unknown as DataModel['keepSize'];
        this._DIAL = new DataWatcher(DIAL, this.onSave.bind(this)) as unknown as DataModel['DIAL'];
        this._userAgent = new DataWatcher(userAgent, this.onSave.bind(this)) as unknown as DataModel['userAgent'];
        this._background = background;
        this._adBlock = adBlock;

    }

    private onSave(): void {
        ipc.settings = {
            resolution: this._resolution,
            keepSize: this._keepSize,
            DIAL: this._DIAL,
            background: this._background,
            adBlock: this._adBlock,
            userAgent: this._userAgent
        };
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
    public get background(): DataModel['background'] {
        return this._background;
    }
    public get adBlock(): DataModel['adBlock'] {
        return this._adBlock;
    }
    public get userAgent(): DataModel['userAgent'] {
        return this._userAgent;
    }

    public set resolution(newResolution) {
        this._resolution = newResolution;
        this.onSave()
    }
    public set background(newBackground) {
        this._background = newBackground;
        this.onSave()
    }
    public set adBlock(newAdBlock) {
        this._adBlock = newAdBlock;
        this.onSave()
    }

}