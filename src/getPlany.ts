import { app, config, getCachedParsed } from "./index";
import { Request, Response } from "express";
import { sendJSON } from "express-wsutils";
import { getIndex } from "./getIndex";
import jsdom from "jsdom";

export type LekcjaType = {
    name: string
    godziny: string
    sala: string | undefined
    salaUrl: string | undefined
    nauczyciel: string | undefined
    nauczycielUrl: string | undefined
    grupa: string
}

export type PlanType = {
    // { day { grupa { godzina { lekcje } } } }
    // grupa:
    // "1", "2" jeżeli są dwie tego dnia
    // "*" jeżeli nie ma różnic
    timestamp: number,
    name: string, // klasa
    plan: { [key: string]: { [key: string]: LekcjaType[] } }
}

app.get("/api/plany/o:planId", async (req: Request, res: Response) => {
    let planType = await getCachedParsed<PlanType>(config.planyUrlBase + 'o' + req.params.planId, 20 * 60 * 100, (data) => {
        let planType: PlanType = { name: "", plan: {}, timestamp: Date.now()}
        const dom = new jsdom.JSDOM(data);
        let document = dom.window.document;
        let klasa = document.querySelector('.tytulnapis')?.textContent!.split(' ')[0]!;
        planType.name = klasa
        let table: HTMLTableElement = document.querySelector('.tabela')!
        Array.from(table.rows).slice(1).forEach((rowElement, row_idx) => {
            Array.from(rowElement.children).forEach((_cell, idx, row) => {
                if(idx >= 2 && _cell.textContent?.trim()) {
                    let to_process: Element[] = [];
                    if(Array.from(_cell.children).some(el => el.tagName == 'BR')) {
                        to_process = [document.createElement('td')];
                        for(const node of Array.from(_cell.childNodes)) {
                            if(node.nodeName == 'BR') {
                                to_process.push(document.createElement('td'));
                            } else {
                                to_process[to_process.length-1].appendChild(node);
                            }
                        }
                    } else {
                        to_process = [_cell];
                    }
                    
                    for(const cell of to_process) { // avoid overshadow
                        let tekst = cell.textContent

                        let weekday = (idx - 2).toString() // 0..4
                        let hour = parseInt(rowElement.querySelector('td.nr')?.textContent!)
                        let godziny = rowElement.querySelector('td.g')?.textContent?.trim()!
                        let lekcja = cell.querySelector('span.p')?.textContent!
    
                        let arr_help = lekcja?.split('-')
                        let grupa = "*"
                        if(arr_help?.length! > 1) {
                            grupa = arr_help[1].split('/')[0]
                            lekcja = arr_help[0]
                        }
                        
    
                        let nauczycielEl = cell.querySelector('a.n')
                        let nauczycielSuf = nauczycielEl?.getAttribute('href')!;
                        let nauczycielUrl = nauczycielSuf ? '/api/plany/' + nauczycielSuf : undefined;
                        let nauczyciel = nauczycielEl?.textContent!
    
                        let salaEl = cell.querySelector('a.s')
                        let salaSuf = salaEl?.getAttribute('href')!;
                        let salaUrl = salaSuf ? '/api/plany/' + salaSuf : undefined
                        let sala = salaEl?.textContent!
    
                        let lekcjaType: LekcjaType = { name: lekcja, godziny: godziny, sala: sala, salaUrl: salaUrl, nauczyciel: nauczyciel, nauczycielUrl: nauczycielUrl, grupa: grupa }
                        if (!planType.plan[weekday]) {
                            planType.plan[weekday] = {}
                        }
                        if(!planType.plan[weekday][hour]) {
                            planType.plan[weekday][hour] = [lekcjaType]
                        } else {
                            planType.plan[weekday][hour].push(lekcjaType)
                        }
                    }
                }
            })
        })
        return planType;
    })
    sendJSON(res, planType, 200)
})



app.get("/api/plany/", async (req: Request, res: Response) => {
    let index = await getIndex(req, res);
    sendJSON(res, { oddzialy: index.oddzialy }, 200)
})

app.get("/api/oddzialy/", async (req: Request, res: Response) => {
    let index = await getIndex(req, res);
    sendJSON(res, { oddzialy: index.oddzialy }, 200)
})