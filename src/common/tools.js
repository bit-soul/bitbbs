import moment from 'moment';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

moment.locale('en');

export function formatDate(date, friendly) {
  date = moment(date);

  if (friendly) {
    return date.fromNow();
  } else {
    return date.format('YYYY-MM-DD HH:mm');
  }
}

export function getFormattedDate() {
  const date = new Date();
  return date.getFullYear() +
         String(date.getMonth() + 1).padStart(2, '0') +
         String(date.getDate()).padStart(2, '0');
}

export function getFormattedTime() {
  const date = new Date();
  return String(date.getHours()).padStart(2, '0') +
         String(date.getMinutes()).padStart(2, '0') +
         String(date.getSeconds()).padStart(2, '0');
}

export function validateId(str) {
  return (/^[a-zA-Z0-9\-_]+$/i).test(str);
}

export async function bhash(str) {
  return await bcrypt.hash(str, 10);
}

export async function bcompare(str, hash) {
  return await bcrypt.compare(str, hash);
}

export function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

export function uuid() {
  return crypto.randomUUID();
}

export function generateauthkey(userid, maxage) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let authkey = '';
  for (let i = 0; i < 10; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    authkey += chars[randomIndex];
  }

  global.authkeys[authkey] = [userid, maxage];
  setTimeout(()=> {
    delete global.authkeys[authkey];
  }, 600 * 1000);

  return authkey;
}

export async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retryTimes(fun, times, interval) {
  let last_error;

  for (let retry_cnt = 0; retry_cnt < times; ++retry_cnt) {
    try {
      return await fun();
    } catch (error) {
      await sleep(interval);
      last_error = error;
    }
  }

  throw last_error;
}

export function utf8ForXml(inputStr) {
  // eslint-disable-next-line no-control-regex
  return inputStr.replace(/[^\x09\x0A\x0D\x20-\xFF\x85\xA0-\uD7FF\uE000-\uFDCF\uFDE0-\uFFFD]/gm, '');
}
