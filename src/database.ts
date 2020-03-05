import { Datastore } from '@google-cloud/datastore';
import * as crypto from 'crypto';
import { Detail, Link } from './types';

const datastore = new Datastore();

export class Database {

  async store(link: Link, details: Detail[], prefectureMap: { [key: string]: Detail[] }): Promise<void> {
    const linkEntity = await this.fetchLinkEntity(link);
    if (!linkEntity) {
      const linkKeyHash = await this.createLinkEntity(link);
      await this.createPrefectures(linkKeyHash, prefectureMap);
      await this.createTotal(linkKeyHash, details);
    }
  }

  async fetchLinkEntity(link: Link): Promise<any> {
    const hash = this.createLinkKeyHash(link);
    const key = datastore.key(['links', hash]);
    const [entity] = await datastore.get(key);
    return entity;
  }

  createLinkKeyHash(link: Link): string {
    const name = JSON.stringify({ date: link.date });
    return crypto.createHash('sha256').update(name, 'utf8').digest('hex');
  }

  async createLinkEntity(link: Link): Promise<string> {
    const hash = this.createLinkKeyHash(link);
    const key = datastore.key(['links', hash]);
    const data: { name: string, value: any }[] = [
      {
        name: 'title',
        value: link.title
      },
      {
        name: 'href',
        value: link.href
      },
      {
        name: 'date',
        value: link.date
      }
    ];
    await datastore.insert({ key, data });
    return hash;
  }

  async createPrefectures(linkKeyHash: string, prefectureMap: { [key: string]: Detail[] }): Promise<void> {
    for (const prefecture of Object.keys(prefectureMap)) {
      const details = prefectureMap[prefecture];
      const key = datastore.key('prefectures');
      const data: { name: string, value: any }[] = [
        {
          name: 'link',
          value: linkKeyHash
        },
        {
          name: 'prefecture',
          value: prefecture
        },
        {
          name: 'people',
          value: details.length
        }
      ];
      await datastore.insert({ key, data });
    }
  }

  async createTotal(linkKeyHash: string, details: Detail[]): Promise<void> {
    const key = datastore.key('totals');
    const data: { name: string, value: any }[] = [
      {
        name: 'link',
        value: linkKeyHash
      },
      {
        name: 'total',
        value: details.length
      }
    ];
    await datastore.insert({ key, data });
  }

  async fetchLatestLink(): Promise<Link | undefined> {
    const query = datastore.createQuery('links')
      .order('date', { descending: true })
      .limit(1);
    const [entities] = await datastore.runQuery(query);
    if (entities && entities.length === 1) {
      return {
        name: entities[0][Datastore.KEY].name,
        title: entities[0].title,
        href: entities[0].href,
        date: entities[0].date
      };
    } else {
      return undefined;
    }
  }

  async fetchPrefecturePeople(link: Link, prefecture: string): Promise<number | undefined> {
    const query = datastore.createQuery('prefectures')
      .filter('prefecture', '=', prefecture)
      .filter('link', '=', link.name!);
    const [entities] = await datastore.runQuery(query);
    if (entities && entities.length > 0) {
      return entities[0].people;
    } else {
      return undefined;
    }
  }

}