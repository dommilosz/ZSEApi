import {app, config, getCachedParsed} from "./index";
import {Request, Response} from "express";
import {sendJSON} from "express-wsutils";
const jsdom = require("jsdom");

export type LekcjaType = {
    name: string
    godziny: string
    nauczyciel: string
    nauczycielUrl: string
    klasa: string
    klasaUrl: string
    grupa: string
}

export type SalaType = {
    // { day { godzina { lekcje } } }
    timestamp: number,
    name: string, // klasa
    plan: { [key: string]: { [key: string]: LekcjaType } }
}