import * as cheerio from 'cheerio';
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "langchain/document";

async function test() {
    const res = await fetch('https://chitranjan.me');
    if(res.headers.get('Content-Type').includes("text")){
        const body = await res.text();
        const $ = cheerio.load(body);
        const about = $('section#about').text();
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
        });
        const chunkedContent = await textSplitter.splitDocuments([new Document({ pageContent: about }),]);
        console.log(chunkedContent)
    }
}
test()