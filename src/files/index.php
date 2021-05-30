<?php
    $title = 'My Files | Cloud';

    $WEB_ROOT;
    $SITE_ROOT;
    $DOCUMENT_ROOT = $_SERVER["DOCUMENT_ROOT"];
    require_once "$DOCUMENT_ROOT/roots.php";
    require_once "$SITE_ROOT/assets/php/main.php";
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <?php echo execAndRead("{$SITE_ROOT}/assets/php/head.php"); ?>
    <link rel="stylesheet" href="./index.css">
    <script src="https://cdn.global-gaming.co/resources/scripts/jquery/jquery.form.min.js"></script>
    <script src="./index.js" type="module"></script>
</head>
<header id="header"><?php echo execAndRead("{$SITE_ROOT}/assets/php/header.php"); ?></header>
<body>
<section id="filesList">
        <div class="leftRight">
            <h4>My Files</h4>
            <form id="search">
                <!--Can't have the space between these two elements here, I could make a workaround for this but I can't be arsed.-->
                <input id="searchText" type="text" placeholder="Search"><input class="asButton" type="submit" value="Search">
            </form>
        </div>
        <hr>
        <table id="files">
            <tbody>
                <tr>
                    <th class="projectColumn">Name</th>
                    <th class="descriptionColumn">Type</th>
                    <th class="sizeColumn">Size</th>
                    <th class="dateColumn">Date Modified</th>
                    <th class="optionsColumn">Options</th>
                </tr>
            </tbody>
            <tbody>
                <tr class="listItem" id="FILE_ID">
                    <td class="nameColumn"><input type="text" value="Untitled file"></td>
                    <td class="typeColumn"><input type="text" value="mkv"></td>
                    <td class="dateColumn">30/05/2021</td>
                    <td class="sizeColumn">128mb</td>
                    <td class="optionsColumn">
                        <span>
                            <!--Add SVG images here-->
                        </span>
                    </td>
                    </td>
                </tr>
            </tbody>
        </table>
        <div id="pages" class="joinButtons"></div>
        <br>
        <p id="resultsText" class="light">Showing results: 0-0 of 0</p>
    </section>
</body>
<footer id="footer"><?php echo execAndRead("{$SITE_ROOT}/assets/php/footer.php"); ?></footer>
</html>