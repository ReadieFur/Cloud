<?php
    global $WEB_ROOT;
    global $REQUEST_URI;
    global $ogType;
    global $title;
    global $description;
    global $themeColour;
    $DirName = ltrim(ucwords(str_replace("_", " ", basename($REQUEST_URI))));
?>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="dark light">
<meta property="og:type" content="<?php echo $ogType !== null ? $ogType : 'website'; ?>">
<meta property="og:title" content="<?php echo $title != null ? $title : "$DirName | Cloud"; ?>"/>
<meta property="og:description" content="<?php echo $description != null ? $description : $DirName; ?>"/>
<meta property="og:url" content="https://readie.global-gaming.co<?php echo $REQUEST_URI; ?>"/>
<meta property="og:image" content="https://cdn.global-gaming.co/images/team/members/readiecircle.png"/>
<meta name="theme-color" content="<?php echo $themeColour != null ? $themeColour : "#6400ff" ?>">
<title><?php echo $title != null ? $title : "$DirName | Cloud"; ?></title>
<link rel="icon" href="https://cdn.global-gaming.co/images/team/members/readiecircle.png" type="image/png">
<link href="https://cdn.global-gaming.co/resources/fonts/montserrat/stylesheet.css" rel="stylesheet" type="text/css"> <!--Main font-->
<link href="https://cdn.global-gaming.co/resources/fonts/open_sans/stylesheet.css" rel="stylesheet" type="text/css"> <!--Fallback font-->
<link rel="stylesheet" type="text/css" href="<?php echo $WEB_ROOT; ?>/assets/css/head.css"/>
<link rel="stylesheet" type="text/css" href="<?php echo $WEB_ROOT; ?>/assets/css/main.css"/>
<script src="https://cdn.global-gaming.co/resources/scripts/jquery/jquery-3.5.1.min.js"></script>
<script>var WEB_ROOT = "<?php echo $WEB_ROOT; ?>";</script>
<style id="themeColours"></style>
<!--I'd like to move the alert box and account container here but I was having som annoying css ussues with it that I can't be arsed to fix right now.-->
<!--This also shouldn't go in the head, make a new file for extra things that should be on all pages-->
<div id="tooltipContainer"><small id="tooltipText"></small></div>