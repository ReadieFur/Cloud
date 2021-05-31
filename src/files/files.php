<?php

use GuzzleHttp\Psr7\Request;

require_once __DIR__ . '/../../../api/account/accountFunctions.php';
require_once __DIR__ . '/../../../api/database/databaseHelper.php';
require_once __DIR__ . '/../../../api/database/readie/users.php';
require_once __DIR__ . '/../../../api/database/readie/cloud/cloud_permissions.php';
require_once __DIR__ . '/../../../api/database/readie/cloud/cloud_files.php';
require_once __DIR__ . '/../../../api/returnData.php';

//https://www.w3schools.com/php/php_file_upload.asp
//http://talkerscode.com/webtricks/file-upload-progress-bar-using-jquery-and-php.php

class Files
{
    public users $usersTable;
    public cloud_permissions $permissionsTable;
    public cloud_files $filesTable;

    function __construct($_request, $_files)
    {
        $this->usersTable = new users(true);
        $this->permissionsTable = new cloud_permissions(true);
        $this->filesTable = new cloud_files(true);

        echo json_encode($this->ProcessRequest($_request, $_files));
    }

    private function ProcessRequest($_request, $_files)
    {
        if (!isset($_request['q']) && empty($_files)) { return new ReturnData('NO_QUERY_FOUND', true); }

        $sessionValid = AccountFunctions::VerifySession();
        if ($sessionValid->error) { return $sessionValid; }
        else if (!$sessionValid->data) { return new ReturnData("SESSION_EXPIRED", true); }

        $account = AccountFunctions::GetUsersByID(array($_COOKIE['READIE_UID']));
        if ($account->error) { return $account; }
        else if (!isset($account->data[$_COOKIE['READIE_UID']])) { return new ReturnData("ACCOUNT_NOT_FOUND", true); }
        $user = $account->data[$_COOKIE['READIE_UID']];

        $permissions = $this->permissionsTable->Select(array('uid'=>$user->uid));
        if ($permissions->error) { return $permissions; }
        else if (count($permissions->data) <= 0)
        {
            $newPermissionsProfile = $this->permissionsTable->Insert(array('uid'=>$user->uid));
            if ($newPermissionsProfile->error || !$newPermissionsProfile->data) { return $account; }
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
            $fileName = $typeSeperatorIndex !== false ? substr($_files['inputFile']['name'], 0, $typeSeperatorIndex) : $_files['inputFile']['name'];
            $fileType = $typeSeperatorIndex !== false ? substr($_files['inputFile']['name'], $typeSeperatorIndex + 1) : "";

            //$tableData = new cloud_files();
            $tableData = array(
                'id'=>$id,
                'uid'=>$user->uid,
                'name'=>$fileName,
                'type'=>$fileType,
                'size'=>$_files['inputFile']['size'],
                'isPrivate'=>'1',
                'dateAltered'=>Time()
            );

            $response = $this->filesTable->Insert($tableData);
            if ($response->error) { return $response; }
            else if ($response->data !== true) { return new ReturnData(true, true); }

            if (!move_uploaded_file($_files['inputFile']['tmp_name'], __DIR__ . '/storage/' . $id . ''))
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
                /*case 'viewFile':
                    //Handled before the user login.*/
                default:
                    return new ReturnData('INVALID_METHOD', true);
            }
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
        $where = array();
        
        switch($_data['filter'])
        {
            case 'name':
                $where = array(array('name', 'LIKE', $_data['data']));
                break;
            case 'type':
                $where = array(array('name', 'LIKE', $_data['data']));
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
                $order = 'isPrivate';
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
        $files = $dbi
            ->Table1('cloud_files')
            ->Select(array("*"))
            ->Where($where)
            ->Order($order, $orderDescending)
            ->Limit($resultsPerPage, $startIndex)
            ->Execute();
        if ($files->error) { return $files; }

        $dbi = new DatabaseInterface($pdo);
        $count = $dbi
            ->Table1('cloud_files')
            ->SelectCount()
            ->Where($where)
            ->Execute();
        if ($count->error) { return $count; }

        $data = new stdClass();
        $data->files = $files->data;
        $data->filesFound = intval($count->data[0]->count);
        $data->startIndex = $startIndex;
        $data->resultsPerPage = $resultsPerPage;
        return new ReturnData($data);
    }
}
//new Files($_GET, $_FILES);
new Files($_POST, $_FILES);