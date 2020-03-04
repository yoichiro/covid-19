import { dialogflow } from 'actions-on-google';
import { Database } from './database';
import * as moment from 'moment';

const app = dialogflow();
const database = new Database();

app.intent('Default Welcome Intent', conv => {
  conv.ask(
    '厚生労働省が発表した新型コロナウイルスの国内での発生状況をお知らせいたします。' +
    'チャーター便帰国者は含まれていません。知りたい都道府県名をどうぞ。'
  );
});

const convertDate = (date: number): moment.Moment => {
  const source = String(date);
  return moment({
    year: Number(source.substring(0, 4)),
    month: Number(source.substring(4, 6)) - 1,
    date: Number(source.substring(6, 8))
  });
};

app.intent('prefecture', async (conv, { prefecture }) => {
  if (prefecture) {
    const link = await database.fetchLatestLink();
    if (link) {
      const date = convertDate(link.date).format('YYYY年M月D日');
      const people = await database.fetchPrefecturePeople(link, String(prefecture));
      if (people) {
        conv.ask(
          `${date}時点での${prefecture}の報告数は、${people}名です。` +
            '他に知りたい都道府県名をどうぞ。'
        );
      } else {
        conv.ask(
          `${date}時点での${prefecture}の報告数はありません。` +
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
    'これは、厚生労働省が発表した国内の都道府県別の新型コロナウイルス感染者数をお伝えするアクションです。' +
    '厚生労働省のホームページで公開された報告数に基づいています。' +
    'チャーター便帰国者は含まれていません。' +
    '報告数を知りたい都道府県名をどうぞ。'
  );
});

app.intent('end', conv => {
  conv.close(
    'マスクの着用や手洗いの徹底など、通常の感染症対策に努めてください。' +
    'より詳しい情報は、厚生労働省のホームページをご覧ください。'
  );
});

export const fulfillment = app;
