(function () {
  const native = sys.browser;

  const DEFAULT_LEVELS = [1, 2, 3, 4, 5, 6];
  const ENTITY_MAP = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
  };

  const decodeEntities = (value) =>
    (typeof value === "string" ? value : "").replace(
      /&([a-z]+);/gi,
      (_, code) => ENTITY_MAP[code.toLowerCase()] || _
    );

  const stripBlocks = (html) =>
    (typeof html === "string" ? html : "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "");

  const stripTags = (html) => {
    const sanitized = stripBlocks(html)
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return decodeEntities(sanitized);
  };

  function collectHeadings(html, levels) {
    const target = Array.isArray(levels)
      ? levels
      : typeof levels === "number"
      ? [levels]
      : DEFAULT_LEVELS;

    return target.reduce((acc, lvl) => {
      const key = `h${lvl}`;
      const regex = new RegExp(`<h${lvl}[^>]*>(.*?)</h${lvl}>`, "gi");
      const items = [];
      let match;
      while ((match = regex.exec(html || ""))) {
        const text = stripTags(match[1] || "");
        if (text) items.push(text);
      }
      acc[key] = items;
      return acc;
    }, {});
  }

  function createPage(url, options = {}) {
    if (!url || typeof url !== "string") {
      throw new Error("browser.page expects a URL string");
    }

    const normalizedOptions =
      options && typeof options === "object" ? options : {};

    let nativePage = native.page(url);
    let currentUrl = url;
    let domCache = null;

    const ensureDom = (force = false) => {
      if (force || domCache === null) {
        const dom = nativePage.evaluate("document.documentElement.outerHTML");
        domCache = typeof dom === "string" ? dom : "";
      }
      return domCache;
    };

    const swapNativePage = (targetUrl) => {
      if (!targetUrl || typeof targetUrl !== "string") {
        throw new Error("page.goto expects a URL string");
      }

      const previous = nativePage;
      const nextPage = native.page(targetUrl);
      nativePage = nextPage;
      currentUrl = targetUrl;
      domCache = null;

      if (previous && typeof previous.close === "function") {
        try {
          previous.close();
        } catch (_) {
          /* ignore cleanup failure */
        }
      }
    };

    const wrapNativeMethod = (name) => {
      const fn = nativePage && nativePage[name];
      if (typeof fn !== "function") return undefined;
      return (...args) => fn.apply(nativePage, args);
    };

    const wrapper = {
      url() {
        return currentUrl;
      },
      goto(targetUrl, gotoOptions = {}) {
        swapNativePage(targetUrl);
        if (gotoOptions && gotoOptions.refresh) {
          ensureDom(true);
        }
        return wrapper;
      },
      reload(options = {}) {
        swapNativePage(currentUrl);
        if (!options || options.refresh !== false) {
          ensureDom(true);
        }
        return wrapper;
      },
      /**
       * Returns cached DOM string.
       */
      html(options = {}) {
        return ensureDom(Boolean(options.refresh));
      },
      getHTML(options = {}) {
        return wrapper.html(options);
      },
      /**
       * Returns plain text content derived from DOM.
       */
      text(options = {}) {
        return stripTags(ensureDom(Boolean(options.refresh)));
      },
      getText(options = {}) {
        return wrapper.text(options);
      },
      /**
       * Returns heading text grouped by level.
       */
      headings(levels, options = {}) {
        return collectHeadings(ensureDom(Boolean(options.refresh)), levels);
      },
      getHeaders(levels, options = {}) {
        return wrapper.headings(levels, options);
      },
      /**
       * Forces a new DOM snapshot.
       */
      refresh() {
        domCache = null;
        return ensureDom(true);
      },
      /**
       * Expose underlying native page for advanced use.
       */
      raw() {
        return nativePage;
      },
    };

    ["close", "click", "evaluate", "mouseMove", "screenshot"].forEach((method) => {
      const fn = wrapNativeMethod(method);
      if (fn) wrapper[method] = fn;
    });

    if (normalizedOptions.refresh) {
      ensureDom(true);
    }

    return wrapper;
  }

  module.exports = {
    page: createPage,
    close: native.close,
    raw: native,
  };
})();
