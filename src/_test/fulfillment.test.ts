import test from 'ava';
import moment = require('moment');
import { createDatePhrase } from '../fulfillment';

test('createDatePhrase', t => {
  let actual = createDatePhrase(moment('2020-03-05T00:00:00.000'), moment('2020-03-05T00:00:00.000'));
  t.is(actual, '本日3月5日');
  actual = createDatePhrase(moment('2019-12-31T00:00:00.000'), moment('2020-01-01T00:00:00.000'));
  t.is(actual, '2019年12月31日');
  actual = createDatePhrase(moment('2020-03-05T00:00:00.000'), moment('2020-03-06T00:00:00.000'));
  t.is(actual, '3月5日');
});
