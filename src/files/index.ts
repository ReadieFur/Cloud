import { Main, ReturnData } from "../assets/js/main.js";

class Files
{
    private readonly resultsPerPage = 20;

    private unfocus: HTMLInputElement;
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

    private filesFilter: IFilesFilter;
    private files?: IFile[];

    constructor()
    {
        new Main();

        this.unfocus = Main.ThrowIfNullOrUndefined(document.querySelector("#unfocus"));
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

        this.FilesPHP(
        {
            method: "getFiles",
            data: this.filesFilter,
            success: (response) => { this.GotFiles(response); }
        });
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
            isPrivate: '1',
            dateAltered: file.lastModified
        });
        fileRow.classList.add("uploading");
        fileRow.style.background = `linear-gradient(90deg, rgba(var(--accentColour), 1) 0%, transparent 0%)`;
        fileRow.addEventListener("click", () => { this.uploadsBody.removeChild(fileRow); });
        this.uploadsBody.appendChild(fileRow);

        (jQuery(this.uploadForm) as any as IAJAXSubmit).ajaxSubmit(
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
                var responseData: IFile = response.data;
                responseData.dateAltered *= 1000;
                this.uploadsBody.removeChild(fileRow);
                var uploadedFileRow = this.CreateFileRow(responseData);
                uploadedFileRow.id = responseData.id;
                //if (this.filesBody.lastChild !== null) { this.filesBody.removeChild(this.filesBody.lastChild); }
                this.filesBody.insertBefore(uploadedFileRow, this.filesBody.firstChild);
            },
            error: (jqXHR) =>
            {
                this.uploadsBody.removeChild(fileRow);
                Main.Alert(Main.GetStatusCodeMessage(jqXHR.status));
            }
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
            this.filesFilter.page = 0;
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
            var fileRow = this.CreateFileRow(file);
            fileRow.id = file.id;
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
        else if (
            (
                searchText[0] === "date"
            ) && (searchText[1] !== "" || searchText[1] !== undefined)
        )
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

    private CreateFileRow(file: IFile): HTMLTableRowElement
    {
        var tr = document.createElement("tr");
        tr.classList.add("listItem");
        tr.id = file.id;

        var nameColumn = document.createElement("td");
        nameColumn.classList.add("nameColumn");
        var nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.maxLength = 255;
        nameInput.value = file.name;
        nameInput.addEventListener("keypress", (ev) => { if (ev.key === "Enter") { this.unfocus.focus(); } });
        nameInput.addEventListener("input", () => { nameInput.value = Files.GetValidFileName(nameInput.value.substr(0, 24)); });
        nameInput.addEventListener("focusout", () =>
        {
            if (file.name !== nameInput.value)
            {
                nameInput.value = file.name = Files.GetValidFileName(nameInput.value.substr(0, 24));

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
        typeInput.addEventListener("input", () => { typeInput.value = Files.GetValidFileName(typeInput.value.substr(0, 24)); });
        typeInput.addEventListener("focusout", () =>
        {
            if (file.name !== typeInput.value)
            {
                typeInput.value = file.name = Files.GetValidFileName(typeInput.value.substr(0, 24));

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
        optionsContainer.classList.add("joinButtons");
        var downloadButton = document.createElement("button");
        downloadButton.innerText = "Download";
        downloadButton.addEventListener("click", () => { window.open(`${Main.WEB_ROOT}/files/storage/${file.id}`); });
        optionsContainer.appendChild(downloadButton);
        var shareButton = document.createElement("button");
        shareButton.innerText = "Public";
        shareButton.addEventListener("click", () =>
        {
            file.isPrivate = file.isPrivate === '1' ? '0' : '1';
            if (file.isPrivate === '1') { shareButton.classList.remove("active"); }
            else { shareButton.classList.add("active"); }
            this.FilesPHP(
            {
                method: "updateFile",
                data: file,
                success: (response) => { if (response.error) { Main.Alert(Main.GetPHPErrorMessage(response.data)); } }
            });
        });
        if (file.isPrivate === '1') { shareButton.classList.remove("active"); }
        else { shareButton.classList.add("active"); }
        optionsContainer.appendChild(shareButton);
        optionsColumn.appendChild(optionsContainer);
        tr.appendChild(optionsColumn);
        
        return tr;
    }

    private FilesPHP(params:
    {
        method: "getFiles" | "updateFile",
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
        return fileName.replace(/[\\\/:*?\"<>|]/, "");
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
    files: IFile[],
    filesFound: number,
    resultsPerPage: number,
    startIndex: number
}

interface IFile
{
    id: string,
    uid: string,
    name: string,
    type: string,
    size: number,
    isPrivate: '0' | '1',
    dateAltered: number
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