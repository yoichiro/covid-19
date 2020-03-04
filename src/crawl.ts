import * as request from 'request';
import * as jsdom from 'jsdom';
import { Detail, Link } from './types';
const moment = require('moment-timezone');

const SITE_URL = 'https://www.mhlw.go.jp';
const PAGE_TITLE_PREFIX = '新型コロナウイルス感染症の現在の状況と厚生労働省の対応について';

export type CrawlResult = {
  link: Link;
  prefectureMap: { [key: string]: Detail[] };
};

export class Crawler {

  convertNumber(source: string): number {
    return Number(source.replace(/[０-９]/g, s => {
      return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    }));
  }

  async crawlListPage(): Promise<Link[]> {
    return new Promise((resolve, reject) => {
      const thisMonth = moment().format('YYYYMM');
      const url = `${SITE_URL}/stf/houdou/houdou_list_${thisMonth}.html`;
      request(url, (error, response, body) => {
        if (error) {
          reject(error);
        } else {
          const dom = new jsdom.JSDOM(body);
          const result: Link[] = [];
          const links = dom.window.document.querySelectorAll('body > div#top > main div.l-contentMain ul > li > a');
          links.forEach(link => {
            const title: string = link!.querySelector('div')!.querySelector('span')!.textContent!;
            if (title.startsWith(PAGE_TITLE_PREFIX)) {
              const m = title.match(/令和(.+)年(.+)月(.+)日版/)!;
              const date = moment({ year: 2018 + this.convertNumber(m[1]), month: this.convertNumber(m[2]) - 1, date: this.convertNumber(m[3])});
              result.push({
                title,
                href: link.getAttribute('href')!,
                date: Number(date.format('YYYYMMDD'))
              });
            }
          });
          resolve(result);
        }
      });
    });
  }

  async crawlDetailPage(link: Link): Promise<Detail[]> {
    return new Promise((resolve, reject) => {
      const url = `${SITE_URL}${link.href}`;
      request(url, (error, response, body) => {
        if (error) {
          reject(error);
        } else {
          const dom = new jsdom.JSDOM(body);
          const tables = dom.window.document.querySelectorAll('body > div#top > main table');
          const table = tables[2];
          const trs = table.querySelectorAll('tbody > tr');
          const rows: Detail[] = [];
          trs.forEach((tr, i) => {
            if (i !== 0) {
              const tds = tr.querySelectorAll('td');
              rows.push({
                no: tds[0].textContent!.trim(),
                oldNo: tds[1].textContent!.trim(),
                fixedDate: tds[2].textContent!.trim(),
                age: tds[3].textContent!.trim(),
                gender: tds[4].textContent!.trim(),
                prefecture: tds[5].textContent!.trim(),
                effective: tds[6].textContent!.trim(),
                status: tds[7].textContent!.trim()
              });
            }
          });
          resolve(rows);
        }
      });
    });
  }

  divideByPrefecture(rows: Detail[]): { [key: string]: Detail[] } {
    return rows.reduce((result, row) => {
      const data: Detail[] = result[row.prefecture] || [];
      data.push(row);
      result[row.prefecture] = data;
      return result;
    }, {} as { [key: string]: Detail[] });
  }

  getLatestLink(links: Link[]): Link {
    return links.reduce((a, b) => {
      return a.date >= b.date ? a : b;
    });
  }

  async crawl(): Promise<CrawlResult | undefined> {
    const links = await this.crawlListPage();
    if (links.length === 0) {
      return undefined;
    }
    const link = this.getLatestLink(links);
    const rows = await this.crawlDetailPage(link);
    const prefectureMap = this.divideByPrefecture(rows);
    return {
      link,
      prefectureMap
    };
  }

}
