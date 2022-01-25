import * as path from 'path';
import { writeFileSync } from 'fs';
import {
  constants,
  fetchList,
  dayjs,
  getDayjs,
  createCalendar,
  eventsPush,
} from './utils';

(async () => {
  /**
   * @type {ics.EventAttributes[]}
   */
  const events = [];

  const list = await fetchList();

  for (const item of list) {
    const { year, holidays, url } = item;
    const yearDayjs = dayjs(`${year}年1月1日`, constants.dateFormat);

    holidays.forEach((holiday) => {
      const [holidayName, holidayText, days, changeText] = holiday
        .split(new RegExp('：|，|。'))
        .filter((item) => item.trim());

      const [startDateText, endDateText] = holidayText
        .replace(new RegExp('放假(调休)?'), '')
        .split(new RegExp('至|—'));
      const startDate = getDayjs(startDateText, yearDayjs);
      const endDate = endDateText
        ? getDayjs(endDateText, startDate)
        : startDate;

      const description = [`${holidayText}，${days}`, changeText]
        .filter((item) => item)
        .join('\n');

      eventsPush(events, {
        holidayName,
        start: startDate,
        end: endDate,
        description,
        url,
        isOffDay: true,
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
          eventsPush(events, {
            holidayName,
            start: date,
            end: date,
            description,
            url,
            isOffDay: false,
          });
        });
    });
  }

  const calendar = createCalendar(events);
  writeFileSync(path.resolve('chinese-holidays.ics'), calendar);
})();
