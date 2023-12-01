import { app, config, getCachedParsed } from "./index";
import { Request, Response } from "express";
import { sendJSON } from "express-wsutils";
import jsdom from "jsdom";

export type LekcjaType = {
    name: string
    godziny: string
    sala: string
    salaUrl: string
    nauczyciel: string
    nauczycielUrl: string
}

export type PlanType = {
    // { day { grupa { godzina { lekcje } } } }
    // grupa:
    // "1", "2" jeżeli są dwie tego dnia
    // "*" jeżeli nie ma różnic
    timestamp: number,
    name: string, // klasa
    plan: { [key: string]: { [key: string]: { [key: string]: LekcjaType } } }
}

app.get("/api/plany/:planId", async (req: Request, res: Response) => {
    let planType = await getCachedParsed<PlanType>(config.planyUrlBase + req.params.planId, 20 * 60 * 100, (data) => {
        let planType: PlanType = { name: "", plan: {}, timestamp: Date.now()}
        const dom = new jsdom.JSDOM(data);
        let document = dom.window.document;
        let klasa = document.querySelector('.tytulnapis')?.textContent!.split(' ')[0]!;
        planType.name = klasa
        let table: HTMLTableElement = document.querySelector('.tabela')!
        Array.from(table.rows).slice(1).forEach((rowElement, row_idx) => {
            Array.from(rowElement.children).forEach((cell, idx, row) => {
                if(idx >= 2 && cell.textContent?.trim()) {
                    let tekst = cell.textContent

                    let weekday = (idx - 2).toString() // 0..4
                    let hour = parseInt(rowElement.querySelector('td.nr')?.textContent!)
                    let godziny = rowElement.querySelector('td.g')?.textContent!
                    let lekcja = rowElement.querySelector('span.p')?.textContent!
                    
                    let arr_help = lekcja?.split('-')
                    let grupa = "*"
                    if(arr_help?.length! > 1) {
                        grupa = arr_help[1].split('/')[0]
                        lekcja = arr_help[0]
                    }
                    
                    let nauczycielEl = rowElement.querySelector('a.n')
                    let nauczycielUrl = config.planyUrlBase + nauczycielEl?.getAttribute('href')!
                    let nauczyciel = nauczycielEl?.textContent!

                    let salaEl = rowElement.querySelector('a.s')
                    let salaUrl = config.planyUrlBase + salaEl?.getAttribute('href')!
                    let sala = salaEl?.textContent!
                    //console.log(`Lekcja ${hour} ${godziny}: ${tekst}`)

                    console.log(typeof planType.plan)
                    let lekcjaType: LekcjaType = { name: lekcja, godziny: godziny, sala: sala, salaUrl: salaUrl, nauczyciel: nauczyciel, nauczycielUrl: nauczycielUrl }
                    console.log(weekday)
                    console.log(grupa)
                    if (!planType.plan[weekday]) {
                        planType.plan[weekday] = {}
                    }
                    if (!planType.plan[weekday][grupa]) {
                        planType.plan[weekday][grupa] = {}
                    }
                    planType.plan[weekday][grupa][hour] = lekcjaType
                    // [klasa][weekday][grupa].lekcje.splice(hour, 0, { name: lekcja, godziny: godziny, sala: sala, salaUrl: salaUrl, nauczyciel: nauczyciel, nauczycielUrl: nauczycielUrl})
                }
            })
        })
        
        //planType.plan[klasa]
        return planType;
    })
    sendJSON(res, planType, 200)
})