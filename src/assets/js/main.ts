declare var WEB_ROOT: string;

export class Main
{
    public static WEB_ROOT: string;
    public static inIFrame: boolean;
    public static header: HTMLElement;
    public static footer: HTMLElement;
    public static urlParams: URLSearchParams;
    public static zoom: number;
    public static accountContainer: HTMLIFrameElement;

    private static alertBoxContainer: HTMLDivElement;
    private static alertBoxText: HTMLParagraphElement;
    private static alertBoxTextBox: HTMLInputElement;

    private static tooltipContainer: HTMLDivElement;
    private static tooltipText: HTMLParagraphElement;

    constructor()
    {
        (<HTMLDivElement>Main.ThrowIfNullOrUndefined(document.querySelector("#javascriptAlert"))).style.display = "none";

        console.log(`
            !   /\\                   ,'|
            o--'O \`.                /  /
             \`--.   \`-----------._,' ,'
                \\                ,--'
                 ) )    _,--(    |
                /,^.---'     )/ \\\\
               ((   \\\\      ((   \\\\
                \\)   \\)      \\)  (/
            -What are you doing here?
        `);

        Main.WEB_ROOT = WEB_ROOT;
        Main.inIFrame = window.self !== window.top;
        Main.urlParams = new URLSearchParams(location.search);
        Main.header = Main.ThrowIfNullOrUndefined(document.querySelector("#header"));
        Main.footer = Main.ThrowIfNullOrUndefined(document.querySelector("#footer"));
        Main.accountContainer = Main.ThrowIfNullOrUndefined(document.querySelector("#accountContainer"));

        Main.alertBoxContainer = Main.ThrowIfNullOrUndefined(document.querySelector("#alertBoxContainer"));
        Main.alertBoxText = Main.ThrowIfNullOrUndefined(document.querySelector("#alerBoxText"));
        Main.alertBoxTextBox = Main.ThrowIfNullOrUndefined(document.querySelector("#alertBoxTextBox"));
        Main.alertBoxContainer.addEventListener("click", () => { Main.alertBoxContainer.style.display = "none"; });

        Main.tooltipContainer = Main.ThrowIfNullOrUndefined(document.querySelector("#tooltipContainer"));
        Main.tooltipText = Main.ThrowIfNullOrUndefined(document.querySelector("#tooltipText"));
        
        window.addEventListener("message", (ev) => { this.WindowMessageEvent(ev); });
        window.addEventListener("resize", () => { this.WindowResizeEvent(); });
        Main.ThrowIfNullOrUndefined(document.querySelector("#accountButton")).addEventListener("click", () => { Main.AccountMenuToggle(true); });
        this.WindowResizeEvent();

        if (Main.RetreiveCache("READIE_DARK") != "false") { Main.DarkTheme(true); }
        else { Main.DarkTheme(false); }
        Main.ThrowIfNullOrUndefined(document.querySelector("#darkMode")).addEventListener("click", () =>
        {
            var cachedValue = Main.RetreiveCache("READIE_DARK");
            if (cachedValue == undefined || cachedValue == "false") { Main.DarkTheme(true); }
            else { Main.DarkTheme(false); }
            //CBA to do the dynamic url thing I normally do, nothing sensitive is being sent over anyway.
            if (Main.accountContainer.contentWindow != null)
            { Main.accountContainer.contentWindow.postMessage("UPDATE_THEME", "*" /*Main.accountContainer.contentWindow?.location.href*/ /*Main.accountContainer.src*/); }
        });

        this.HighlightActivePage();

        let staticStyles = document.createElement("style");
        staticStyles.innerHTML = `
            *
            {
                transition:
                    background 400ms ease 0s,
                    background-color 400ms ease 0s,
                    color 100ms ease 0s;
            }
        `;
        document.head.appendChild(staticStyles);
    }

    private WindowResizeEvent(): void
    {
        if (window.innerWidth < 1280) { Main.zoom = 0.75; }
        else { Main.zoom = 1; }
    }

    private HighlightActivePage(): void
    {
        let path = window.location.pathname.split("/").filter((el) => { return el != ""; });
        for (let i = 0; i < path.length; i++) { path[i] = path[i].replace("_", ""); }
        
        Main.ThrowIfNullOrUndefined(document.querySelector("#header")).querySelectorAll("a").forEach((element: HTMLLinkElement) =>
        {
            if (element.href == window.location.origin + window.location.pathname)
            {
                element.classList.add("accent");
                let whyIsThisSoFarBack = element.parentElement?.parentElement?.parentElement;
                if (whyIsThisSoFarBack !== null || whyIsThisSoFarBack !== undefined)
                {
                    if (whyIsThisSoFarBack!.classList.contains("naviDropdown")) { whyIsThisSoFarBack!.firstElementChild!.classList.add("accent"); }
                }
            }
        });
    }

