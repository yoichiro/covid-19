import { BasicCard, BrowseCarousel, BrowseCarouselItem, Button, dialogflow, SimpleResponse } from 'actions-on-google';
import { Database } from './database';
import * as moment from 'moment';

const SITE_URL = 'https://www.mhlw.go.jp';

const app = dialogflow();
const database = new Database();

app.intent('Default Welcome Intent', async (conv) => {
  const link = await database.fetchLatestLink();
  if (link) {
    const total = await database.fetchTotal(link);
    if (total) {
      const date = createDatePhrase(convertDate(link.date), moment());
      if (conv.screen) {
        conv.ask(new SimpleResponse({
          speech: '厚生労働省が発表した新型コロナウイルスの国内での事例数をお知らせいたします。' +
            'チャーター便帰国者は含まれていません。' +
            `${date}時点での、国内を居住地とする事例数は、${total}件です。`,
          text: '厚生労働省が発表した新型コロナウイルスの国内での事例数をお知らせいたします。'
        }));
        conv.ask(new BasicCard({
          title: `国内の事例数: ${total}件`,
          subtitle: `${date} 時点`,
          text: '厚生労働省発表（チャーター便帰国者は含まれていません）\n日本国内を居住地とする事例の数です。',
          buttons: new Button({
            title: '厚生労働省ホームページ',
            url: `${SITE_URL}${link.href}`
          }),
        }));
        conv.ask('知りたい都道府県名をどうぞ。');
      } else {
        conv.ask(
          '厚生労働省が発表した新型コロナウイルスの国内での事例数をお知らせいたします。' +
          'チャーター便帰国者は含まれていません。' +
          `${date}時点での、国内を居住地とする事例数は、${total}件です。` +
          '知りたい都道府県名をどうぞ。'
        );
      }
      return;
    }
  }
  conv.close('申し訳ございません。情報がありません。');
});

const convertDate = (date: number): moment.Moment => {
  const source = String(date);
  return moment({
    year: Number(source.substring(0, 4)),
    month: Number(source.substring(4, 6)) - 1,
    date: Number(source.substring(6, 8))
  });
};

export const createDatePhrase = (date: moment.Moment, today: moment.Moment): string => {
  if (today.year() !== date.year()) {
    return date.format('YYYY年M月D日');
  } else {
    if (today.isSame(date, 'date')) {
      return '本日' + date.format('M月D日');
    } else {
      return date.format('M月D日');
    }
  }
};

app.intent('prefecture', async (conv, { prefecture }) => {
  if (prefecture) {
    const link = await database.fetchLatestLink();
    if (link) {
      const date = createDatePhrase(convertDate(link.date), moment());
      const people = await database.fetchPrefecturePeople(link, String(prefecture));
      if (people) {
        if (conv.screen) {
          conv.ask(new SimpleResponse({
            speech: `${date}時点での、居住地が${prefecture}の事例数は、${people}件です。`,
            text: `居住地が${prefecture}の事例数です。`
          }));
          conv.ask(new BasicCard({
            title: `${prefecture}の事例数: ${people}件`,
            subtitle: `${date} 時点`,
            text: `厚生労働省発表（チャーター便帰国者は含まれていません）\n${prefecture}を居住地とする事例の数です。`,
            buttons: new Button({
              title: '厚生労働省ホームページ',
              url: `${SITE_URL}${link.href}`
            }),
          }));
          conv.ask(
            '他に知りたい都道府県名をどうぞ。'
          );
        } else {
          conv.ask(
            `${date}時点での、居住地が${prefecture}の事例数は、${people}件です。` +
            '他に知りたい都道府県名をどうぞ。'
          );
        }
      } else {
        conv.ask(
          `${date}時点での、居住地が${prefecture}の事例数はありません。`
        );
        conv.ask(
          '他に知りたい都道府県名をどうぞ。'
        );
      }
    } else {
      conv.close('申し訳ございません。情報がありません。');
    }
  } else {
    conv.ask('もう一度、知りたい都道府県名を教えてください。');
  }
});

app.intent('help', conv => {
  conv.ask(
    'これは、厚生労働省が発表した居住地別の新型コロナウイルスの事例数をお伝えするアクションです。' +
    '厚生労働省のホームページで公開された報告数に基づいています。' +
    'チャーター便帰国者は含まれていません。' +
    '事例数を知りたい都道府県名をどうぞ。'
  );
});

app.intent('end', conv => {
  if (conv.screen && conv.surface.capabilities.has('actions.capability.WEB_BROWSER')) {
    conv.close(
      'マスクの着用や手洗いの徹底など、通常の感染症対策に努めてください。'
    );
    conv.close(new BrowseCarousel({
      items: [
        new BrowseCarouselItem({
          title: '新型コロナウイルス感染症について',
          url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000164708_00001.html'
        }),
        new BrowseCarouselItem({
          title: '厚生労働省 報道発表資料',
          url: 'https://www.mhlw.go.jp/stf/houdou/index.html'
        }),
        new BrowseCarouselItem({
          title: '厚生労働省ホームページ',
          url: 'https://www.mhlw.go.jp/index.html'
        })
      ]
    }));
    conv.close(
      'より詳しい情報は、厚生労働省のホームページをご覧ください。'
    );
  } else {
    conv.close(
      'マスクの着用や手洗いの徹底など、通常の感染症対策に努めてください。' +
      'より詳しい情報は、厚生労働省のホームページをご覧ください。'
    );
  }
});

export const fulfillment = app;
