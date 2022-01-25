import fetch from 'node-fetch';
import { parse } from 'node-html-parser';
import { basename, extname } from 'path';
import { serialNumberRegExp } from './constants';

export const fetchList = async () => {
  const listHtmlText = await fetch(
    'http://sousuo.gov.cn/s.htm?q=年部分节假日安排的通知&t=paper&n=5&searchfield=title&sort=pubtime&sortType=1'
  ).then((res) => res.text());

  const list = parse(listHtmlText)
    .querySelector('.result')
    .querySelectorAll('.res-list')
    .map(async (item) => {
      const el = item.querySelector('a');
      const filename = basename(
        el.attributes.href,
        extname(el.attributes.href)
      );
      const { content, url } = await fetch(
        `https://xcx-static.www.gov.cn/xhrb/json_file/${filename}.json`
      ).then((res) => res.json());
      const holidays = parse(content)
        .textContent.split(new RegExp('\n|\r'))
        .filter((item) => serialNumberRegExp.test(item))
        .map((item) => item.replace(serialNumberRegExp, ''));

      return {
        year: el.text.replace(new RegExp('[^0-9]', 'ig'), ''),
        holidays,
        url,
      };
    });

  return await Promise.all(list);
};
