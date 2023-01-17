import {app, config, getCachedParsed} from "./index";
import {Request, Response} from "express";
import {sendJSON} from "express-wsutils";

const jsdom = require("jsdom");

export type ZastepstwaType = {
    informations:string,
    zastepstwa: {[key:string]:{[key:string]:{[key:string]:{name:string, text:string, zastepca:string, sala:string}}}},
}

app.get("/api/zastepstwa", async (req: Request, res: Response) => {
    let zastepstwa = await getCachedParsed<ZastepstwaType>(config.zastepstwaUrl, 20 * 60 * 1000, (data) => {
        let zastepstwa:ZastepstwaType = {informations:"", zastepstwa:{}};

        const dom = new jsdom.JSDOM(data);
        let document = dom.window.document;

        let tab = []
        for (let tr of document.querySelectorAll("tr")){
            let str1 = ""
            for (let td of tr.querySelectorAll("td:not(.st0)"))
                str1 = str1 +" "+ td.textContent
            str1 = str1.trim()
            tab.push(str1)
        }
        let tab2:string[][] = []
        let i2 = -1
        for (let i =0;i<tab.length;i++){
            if (tab[i] == ''){
                tab2.push([])
                i2 = i2 + 1}
            else{
                tab[i] = tab[i].replace("\r", "")
                tab[i] = tab[i].replace("\n", " ")

                tab2[i2].push(tab[i])
            }
        }
        let informations = document.querySelector(".st0 > nobr")?.textContent.trim();

        let obj:{[key:string]:{[key:string]:{[key:string]:{name:string, text:string, zastepca:string, sala:string}}}} = {}
        for(let z of tab2){
            for (let z1 of z.slice(2)){
                let arr = z1.split("\n");

                let lekcja = arr[0]?.trim();
                let klasa = arr[1].split("-")[0]?.trim();
                let grupa = ((klasa.split("(")[1]?.split(")")?.[0])??"*").trim();
                let sala = arr[1].split("-")[1]?.trim();
                let zastepca = arr[3]?.trim();
                let uwagi = arr[5]?.trim();

                klasa = klasa.split("(")[0].trim();

                if(!obj[klasa])obj[klasa] = {};
                if(!obj[klasa][grupa])obj[klasa][grupa] = {};
                obj[klasa][grupa][lekcja] = {text:uwagi,name:z[0], zastepca, sala};
            }
        }
        zastepstwa.zastepstwa = obj
        zastepstwa.informations = informations;

        return zastepstwa;
    })

    res.writeHead(200, {"Content-Type":"application/json; charset=utf-8"});
    res.write(JSON.stringify(zastepstwa));
    res.end();

});

