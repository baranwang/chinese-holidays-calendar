import ics from 'ics';
import { commonEventAttributes } from './constants';
/**
 *
 * @param {ics.EventAttributes[]} events
 */
export const createCalendar = (events) => {
  const { error, value } = ics.createEvents(
    events.map((item) => ({ ...commonEventAttributes, ...item }))
  );
  if (error) {
    console.error(error);
    throw error;
  }
  return value
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
    .join('\n');
};
