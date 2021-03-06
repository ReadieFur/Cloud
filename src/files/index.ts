import { Main, ReturnData } from "../assets/js/main.js";
import * as Interfaces from "../assets/js/interfaces.js";

class Files
{
    private static readonly usernameRegex = /(?=.{4,20}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])/m;

    private unfocus: HTMLInputElement;
    private preview:
    {
        container: HTMLDivElement;
        iframe: HTMLIFrameElement;
    }
    private search: HTMLFormElement;
    private searchText: HTMLInputElement;
    private filesTable: HTMLTableElement;
    private uploadsBody: HTMLTableSectionElement;
    private filesBody: HTMLTableSectionElement;
    private pageButtonsContainer: HTMLDivElement;
    private resultsText: HTMLParagraphElement;
    //private fileDrop: HTMLDivElement;
    private uploadForm: HTMLFormElement;
    private inputFile: HTMLInputElement;
    private sharingMenu:
    {
        container: HTMLDivElement,
        sharingTypes: HTMLSelectElement,
        subMenus:
        {
            inviteOptions:
            {
                container: HTMLTableSectionElement,
                usernameInput: HTMLInputElement,
                inviteListElement: HTMLUListElement,
                inviteList: string[]
            },
            publicOptions:
            {
                container: HTMLTableSectionElement,
                publicSharingTimeInput: HTMLInputElement
            }
        },
        unsavedChangesNotice: HTMLParagraphElement,
        sharingLink: HTMLButtonElement,
        saveButton: HTMLButtonElement
    }
    private filesFilter: IFilesFilter;

    constructor()
    {
        new Main();
        this.unfocus = Main.ThrowIfNullOrUndefined(document.querySelector("#unfocus"));
        this.preview =
        {
            container: Main.ThrowIfNullOrUndefined(document.querySelector("#filePreviewContainer")),
            iframe: Main.ThrowIfNullOrUndefined(document.querySelector("#filePreview"))
        };
        this.search = Main.ThrowIfNullOrUndefined(document.querySelector("#search"));
        this.searchText = Main.ThrowIfNullOrUndefined(document.querySelector("#searchText"));
        this.filesTable = Main.ThrowIfNullOrUndefined(document.querySelector("#files"));
        this.uploadsBody = Main.ThrowIfNullOrUndefined(this.filesTable.querySelector("#uploadsBody"));
        this.filesBody = Main.ThrowIfNullOrUndefined(this.filesTable.querySelector("#filesBody"));
        this.pageButtonsContainer = Main.ThrowIfNullOrUndefined(document.querySelector("#pages"));
        this.resultsText = Main.ThrowIfNullOrUndefined(document.querySelector("#resultsText"));
        //this.fileDrop = Main.ThrowIfNullOrUndefined(document.querySelector("#fileDrop"));
        this.uploadForm = Main.ThrowIfNullOrUndefined(document.querySelector("#uploadForm"));
        this.inputFile = Main.ThrowIfNullOrUndefined(document.querySelector("#inputFile"));
        this.sharingMenu =
        {
            container: Main.ThrowIfNullOrUndefined(document.querySelector("#sharingMenu")),
            sharingTypes: Main.ThrowIfNullOrUndefined(document.querySelector("#sharingTypes")),
            subMenus:
            {
                inviteOptions:
                {
                    container: Main.ThrowIfNullOrUndefined(document.querySelector("#inviteSharing")),
                    usernameInput: Main.ThrowIfNullOrUndefined(document.querySelector("#inviteUser")),
                    inviteListElement: Main.ThrowIfNullOrUndefined(document.querySelector("#inviteList")),
                    inviteList: []
                },
                publicOptions:
                {
                    container: Main.ThrowIfNullOrUndefined(document.querySelector("#publicSharing")),
                    publicSharingTimeInput: Main.ThrowIfNullOrUndefined(document.querySelector("#publicExpiryTime"))
                }
            },
            unsavedChangesNotice: Main.ThrowIfNullOrUndefined(document.querySelector("#unsavedSharingChangesNotice")),
            sharingLink: Main.ThrowIfNullOrUndefined(document.querySelector("#sharingLink")),
            saveButton: Main.ThrowIfNullOrUndefined(document.querySelector("#saveSharing"))
        }
        this.filesFilter =
        {
            filter: "date",
            data: "",
            page: 1
        };

        window.addEventListener("message", (ev) => { this.WindowMessageEvent(ev); });
        //For now I will I will just do single file uploads with no drag and drop, I will work on this bit for the next update.
        //A way I could possibly use this for individual drag and drop files is to drop them onto a large transparent file input.
        /*if ('FileReader' in window && 'DataTransfer' in window)
        {
            window.addEventListener("dragover", (ev) => { ev.preventDefault(); });
            window.addEventListener("drop", (ev) => { this.FileDrop(ev); });
        }*/
        (<HTMLDivElement>Main.ThrowIfNullOrUndefined(document.querySelector("#filePreviewContainer > .background"))).addEventListener("click", () =>
        {
            Main.FadeElement("none", this.preview.container);
            this.preview.iframe.src = "";
        });
        this.search.addEventListener("submit", (ev) => { this.SearchFiles(ev); });
        this.uploadForm.setAttribute("action", "./files.php");
        this.uploadForm.setAttribute("method", "post");
        new MutationObserver(() =>
        {
            if (this.uploadForm.getAttribute("action") !== "./files.php" || this.uploadForm.getAttribute("method") !== "post")
            {
                this.uploadForm.setAttribute("action", "./files.php");
                this.uploadForm.setAttribute("method", "post");
            }
        })
        .observe(this.uploadForm, { attributes: true, childList: false });
        this.inputFile.setAttribute("name", "inputFile");
        new MutationObserver(() =>
        {
            if (this.inputFile.getAttribute("name") !== "inputFile")
            { this.inputFile.setAttribute("name", "inputFile"); }
        })
        .observe(this.inputFile, { attributes: true, childList: false });
        this.inputFile.addEventListener("change", (ev) => { this.UploadFile(ev); })
        //this.fileDrop.addEventListener("drop", (ev) => { this.FileDrop(ev); });

        if (Main.urlParams.has("q"))
        {
            var query: IFilesFilter | null = JSON.parse(Main.urlParams.get("q")!);
            if (query !== null)
            {
                if (
                    (query.data !== null || query.data !== undefined) &&
                    (query.filter !== null || query.filter !== undefined) &&
                    (query.page !== null || query.page !== undefined)
                )
                {
                    this.filesFilter.data = query.data;
                    this.filesFilter.filter = query.filter;
                    this.filesFilter.page = query.page;
                    this.searchText.value = query.data
                }
            }
        }

        Main.ThrowIfNullOrUndefined(document.querySelector("#sharingMenu > .background")).addEventListener("click", () => { Main.FadeElement("none", this.sharingMenu.container); });
        Main.ThrowIfNullOrUndefined(document.querySelector("#sharingMenu > .container > form")).addEventListener("submit", (ev: Event) => { ev.preventDefault(); });
        this.sharingMenu.subMenus.inviteOptions.usernameInput.addEventListener("keypress", (ev) =>
        {
            if (ev.key === " ")
            {
                ev.preventDefault();
            }
            else if (ev.key === "Enter" && this.AddUserToInviteList(this.sharingMenu.subMenus.inviteOptions.usernameInput.value))
            {
                this.sharingMenu.subMenus.inviteOptions.usernameInput.value = "";
            }
        });

        this.FilesPHP(
        {
            method: "getFiles",
            data: this.filesFilter,
            success: (response) => { this.GotFiles(response); }
        });
    }

    private AddUserToInviteList(username: string): boolean
    {
        //In the future check if the user is found on the database before adding them to the list, currently the check is only done when the save button is pressed.
        username = username.toLowerCase();
        if (username.match(Files.usernameRegex) && !this.sharingMenu.subMenus.inviteOptions.inviteList.includes(username))
        {
            this.sharingMenu.unsavedChangesNotice.style.display = "block";
            var user = document.createElement("li");
            user.innerText = username;
            user.classList.add("light");
            user.addEventListener("click", () =>
            {
                this.sharingMenu.subMenus.inviteOptions.inviteList.splice(this.sharingMenu.subMenus.inviteOptions.inviteList.indexOf(username), 1);
                this.sharingMenu.subMenus.inviteOptions.inviteListElement.removeChild(user);
            });
            this.sharingMenu.subMenus.inviteOptions.inviteList.push(username);
            this.sharingMenu.subMenus.inviteOptions.inviteListElement.appendChild(user);

            return true;
        }
        else { return false; }
    }

    private UploadFile(ev: Event)
    {
        var files = (<HTMLInputElement>ev.target).files;
        if (files === null || files[0] === undefined) { return; }

        var file = files[0];
        var typeSeperatorIndex = file.name.lastIndexOf('.');
        var filename = typeSeperatorIndex !== -1 ? file.name.substr(0, typeSeperatorIndex) : file.name;
        var filetype = typeSeperatorIndex !== -1 ? file.name.substr(typeSeperatorIndex + 1) : "";

        var fileRow = this.CreateFileRow(
        {
            id: new Date().getTime().toString(),
            uid: Main.RetreiveCache("READIE_UID"),
            name: filename,
            type: filetype,
            size: file.size,
            metadata:
            {
                mimeType: file.type,
            },
            shareType: 0,
            sharedWith: [],
            publicExpiryTime: -1,
            dateAltered: new Date().getTime(),
        }, true);
        fileRow.classList.add("uploading");
        fileRow.style.background = `linear-gradient(90deg, rgba(var(--accentColour), 1) 0%, transparent 0%)`;
        //fileRow.addEventListener("click", () => { this.uploadsBody.removeChild(fileRow); });
        this.uploadsBody.appendChild(fileRow);

        var wasCancelled = false;
        const upload = (jQuery(this.uploadForm) as any as IAJAXSubmit).ajaxSubmit(
        {
            uploadProgress: (event, position, total, percentComplete) =>
            {	
                fileRow.style.background = `linear-gradient(90deg, rgba(var(--accentColour), 1) ${percentComplete}%, transparent ${percentComplete}%)`;
            },
            success: (data, textStatus, jqXHR) =>
            {
                var response: ReturnData = JSON.parse(data);
                if (response.error) { Main.Alert(Main.GetPHPErrorMessage(response.data)); return; }

                //I could just also reload all the file listings here.
                var responseData: Interfaces.IFile = response.data;
                responseData.dateAltered *= 1000;
                this.uploadsBody.removeChild(fileRow);
                var uploadedFileRow = this.CreateFileRow(responseData);
                //if (this.filesBody.lastChild !== null) { this.filesBody.removeChild(this.filesBody.lastChild); }
                this.filesBody.insertBefore(uploadedFileRow, this.filesBody.firstChild);
            },
            error: (jqXHR) =>
            {
                this.uploadsBody.removeChild(fileRow);
                if (!wasCancelled) { Main.Alert(Main.GetStatusCodeMessage(jqXHR.status)); }
            }
        });
        //https://stackoverflow.com/questions/10601841/how-do-i-cancel-a-file-upload-started-by-ajaxsubmit-in-jquery
        const xhr = (upload as any).data('jqxhr');
        (<HTMLButtonElement>fileRow.querySelector(".cancel")).addEventListener("click", () =>
        {
            wasCancelled = true;
            xhr.abort();
            //Done by the error handler.
            // this.uploadsBody.removeChild(fileRow);
        });
    }

    //https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/File_drag_and_drop
    //https://css-tricks.com/drag-and-drop-file-uploading/
    private FileDrop(ev: DragEvent)
    {
        console.log(ev);
        ev.preventDefault();

        if (ev.dataTransfer !== null && ev.dataTransfer.items)
        {
            for (let i = 0; i < ev.dataTransfer.items.length; i++)
            {
                if (ev.dataTransfer.items[i].kind === "file")
                {
                    var file = ev.dataTransfer.items[i].getAsFile();
                    console.log(`file[${i}].name = ${file !== null ? file.name : null}`);
                    console.log(file);
                }
            }
        }
        else if (ev.dataTransfer !== null && ev.dataTransfer.files)
        {
            for (let i = 0; i < ev.dataTransfer.files.length; i++)
            {
                console.log(`file[${i}].name = ${ev.dataTransfer.files[i].name}`);
            }
        }
    }

    private GotFiles(response: ReturnData)
    {
        if (response.error) { Main.Alert(Main.GetPHPErrorMessage(response.data)); return; }

        var responseData: IFileResponse = response.data;

        //#region Results text.
        this.resultsText.innerText = `Showing results: ${
            responseData.files.length === 0 ? 0 : responseData.startIndex + 1} - ${
            responseData.startIndex + responseData.files.length} of ${responseData.files.length}`;
        //#endregion

        //#region Page buttons.
        var pageNumbers: number[] = [];
        if (response.data.overlaysFound > responseData.resultsPerPage)
        {
            var pagesAroundCurrent = 2;
            var pages = response.data.overlaysFound / response.data.resultsPerPage;
            if (pages > 0 && pages < 1) { pages = 1; }
            else if (pages % 1 != 0) { pages = Math.trunc(pages) + 1; } //Can't have half a page, so make a new one.
    
            //I could simplify this but it would make it harder to read.
            this.filesFilter.page = (response.data.startIndex / response.data.resultsPerPage) + 1;
            var lowerPage = this.filesFilter.page - pagesAroundCurrent;
            var upperPage = this.filesFilter.page + pagesAroundCurrent;
    
            //Just in case something bad happens and I end up with decimals I don't want those to show as the page numbers (Math.trunc).

            pageNumbers.push(1);
    
            for (let i = lowerPage; i < this.filesFilter.page; i++)
            {
                if (i <= 1) { continue; }
                pageNumbers.push(Math.trunc(i));
            }
    
            if (this.filesFilter.page != 1 && this.filesFilter.page != pages) { pageNumbers.push(Math.trunc(this.filesFilter.page)); }
    
            for (let i = this.filesFilter.page + 1; i <= upperPage; i++)
            {
                if (i >= pages) { break; }
                pageNumbers.push(Math.trunc(i));
            }
    
            pageNumbers.push(pages);
        }
        else if (response.data.overlaysFound > 0) //&& response.data.overlaysFound <= Browser.resultsPerPage
        {
            this.filesFilter.page = 1;
            pageNumbers.push(1);
        }
        else
        {
            //this.filesFilter.page = 0;
            this.filesFilter.page = 1;
        }

        this.pageButtonsContainer.innerHTML = "";
        pageNumbers.forEach(page =>
        {
            var button = document.createElement("button");
            button.innerText = page.toString();

            if (pageNumbers.length == 1) { button.classList.add("ignore"); }

            if (page == this.filesFilter.page) { button.classList.add("active"); }
            else
            {
                button.onclick = () =>
                {
                    this.FilesPHP(
                    {
                        method: "getFiles",
                        data:
                        {
                            filter: this.filesFilter.filter,
                            search: this.filesFilter.data,
                            page: page
                        },
                        success: (_response) => { this.GotFiles(_response); }
                    });
                }
            }

            this.pageButtonsContainer.appendChild(button);
        });
        //#endregion

        this.filesBody.innerHTML = "";
        responseData.files.forEach(file =>
        {
            file.dateAltered *= 1000;
            file.publicExpiryTime *= 1000;
            var fileRow = this.CreateFileRow(file);
            this.filesBody.appendChild(fileRow);
        });

        //#region Save the search into the browser history
        var pageQueryString = JSON.stringify(this.filesFilter);
        Main.urlParams.set("q", pageQueryString);
        window.history.pushState(pageQueryString, document.title, `?${Main.urlParams.toString()}`);
        //#endregion
    }

    private SearchFiles(ev: Event)
    {
        ev.preventDefault();
        ev.returnValue = false;

        var searchText = this.searchText.value.split(':');

        if (searchText[1] === "") { Main.Alert("Invalid search."); return; }

        if (searchText[0] === "" && searchText[1] === undefined)
        {
            //"none" is for listing all overlays that the user can see.
            this.filesFilter.filter = "date";
            this.filesFilter.data = "";
        }
        else if ((searchText[0] === "date") && (searchText[1] !== "" || searchText[1] !== undefined))
        {
            var page = parseInt(searchText[1]);
            this.filesFilter.filter = searchText[0].toLowerCase() as IFilesFilter["filter"];
            this.filesFilter.page = isNaN(page) ? 1 : page;
        }
        else
        {
            this.filesFilter.filter = "name";
            this.filesFilter.data = searchText[0];
        }

        this.FilesPHP(
        {
            method: "getFiles",
            data: this.filesFilter,
            success: (response) => { this.GotFiles(response); }
        });
    }

    private SetSharingUIContents(file: Interfaces.IFile)
    {
        this.sharingMenu.subMenus.inviteOptions.inviteList = [];
        this.sharingMenu.subMenus.inviteOptions.inviteListElement.innerHTML = "";

        const instance = this;
        function SetShareType(type: Interfaces.IFile["shareType"])
        {
            instance.sharingMenu.subMenus.inviteOptions.container.style.display = "none";
            instance.sharingMenu.subMenus.publicOptions.container.style.display = "none";

            switch (type.toString())
            {
                case "1": //Invite
                    instance.sharingMenu.subMenus.inviteOptions.container.style.display = "table-row-group";
                    if (file.sharedWith !== undefined) { file.sharedWith.forEach(username => { instance.AddUserToInviteList(username); }); }
                    break;
                case "2": //Public
                    instance.sharingMenu.subMenus.publicOptions.container.style.display = "table-row-group";
                    if (file.publicExpiryTime != -1)
                    {
                        instance.sharingMenu.subMenus.publicOptions.publicSharingTimeInput.value = Files.FormatUnixToFormDate(file.publicExpiryTime);
                    }
                    else
                    {
                        instance.sharingMenu.subMenus.publicOptions.publicSharingTimeInput.value = "";
                    }
                    break;
                default: //0 (Private)
                    break;
            }
        }

        instance.sharingMenu.sharingTypes.value = file.shareType.toString();
        SetShareType(file.shareType);

        this.sharingMenu.sharingTypes.onchange = () =>
        {
            this.sharingMenu.unsavedChangesNotice.style.display = "block";
            SetShareType(parseInt(this.sharingMenu.sharingTypes.value) as Interfaces.IFile["shareType"]);
        };
        this.sharingMenu.subMenus.publicOptions.publicSharingTimeInput.onchange = () => { this.sharingMenu.unsavedChangesNotice.style.display = "block"; }
        this.sharingMenu.sharingLink.onclick = () => { navigator.clipboard.writeText(`${window.location.origin}${Main.WEB_ROOT}/files/view/${file.id}/`); };
        this.sharingMenu.saveButton.onclick = () => { this.SaveSharingOptions(file); };

        this.sharingMenu.unsavedChangesNotice.style.display = "none";
    }

    private SaveSharingOptions(file: Interfaces.IFile)
    {
        var shareType: Interfaces.IFile["shareType"];
        var publicExpiryTime = -1;
        switch (this.sharingMenu.sharingTypes.value)
        {
            case "1": //Invite
                shareType = 1;
                break;
            case "2": //Public
                shareType = 2;
                var parsedDate = Date.parse(this.sharingMenu.subMenus.publicOptions.publicSharingTimeInput.value) / 1000;
                if (!isNaN(parsedDate)) { publicExpiryTime = parsedDate; }
                break;
            default: //0 (Private)
                shareType = 0;
                break;
        }

        var updatedFile: Interfaces._IFile =
        {
            id: file.id,
            uid: file.uid,
            name: file.name,
            type: file.type,
            size: file.size,
            shareType: shareType,
            publicExpiryTime: publicExpiryTime,
            sharedWith: this.sharingMenu.subMenus.inviteOptions.inviteList
        };

        //TODO: Store the file row element in memory so that it does not need to be queried and can be accessed easier. This will be necessary for when I will want to add a function for when files are updated as it would make the code neater, less repetitive, and could help with if files are updated elsewhere.
        this.FilesPHP(
        {
            method: "updateFile",
            data: updatedFile,
            success: (response) =>
            {
                if (response.error)
                {
                    Main.Alert(Main.GetPHPErrorMessage(response.data));
                    return;
                }

                const updatedFileResponse: Interfaces.IFile = response.data;
                updatedFileResponse.publicExpiryTime *= 1000;

                const shareButton: HTMLButtonElement = Main.ThrowIfNullOrUndefined(document.querySelector(`#file_${file.id} > .optionsColumn > .joinButtons > .shareButton`)) as HTMLButtonElement;
                if (updatedFileResponse.shareType == 0) { shareButton.classList.remove("active"); }
                else { shareButton.classList.add("active"); }
                shareButton.onclick = async () =>
                {

                    this.SetSharingUIContents(updatedFileResponse);
                    await Main.FadeElement("block", this.sharingMenu.container);
                };

                this.sharingMenu.subMenus.inviteOptions.inviteList = [];
                this.sharingMenu.subMenus.inviteOptions.inviteListElement.innerHTML = "";
                updatedFileResponse.sharedWith.forEach(username => { this.AddUserToInviteList(username); });

                if (updatedFileResponse.publicExpiryTime != -1)
                { this.sharingMenu.subMenus.publicOptions.publicSharingTimeInput.value = Files.FormatUnixToFormDate(updatedFileResponse.publicExpiryTime); }
                else { this.sharingMenu.subMenus.publicOptions.publicSharingTimeInput.value = ""; }

                this.sharingMenu.unsavedChangesNotice.style.display = "none";
            }
        });
    }

    private CreateFileRow(file: Interfaces.IFile, isUpload: boolean = false): HTMLTableRowElement
    {
        var tr = document.createElement("tr");
        tr.classList.add("listItem");
        tr.id = `file_${file.id}`;

        var nameColumn = document.createElement("td");
        nameColumn.classList.add("nameColumn");
        var nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.maxLength = 255;
        nameInput.value = file.name;
        nameInput.addEventListener("keypress", (ev) => { if (ev.key === "Enter") { this.unfocus.focus(); } });
        nameInput.addEventListener("input", () => { nameInput.value = Files.GetValidFileName(nameInput.value); });
        nameInput.addEventListener("focusout", () =>
        {
            if (file.name !== nameInput.value)
            {
                nameInput.value = file.name = Files.GetValidFileName(nameInput.value);

                this.FilesPHP(
                {
                    method: "updateFile",
                    data: file,
                    success: (response) => { if (response.error) { Main.Alert(Main.GetPHPErrorMessage(response.data)); } }
                });
            }
        });
        nameColumn.appendChild(nameInput);
        tr.appendChild(nameColumn);

        var typeColumn = document.createElement("td");
        typeColumn.classList.add("typeColumn");
        var typeInput = document.createElement("input");
        typeInput.type = "text";
        typeInput.maxLength = 24;
        typeInput.value = file.type;
        /*typeInput.addEventListener("keypress", (ev) => { if (ev.key === "Enter") { this.unfocus.focus(); } });
        typeInput.addEventListener("input", () => { typeInput.value = Files.GetValidFileName(typeInput.value); });
        typeInput.addEventListener("focusout", () =>
        {
            if (file.name !== typeInput.value)
            {
                typeInput.value = file.name = Files.GetValidFileName(typeInput.value);

                this.FilesPHP(
                {
                    method: "updateFile",
                    data: file,
                    success: (response) => { if (response.error) { Main.Alert(Main.GetPHPErrorMessage(response.data)); } }
                });
            }
        });*/
        typeColumn.appendChild(typeInput);
        tr.appendChild(typeColumn);

        var dateColumn = document.createElement("td");
        dateColumn.classList.add("dateColumn");
        var date = new Date(file.dateAltered);
        dateColumn.innerText = `${
            date.getDay() < 10 ? "0" + date.getDay().toString() : date.getDay()}/${
            date.getMonth() < 10 ? "0" + date.getMonth() : date.getMonth()}/${
            date.getFullYear()} - ${
            date.getHours() < 10 ? "0" + date.getHours() : date.getHours()}:${
            date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes()}`;
        tr.appendChild(dateColumn);

        var sizeColumn = document.createElement("td");
        sizeColumn.classList.add("sizeColumn");
        sizeColumn.innerText = Main.FormatBytes(file.size);
        tr.appendChild(sizeColumn);

        var optionsColumn = document.createElement("td");
        optionsColumn.classList.add("optionsColumn");
        var optionsContainer = document.createElement("div");
        if (!isUpload)
        {
            optionsContainer.classList.add("joinButtons");
            var downloadButton = document.createElement("button");
            downloadButton.innerText = "Download";
            downloadButton.addEventListener("click", () => { window.open(`${Main.WEB_ROOT}/files/storage/${file.id}.${file.type}`); });
            optionsContainer.appendChild(downloadButton);
            var shareButton = document.createElement("button");
            shareButton.innerText = "Share";
            shareButton.classList.add("shareButton", "dontForceCursor");
            if (file.shareType != 0) { shareButton.classList.add("active"); }
            shareButton.onclick = async () =>
            {
                this.SetSharingUIContents(file);
                await Main.FadeElement("block", this.sharingMenu.container);
            };
            optionsContainer.appendChild(shareButton);
            var deleteButton = document.createElement("button");
            deleteButton.innerText = "Delete";
            deleteButton.classList.add("red");
            deleteButton.addEventListener("dblclick", () =>
            {
                this.FilesPHP(
                {
                    method: "deleteFile",
                    data: file,
                    success: (response) =>
                    {
                        if (response.error) { Main.Alert(Main.GetPHPErrorMessage(response.data)); }
                        else if (response.data !== true) { Main.Alert("Unknown error."); }
                        else { tr.remove(); }
                    }
                });
            });
            optionsContainer.appendChild(deleteButton);

            tr.addEventListener("click", (ev) =>
            {
                if ((<HTMLElement>ev.target).tagName == "TD" && ev.button == 0)
                {
                    if (ev.ctrlKey)
                    {
                        window.open(`${Main.WEB_ROOT}/files/view/${file.id}/`);
                    }
                    else
                    {
                        this.preview.iframe.src = `${Main.WEB_ROOT}/files/view/${file.id}/`;
                        Main.FadeElement("block", this.preview.container);
                    }
                }
            });
            tr.addEventListener("mousedown", (ev) =>
            {
                if ((<HTMLElement>ev.target).tagName == "TD" && ev.button == 1)
                {
                    window.open(`${Main.WEB_ROOT}/files/view/${file.id}/`);
                }
            });
        }
        else
        {
            var cancelUploadButton = document.createElement("button");
            cancelUploadButton.innerText = "Cancel";
            cancelUploadButton.classList.add("red", "cancel");
            // cancelUploadButton.addEventListener("click", () => { /*To be set by the uploading function*/ });
            optionsContainer.appendChild(cancelUploadButton);
        }
        optionsColumn.appendChild(optionsContainer);
        tr.appendChild(optionsColumn);
        
        return tr;
    }

    private FilesPHP(params:
    {
        method: "getFiles" | "updateFile" | "deleteFile",
        data?: object
        success?: (response: ReturnData) => any
        error?: (ex: any) => any
        async?: boolean
    })
    {
        return jQuery.ajax(
        {
            async: params.async??true,
            url: "./files.php",
            method: "POST",
            dataType: "json",
            data:
            {
                "q": JSON.stringify(
                {
                    method: params.method,
                    data: params.data??{}
                })
            },
            error: params.error??Main.ThrowAJAXJsonError,
            success: params.success
        });
    }

    private static GetValidFileName(fileName: string): string
    {
        return fileName.substr(0, 255).replace(/[\\\/:*?\"<>|]/, "");
    }

    private static GetValidFileType(fileName: string): string
    {
        return fileName.substr(0, 24);
    }

    private WindowMessageEvent(ev: MessageEvent<any>)
    {
        var host = window.location.host.split('.');
        if (ev.origin.split('/')[2] == `api-readie.global-gaming.${host[host.length - 1]}`)
        {
            if (Main.TypeOfReturnData(ev.data))
            {
                switch (ev.data.data)
                {
                    case "LOGGED_IN":
                        this.FilesPHP(
                        {
                            method: "getFiles",
                            data: this.filesFilter,
                            success: (response) => { this.GotFiles(response); }
                        });
                        break;
                    default:
                        //Not implemented.
                        break;
                }
            }
            else
            {
                //Alert unknown error/response.
                console.log("Unknown response: ", ev);
                Main.AccountMenuToggle(false);
            }
        }
    }

    public static FormatUnixToFormDate(unixTime: number): string
    {
        //Element value format: YYYY-MM-DDTHH:mm
        const date = new Date(unixTime);
        return `${date.getFullYear()}-${
            (date.getMonth() + 1) < 10 ? "0" + date.getMonth().toString() : date.getMonth()}-${
            date.getDate() < 10 ? "0" + date.getDate().toString() : date.getDate()}T${
            date.getHours() < 10 ? "0" + date.getHours().toString() : date.getHours()}:${
            date.getMinutes() < 10 ? "0" + date.getMinutes().toString() : date.getMinutes()}`;
    }
}
new Files();

interface IFilesFilter
{
    filter: "name" | "type" | "size" | "date" | "shared",
    data: string,
    page: number
}

interface IFileResponse
{
    files: Interfaces.IFile[],
    filesFound: number,
    resultsPerPage: number,
    startIndex: number
}

interface IAJAXSubmit
{
    ajaxSubmit(options:
    {
        target?: string,
        resetForm?: boolean
        beforeSubmit?: (data: any) => any,
        uploadProgress?: (event: any, position: any, total: any, percentComplete: any) => any,
        success?: (data: any, textStatus: JQuery.Ajax.SuccessTextStatus, jqXHR: JQuery.jqXHR) => any,
        error?: (data: JQuery.jqXHR) => any
    }): void
}