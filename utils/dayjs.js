import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import { constants } from './constants.js';

dayjs.extend(customParseFormat);

export { dayjs };

/**
 * @param {string} text
 * @param {dayjs.Dayjs} day
 */
export const getDayjs = (text, day) => {
  if (!text.includes('月')) {
    return day.clone().date(parseInt(text));
  } else if (!text.includes('年')) {
    return dayjs(`${day.year()}年${text}`, constants.dateFormat);
  } else {
    return dayjs(text, constants.dateFormat);
  }
};

/**
 * @param {dayjs.Dayjs} day
 */
export const dayjsToIcsArray = (day) => {
  return [day.year(), day.month() + 1, day.date()];
};
