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
    <script src="https://cdn-readie.global-gaming.co/resources/scripts/jquery/jquery.form.min.js"></script>
    <script src="./index.js" type="module"></script>
</head>
<header id="header"><?php echo execAndRead("{$SITE_ROOT}/assets/php/header.php"); ?></header>
<body>
    <input id="unfocus">
    <div id="filePreviewContainer">
        <div class="background"></div>
        <iframe id="filePreview"></iframe>
    </div>
    <div id="sharingMenu">
        <div class="background"></div>
        <div class="container">
            <h3>Sharing options:</h3>
            <form>
                <select id="sharingTypes">
                    <option value="0">Private</option>
                    <option value="1">Invite</option>
                    <option value="2">Public</option>
                </select>
                <table>
                    <!--There are no options for private sharing-->
                    <!-- <tbody id="privateSharing">
                    </tbody> -->
                    <tbody id="inviteSharing">
                        <tr>
                            <td>
                                <p>Add User:</p>
                                <input type="text" id="inviteUser" placeholder="Username" minlength="4" maxlength="20">
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <p>Shared with:</p>
                                <ul id="inviteList"></ul>
                            </td>
                        </tr>
                    </tbody>
                    <!--There are no options for public sharing-->
                    <tbody id="publicSharing">
                        <tr>
                            <td>
                                <p>Expiry Date:</p>
                                <input type="datetime-local" id="publicExpiryTime">
                                <br><br>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </form>
            <p id="unsavedSharingChangesNotice" class="light">You have unsaved changes!</p>
            <div class="joinButtons">
                <button id="sharingLink">Copy Link</button>
                <button id="saveSharing">Save</button>
            </div>
        </div>
    </div>
    <!--This drop box is just cosmetic, the event is attatched to the window-->
    <!--<div id="fileDrop">
        <div class="center">
            <h3>Drop files anywhere to upload.</h3>
        </div>
    </div>-->
    <!--<div id="viewer">
        For now I will just redirect to the view page when the user clicks on the file.
    </div>-->
    <section id="filesList">
        <div class="leftRight">
            <table>
                <tbody>
                    <tr>
                        <td>
                            <h4 id="pageTitle">My Files</h4>
                        </td>
                        <td>
                            <form id="uploadForm">
                                <input id="inputFile" type="file">
                            </form>
                        </td>
                    </tr>
                </tbody>
            </table>
            <form id="search">
                <input id="searchText" type="text" placeholder="Search"><input class="asButton" type="submit" value="Search">
            </form>
        </div>
        <hr>
        <table id="files">
            <tbody>
                <tr>
                    <th class="projectColumn">Name</th>
                    <th class="descriptionColumn">Type</th>
                    <th class="dateColumn">Date Modified</th>
                    <th class="sizeColumn">Size</th>
                    <th class="optionsColumn">Options</th>
                </tr>
            </tbody>
            <tbody id="uploadsBody">
                <!--<tr class="listItem uploading" id="FILE_ID">
                    <td class="nameColumn"><input type="text" value="Untitled file"></td>
                    <td class="typeColumn"><input type="text" value="mkv"></td>
                    <td class="dateColumn">30/05/2021 - 13:05</td>
                    <td class="sizeColumn">128mb</td>
                    <td class="optionsColumn">
                        <div class="joinButtons">
                            <button>Download</button>
                            <button>Public</button>
                            <button class="red">Delete</button>
                        </div>
                    </td>
                </tr>-->
            </tbody>
            <tbody id="filesBody">
                <!--<tr class="listItem" id="FILE_ID">
                    <td class="nameColumn"><input type="text" value="Untitled file"></td>
                    <td class="typeColumn"><input type="text" value="mkv"></td>
                    <td class="dateColumn">30/05/2021</td>
                    <td class="sizeColumn">128mb</td>
                    <td class="optionsColumn">
                        <div class="joinButtons">
                            <button>Download</button>
                            <button>Public</button>
                            <button class="red">Delete</button>
                        </div>
                    </td>
                </tr>-->
            </tbody>
        </table>
        <div id="pages" class="joinButtons"></div>
        <br>
        <p id="resultsText" class="light">Showing results: 0-0 of 0</p>
    </section>
</body>
<footer id="footer"><?php echo execAndRead("{$SITE_ROOT}/assets/php/footer.php"); ?></footer>
</html>