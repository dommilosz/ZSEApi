import {json, Request, Response} from "express";
import {HttpGet} from "http-client-methods"
import express from 'express';
import cors from "cors";
import configured from "configuredjs";

export const config = configured({
    path: "config.json", writeMissing: true, defaultConfig: {
        indexUrl: "https://plan.zse.bydgoszcz.pl/lista.html",
        zastepstwaUrl: "https://zastepstwa.zse.bydgoszcz.pl/",
        planyUrlBase: "https://plan.zse.bydgoszcz.pl/plany/o",
        httpPort:8080,
    }
})

export const app = express();
app.use(json({limit: '50mb'}));
app.use(cors());

app.listen(config.httpPort, () => {
    console.log(`ZSEApi listening on port ${config.httpPort}`)
})

export let cache:{[key:string]:{fetched:number, data:string}} = {};
export let parseCache:{[key:string]:{fetched:number, data:any}} = {};
export async function getCached(url:string, life:number, encoding?:string):Promise<string>{
    let ts = +new Date();

    if(!cache[url] || (ts - cache[url]?.fetched) > life){
        let data = await HttpGet(url,{},true);
        let buff = await data.buffer();
        const decoder = new TextDecoder(encoding??'utf8');
        const text = decoder.decode(buff);
        cache[url] = {fetched:ts, data:text};
    }
    return cache[url].data;
}

export async function getCachedParsed<T>(url:string, life:number, parser:(d:string)=>T, key?:string, encoding?:string):Promise<T>{
    let ts = +new Date();

    if(!parseCache[url+key] || (ts - parseCache[url+key]?.fetched) > life){
        let data = await getCached(url, life, encoding);
        parseCache[url+key] = {data:await parser(data), fetched:+new Date()}
    }
    return parseCache[url+key].data as T;
}

import "./getIndex"
import "./getZastepstwa"
import "./getPlany"
import "./getSale"
import "./getNauczyciele"