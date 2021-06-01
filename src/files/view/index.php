<?php
    $title = 'View File | Cloud';

    $WEB_ROOT;
    $SITE_ROOT;
    $DOCUMENT_ROOT = $_SERVER["DOCUMENT_ROOT"];
    require_once "$DOCUMENT_ROOT/roots.php";
    require_once "$SITE_ROOT/assets/php/main.php";

    require_once __DIR__ . '/../../../../api/account/accountFunctions.php';
    require_once __DIR__ . '/../../../../api/database/readie/cloud/cloud_files.php';
    require_once __DIR__ . '/../../../../api/returnData.php';

    $phpData = new ReturnData('UNKNOWN_ERROR', true);

    $uri = array_filter(explode('/', $_SERVER['REQUEST_URI']), fn($part) => !is_null($part) && $part !== '');

    if ($uri[count($uri) - 1] !== 'view' || (is_null($uri[count($uri)]) || $uri[count($uri)] === '')) { $phpData = new ReturnData('INVALID_PATH', true); }
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
        else if ($files->data[0]->isPrivate === '1')
        {
            $sessionValid = AccountFunctions::VerifySession();
            if ($sessionValid->error) { $phpData = $sessionValid; }
            else if (!$sessionValid->data || $_COOKIE['READIE_UID'] !== $files->data[0]->uid) { $phpData = new ReturnData('INVALID_CREDENTIALS', true); }
            else
            {
                $data = new stdClass();
                $data->mimeType = mime_content_type(__DIR__ . '/../storage/userfiles/' . $files->data[0]->id);
                $data->filePath = $WEB_ROOT . '/files/storage/' . $files->data[0]->id . '/';
                $phpData = new ReturnData($data);
            }
        }
        else
        {
            $data = new stdClass();
            $data->mimeType = mime_content_type(__DIR__ . '/../storage/userfiles/' . $files->data[0]->id);
            $data->filePath = $WEB_ROOT . '/files/storage/' . $files->data[0]->id . '/';
            $phpData = new ReturnData($data);
        }
    }

    $mimeTypeSplit = array();
    $mimeParent = '';
    if (!$phpData->error)
    {
        $title = 'View File - ' . $files->data[0]->name . '.' . $files->data[0]->type . ' | Cloud';
        $mimeTypeSplit = array_filter(explode('/', $phpData->data->mimeType), fn($part) => !is_null($part) && $part !== '');
        $mimeParent = !empty($mimeTypeSplit) ? $mimeTypeSplit[0] : '';
    }
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <?php echo execAndRead("{$SITE_ROOT}/assets/php/head.php"); ?>
    <link rel="stylesheet" href="<?php echo $WEB_ROOT; ?>/files/view/view.css">
    <script src="<?php echo $WEB_ROOT; ?>/files/view/view.js" type="module"></script>
    <script>var phpData = `<?php echo json_encode($phpData); ?>`;</script>
    <?php
        if (!$phpData->error)
        {
            switch ($mimeParent)
            {
                case 'video':
                    ?>
                        <meta property="og:type" content="<?php echo $phpData->data->mimeType; ?>">
                        <meta property="og:image" content="https://cdn.global-gaming.co/images/banner.png">  <!-- TMP while I try get ffmpeg thumbnails working -->
                        <meta property="og:image:secure_url" content="https://cdn.global-gaming.co/images/banner.png">
                        <meta property="og:image:type" content="image/jpeg">
                        <meta property="og:image:width" content="1920">
                        <meta property="og:image:height" content="1080">
                        <meta property="og:video" content="<?php echo $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . $phpData->data->filePath; ?>">
                        <meta property="og:video:url" content="<?php echo $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . $phpData->data->filePath; ?>">
                        <meta property="og:video:secure_url" content="<?php echo $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . $phpData->data->filePath; ?>">
                        <meta property="og:video:type" content="<?php echo $phpData->data->mimeType; ?>">
                        <!--<meta property="og:video:width" content="1920">--> <!-- Make dynamic, do I need this? -->
                        <!--<meta property="og:video:height" content="1080">--> <!-- Make dynamic, do I need this? -->
                        <meta name="twitter:card" content="player">
                        <meta name="twitter:image" content="https://cdn.global-gaming.co/images/banner.png">
                        <!--<meta property="og:video:width" content="1920">--> <!-- Make dynamic, do I need this? -->
                        <!--<meta property="og:video:height" content="1080">--> <!-- Make dynamic, do I need this? -->
                        <meta name="twitter:player" content="<?php echo $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . $phpData->data->filePath; ?>">
                    <?php
                    break;
                case 'image':
                    ?>
                        <meta property="og:type" content="<?php echo $phpData->data->mimeType; ?>">
                        <meta property="og:image" content="<?php echo $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . $phpData->data->filePath; ?>">  <!-- TMP while I try get ffmpeg thumbnails working -->
                        <meta property="og:image:secure_url" content="<?php echo $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . $phpData->data->filePath; ?>">
                        <meta property="og:image:type" content="<?php echo $phpData->data->mimeType; ?>"> <!-- Make dynamic, do I need this? -->
                        <!--<meta property="og:image:width" content="1080">--> <!-- Make dynamic -->
                        <!--<meta property="og:image:height" content="1920">--> <!-- Make dynamic -->
                        <meta name="twitter:card" content="image">
                        <meta name="twitter:image" content="<?php echo $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . $phpData->data->filePath; ?>">
                    <?php
                    break;
                case 'audio':
                    ?>
                    
                    <?php
                    break;
                default:
                    break;
            }
        }
    ?>
</head>
<header id="header"><?php echo execAndRead("{$SITE_ROOT}/assets/php/header.php"); ?></header>
<body>
    <?php
        if (!$phpData->error)
        {
            ?>
                <section id="pageTitleContainer">
                    <div class="leftRight">
                        <h4><?php echo $files->data[0]->name . '.' . $files->data[0]->type; ?></h4>
                        <a class="asButton" href="<?php echo $phpData->data->filePath; ?>" target="_blank">Download</a>
                    </div>
                    <hr>
                    <br>
                </section>
                <span id="contentContainer">
                    <?php
                        switch ($mimeParent)
                        {
                            case 'video':
                                ?>
                                    <video controls src="<?php echo $phpData->data->filePath; ?>"></video>
                                <?php
                                break;
                            case 'image':
                                ?>
                                    <img src="<?php echo $phpData->data->filePath; ?>">
                                <?php
                                break;
                            case 'audio':
                                ?>
                                    <audio controls src="<?php echo $phpData->data->filePath; ?>"></audio>
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