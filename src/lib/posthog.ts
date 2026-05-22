import posthog from "posthog-js";

export const initPostHog = () => {
  posthog.init("phc_ussWjYZIFxoBmJeNZQBeXrt7yYoEMDMvwkcl7MAC2mw", {
    api_host: "https://us.i.posthog.com",
    capture_pageview: false, // We'll capture manually for SPA route changes
    capture_pageleave: true,
    persistence: "localStorage",
  });
};

export { posthog };
