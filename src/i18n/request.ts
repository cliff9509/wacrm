import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  // Kenya is the default; deployments may still supply another dictionary.
  const locale = process.env.NEXT_PUBLIC_APP_LOCALE || 'en-KE';

  let messages;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch (error) {
    // en is the source dictionary until a locale-specific file is supplied.
    messages = (await import(`../../messages/en.json`)).default;
  }

  return {
    locale: locale === 'en-KE' ? 'en-KE' : locale,
    messages
  };
});
