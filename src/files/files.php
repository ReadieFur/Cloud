<?php
require_once __DIR__ . '/../../../api/account/accountFunctions.php';
require_once __DIR__ . '/../../../api/database/credentials.php';
require_once __DIR__ . '/../../../api/database/databaseHelper.php';
require_once __DIR__ . '/../../../api/database/readie/users.php';
require_once __DIR__ . '/../../../api/database/readie/cloud/cloud_permissions.php';
require_once __DIR__ . '/../../../api/database/readie/cloud/cloud_files.php';
require_once __DIR__ . '/../../../api/database/readie/cloud/cloud_file_shares.php';
require_once __DIR__ . '/../../../api/returnData.php';

//https://www.w3schools.com/php/php_file_upload.asp
//http://talkerscode.com/webtricks/file-upload-progress-bar-using-jquery-and-php.php

class Files
{
    public users $usersTable;
    public cloud_permissions $permissionsTable;
    public cloud_files $filesTable;
    public cloud_file_shares $sharesTable;

    function __construct($_request, $_files)
    {
        $this->usersTable = new users(true);
        $this->permissionsTable = new cloud_permissions(true);
        $this->filesTable = new cloud_files(true);
        $this->sharesTable = new cloud_file_shares(true);

        echo json_encode($this->ProcessRequest($_request, $_files));
    }

    private function ProcessRequest($_request, $_files)
    {
        if (!isset($_request['q']) && empty($_files)) { return new ReturnData('NO_QUERY_FOUND', true); }

        $sessionValid = AccountFunctions::VerifySession();
        if ($sessionValid->error) { return $sessionValid; }
        else if (!$sessionValid->data) { return new ReturnData("SESSION_EXPIRED", true); }

        $permissions = $this->permissionsTable->Select(array('uid'=>$_COOKIE['READIE_UID']));
        if ($permissions->error) { return $permissions; }
        else if (count($permissions->data) <= 0)
        {
            $newPermissionsProfile = $this->permissionsTable->Insert(array('uid'=>$_COOKIE['READIE_UID']));
            if ($newPermissionsProfile->error || !$newPermissionsProfile->data) { return $newPermissionsProfile; }
            return new ReturnData("INVALID_PERMISSIONS", true);
        }
        else if ($permissions->data[0]->files == "0")
        { return new ReturnData("INVALID_PERMISSIONS", true); }

        if (!empty($_files))
        {
            if (!is_uploaded_file($_files['inputFile']['tmp_name'])) { return new ReturnData('INCORRECT_PROTOCOL'); }
            else if (!isset($_files['inputFile'])) { return new ReturnData('NO_DATA_FOUND', true); }
            else if ($_files['inputFile']['error'] !== 0) { return new ReturnData('UPLOAD_ERROR', true); }

            $id = '';
            do
            {
                $id = str_replace('.', '', uniqid('', true));
                $existingIDs = $this->filesTable->Select(array('id'=>$id));
                if ($existingIDs->error) { return $existingIDs; }
            }
            while (count($existingIDs->data) > 0);

            $typeSeperatorIndex = strrpos($_files['inputFile']['name'], '.');
            $fileName = $this->GetValidFileName($typeSeperatorIndex !== false ? substr($_files['inputFile']['name'], 0, $typeSeperatorIndex) : $_files['inputFile']['name']);
            $fileType = $this->GetValidFileType($typeSeperatorIndex !== false ? substr($_files['inputFile']['name'], $typeSeperatorIndex + 1) : "");

            //$tableData = new cloud_files();
            $tableData = array(
                'id'=>$id,
                'uid'=>$_COOKIE['READIE_UID'],
                'name'=>$fileName,
                'type'=>$fileType,
                'size'=>$_files['inputFile']['size'],
                'shareType'=>'0',
                'dateAltered'=>Time()
            );

            $response = $this->filesTable->Insert($tableData);
            if ($response->error) { return $response; }
            else if ($response->data !== true) { return new ReturnData(true, true); }

            if (!move_uploaded_file($_files['inputFile']['tmp_name'], __DIR__ . '/storage/userfiles/' . $id . ''))
            {
                //If this fails then something critical has happened.
                $this->filesTable->Delete($tableData);
                return new ReturnData('SERVER_ERROR', true);
            }

            return new ReturnData($tableData);
        }
        else
        {
            $query = json_decode($_request['q'], true);
    
            if (!isset($query['method'])) { return new ReturnData('NO_METHOD_FOUND', true); }
            if (!isset($query['data'])) { return new ReturnData('NO_DATA_FOUND', true); }

            switch ($query['method'])
            {
                case 'getFiles':
                    return $this->GetFiles($query['data']);
                /*case 'uploadFile':
                    Handled in the previous if clause.*/
                case 'updateFile':
                    return $this->UpdateFile($query['data']);
                case 'deleteFile':
                    return $this->DeleteFile($query['data']);
                default:
                    return new ReturnData('INVALID_METHOD', true);
            }
        }
    }

