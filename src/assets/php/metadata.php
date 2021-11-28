<?php
class MetaData
{
    public $mimeType;
}

class ImageMetaData extends MetaData
{
    public $width;
    public $height;
}

class VideoMetaData extends MetaData
{
    public $codec;
    public $bitrate;
    public $width;
    public $height;
    public $frameRate;
    public $duration;
    public $thumbnailMimeType;
    public $thumbnailWidth;
    public $thumbnailHeight;
    public $thumbnailSize;
}