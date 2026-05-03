/**
 * Ondeya — CJ Affiliate Link Generator
 *
 * So findest du deine IDs:
 *
 * PUBLISHER_ID:
 *   → cj.com einloggen → oben rechts auf deinen Namen klicken
 *   → "Account" → deine CID (7-8-stellige Zahl, z.B. 12345678)
 *
 * LYLE_SCOTT_ADVERTISER_ID:
 *   → cj.com → "Advertisers" → "Joined" → nach "Lyle & Scott" suchen
 *   → In der URL oder in den Programm-Details steht die AID (z.B. 5361234)
 *   → Oder: Klick auf "Get Links" bei Lyle & Scott → ein beliebiger Link
 *     enthält die AID im Pfad: /click-PUBLISHERID-ADVERTISERID
 */

// ─── Deine IDs hier eintragen ────────────────────────────────────────────────

const CJ_PUBLISHER_ID = '7931561'; // z.B. '12345678'

const ADVERTISERS: Record<string, string> = {
  'lyle-scott': '7025021', // z.B. '5361234'
  // Weitere Partner hier ergänzen:
  // 'mango': 'MANGO_ADVERTISER_ID',
  // 'about-you': 'ABOUT_YOU_ADVERTISER_ID',
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generiert einen CJ Affiliate Deep Link.
 *
 * Format: https://www.anrdoezrs.net/click-{PID}-{AID}?url={encoded_destination}
 *
 * @param advertiserKey  Schlüssel aus dem ADVERTISERS-Objekt oben (z.B. 'lyle-scott')
 * @param destinationUrl Die echte Produkt-URL beim Händler
 * @param sid            Optionale Sub-ID für eigenes Tracking (z.B. Produkt-ID)
 * @returns              Vollständiger CJ Affiliate Tracking Link
 */
export function buildAffiliateLink(
  advertiserKey: string,
  destinationUrl: string,
  sid?: string
): string {
  const advertiserId = ADVERTISERS[advertiserKey];

  // Fallback: wenn IDs noch nicht gesetzt sind, direkte URL nutzen
  if (
    !advertiserId ||
    advertiserId.includes('ADVERTISER_ID') ||
    CJ_PUBLISHER_ID.includes('PUBLISHER_ID')
  ) {
    if (__DEV__) {
      console.warn(
        `[Affiliate] IDs noch nicht konfiguriert für "${advertiserKey}" — nutze direkte URL.`
      );
    }
    return destinationUrl;
  }

  const encodedUrl = encodeURIComponent(destinationUrl);
  const sidParam = sid ? `&sid=${encodeURIComponent(sid)}` : '';

  return `https://www.anrdoezrs.net/click-${CJ_PUBLISHER_ID}-${advertiserId}?url=${encodedUrl}${sidParam}`;
}

/**
 * Shortcut für Lyle & Scott Links.
 */
export function lyleScottLink(destinationUrl: string, productId?: string): string {
  return buildAffiliateLink('lyle-scott', destinationUrl, productId);
}
