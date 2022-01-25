#!/usr/bin/env node

import fetch from 'node-fetch';
import { parse } from 'node-html-parser';
import * as path from 'path';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import ics from 'ics';
import { writeFileSync } from 'fs';

dayjs.extend(customParseFormat);

const productName = process.env.npm_package_name;
const dateFormat = 'YYYY年M月D日';

const chineseNumberRegExp = new RegExp(
  `^[${['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'].join(
    '|'
  )}]{1,}、`
);

/**
 * @type {ics.EventAttributes}
 */
const eventCommon = {
  calName: '中国大陆节假日',
  productId:
    '-//BaranWang Spider by The State Council//Mainland China Public Holidays//EN',
  classification: 'PUBLIC',
};

/**
 * @param {string} text
 * @param {dayjs.Dayjs} day
 */
const getDayjs = (text, day) => {
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
    const yearDayjs = dayjs(`${year}年1月1日`, dateFormat);
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
        .split(new RegExp('至|—'));
      const startData = getDayjs(startDateText, yearDayjs);
      const endData = endDateText
        ? getDayjs(endDateText, startData)
        : startData;

      const description = [`${holidayText}，${days}`, changeText]
        .filter((item) => item)
        .join('\n');

      events.push({
        uid: `${startData.format('YYYYMMDD')}@${productName}`,
        title: `${holidayName}放假`,
        description,
        start: dateToArray(startData),
        end: dateToArray(endData.add(1, 'day')),
        busyStatus: 'FREE',
        categories: ['节假日', 'Holiday'],
        url,
      });

      if (!changeText) return;
      changeText
        .replace('上班', '')
        .split('、')
        .forEach((item) => {
          const date = getDayjs(
            item.replace(new RegExp('（.*）'), ''),
            yearDayjs
          );
          events.push({
            uid: `${date.format('YYYYMMDD')}@${productName}`,
            title: `${holidayName}调休`,
            description,
            start: dateToArray(date),
            end: dateToArray(date.add(1, 'day')),
            busyStatus: 'BUSY',
            categories: ['调休', 'Business Day'],
            url,
          });
        });
    });

    const { error, value } = ics.createEvents(
      events.map((item) => ({ ...eventCommon, ...item }))
    );
    if (error) {
      return console.error(error);
    }
    writeFileSync(
      path.resolve('chinese-holidays.ics'),
      value
        .split('\n')
        .filter((item) => !item.startsWith('DTSTAMP'))
        .flatMap((item) => {
          if (item.startsWith('X-WR-CALNAME')) {
            return [
              item,
              'X-WR-TIMEZONE:Asia/Shanghai',
              'X-APPLE-LANGUAGE:zh',
              'X-APPLE-REGION:CN',
            ];
          } else {
            return item;
          }
        })
        .join('\n')
    );
  }
})();
