/**
 * Slug-to-bilingual-label mapping for InfrastructureDetection signals.
 *
 * Purpose: Translate internal scanner slugs into bounded, concrete,
 * observable explanations for the Detection Signals UI section.
 *
 * Discipline (mentor-sealed):
 * - BOUNDED: ~10-15 words max
 * - CONCRETE: Mention real header/cookie/network anchors when relevant
 * - OBSERVABLE: No storytelling, no fear language
 * - NO numeric confidence values (Article 70)
 *
 * If a slug is not in the map, return a generic fallback rather than
 * the raw slug. Raw slugs are implementation residue, not truth.
 */

export type BilingualLabel = {
  en: string;
  ar: string;
};

const SIGNAL_LABELS: Record<string, BilingualLabel> = {
  gfe_edge_signal: {
    en: "Google Frontend edge signals (gws/gfe server, via, alt-svc, x-goog)",
    ar: "إشارات حافة Google Frontend (gws/gfe server، via، alt-svc، x-goog)",
  },
  cloudflare_edge_headers: {
    en: "Matched Cloudflare edge response patterns (cf-ray, cf-cache-status, __cf_bm)",
    ar: "طابقت أنماط استجابة Cloudflare الحافة (cf-ray، cf-cache-status، __cf_bm)",
  },
  cloudflare_security_headers: {
    en: "Cloudflare security header patterns observed in response",
    ar: "أنماط رؤوس أمان Cloudflare ملحوظة في الاستجابة",
  },
  cloudflare_reverse_proxy: {
    en: "Cloudflare reverse-proxy patterns in response headers",
    ar: "أنماط وكيل Cloudflare العكسي في رؤوس الاستجابة",
  },
  cloudflare_network_signal: {
    en: "Cloudflare network/AS-level signal detected",
    ar: "إشارة على مستوى شبكة Cloudflare مكتشفة",
  },
  vercel_edge_headers: {
    en: "Vercel edge headers matched (x-vercel-id, x-vercel-cache)",
    ar: "رؤوس Vercel الحافة طابقت (x-vercel-id، x-vercel-cache)",
  },
  vercel_platform_headers: {
    en: "Vercel platform headers or hostname patterns observed",
    ar: "رؤوس منصة Vercel أو أنماط اسم المضيف ملحوظة",
  },
  vercel_network_signal: {
    en: "Vercel network/AS-level signal detected",
    ar: "إشارة على مستوى شبكة Vercel مكتشفة",
  },
  netlify_edge_headers: {
    en: "Netlify edge headers matched (x-nf-request-id, netlify)",
    ar: "رؤوس Netlify الحافة طابقت (x-nf-request-id، netlify)",
  },
  netlify_platform_headers: {
    en: "Netlify platform headers or hostname patterns observed",
    ar: "رؤوس منصة Netlify أو أنماط اسم المضيف ملحوظة",
  },
  netlify_network_signal: {
    en: "Netlify network signal detected",
    ar: "إشارة شبكة Netlify مكتشفة",
  },
  render_platform_headers: {
    en: "Render platform headers or hostname patterns observed",
    ar: "رؤوس منصة Render أو أنماط اسم المضيف ملحوظة",
  },
  render_edge_signal: {
    en: "Render edge signal matched (rndr-id header)",
    ar: "إشارة حافة Render طابقت (رأس rndr-id)",
  },
  render_network_signal: {
    en: "Render network signal detected",
    ar: "إشارة شبكة Render مكتشفة",
  },
  aws_edge_headers: {
    en: "AWS CloudFront edge patterns matched (x-amz-cf-*, cloudfront)",
    ar: "أنماط حافة AWS CloudFront طابقت (x-amz-cf-*، cloudfront)",
  },
  aws_headers: {
    en: "AWS infrastructure headers observed (x-amz-*, awselb)",
    ar: "رؤوس بنية AWS ملحوظة (x-amz-*، awselb)",
  },
  aws_load_balancer_signal: {
    en: "AWS Elastic Load Balancer patterns in response",
    ar: "أنماط AWS Elastic Load Balancer في الاستجابة",
  },
  aws_network_signal: {
    en: "Amazon network/AS-level signal detected",
    ar: "إشارة على مستوى شبكة Amazon مكتشفة",
  },
  azure_headers: {
    en: "Azure headers observed (x-azure, microsoft-iis)",
    ar: "رؤوس Azure ملحوظة (x-azure، microsoft-iis)",
  },
  azure_hosting_signal: {
    en: "Azure App Service hosting patterns observed",
    ar: "أنماط استضافة Azure App Service ملحوظة",
  },
  azure_network_signal: {
    en: "Microsoft Azure network/AS signal detected",
    ar: "إشارة شبكة Microsoft Azure مكتشفة",
  },
  gcp_headers: {
    en: "Google Cloud Platform headers observed (x-cloud-trace-context)",
    ar: "رؤوس Google Cloud Platform ملحوظة (x-cloud-trace-context)",
  },
  gcp_hosting_signal: {
    en: "Google Cloud hosting patterns observed (appspot, run.app)",
    ar: "أنماط استضافة Google Cloud ملحوظة (appspot، run.app)",
  },
  gcp_network_signal: {
    en: "Google Cloud network/AS signal detected",
    ar: "إشارة شبكة Google Cloud مكتشفة",
  },
  sucuri_security_headers: {
    en: "Sucuri WAF header patterns observed (x-sucuri-id, x-sucuri-cache)",
    ar: "أنماط رؤوس Sucuri WAF ملحوظة (x-sucuri-id، x-sucuri-cache)",
  },
  sucuri_edge_headers: {
    en: "Sucuri CDN edge header patterns observed",
    ar: "أنماط رؤوس حافة Sucuri CDN ملحوظة",
  },
  akamai_headers: {
    en: "Akamai edge headers matched (x-akamai, akamai-ghost)",
    ar: "رؤوس Akamai الحافة طابقت (x-akamai، akamai-ghost)",
  },
  akamai_security_signal: {
    en: "Akamai WAF security signal patterns observed",
    ar: "أنماط إشارة أمان Akamai WAF ملحوظة",
  },
  akamai_network_signal: {
    en: "Akamai network/AS-level signal detected",
    ar: "إشارة على مستوى شبكة Akamai مكتشفة",
  },
  fastly_headers: {
    en: "Fastly edge patterns matched (fastly, x-served-by, x-cache-hits)",
    ar: "أنماط Fastly الحافة طابقت (fastly، x-served-by، x-cache-hits)",
  },
  fastly_proxy_signal: {
    en: "Fastly reverse-proxy patterns in response",
    ar: "أنماط وكيل Fastly العكسي في الاستجابة",
  },
  fastly_network_signal: {
    en: "Fastly network/AS-level signal detected",
    ar: "إشارة على مستوى شبكة Fastly مكتشفة",
  },
  nginx_server_header: {
    en: "Server header indicates nginx software",
    ar: "رأس الخادم يشير إلى برنامج nginx",
  },
  apache_server_header: {
    en: "Server header indicates Apache HTTP Server",
    ar: "رأس الخادم يشير إلى خادم Apache HTTP",
  },
  express_powered_by_header: {
    en: "X-Powered-By header indicates Express framework",
    ar: "رأس X-Powered-By يشير إلى إطار Express",
  },
  nextjs_headers_or_cookies: {
    en: "Next.js headers or cookies observed (_next, x-nextjs)",
    ar: "رؤوس أو cookies لـ Next.js ملحوظة (_next، x-nextjs)",
  },
  wordpress_headers_or_cookies: {
    en: "WordPress headers or cookies observed (wp-, x-redirect-by)",
    ar: "رؤوس أو cookies لـ WordPress ملحوظة (wp-، x-redirect-by)",
  },
};

/**
 * Get bilingual label for a signal slug.
 * Returns generic fallback if slug not mapped.
 */
export function getSignalLabel(slug: string): BilingualLabel {
  if (SIGNAL_LABELS[slug]) {
    return SIGNAL_LABELS[slug];
  }
  return {
    en: "Passive infrastructure pattern observed in response",
    ar: "نمط بنية تحتية سلبي ملحوظ في الاستجابة",
  };
}

/**
 * Get all unique labels for a list of signal slugs (deduped).
 * Used when a vendor has multiple signals — merge into one label set.
 */
export function getSignalLabels(slugs: string[]): BilingualLabel[] {
  const seen = new Set<string>();
  const labels: BilingualLabel[] = [];
  for (const slug of slugs) {
    const label = getSignalLabel(slug);
    const key = `${label.en}::${label.ar}`;
    if (!seen.has(key)) {
      seen.add(key);
      labels.push(label);
    }
  }
  return labels;
}
