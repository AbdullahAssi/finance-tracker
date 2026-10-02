/** Shown in the Settings footer. Change the author name here. */
export const APP_INFO = {
  name: 'Expense Tracker',
  author: 'Muhammad Abdullah',
  startYear: 2026,
};

export const copyrightLine = () => {
  const year = new Date().getFullYear();
  const years = year > APP_INFO.startYear ? `${APP_INFO.startYear}–${year}` : String(APP_INFO.startYear);
  return `© ${years} ${APP_INFO.author}. All rights reserved.`;
};
