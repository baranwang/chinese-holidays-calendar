import { productName } from './constants';
import { dayjsToIcsArray } from './dayjs';
/**
 *
 * @param {ics.EventAttributes[]} events
 * @param {*} params
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
    end: dayjsToIcsArray(end),
    busyStatus,
    categories,
    url,
  });
};
