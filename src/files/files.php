<?php
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

    function __construct($_request)
    {
        $this->usersTable = new users(true);
        $this->permissionsTable = new cloud_permissions(true);
        $this->filesTable = new cloud_files(true);

        echo json_encode($this->ProcessRequest($_request));
    }

    private function ProcessRequest($_request)
    {
        $sessionValid = AccountFunctions::VerifySession();
        if ($sessionValid->error) { return $sessionValid; }
        else if (!$sessionValid->data) { return new ReturnData("SESSION_EXPIRED", true); }
        return new ReturnData($_request);
    }
}
//new Files($_GET);
new Files($_POST);