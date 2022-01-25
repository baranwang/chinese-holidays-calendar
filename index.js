import fetch from 'node-fetch';
import { parse } from 'node-html-parser';
import * as path from 'path';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import ics from 'ics';
import { writeFileSync } from 'fs';

dayjs.extend(customParseFormat);

const productName = 'chinese-holidays-calendar';
const dateFormat = 'YYYY年M月D日';

const chineseNumberRegExp = new RegExp(
  `^[${['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'].join(
    '|'
  )}]{1,}、`
);

/**
 * @param {string} text
 * @param {dayjs.Dayjs} day
 */
const getDay = (text, day) => {
  if (!text.includes('月')) {
    return day.clone().date(parseInt(text));
  } else if (!text.includes('年')) {
    return dayjs(`${day.year()}年${text}`, dateFormat);
  } else {
    return dayjs(text, dateFormat);
  }
};

/**
 * @param {dayjs.Dayjs} day
 */
const dateToArray = (day) => {
  return [day.year(), day.month() + 1, day.date()];
};

(async () => {
  /**
   * @type {ics.EventAttributes[]}
   */
  const events = [];

  const listHtmlText = await fetch(
    'http://sousuo.gov.cn/s.htm?q=年部分节假日安排的通知&t=paper&n=5&searchfield=title&sort=pubtime&sortType=1'
  ).then((res) => res.text());

  const list = parse(listHtmlText)
    .querySelector('.result')
    .querySelectorAll('.res-list')
    .map((item) => {
      const el = item.querySelector('a');
      const jsonFileName = path.basename(
        el.attributes.href,
        path.extname(el.attributes.href)
      );
      return {
        url: `https://xcx-static.www.gov.cn/xhrb/json_file/${jsonFileName}.json`,
        title: el.text,
      };
    });

  for (const item of list) {
    const year = item.title.replace(new RegExp('[^0-9]', 'ig'), '');
    const yearDay = dayjs(`${year}年1月1日`, dateFormat);
    const { content, url } = await fetch(item.url).then((res) => res.json());
    const holidayTextList = parse(content)
      .textContent.split(new RegExp('\n|\r'))
      .filter((item) => chineseNumberRegExp.test(item))
      .map((item) => item.replace(chineseNumberRegExp, ''));

    holidayTextList.forEach((holiday, index) => {
      const [holidayName, holidayText, days, changeText] = holiday
        .split(new RegExp('：|，|。'))
        .filter((item) => item.trim());

      const [startDateText, endDateText] = holidayText
        .replace(new RegExp('放假(调休)?'), '')
        .split('至');
      const startData = getDay(startDateText, yearDay);
      const endData = endDateText ? getDay(endDateText, startData) : startData;

      const description = [`${holidayText}，${days}`, changeText]
        .filter((item) => item)
        .join('\n');

      events.push({
        productId:
          '-//BaranWang Spider by The State Council//Mainland China Public Holidays//EN',
        uid: `holiday-${year}-${index}@${productName}`,
        title: holidayName,
        description,
        start: dateToArray(startData),
        end: dateToArray(endData.add(1, 'day')),
        startOutputType: 'local',
        endOutputType: 'local',
        busyStatus: 'FREE',
        url,
      });

      if (changeText) {
        changeText
          .replace('上班', '')
          .split('、')
          .forEach((item) => {
            const date = getDay(
              item.replace(new RegExp('（.*）'), ''),
              yearDay
            );
            events.push({
              uid: `workingday-${year}-${index}-${date.format(
                'YYYY-MM-DD'
              )}@${productName}`,
              title: `${holidayName}调休`,
              description,
              start: dateToArray(date),
              end: dateToArray(date.add(1, 'day')),
              busyStatus: 'BUSY',
              url,
            });
          });
      }
    });

    const { error, value } = ics.createEvents(events);
    if (error) {
      return console.error(error);
    }
    writeFileSync(
      path.resolve('chinese-holidays.ics'),
      value
        .split('\n')
        .filter((item) => !item.startsWith('DTSTAMP'))
        .join('\n')
    );
  }
})();
