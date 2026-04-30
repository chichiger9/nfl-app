import type { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/globals.css';

/*
  Pre-hydration theme bootstrap.

  Runs synchronously while the document is parsed, before any React or
  bundle code executes. Reads `localStorage.nfl.theme`, falls back to
  `prefers-color-scheme`, and stamps `<html data-theme="...">` so the
  CSS variables in globals.css resolve correctly on the very first paint.
  This is what prevents the dark-on-light (or vice-versa) SSR flash.

  Kept tiny + minified to stay cheap. Wrapped in try/catch because
  storage access can throw in tracking-prevention modes.
*/
const themeInitScript = `(function(){try{var s=localStorage.getItem('nfl.theme');var r=(s==='light'||s==='dark')?s:(window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.setAttribute('data-theme',r);}catch(e){}})();`;

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        {/* Tells the browser chrome (mobile address bar, PWA toolbar) to
            follow the OS preference. Explicit user overrides rely on JS
            and are intentionally not reflected here. */}
        <meta
          name="theme-color"
          content="#ffffff"
          media="(prefers-color-scheme: light)"
        />
        <meta
          name="theme-color"
          content="#0b0c0e"
          media="(prefers-color-scheme: dark)"
        />
        <script
          // Must be inline + synchronous. dangerouslySetInnerHTML keeps it
          // verbatim; React doesn't rerun this on the client.
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </Head>
      <div className="font-sans relative isolate">
        <Component {...pageProps} />
      </div>
    </>
  );
}
