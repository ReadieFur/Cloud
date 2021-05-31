<?php
require_once __DIR__ . '/../../../../api/account/accountFunctions.php';
require_once __DIR__ . '/../../../../api/database/databaseHelper.php';
require_once __DIR__ . '/../../../../api/database/readie/users.php';
require_once __DIR__ . '/../../../../api/database/readie/cloud/cloud_permissions.php';
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
        header('Content-Disposition: attachment; filename="' . $files->data[0]->name. '.' . $files->data[0]->type . '"');
        header("Content-Length: " . filesize(__DIR__ . '/userfiles/' . $files->data[0]->id));
        //TODO Add the content type header.
        $fileContents = readfile(__DIR__ . '/userfiles/' . $files->data[0]->id);
        if ($fileContents === false) { http_response_code(500); exit(); }
        exit();
    }
}
new File();