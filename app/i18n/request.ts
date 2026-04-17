// app/i18n/request.ts
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // 1. Await the requestLocale
  let locale = await requestLocale;

  // 2. Fallback if the locale is missing or invalid
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  console.log(">>>>> Request locale is:", locale);
  console.log(">>>>>>>!!", await import(`../../messages/${locale}.json`));

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
