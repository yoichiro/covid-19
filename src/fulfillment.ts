import {
  BasicCard,
  BrowseCarousel,
  BrowseCarouselItem,
  Button,
  dialogflow,
  DialogflowConversation,
  SimpleResponse
} from 'actions-on-google';
import { Database } from './database';
import * as moment from 'moment';
import * as i18n from 'i18n';
import { sprintf } from 'sprintf-js';

const SITE_URL = 'https://www.mhlw.go.jp';

const app = dialogflow();
const database = new Database();

i18n.configure({
  locales: ["en-US", "ja-JP"],
  directory: __dirname + "/../locales",
  defaultLocale: "ja-JP"
});

const _setupLocale = (conv: DialogflowConversation<unknown, unknown>): void => {
  console.log(conv.user.locale);
  i18n.setLocale(conv.user.locale);
};

const _sprintf = (message: string, params: any[]): string => {
  if (params.length > 0) {
    return sprintf(message, ...params);
  } else {
    return message;
  }
};

const _i18n = (name: string, ...params: any[]): string => {
  const message = i18n.__(name);
  if (Array.isArray(message)) {
    return _sprintf(message[Math.floor(Math.random() * message.length)], params);
  } else {
    return _sprintf(message, params);
  }
};

app.intent('Default Welcome Intent', async (conv) => {
  _setupLocale(conv);
  const link = await database.fetchLatestLink();
  if (link) {
    const total = await database.fetchTotal(link);
    if (total) {
      const date = createDatePhrase(convertDate(link.date), moment());
      if (conv.user.locale === 'en-US') {
        if (conv.screen) {
          conv.close(new SimpleResponse({
            speech: _i18n('WELCOME_MESSAGE_SPEECH_1', total, date),
            text: _i18n('WELCOME_MESSAGE_TEXT_1')
          }));
          conv.close(new BasicCard({
            title: _i18n('WELCOME_MESSAGE_BASIC_CARD_TITLE', total),
            subtitle: _i18n('WELCOME_MESSAGE_BASIC_CARD_SUBTITLE', date),
            text: _i18n('WELCOME_MESSAGE_BASIC_CARD_TEXT'),
            buttons: new Button({
              title: _i18n('WELCOME_MESSAGE_BASIC_CARD_BUTTON'),
              url: `${SITE_URL}/english`
            }),
          }));
        } else {
          conv.close(
            _i18n('WELCOME_MESSAGE_SPEECH_2', total, date)
          );
        }
        conv.close(_i18n('END_MESSAGE_1') + _i18n('END_MESSAGE_2'));
      } else {
        if (conv.screen) {
          conv.ask(new SimpleResponse({
            speech: _i18n('WELCOME_MESSAGE_SPEECH_1', date, total),
            text: _i18n('WELCOME_MESSAGE_TEXT_1')
          }));
          conv.ask(new BasicCard({
            title: _i18n('WELCOME_MESSAGE_BASIC_CARD_TITLE', total),
            subtitle: _i18n('WELCOME_MESSAGE_BASIC_CARD_SUBTITLE', date),
            text: _i18n('WELCOME_MESSAGE_BASIC_CARD_TEXT'),
            buttons: new Button({
              title: _i18n('WELCOME_MESSAGE_BASIC_CARD_BUTTON'),
              url: `${SITE_URL}${link.href}`
            }),
          }));
          conv.ask(_i18n('WELCOME_MESSAGE_ASK'));
        } else {
          conv.ask(
            _i18n('WELCOME_MESSAGE_SPEECH_2', date, total) +
            _i18n('WELCOME_MESSAGE_ASK')
          );
        }
      }
      return;
    }
  }
  conv.close(_i18n('WELCOME_MESSAGE_NO_INFORMATION'));
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
    return date.format(_i18n('DATE_FORMAT_1'));
  } else {
    if (today.isSame(date, 'date')) {
      return _i18n("TODAY") + date.format(_i18n('DATE_FORMAT_2'));
    } else {
      return date.format(_i18n('DATE_FORMAT_2'));
    }
  }
};

app.intent('prefecture', async (conv, { prefecture }) => {
  _setupLocale(conv);
  if (prefecture) {
    const link = await database.fetchLatestLink();
    if (link) {
      const date = createDatePhrase(convertDate(link.date), moment());
      const people = await database.fetchPrefecturePeople(link, String(prefecture));
      if (people) {
        if (conv.screen) {
          conv.ask(new SimpleResponse({
            speech: _i18n('PREFECTURE_SPEECH_1', date, prefecture, people),
            text: _i18n('PREFECTURE_TEXT_1', prefecture)
          }));
          conv.ask(new BasicCard({
            title: _i18n('PREFECTURE_BASIC_CARD_TITLE', prefecture, people),
            subtitle: _i18n('PREFECTURE_BASIC_CARD_SUBTITLE', date),
            text: _i18n('PREFECTURE_BASIC_CARD_TEXT', prefecture),
            buttons: new Button({
              title: _i18n('PREFECTURE_BASIC_CARD_BUTTON'),
              url: `${SITE_URL}${link.href}`
            }),
          }));
          conv.ask(
            _i18n('PREFECTURE_ASK')
          );
        } else {
          conv.ask(
            _i18n('PREFECTURE_SPEECH_2', date, prefecture, people) +
            _i18n('PREFECTURE_ASK')
          );
        }
      } else {
        conv.ask(
          _i18n('PREFECTURE_SPEECH_3', date, prefecture)
        );
        conv.ask(
          _i18n('PREFECTURE_ASK')
        );
      }
    } else {
      conv.close(_i18n('PREFECTURE_NO_INFORMATION'));
    }
  } else {
    conv.ask(_i18n('PREFECTURE_SPEECH_4'));
  }
});

app.intent('help', conv => {
  _setupLocale(conv);
  conv.ask(
    _i18n('HELP')
  );
});

app.intent('end', conv => {
  _setupLocale(conv);
  if (conv.screen && conv.surface.capabilities.has('actions.capability.WEB_BROWSER')) {
    conv.close(
      _i18n('END_MESSAGE_1')
    );
    conv.close(new BrowseCarousel({
      items: [
        new BrowseCarouselItem({
          title: _i18n('END_BROWSE_CAROUSEL_1'),
          url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000164708_00001.html'
        }),
        new BrowseCarouselItem({
          title: _i18n('END_BROWSE_CAROUSEL_2'),
          url: 'https://www.mhlw.go.jp/stf/houdou/index.html'
        }),
        new BrowseCarouselItem({
          title: _i18n('END_BROWSE_CAROUSEL_3'),
          url: 'https://www.mhlw.go.jp/index.html'
        })
      ]
    }));
    conv.close(
      _i18n('END_MESSAGE_2')
    );
  } else {
    conv.close(
      _i18n('END_MESSAGE_1') + _i18n('END_MESSAGE_2')
    );
  }
});

export const fulfillment = app;
