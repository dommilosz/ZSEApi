import {app, config, getCachedParsed} from "./index";
import {Request, Response} from "express";
import {sendJSON} from "express-wsutils";

const jsdom = require("jsdom");

export type LekcjaType = {
    name:string
    sala:string
    nauczyciel:string
}

export type PlanyType = {
    // klasa { day { grupa { lekcje } } }
    // grupa:
    // "1", "2" jeżeli są dwie tego dnia
    // "*" jeżeli nie ma różnic
    plany: {[key:string]:{[key:string]:{[key:string]:{lekcje:Array<LekcjaType>}}}}
}

app.get("/api/plany", async (req:Request, res: Response) => {
    let plany = await getCachedParsed(config.planyUrlBase + "" /*na podstawie /index będzie adres w pętli*/, 20 * 60 * 100, (data) => {
        //TODO
    })
})