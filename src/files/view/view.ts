import { Main, ReturnData } from "../../assets/js/main.js";
import * as Interfaces from "../../assets/js/interfaces.js";

declare var phpData: string;

class View
{
    public static readonly urlFilePath = `${Main.WEB_ROOT}/files/storage`;
    public static readonly urlThumbnailSuffix = "/thumbnail";

    private contentContainer: HTMLSpanElement;
    
    constructor()
    {
        new Main();
        this.contentContainer = Main.ThrowIfNullOrUndefined(document.querySelector("#contentContainer")) as HTMLSpanElement;
    }

    public async Init()
    {
        if (Main.inIFrame)
        {
            document.body.classList.add("inIFrame");
        }

        var parsedPHPData: ReturnData = JSON.parse(phpData);
        (Main.ThrowIfNullOrUndefined(document.querySelector("#phpDataContainer")) as HTMLScriptElement).remove();
        if (parsedPHPData.error)
        {
            Main.Alert(Main.GetPHPErrorMessage(parsedPHPData.data));
            if (!Main.inIFrame)
            {
                await Main.Sleep(2500);
                window.location.href = `${Main.WEB_ROOT}/`;
            }
        }
        else if (parsedPHPData.data === false)
        {
            Main.Alert("Unknown error.");
            if (!Main.inIFrame)
            {
                await Main.Sleep(2500);
                window.location.href = `${Main.WEB_ROOT}/`;
            }
        }

        var file: Interfaces.IFile = parsedPHPData.data;
        switch (file.metadata.mimeType.split("/")[0])
        {
            // case "video":
            //     break;
            // case "image":
            //     break;
            // case "audio":
            //     break;
            case "text":
                Main.XHR({url: `${View.urlFilePath}/${file.name}`, method: "GET"})
                .then((result: { xhr: XMLHttpRequest; response: string; }) =>
                {
                    var pre = document.createElement("pre");
                    pre.innerText = result.response;
                    pre.classList.add("light");
                    this.contentContainer.appendChild(pre);
                }).catch(err => { Main.Alert("Error loading content."); });
                break;
            default:
                break;
        }

        return this;
    }
}
new View().Init();