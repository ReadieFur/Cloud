<?php
require_once __DIR__ . '/../../../../api/account/accountFunctions.php';
require_once __DIR__ . '/../../../../api/database/readie/cloud/cloud_files.php';
require_once __DIR__ . '/../../../../api/database/readie/cloud/cloud_file_shares.php';
require_once __DIR__ . '/../../../../api/returnData.php';

class FileData
{
    public string $id;
    public string $name;
    public string $type;
    public int $size;
}

class File
{
    const FILE_PATH = __DIR__ . '/userfiles';
    const THUMBNAIL_SUFFIX = '_thumbnail';

    function __construct()
    {
        $fileData = new FileData();

        if (session_status() == PHP_SESSION_ACTIVE && $_SESSION["REQUEST_URI"] == $_SERVER['REQUEST_URI'])
        {
            //Check if a session for this user already exists (if it does then they can skip the verification).
            $fileData->id = $_SESSION['id'];
            $fileData->name = $_SESSION['name'];
            $fileData->type = $_SESSION['type'];
            $fileData->size = $_SESSION['size'];
        }
        else
        {
            //Check if the user is allowed to access the file.
            $uri = array_filter(explode('/', $_SERVER['REQUEST_URI']), fn($part) => !is_null($part) && $part !== '');
            $uriPartExploded = explode('.', $uri[count($uri)], 2);
            if (count($uriPartExploded) !== 2 || empty($uriPartExploded[0]))
            {
                http_response_code(404);
                exit();
            }
            $id = '';
            // $extension = $uriPartExploded[1];
            $getThumbnail = false;
            if ($uri[count($uri) - 2] === 'storage' && !ctype_space($uri[count($uri) - 1]) && $uriPartExploded[0] === 'thumbnail')
            {
                $id = $uri[count($uri) - 1];
                $getThumbnail = true;
            }
            else if ($uri[count($uri) - 1] === 'storage' && !ctype_space($uri[count($uri)]))
            {
                $id = $uriPartExploded[0];
            }
            else
            {
                http_response_code(404);
                exit();
            }
    
            $filesTable = new cloud_files(true);
    
            $files = $filesTable->Select(array('id'=>$id));
            if ($files->error) { http_response_code(500); exit(); }
            else if (empty($files->data) || $files->data[0] === null) { http_response_code(404); exit(); }
            else if (!file_exists(__DIR__ . '/userfiles/' . $files->data[0]->id))
            {
                $deleteResponse = $filesTable->Delete(array('id'=>$id));
                if ($deleteResponse->error || $deleteResponse !== true) { http_response_code(500); exit(); }
                http_response_code(404);
                exit();
            }
            else if ($files->data[0]->shareType != '2') //Not public
            {
                //Verify the users session
                $sessionValid = AccountFunctions::VerifySession();
                if ($sessionValid->error) { http_response_code(403); exit(); }

                if ($sessionValid->data && $_COOKIE['READIE_UID'] !== $files->data[0]->uid)
                {
                    switch ($files->data[0]->shareType)
                    {
                        case '0': //Private
                            //We know that the user is not the owner of the file because of the check above so we can simply deny access here.
                            http_response_code(401);
                            exit();
                            break;
                        case '1': //Invite
                            $fileSharesTable = new cloud_file_shares(true);
                            $fileShares = $fileSharesTable->Select(array("fid"=>$files->data[0]->id));
                            if ($fileShares->error) { return $fileShares; }
                            else if (empty($fileShares->data) || $fileShares->data[0] === null) { http_response_code(401); exit(); }
                            else if (!in_array($_COOKIE['READIE_UID'], array_column($fileShares->data, 'uid'))) { http_response_code(401); exit(); }
                            break;
                        default:
                            //Shouldn't be reached but if it is then return an error.
                            http_response_code(500);
                            exit();
                            // break;
                    }
                }
            }
            else if ($files->data[0]->publicExpiryTime != -1 && time() > $files->data[0]->publicExpiryTime) //Public but with an expiry time.
            {
                //Verify the users session
                $sessionValid = AccountFunctions::VerifySession();
                if ($sessionValid->error) { http_response_code(403); exit(); }
                else if ($sessionValid->data && $_COOKIE['READIE_UID'] !== $files->data[0]->uid)
                {
                    http_response_code(401);
                    exit();
                }
            }

            if (session_status() == PHP_SESSION_NONE)
            {
                session_start();
                $_SESSION['URL'] = $_SERVER['REQUEST_URI'];
                if (!$getThumbnail)
                {
                    $fileData->id = $_SESSION['id'] = strval($files->data[0]->id);
                    $fileData->name = $_SESSION['name'] = $files->data[0]->name;
                    $fileData->type = $_SESSION['type'] = $files->data[0]->type;
                    $fileData->size = $_SESSION['size'] = $files->data[0]->size;
                }
                else
                {
                    $fileData->id = $_SESSION['id'] = strval($files->data[0]->id) . File::THUMBNAIL_SUFFIX;
                    $fileData->name = $_SESSION['name'] = $files->data[0]->name . File::THUMBNAIL_SUFFIX;
                    $fileData->type = $_SESSION['type'] = explode('/', mime_content_type(File::FILE_PATH . '/' . $files->data[0]->id . File::THUMBNAIL_SUFFIX))[1];
                    $fileData->size = $_SESSION['size'] = filesize(File::FILE_PATH . '/' . $files->data[0]->id . File::THUMBNAIL_SUFFIX);
                }
            }
        }

        //Stream the file.
        $fileStream = new FileStream(
            File::FILE_PATH . '/' . $fileData->id,
            $fileData->name,
            $fileData->type
        );
        $fileStream->Begin();
    }
}

