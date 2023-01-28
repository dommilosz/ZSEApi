import {app, config, getCachedParsed} from "./index";
import {Request, Response} from "express";
import {sendJSON} from "express-wsutils";
const jsdom = require("jsdom");

export type LekcjaType = {
    name:string
    sala:string
    nauczyciel:string
}

export type PlanType = {
    // klasa { day { grupa { lekcje } } }
    // grupa:
    // "1", "2" jeżeli są dwie tego dnia
    // "*" jeżeli nie ma różnic
    plan: {[key:string]:{[key:string]:{[key:string]:{lekcje:Array<LekcjaType>}}}}
}

app.get("/api/plany/:planId", async (req:Request, res: Response) => {
    console.log(`Got plan request for ${config.planyUrlBase + req.params.planId + ".html"}`)
    let planType = await getCachedParsed<PlanType>(config.planyUrlBase + req.params.planId + ".html", 20 * 60 * 100, (data) => {
        let planType:PlanType = {plan:{}}
        const dom = new jsdom.JSDOM(data);
        let document = dom.window.document;
        return document;
    })
    sendJSON(res, planType, 200)
})