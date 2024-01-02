import fetch from 'node-fetch';
import { parse } from 'node-html-parser';
import { basename, extname } from 'path';
import { serialNumberRegExp } from './constants.js';

export const fetchList = async () => {
  const listHtmlText = await fetch(
    'https://sousuo.www.gov.cn/sousuo/search.shtml?code=17da70961a7&searchWord=%E5%B9%B4%E9%83%A8%E5%88%86%E8%8A%82%E5%81%87%E6%97%A5%E5%AE%89%E6%8E%92%E7%9A%84%E9%80%9A%E7%9F%A5&dataTypeId=14&sign=&pageNo=1'
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