    private WindowMessageEvent(ev: MessageEvent<any>): void
    {
        var host = window.location.host.split('.');
        if (ev.origin.split('/')[2] == `api-readie.global-gaming.${host[host.length - 1]}`)
        {
            if (Main.TypeOfReturnData(ev.data))
            {
                /*if (ev.data.error)
                {
                    console.error(ev);
                    Main.AccountMenuToggle(false);
                }
                else if (typeof(ev.data.data) === "string")
                {
                    switch (ev.data.data)
                    {
                        case "BACKGROUND_CLICK":
                            Main.AccountMenuToggle(false);
                            break;
                        case "LOGGED_IN":
                            Main.AccountMenuToggle(false);
                            break;
                        case "LOGGED_OUT":
                            window.location.reload();
                            break;
                        case "ACCOUNT_DELETED":
                            window.location.reload();
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
                }*/

                switch (ev.data.data)
                {
                    case "BACKGROUND_CLICK":
                        Main.AccountMenuToggle(false);
                        break;
                    case "LOGGED_IN":
                        Main.AccountMenuToggle(false);
                        break;
                    case "LOGGED_OUT":
                        window.location.reload();
                        break;
                    case "ACCOUNT_DELETED":
                        window.location.reload();
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

    public static async XHR(data:
    {
        url: string,
        method: 'GET' | 'POST',
        parameters?: IDictionary<any>,
        headers?: IDictionary<string>,
    }): Promise<{xhr: XMLHttpRequest, response: any}>
    {
        return new Promise<{xhr: XMLHttpRequest, response: any}>((resolve, reject) =>
        {
            var xhr = new XMLHttpRequest();
            xhr.open(data.method, data.url, true);
            
            if (data.headers !== undefined)
            {
                for (var hKey in data.headers)
                {
                    xhr.setRequestHeader(hKey, data.headers[hKey]);
                }
            }

            xhr.onreadystatechange = () =>
            {
                if (xhr.readyState == 4)
                {
                    if (xhr.status == 200)
                    {
                        try
                        {
                            resolve({
                                xhr: xhr,
                                response: xhr.response
                            });
                        }
                        catch (e)
                        {
                            reject({
                                status: xhr.status,
                                text: xhr.responseText,
                                error: e
                            });
                        }
                    }
                    else
                    {
                        reject({
                            status: xhr.status,
                            text: xhr.statusText,
                            error: undefined
                        });
                    }
                }
            };

            if (data.parameters !== undefined)
            {
                var params = new URLSearchParams();
                for (var pKey in data.parameters)
                {
                    params.set(encodeURIComponent(pKey), encodeURIComponent(data.parameters[pKey]));
                }
                xhr.send(params.toString());
            }
            else
            {
                xhr.send();
            }
        });
    }

    public static AccountMenuToggle(show: boolean)
    {
        if (show)
        {
            if (Main.accountContainer.contentWindow != null) { Main.accountContainer.contentWindow.postMessage("UPDATE_THEME", "*"); }
            Main.accountContainer.style.display = "block";
        }
        Main.accountContainer.classList.remove(show ? "fadeOut" : "fadeIn");
        Main.accountContainer.classList.add(show ? "fadeIn" : "fadeOut");
        if (!show) { setTimeout(() => { Main.accountContainer.style.display = "none"; }, 399); }
    }

    public static TypeOfReturnData(data: any): data is ReturnData
    {
        return (data as ReturnData).error !== undefined && (data as ReturnData).data !== undefined;
    }

    public static ThrowIfNullOrUndefined(variable: any): any
    {
        if (variable === null || variable === undefined) { throw new TypeError(`${variable} is null or undefined`); }
        return variable;
    }

    public static DarkTheme(dark: boolean): void
    {
        Main.SetCache("READIE_DARK", dark ? "true" : "false", 365);
        var darkButton: HTMLInputElement = Main.ThrowIfNullOrUndefined(document.querySelector("#darkMode"));
        var themeColours: HTMLStyleElement = Main.ThrowIfNullOrUndefined(document.querySelector("#themeColours"));
        if (dark) { darkButton.classList.add("accent"); }
        else { darkButton.classList.remove("accent"); }
        themeColours!.innerHTML = `
            :root
            {
                --foregroundColour: ${dark ? "255, 255, 255" : "0, 0, 0"};
                --backgroundColour: ${dark ? "13, 17, 23" : "255, 255, 255"};
                --backgroundAltColour: ${dark ? "22, 27, 34" : "225, 225, 225"};
                --accentColour: 100, 0, 255;
                --accentColourAlt: 255, 120, 0;
            }
        `;
    }

    //I did not realise that PHP could also get the cookies, look into getting cookies from PHP instead for better security.
    public static RetreiveCache(cookie_name: string): string
    {
        var i, x, y, ARRcookies = document.cookie.split(";");
        for (i = 0; i < ARRcookies.length; i++)
        {
            x = ARRcookies[i].substr(0, ARRcookies[i].indexOf("="));
            y = ARRcookies[i].substr(ARRcookies[i].indexOf("=") + 1);
            x = x.replace(/^\s+|\s+$/g, "");
            if (x == cookie_name) { return unescape(y); }
        }
        return "";
    }

    public static SetCache(cookie_name: string, value: string, time: number, path: string = '/'): void
    {
        var hostSplit = window.location.host.split(".");
        var domain = `.${hostSplit[hostSplit.length - 2]}.${hostSplit[hostSplit.length - 1]}`;
        var expDate = new Date();
        expDate.setDate(expDate.getDate() + time);
        document.cookie = `${cookie_name}=${value}; expires=${expDate.toUTCString()}; path=${path}; domain=${domain};`;
    }

    public static ThrowAJAXJsonError(data: any) { throw new TypeError(`${data} could not be steralised`); }

    //Consider using the mouse over event and then using a timer in here to display the tooltip after x seconds.
    public static Tooltip(message: string, ev: MouseEvent, side: "top" | "left" | "bottom" | "right")
    {
        if (ev.currentTarget !== undefined)
        {
            (<HTMLElement>ev.currentTarget).onmousemove = (_ev) =>
            {
                this.tooltipContainer.style.display = "block";
                this.tooltipText.innerHTML = message;
                
                this.tooltipContainer.style.removeProperty("top");
                this.tooltipContainer.style.removeProperty("left");
                this.tooltipContainer.style.removeProperty("bottom");
                this.tooltipContainer.style.removeProperty("right");
                switch (side)
                {
                    case "top":
                        this.tooltipContainer.style.top = `${_ev.clientY - this.tooltipContainer.clientHeight - 10}px`;
                        this.tooltipContainer.style.left = `${_ev.clientX - (this.tooltipContainer.clientWidth / 2)}px`;
                        break;
                    case "left":
                        this.tooltipContainer.style.top = `${_ev.clientY - (this.tooltipContainer.clientHeight / 2)}px`;
                        this.tooltipContainer.style.left = `${_ev.clientX - (this.tooltipContainer.clientWidth + 10)}px`;
                        break;
                    case "bottom":
                        this.tooltipContainer.style.top = `${_ev.clientY + this.tooltipContainer.clientHeight + 10}px`;
                        this.tooltipContainer.style.left = `${_ev.clientX - (this.tooltipContainer.clientWidth / 2)}px`;
                        break;
                    case "right":
                        this.tooltipContainer.style.top = `${_ev.clientY - (this.tooltipContainer.clientHeight / 2)}px`;
                        this.tooltipContainer.style.left = `${_ev.clientX + 10}px`;
                        break;
                    default:
                        //WIP auto positioning.
                        var yPosition: "top" | "middle" | "bottom";
                        var xPosition: "left" | "middle" | "right";

                        if (_ev.clientY - this.tooltipContainer.clientHeight - 10 > 0 && _ev.clientY + this.tooltipContainer.clientHeight + 10 < document.body.clientHeight)
                        { yPosition = "middle"; }
                        else if (_ev.clientY - this.tooltipContainer.clientHeight - 10 < 0)
                        { yPosition = "bottom"; }
                        else
                        { yPosition = "top"; }

                        if (_ev.clientY - (this.tooltipContainer.clientHeight / 2) > 0 && _ev.clientY - (this.tooltipContainer.clientHeight / 2) < document.body.clientWidth)
                        { xPosition = "middle" }
                        else if (_ev.clientY - (this.tooltipContainer.clientHeight / 2) < 0)
                        { xPosition = "right" }
                        else
                        { xPosition = "left"; }

                        console.log(xPosition, yPosition);

                        /*this.tooltipContainer.style.top = `${top}px`;
                        this.tooltipContainer.style.left = `${left}px`;*/
                        break;
                }
            };

            //I'd like to clear this event listener but I cant pass 'this' into the remove event listener function and I dont want to store the small function externally.
            (<HTMLElement>ev.currentTarget).onmouseleave = () => { this.tooltipContainer.style.removeProperty("display"); };
        }
    }

    //This is asyncronous as I will check if the user has dismissed the alert box in the future.
    public static async Alert(message: string/*, solidBackground = false*/): Promise<void>
    {
        if (Main.alertBoxTextBox != null && Main.alertBoxText != null && Main.alertBoxContainer != null)
        {
            console.log("Alert:", message);
            Main.alertBoxTextBox.focus();
            Main.alertBoxText.innerHTML = message;
            Main.alertBoxContainer.style.display = "block";
        }
    }

    public static async FadeElement(
        displayType: "inline" | "block" | "contents" | "flex" | "grid" | "inline-block" | "inline-flex" | "inline-table" | "run-in" | "table" | "table-caption" | "table-column-group" | "table-cell" | "table-column" | "table-row" | "none" | "initial" | "inherit",
        element: HTMLElement
    ): Promise<void>
    {
        const fadeTime = 399;

        if (displayType !== "none")
        {
            element.style.display = displayType;
            element.classList.remove("fadeOut");
            element.classList.add("fadeIn");
            await Main.Sleep(fadeTime);
        }
        else
        {
            element.classList.remove("fadeIn");
            element.classList.add("fadeOut");
            await Main.Sleep(fadeTime);
            element.style.display = "none";
        }
    }

    public static Sleep(milliseconds: number): Promise<unknown>
    {
        return new Promise(r => setTimeout(r, milliseconds));
    }

    //https://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript
    public static FormatBytes(bytes: number, decimals = 2): string
    {
        if (bytes === 0) { return '0 Bytes'; }

        var k = 1024;
        var dm = decimals < 0 ? 0 : decimals;
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

        var i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    public static GetStatusCodeMessage(code: number)
    {
        switch(code)
        {
            case 400: return "Bad Request.";
            case 401: return "Unauthorized.";
            case 402: return "Payment Required.";
            case 403: return "Forbidden.";
            case 404: return "Not Found.";
            case 405: return "Method Not Allowed.";
            case 406: return "Not Acceptable.";
            case 407: return "Proxy Authentication Required.";
            case 408: return "Request Timeout.";
            case 409: return "Conflict.";
            case 410: return "Gone.";
            case 411: return "Length Required.";
            case 412: return "Precondition Failed.";
            case 413: return "Payload Too Large.";
            case 414: return "URI Too Long.";
            case 415: return "Unsupported Media Type.";
            case 416: return "Range Not Satisfiable.";
            case 417: return "Range Expectation Failed.";
            case 418: return "I'm a teapot.";
            case 421: return "Misdirected Request.";
            case 422: return "Unprocessable Entity.";
            case 423: return "Locked.";
            case 424: return "Failed Dependency.";
            case 425: return "Too Early.";
            case 426: return "Upgrade Required.";
            case 428: return "Precondition Required.";
            case 429: return "Too Many Requests.";
            case 431: return "Request Header Fields Too Large.";
            case 451: return "Unavailable For Legal Reasons.";
            default: return "Unknown error.";
        }
    }

    public static GetPHPErrorMessage(error: any): string
    {
        switch (error)
        {
            case "NO_QUERY_FOUND":
                return "No query found.";
            case "NO_METHOD_FOUND":
                return "No method found.";
            case "NO_DATA_FOUND":
                return "No data found.";
            case "INVALID_METHOD":
                return "Invalid method.";
            case "INVALID_DATA":
                return "Invalid data.";
            case "ACCOUNT_NOT_FOUND":
                return "Account not found.";
            case "ACCOUNT_NOT_VERIFIED":
                return "Account not verified.";
            case "ACCOUNT_ALREADY_EXISTS":
                return "Account already exists.";
            case "ENCRYPTION_ERROR":
                return "Encryption error.";
            case "SET_COOKIE_ERROR":
                return "Set cookie error.";
            case "GET_COOKIE_ERROR":
                return "Get cookie error.";
            case "COOKIE_NOT_FOUND":
                return "Cookie not found.";
            case "SESSION_INVALID":
                return "Session invalid.";
            case "INVALID_CREDENTIALS":
                return "Invalid credentials.";
            case "INVALID_UID":
                return "Invalid user ID.";
            case "INVALID_EMAIL":
                return "Invalid email.";
            case "INVALID_USERNAME":
                return "Invalid username.";
            case "INVALID_PASSWORD":
                return "Invalid password.";
            case "INVALID_OTP":
                return "Invalid OTP.";
            case "INVALID_PERMISSIONS":
                return "Insufficient permissions.";
            case "VERIFICATION_FAILED":
                return "Verification failed.";
            case "MAIL_ERROR":
                return "Mail error."
            case "NO_RESULTS":
                return "No results found.";
            case "NOT_LOGGED_IN":
                return "Not logged in.";
            case "SERVER_ERROR":
                return "Server error.";
            case "INCORRECT_PROTOCOL":
                return "Incorrect protocol.";
            case "UPLOAD_ERROR":
                return "Upload error.";
            default:
                return `Unknown error.<br><small>${String(error)}</small>`;
        }
    }
}

export interface ReturnData
{
    error: boolean,
    data: any
}

export interface IDictionary<T>
{
    [key: string]: T;
}