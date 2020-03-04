import { Crawler } from './crawl';
import { Database } from './database';
import * as functions from 'firebase-functions';
import { fulfillment } from './fulfillment';

exports.crawl = async (_pubSubEvent: any, _context: any): Promise<void> => {
  const crawler = new Crawler();
  const crawlResult = await crawler.crawl();
  if (crawlResult) {
    const database = new Database();
    await database.store(crawlResult.link, crawlResult.prefectureMap);
  }
};

exports.fulfillment = functions.https.onRequest(fulfillment);
