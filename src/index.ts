import {json, Request, Response} from "express";
import {HttpGet} from "http-client-methods"
import express from 'express';
import cors from "cors";
import configured from "configuredjs";
export const config = configured({
    path: "config.json", writeMissing: true, defaultConfig: {
        indexUrl: "https://plan.zse.bydgoszcz.pl/lista.html",
        httpPort:8080,
    }
})

export const app = express();
app.use(json({limit: '50mb'}));
app.use(cors());

app.listen(config.httpPort, () => {
    console.log(`Example app listening on port ${config.httpPort}`)
})

export let cache:{[key:string]:{fetched:number, data:string}} = {};
export let parseCache:{[key:string]:{fetched:number, data:any}} = {};
export async function getCached(url:string, life:number):Promise<string>{
    let ts = +new Date();

    if(!cache[url] || (ts - cache[url]?.fetched) > life){
        let data = await HttpGet(url);
        cache[url] = {fetched:ts, data};
    }
    return cache[url].data;
}

export async function getCachedParsed<T>(url:string, life:number, parser:(d:string)=>T, key?:string):Promise<T>{
    let ts = +new Date();

    if(!parseCache[url+key] || (ts - parseCache[url+key]?.fetched) > life){
        let data = await getCached(url, life);
        parseCache[url+key] = {data:await parser(data), fetched:+new Date()}
    }
    return parseCache[url+key].data as T;
}

import "./getIndex"