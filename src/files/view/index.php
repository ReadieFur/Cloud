<?php
    $title = 'View File | Cloud';

    $WEB_ROOT;
    $SITE_ROOT;
    $DOCUMENT_ROOT = $_SERVER["DOCUMENT_ROOT"];
    require_once "$DOCUMENT_ROOT/roots.php";
    require_once "$SITE_ROOT/assets/php/main.php";

    require_once __DIR__ . '/../../../../api/account/accountFunctions.php';
    require_once __DIR__ . '/../../../../api/database/readie/cloud/cloud_files.php';
    require_once __DIR__ . '/../../../../api/database/readie/cloud/cloud_file_shares.php';
    require_once __DIR__ . '/../../../../api/returnData.php';

    $baseUrl = $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'];
    $urlFilePath = $WEB_ROOT . '/files/storage';
    $urlThumbnailSuffix = '/thumbnail';
    $localFilePath = __DIR__ . '/../storage/userfiles';
    $localThumbnailSuffix = '_thumbnail';

    $phpData = new ReturnData('UNKNOWN_ERROR', true);

    $uri = array_filter(explode('/', $_SERVER['REQUEST_URI']), fn($part) => !is_null($part) && $part !== '');

    if ($uri[count($uri) - 1] !== 'view' || ctype_space($uri[count($uri)])) { $phpData = new ReturnData('INVALID_PATH', true); }
    else
    {
        $filesTable = new cloud_files(true);

        $files = $filesTable->Select(array('id'=>$uri[count($uri)]));
        if ($files->error) { $phpData = new ReturnData($files, true); }
        else if (empty($files->data) || $files->data[0] === null) { $phpData = new ReturnData('NO_RESULTS', true); }
        else if (!file_exists(__DIR__ . '/../storage/userfiles/' . $files->data[0]->id))
        {
            $deleteResponse = $filesTable->Delete(array('id'=>$uri[count($uri)]));
            if ($deleteResponse->error || $deleteResponse !== true) { $phpData = $deleteResponse; }
            else { $phpData = new ReturnData('NO_DATA_FOUND', true); }
        }
        else if ($files->data[0]->shareType != '2') //Not public
        {
            //Verify the users session
            $sessionValid = AccountFunctions::VerifySession();
            if ($sessionValid->error) { $phpData = $sessionValid; }

            if ($sessionValid->data && $_COOKIE['READIE_UID'] === $files->data[0]->uid)
            {
                $files->data[0]->metadata = json_decode($files->data[0]->metadata);
                $phpData = new ReturnData($files->data[0]);
            }
            else
            {
                switch ($files->data[0]->shareType)
                {
                    case '0': //Private
                        //We know that the user is not the owner of the file because of the check above so we can simply deny access here.
                        $phpData = new ReturnData('INVALID_CREDENTIALS', true);
                        break;
                    case '1': //Invite
                        $fileSharesTable = new cloud_file_shares(true);
                        $fileShares = $fileSharesTable->Select(array("fid"=>$files->data[0]->id));
                        if ($fileShares->error) { return $fileShares; }
                        else if (empty($fileShares->data) || $fileShares->data[0] === null) { $phpData = new ReturnData("INVALID_CREDENTIALS", true); }
                        else if (!in_array($_COOKIE['READIE_UID'], array_column($fileShares->data, 'uid'))) { $phpData = new ReturnData("INVALID_CREDENTIALS", true); }
                        else
                        {
                            $files->data[0]->metadata = json_decode($files->data[0]->metadata);
                            $phpData = new ReturnData($files->data[0]);
                        }
                        break;
                    default:
                        //Shouldn't be reached but if it is then return an error.
                        http_response_code(500);
                        exit();
                        // break;
                }
            }
        }
        else
        {
            $files->data[0]->metadata = json_decode($files->data[0]->metadata);
            $phpData = new ReturnData($files->data[0]);
        }
    }

    $mimeTypeExploded = array();
    if (!$phpData->error)
    {
        $mimeTypeExploded = explode('/', $phpData->data->metadata->mimeType);
        $title = 'View File - ' . $files->data[0]->name . '.' . $files->data[0]->type . ' | Cloud';
    }
