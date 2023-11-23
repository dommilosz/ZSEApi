import { app, config, getCachedParsed } from "./index";
import { Request, Response } from "express";
import { sendJSON } from "express-wsutils";
import jsdom from "jsdom";

export type LekcjaType = {
    name: string
    sala: string
    nauczyciel: string
}

export type PlanType = {
    // klasa { day { grupa { lekcje } } }
    // grupa:
    // "1", "2" jeżeli są dwie tego dnia
    // "*" jeżeli nie ma różnic
    plan: { [key: string]: { [key: string]: { [key: string]: { lekcje: Array<LekcjaType> } } } }
}

app.get("/api/plany/:planId", async (req: Request, res: Response) => {
    console.log(`Got plan request for ${config.planyUrlBase + req.params.planId}`)
    let planType = await getCachedParsed<PlanType>(config.planyUrlBase + req.params.planId, 20 * 60 * 100, (data) => {
        let planType: PlanType = { plan: {} }
        const dom = new jsdom.JSDOM(data);
        let document = dom.window.document;
        let klasa = document.querySelector('.tytulnapis')?.textContent!.split(' ')[0]!;
        let table: HTMLTableElement = document.querySelector('.tabela')!
        Array.from(table.rows).slice(1).forEach((rowElement) => {
            Array.from(rowElement.children).forEach((cell, idx, row) => {
                if(idx >= 2) {
                    let weekday = idx - 2 // 0..4
                    let tekst = cell.textContent
                    console.log(tekst)
                }
            })
        })
        
        //planType.plan[klasa]
        return planType;
    })
    sendJSON(res, planType, 200)
})