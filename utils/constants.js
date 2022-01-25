export const productName = process.env.npm_package_name;

export const dateFormat = 'YYYY年M月D日';

export const serialNumberRegExp = new RegExp(
  '^[零|一|二|三|四|五|六|七|八|九]{1,}、'
);

/**
 * @type {ics.EventAttributes}
 */
export const commonEventAttributes = {
  productId:
    '-//BaranWang Spider by The State Council//Mainland China Public Holidays//EN',
  calName: '中国大陆节假日',
  classification: 'PUBLIC',
};

export const constants = {
  productName,
  dateFormat,
  serialNumberRegExp,
  commonEventAttributes,
};
