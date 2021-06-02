<?php
require_once __DIR__ . '/../../../../api/account/accountFunctions.php';
require_once __DIR__ . '/../../../../api/database/readie/cloud/cloud_files.php';
require_once __DIR__ . '/../../../../api/returnData.php';

class File
{
    function __construct()
    {
        $uri = array_filter(explode('/', $_SERVER['REQUEST_URI']), fn($part) => !is_null($part) && $part !== '');

        if ($uri[count($uri) - 1] !== 'storage' || (is_null($uri[count($uri)]) || $uri[count($uri)] === '')) { http_response_code(403); exit(); }

        $filesTable = new cloud_files(true);

        $files = $filesTable->Select(array('id'=>$uri[count($uri)]));
        if ($files->error) { http_response_code(500); exit(); }
        else if (empty($files->data) || $files->data[0] === null) { http_response_code(404); exit(); }
        else if (!file_exists(__DIR__ . '/userfiles/' . $files->data[0]->id))
        {
            $deleteResponse = $filesTable->Delete(array('id'=>$uri[count($uri)]));
            if ($deleteResponse->error || $deleteResponse !== true) { http_response_code(500); exit(); }
            http_response_code(404);
            exit();
        }
        else if ($files->data[0]->isPrivate === '1')
        {
            $sessionValid = AccountFunctions::VerifySession();
            if ($sessionValid->error) { http_response_code(500); exit(); }
            else if (!$sessionValid->data || $_COOKIE['READIE_UID'] !== $files->data[0]->uid) { http_response_code(403); exit(); }
        }

        //https://stackoverflow.com/questions/1628260/downloading-a-file-with-a-different-name-to-the-stored-name
        //https://stackoverflow.com/questions/5924061/using-php-to-output-an-mp4-video


        $fileSize = filesize(__DIR__ . '/userfiles/' . $files->data[0]->id);
        //This shouldn't fail to open because I checked if the file existed earlier.
        $fileStream = fopen(__DIR__ . '/userfiles/' . $files->data[0]->id, 'rb');

        $beginBytes = 0;
        $endBytes = $fileSize;

        if (isset($_SERVER['HTTP_RANGE']) && preg_match('/bytes=\h*(\d+)-(\d*)[\D.*]?/i', $_SERVER['HTTP_RANGE'], $matches))
        {
            $beginBytes=intval($matches[0]);
            if(!empty($matches[1]))
            {
                $endBytes=intval($matches[1]);
            }
        }

        if($beginBytes > 0|| $endBytes < $fileSize) { http_response_code(206); }
        else { http_response_code(200); }

        header('Content-Type: ' . mime_content_type(__DIR__ . '/userfiles/' . $files->data[0]->id));
        header('Accept-Ranges: bytes');
        header('Content-Length:' . ($endBytes - $beginBytes));
        header("Content-Disposition: inline;");
        header("Content-Range: bytes $beginBytes-$endBytes/$fileSize");
        header("Content-Transfer-Encoding: binary\n");
        header('Connection: close');

        $cursor = $beginBytes;
        fseek($fileStream, $beginBytes, 0);

        while(!feof($fileStream) && $cursor < $endBytes && (connection_status()==0))
        {
            echo fread($fileStream, min(1024 * 16, $endBytes - $cursor));
            $cursor += 1024 * 16;
            usleep(1000);
        }
        exit();
    }
}
new File();