?>
<!DOCTYPE html>
<html lang="en">
<head>
<link rel="stylesheet" href="<?php echo $WEB_ROOT; ?>/files/view/view.css">
    <script src="<?php echo $WEB_ROOT; ?>/files/view/view.js" type="module"></script>
    <script id="phpDataContainer">var phpData = `<?php echo json_encode($phpData); ?>`;</script>
    <?php
        if (!$phpData->error)
        {
            //Value set here to be used in head.php
            $ogType = $mimeTypeExploded[0] . '.' . $mimeTypeExploded[1];
            $fileExtension = '.' . $mimeTypeExploded[1];

            switch ($mimeTypeExploded[0])
            {
                case 'video':
                    $thumbnailExtension = '.' . (explode('/', $phpData->data->metadata->thumbnailMimeType)[1]);
                    ?>
                        <!-- <meta property="og:type" content="<?php echo $ogType; ?>"> -->
                        <meta property="og:image" content="<?php echo $baseUrl . $urlFilePath . '/' . $phpData->data->id . $urlThumbnailSuffix . $thumbnailExtension; ?>">
                        <meta property="og:image:secure_url" content="<?php echo $baseUrl . $urlFilePath . '/' . $phpData->data->id . $urlThumbnailSuffix . $thumbnailExtension; ?>">
                        <meta property="og:image:type" content="<?php echo $phpData->data->metadata->thumbnailMimeType; ?>">
                        <meta property="og:image:width" content="<?php echo $phpData->data->metadata->thumbnailWidth; ?>">
                        <meta property="og:image:height" content="<?php echo $phpData->data->metadata->thumbnailHeight; ?>">
                        <meta property="og:updated_time" content="<?php echo gmdate("Y-m-d\TH:i:s\Z", $phpData->data->dateAltered); ?>">
                        <meta property="og:video" content="<?php echo $baseUrl . $urlFilePath . '/' . $phpData->data->id . $fileExtension; ?>">
                        <meta property="og:video:url" content="<?php echo $baseUrl . $urlFilePath . '/' . $phpData->data->id . $fileExtension; ?>">
                        <meta property="og:video:secure_url" content="<?php echo $baseUrl . $urlFilePath . '/' . $phpData->data->id . $fileExtension; ?>">
                        <meta property="og:video:type" content="<?php echo $phpData->data->metadata->mimeType; ?>">
                        <meta property="og:video:width" content="<?php echo $phpData->data->metadata->width; ?>">
                        <meta property="og:video:height" content="<?php echo $phpData->data->metadata->height; ?>">
                        <meta name="twitter:card" content="player">
                        <meta name="twitter:image" content="<?php echo $baseUrl . $urlFilePath . '/' . $phpData->data->id . $urlThumbnailSuffix . $thumbnailExtension; ?>">
                        <meta name="twitter:player:width" content="<?php echo $phpData->data->metadata->width; ?>">
                        <meta name="twitter:player:height" content="<?php echo $phpData->data->metadata->height; ?>">
                        <meta name="twitter:player" content="<?php echo $baseUrl . $urlFilePath . '/' . $phpData->data->id . $fileExtension; ?>">
                    <?php
                    break;
                case 'image':
                    ?>
                        <!-- <meta property="og:type" content="<?php echo $ogType; ?>"> -->
                        <meta property="og:image" content="<?php echo $baseUrl . $urlFilePath . '/' . $phpData->data->id . $fileExtension; ?>">
                        <meta property="og:image:secure_url" content="<?php echo $baseUrl . $urlFilePath . '/' . $phpData->data->id . $fileExtension; ?>">
                        <meta property="og:image:type" content="<?php echo $phpData->data->metadata->mimeType; ?>">
                        <meta property="og:image:width" content="<?php echo $phpData->data->metadata->width; ?>">
                        <meta property="og:image:height" content="<?php echo $phpData->data->metadata->height; ?>">
                        <meta property="og:updated_time" content="<?php echo gmdate("Y-m-d\TH:i:s\Z", $phpData->data->dateAltered); ?>">
                        <meta name="twitter:card" content="image">
                        <meta name="twitter:image" content="<?php echo $baseUrl . $urlFilePath; ?>">
                    <?php
                    break;
                /*case 'audio':
                    ?>
                    
                    <?php
                    break;*/
                /*case 'text':
                    ?>

                    <?php
                    break;*/
                default:
                    break;
            }
        }
    ?>
    <?php echo execAndRead("{$SITE_ROOT}/assets/php/head.php"); ?>
</head>
<header id="header"><?php echo execAndRead("{$SITE_ROOT}/assets/php/header.php"); ?></header>
<body>
    <?php
        if (!$phpData->error)
        {
            ?>
                <section id="pageTitleContainer">
                    <div class="leftRight">
                        <h4><?php echo $phpData->data->name . '.' . $phpData->data->type; ?></h4>
                        <a class="asButton" href="<?php echo $baseUrl . $urlFilePath . '/' . $phpData->data->id . $fileExtension; ?>" target="_blank">Download</a>
                    </div>
                    <hr>
                    <br>
                </section>
                <span id="contentContainer">
                    <?php
                        switch ($mimeTypeExploded[0])
                        {
                            case 'video':
                                ?>
                                    <video controls src="<?php echo $baseUrl . $urlFilePath . '/' . $phpData->data->id . $fileExtension; ?>"></video>
                                <?php
                                break;
                            case 'image':
                                ?>
                                    <img src="<?php echo $baseUrl . $urlFilePath . '/' . $phpData->data->id . $fileExtension; ?>">
                                <?php
                                break;
                            case 'audio':
                                ?>
                                    <audio controls src="<?php echo $baseUrl . $urlFilePath . '/' . $phpData->data->id . $fileExtension; ?>"></audio>
                                <?php
                                break;
                            case 'text':
                                ?>
                                    <!-- Set in the TS file. -->
                                    <!-- <pre></pre> -->
                                <?php
                                break;
                            default:
                                break;
                        }
                    ?>
                </span>
            <?php
        }
    ?>
</body>
<footer id="footer"><?php echo execAndRead("{$SITE_ROOT}/assets/php/footer.php"); ?></footer>
</html>