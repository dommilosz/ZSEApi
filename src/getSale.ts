import {app, config, getCachedParsed} from "./index";
import {Request, Response} from "express";
import {sendJSON} from "express-wsutils";
import { getIndex } from "./getIndex";
const jsdom = require("jsdom");

export type LekcjaType = {
    name: string
    godziny: string
    nauczyciel: string | undefined
    nauczycielUrl: string | undefined
    klasa: string | undefined
    klasaUrl: string | undefined
    grupa: string
}

export type SalaType = {
    // { day { godzina { lekcje } } }
    timestamp: number,
    name: string, // klasa
    plan: { [key: string]: { [key: string]: LekcjaType[] } }
}

app.get("/api/plany/s:planId", async (req: Request, res: Response) => {
    let planType = await getCachedParsed<SalaType>(config.planyUrlBase + 's' + req.params.planId, 20 * 60 * 100, (data) => {
        let planType: SalaType = { name: "", plan: {}, timestamp: Date.now()}
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
                    let godziny = rowElement.querySelector('td.g')?.textContent?.trim()!
                    let lekcja = cell.querySelector('span.p')?.textContent!
                    

                    let klasaEl = cell.querySelector('a.o')
                    let klasaSuf = klasaEl?.getAttribute('href')!;
                    let klasaUrl = klasaSuf ? '/api/plany/' + klasaSuf : undefined
                    let klasa = klasaEl?.textContent!

                    let nauczycielEl = cell.querySelector('a.n')
                    let nauczycielSuf = nauczycielEl?.getAttribute('href')!;
                    let nauczycielUrl = nauczycielSuf ? '/api/plany/' + nauczycielSuf : undefined;
                    let nauczyciel = nauczycielEl?.textContent!

                    let grupa = "*"

                    let stripped = cell.innerHTML.replaceAll(/<[^>]*>(.+?)<[^>]*>/g, "").replace('-', '').replace("<br>", '').trim();
                    if (stripped.match(/\d\/\d/)) {
                        grupa = stripped.split('/')[0];
                    }

                    let lekcjaType: LekcjaType = { name: lekcja, godziny: godziny, klasa: klasa, klasaUrl: klasaUrl, nauczyciel: nauczyciel, nauczycielUrl: nauczycielUrl, grupa: grupa }
                    if (!planType.plan[weekday]) {
                        planType.plan[weekday] = {}
                    }
                    if(!planType.plan[weekday][hour]) {
                        planType.plan[weekday][hour] = [lekcjaType];
                    } else {
                        planType.plan[weekday][hour].push(lekcjaType);
                    }
                }
            })
        })
        
        //planType.plan[klasa]
        return planType;
    })
    sendJSON(res, planType, 200)
})

app.get("/api/sale/", async (req: Request, res: Response) => {
    let index = await getIndex(req, res);
    sendJSON(res, { sale: index.sale }, 200)
})