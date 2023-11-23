import {app, config, getCachedParsed} from "./index";
import {Request, Response} from "express";
import {sendJSON} from "express-wsutils";
import { LekcjaType } from "./getPlany";

const jsdom = require("jsdom");

export type NauczycieleType = {
    // nauczyciel { day { lekcje } }
    plan: {[key:string]:{[key:string]:{lekcje:Array<LekcjaType>}}}
}