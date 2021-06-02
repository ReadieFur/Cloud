import { Main, ReturnData } from "../../assets/js/main.js";

declare var phpData: string;

class View
{
    constructor()
    {
        new Main();
    }

    public async Init()
    {
        var parsedPHPData: ReturnData = JSON.parse(phpData);
        if (parsedPHPData.error)
        {
            Main.Alert(Main.GetPHPErrorMessage(parsedPHPData.data));
            await Main.Sleep(2500);
            window.location.href = `${Main.WEB_ROOT}/`;
        }
        else if (parsedPHPData.data === false)
        {
            Main.Alert("Unknown error.");
            await Main.Sleep(2500);
            window.location.href = `${Main.WEB_ROOT}/`;
        }
        return this;
    }
}
new View().Init();