//https://stackoverflow.com/questions/1628260/downloading-a-file-with-a-different-name-to-the-stored-name
//Tweaked from: http://codesamplez.com/programming/php-html5-video-streaming-tutorial
class FileStream
{
    private $path = "";
    private $name = "";
    private $type = "";
    private $stream = "";
    private $buffer = 102400;
    private $start = -1;
    private $end = -1;
    private $size = 0;
 
    function __construct($filePath, $name, $type)
    {
        $this->path = $filePath;
        $this->name = $name;
        $this->type = $type;
    }
     
    private function Open()
    {
        if (!($this->stream = fopen($this->path, 'rb')))
        {
            http_response_code(500);
            die('Could not open stream for reading');
        }
    }
     
    private function SetHeaders()
    {
        ob_get_clean();
        header("Content-Type: " . mime_content_type($this->path));
        header("Content-Disposition: attachment; filename=\"" . $this->name . "." . $this->type . "\"");
        header("Cache-Control: max-age=2592000, public");
        header("Expires: " . gmdate('D, d M Y H:i:s', time()+2592000) . ' GMT');
        header("Last-Modified: " . gmdate('D, d M Y H:i:s', @filemtime($this->path)) . ' GMT' );
        $this->start = 0;
        $this->size = filesize($this->path); 
        $this->end = $this->size - 1;
        header("Accept-Ranges: 0-" . $this->end);
         
        if (isset($_SERVER['HTTP_RANGE']))
        {
            $c_start = $this->start;
            $c_end = $this->end;
 
            list(, $range) = explode('=', $_SERVER['HTTP_RANGE'], 2);
            if (strpos($range, ',') !== false)
            {
                header('HTTP/1.1 416 Requested Range Not Satisfiable');
                header("Content-Range: bytes $this->start-$this->end/$this->size");
                exit;
            }
            if ($range == '-')
            {
                $c_start = $this->size - substr($range, 1);
            }
            else
            {
                $range = explode('-', $range);
                $c_start = $range[0];
                $c_end = (isset($range[1]) && is_numeric($range[1])) ? $range[1] : $c_end;
            }
            $c_end = ($c_end > $this->end) ? $this->end : $c_end;
            if ($c_start > $c_end || $c_start > $this->size - 1 || $c_end >= $this->size)
            {
                header('HTTP/1.1 416 Requested Range Not Satisfiable');
                header("Content-Range: bytes $this->start-$this->end/$this->size");
                exit;
            }
            $this->start = $c_start;
            $this->end = $c_end;
            $length = $this->end - $this->start + 1;
            fseek($this->stream, $this->start);
            header('HTTP/1.1 206 Partial Content');
            header("Content-Length: " . $length);
            header("Content-Range: bytes $this->start-$this->end/" . $this->size);
        }
        else
        {
            header("Content-Length: " . $this->size);
        }  
    }
    
    //End the file stream.
    private function End()
    {
        fclose($this->stream);
        exit;
    }
     
    //Stream the data to the client.
    private function Stream()
    {
        $i = $this->start;
        set_time_limit(0);
        while(!feof($this->stream) && $i <= $this->end)
        {
            $bytesToRead = $this->buffer;
            if(($i+$bytesToRead) > $this->end)
            {
                $bytesToRead = $this->end - $i + 1;
            }
            $data = fread($this->stream, $bytesToRead);
            echo $data;
            flush();
            $i += $bytesToRead;
        }
    }
    
    //Begin the file stream.
    public function Begin()
    {
        $this->Open();
        $this->SetHeaders();
        $this->Stream();
        $this->End();
    }
}

new File();