    private function DeleteFile(array $_data)
    {
        if (!isset($_data['id'])) { return new ReturnData('INVALID_DATA', true); }

        $files = $this->filesTable->Select(array('id'=>$_data['id']));
        if ($files->error) { return $files; }
        else if (!isset($files->data[0])) { return new ReturnData('NO_RESULTS', true); }
        else if ($_COOKIE['READIE_UID'] !== $files->data[0]->uid) { return new ReturnData('INVALID_PERMISSIONS', true); }

        $localFileDeleted = unlink(__DIR__ . '/storage/userfiles/' . $files->data[0]->id);
        if (!$localFileDeleted) { return new ReturnData('SERVER_ERROR', true); }

        $deleteResponse = $this->filesTable->Delete(array('id'=>$files->data[0]->id));
        if ($deleteResponse->error) { return $deleteResponse; }
        else if ($deleteResponse->data !== true) { return new ReturnData($deleteResponse->data, true); }
        return new ReturnData(true);
    }

    private function UpdateFile(array $_data)
    {
        global $dbServername;
        global $dbName;
        global $dbUsername;
        global $dbPassword;

        if (
            !isset($_data['id']) ||
            !isset($_data['uid']) ||
            !isset($_data['name']) ||
            !isset($_data['type']) ||
            !isset($_data['size']) ||
            !isset($_data['shareType']) ||
            !isset($_data['sharedWith']) ||
            !isset($_data['dateAltered'])
        )
        { return new ReturnData('INVALID_DATA', true); }

        $files = $this->filesTable->Select(array('id'=>$_data['id']));
        if ($files->error) { return $files; }
        else if (!isset($files->data[0])) { return new ReturnData('NO_RESULTS', true); }
        else if ($_COOKIE['READIE_UID'] !== $files->data[0]->uid) { return new ReturnData('INVALID_PERMISSIONS', true); }

        if (!($_data['shareType'] == 0 || $_data['shareType'] == 1 || $_data['shareType'] == 2)) { return new ReturnData('INVALID_DATA' . $_data["shareType"], true); }

        $updatedFileResponse = $this->filesTable->Update(
            array(
                'name'=>$this->GetValidFileName($_data['name']),
                'type'=>$this->GetValidFileType($_data['type']),
                'shareType'=>$_data['shareType'],
                'dateAltered'=>Time()
            ),
            array(
                'id'=>$files->data[0]->id
            )
        );
        if ($updatedFileResponse->error) { return $updatedFileResponse; }
        else if ($updatedFileResponse->data !== true) { return new ReturnData($updatedFileResponse->data, true); }

        if ($_data['shareType'] == '0') //Private
        {
            $deletedSharesResponse = $this->sharesTable->Delete(array('fid'=>$files->data[0]->id));
            if ($deletedSharesResponse->error && $deletedSharesResponse->data != 'NO_RESULTS') { return $deletedSharesResponse; }
            else if ($deletedSharesResponse->data !== true) { return new ReturnData($deletedSharesResponse->data, true); }
            $_data['sharedWith'] = array();
            return new ReturnData($_data);
        }
        else
        {
            $where = array();
            for ($i = 0; $i < count($_data['sharedWith']); $i++)
            {
                $where[] = array('username', 'LIKE', $_data['sharedWith'][$i]);
                $where[] = 'AND';
            }
            $where = array_slice($where, 0, -1);

            $pdo = new PDO("mysql:host=$dbServername:3306;dbname=$dbName", $dbUsername, $dbPassword);
            $dbi = new DatabaseInterface($pdo);
            $foundUsers = $dbi
                ->Table1('users')
                ->Select(array('uid', 'username'))
                ->Where($where)
                ->Execute();
            if ($foundUsers->error) { return $foundUsers; }
            
            //Make sure that the owner is not in the share list.
            $foundUsers->data = array_filter($foundUsers->data, function($user) { return $user->uid !== $_COOKIE['READIE_UID']; });

            $deleteOldSharesResponse = $this->sharesTable->Delete(array('fid'=>$files->data[0]->id));
            if ($deleteOldSharesResponse->error) { return $deleteOldSharesResponse; }
            else if ($deleteOldSharesResponse->data !== true) { return new ReturnData($deleteOldSharesResponse->data, true); }

            $validUsersAdded = array();
            //This isn't really efficent as I have to delete and add all of the users back to the share list one query at a time. In the future when I get round to improving my database helper class I should be able to make this more efficent.
            foreach ($foundUsers->data as $user)
            {
                if (in_array($user->username, $_data['sharedWith']))
                {
                    $validUsersAdded[] = $user->username;
                    $shareResponse = $this->sharesTable->Insert(
                        array(
                            'fid'=>$files->data[0]->id,
                            'uid'=>$user->uid
                        )
                    );
                    if ($shareResponse->error) { return $shareResponse; }
                    else if ($shareResponse->data !== true) { return new ReturnData($shareResponse->data, true); }
                }
            }
            $_data['sharedWith'] = $validUsersAdded;
            return new ReturnData($_data);
        }
    }

