import {app, config, getCachedParsed} from "./index";
import {Request, Response} from "express";
import {sendJSON} from "express-wsutils";
const jsdom = require("jsdom");

const CssSelector = "body > h4 a"

export type IndexType = {
    timestamp: number,
    zastepstwaUrl: string,
    oddzialy:{name:string, url:string}[],
    nauczyciele:{name:string, url:string}[],
    sale:{name:string, url:string}[],
}

export async function getIndex(req:Request,res:Response) {
    let index = await getCachedParsed<IndexType>(config.indexUrl,4*60*60*1000,(data)=>{
        let index:IndexType = {nauczyciele: [], oddzialy: [], sale: [], zastepstwaUrl:"", timestamp: Date.now()};

        const dom = new jsdom.JSDOM(data);
        let document = dom.window.document;
        index.zastepstwaUrl = document.querySelector(CssSelector).href;
        let domain = config.indexUrl.split("/")[0]+"//"+config.indexUrl.split("/")[2]

        let elements = document.querySelectorAll("body > *");
        for (let i = 1; i < elements.length; i++) {
            let pelement = elements[i-1];
            let element = elements[i];
            if(pelement.tagName === "H4" && element.tagName === "UL"){
                let header:string = pelement.innerHTML;
                let objects = element.querySelectorAll("a");
                for (let object of objects){
                    let name:string = object.innerHTML;
                    let href:string = '/api/' + object.href;

                    // if(!href.startsWith("http")){
                    //     href = domain +"/"+ href;
                    // }

                    if(header === "Oddziały"){
                        index.oddzialy.push({name:name,url:href})
                    }
                    if(header === "Nauczyciele"){
                        index.nauczyciele.push({name:name,url:href})
                    }
                    if(header === "Sale"){
                        index.sale.push({name:name,url:href})
                    }
                }
            }
        }
        return index;
    });
    return index;
}

app.get("/api/index", async (req:Request,res:Response)=>{
    let index = await getIndex(req, res);
    sendJSON(res, index, 200);
})