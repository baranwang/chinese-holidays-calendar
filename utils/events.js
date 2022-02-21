import { productName } from './constants.js';
import { dayjsToIcsArray, dayjs } from './dayjs.js';
/**
 *
 * @param {ics.EventAttributes[]} events
 * @param {{holidayName: string, start: dayjs.Dayjs, end: dayjs.Dayjs, description: string, url: string, isOffDay: boolean}} params
 */
export const eventsPush = (
  events,
  { holidayName, start, end, description, url, isOffDay }
) => {
  const uid = `${start.format('YYYYMMDD')}@${productName}`;
  const title = `${holidayName}${isOffDay ? '放假' : '调休'}`;
  const categories = isOffDay
    ? ['节假日', 'Holiday']
    : ['调休', 'Business Day'];
  const busyStatus = isOffDay ? 'FREE' : 'BUSY';

  events.push({
    uid,
    title,
    description,
    start: dayjsToIcsArray(start),
    end: dayjsToIcsArray(dayjs(end).add(1, 'day')),
    busyStatus,
    categories,
    url,
  });
};