    private function GetFiles(array $_data)
    {
        global $dbServername;
        global $dbName;
        global $dbUsername;
        global $dbPassword;

        if (
            (
                !isset($_data['filter']) ||
                !(
                    $_data['filter'] === 'name' ||
                    $_data['filter'] === 'type' ||
                    $_data['filter'] === 'size' ||
                    $_data['filter'] === 'date' ||
                    $_data['filter'] === 'shared'
                )
            ) ||
            !isset($_data['data']) ||
            !isset($_data['page'])
        )
        { return new ReturnData('INVALID_DATA', true); }
        
        $order = 'dateAltered';
        $orderDescending = true;
        $where = array('uid'=>$_COOKIE['READIE_UID']);
        
        switch($_data['filter'])
        {
            case 'name':
                $where[] = 'AND';
                $where[] = array('name', 'LIKE', $_data['data']);
                break;
            case 'type':
                $where[] = 'AND';
                $where[] = array('type', 'LIKE', $_data['data']);
                break;
            case 'size':
                $order = 'size';
                $orderDescending = $_data['data'] === "asc" || $_data['data'] === "ascending" || $_data['data'] === "true" ? false : true;
                break;
            case 'date':
                //$order = 'dateAltered';
                $orderDescending = $_data['data'] === "asc" || $_data['data'] === "ascending" || $_data['data'] === "true" ? false : true;
                break;
            case 'shared':
                $order = 'shareType';
                $orderDescending = $_data['data'] === "asc" || $_data['data'] === "ascending" || $_data['data'] === "true" ? false : true;
                break;
            /*default:
                $order = 'dateAltered';
                break;*/
        }

        $resultsPerPage = 20;
        $startIndex = $resultsPerPage * (intval($_data['page']) - 1);

        $pdo = new PDO("mysql:host=$dbServername:3306;dbname=$dbName", $dbUsername, $dbPassword);
        $dbi = new DatabaseInterface($pdo);
        $filesFound = $dbi
            ->Table1('cloud_files')
            ->Select(array("*"))
            ->Where($where)
            ->Order($order, $orderDescending)
            ->Limit($resultsPerPage, $startIndex)
            ->Execute();
        if ($filesFound->error) { return $filesFound; }

        foreach ($filesFound->data as $key => $value)
        {
            if ($value->shareType == '0')
            {
                $filesFound->data[$key]->sharedWith = array();
                $filesFound->data[$key]->sharedWith = [];
            }
            else
            {
                $dbi2 = new DatabaseInterface($pdo);
                $sharesFound = $dbi2
                    ->Table1('cloud_file_shares')
                    ->Table2('users')
                    ->Select(array('uid'), array('username'))
                    ->On('uid')
                    ->Where(array('fid'=>$value->id))
                    ->Execute();
                if ($sharesFound->error) { return $sharesFound; }
                $filesFound->data[$key]->sharedWith = array();
                foreach ($sharesFound->data as $share)
                {
                    $filesFound->data[$key]->sharedWith[] = $share->username;
                }
            }
        }

        $dbi3 = new DatabaseInterface($pdo);
        $filesCount = $dbi3
            ->Table1('cloud_files')
            ->SelectCount()
            ->Where($where)
            ->Execute();
        if ($filesCount->error) { return $filesCount; }

        $data = new stdClass();
        $data->files = $filesFound->data;
        $data->filesFound = intval($filesCount->data[0]->count);
        $data->startIndex = $startIndex;
        $data->resultsPerPage = $resultsPerPage;

        return new ReturnData($data);
    }

    private static function GetValidFileName(string $name)
    {
        return preg_replace('/[\\\\\/:*?\"<>|]/', '', substr($name, 0, 255));
    }

    private static function GetValidFileType(string $type)
    {
        return substr($type, 0, 24);
    }
}
//new Files($_GET, $_FILES);
new Files($_POST, $_FILES);