export interface _IFile
{
    id: string,
    uid: string,
    name: string,
    type: string,
    size: number,
    shareType: 0 | 1 | 2,
    sharedWith: string[],
}

//This contains extra properties that are received from the server, but are not needed when sending data to the server.
export interface IFile extends _IFile
{
    metadata: IMetaData,
    dateAltered: number
}

export interface IMetaData
{
    mimeType: string
}

export interface IImageMetaData extends IMetaData
{
    width: number,
    height: number
}

export interface IVideoMetaData extends IMetaData
{
    codec: string,
    bitrate: number,
    width: number,
    height: number,
    frameRate: number,
    duration: number
}