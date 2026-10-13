import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { hasNoWebsite, hasRealWebsite, normalizeWebsiteUrlForFilter } from "../website-filter";

describe("No-Website Filter Unit Tests", () => {
  it("treats null as having NO website", () => {
    assert.equal(hasNoWebsite(null), true);
    assert.equal(hasRealWebsite(null), false);
  });

  it("treats empty string as having NO website", () => {
    assert.equal(hasNoWebsite(""), true);
    assert.equal(hasRealWebsite(""), false);
  });

  it("treats whitespace-only string as having NO website", () => {
    assert.equal(hasNoWebsite("   "), true);
    assert.equal(hasNoWebsite("\t\n"), true);
    assert.equal(hasRealWebsite("   "), false);
  });

  it("treats Facebook URL as NOT a real website (so it counts as NO website)", () => {
    assert.equal(hasNoWebsite("https://facebook.com/spicegarden"), true);
    assert.equal(hasNoWebsite("https://www.facebook.com/p/Spice-Garden-100063/"), true);
    assert.equal(hasNoWebsite("facebook.com/mybusiness"), true);
    assert.equal(hasNoWebsite("m.facebook.com/page"), true);
    assert.equal(hasRealWebsite("https://www.facebook.com/spicegarden"), false);
  });

  it("treats a real domain as having a real website", () => {
    assert.equal(hasNoWebsite("spicegardendubai.com"), false);
    assert.equal(hasNoWebsite("https://spicegardendubai.com"), false);
    assert.equal(hasNoWebsite("http://spicegardendubai.com/menu"), false);
    assert.equal(hasRealWebsite("spicegardendubai.com"), true);
    assert.equal(hasRealWebsite("https://spicegardendubai.com"), true);
  });

  it("treats a domain with www as having a real website", () => {
    assert.equal(hasNoWebsite("www.spicegardendubai.com"), false);
    assert.equal(hasNoWebsite("https://www.spicegardendubai.com"), false);
    assert.equal(hasNoWebsite("http://www.thecornercafe.co.uk"), false);
    assert.equal(hasRealWebsite("www.spicegardendubai.com"), true);
    assert.equal(hasRealWebsite("https://www.spicegardendubai.com"), true);
  });

  it("treats Instagram, Linktree, WhatsApp, Google Maps, g.page, and business.site as NOT a real website", () => {
    // Instagram
    assert.equal(hasNoWebsite("https://instagram.com/glowbeautysalon"), true);
    assert.equal(hasNoWebsite("https://www.instagram.com/thecornercafe"), true);

    // Linktree & link-in-bio
    assert.equal(hasNoWebsite("https://linktr.ee/glowbeauty"), true);
    assert.equal(hasNoWebsite("linktr.ee/mybrand"), true);
    assert.equal(hasNoWebsite("https://bio.link/creator"), true);

    // WhatsApp
    assert.equal(hasNoWebsite("https://wa.me/971501234567"), true);
    assert.equal(hasNoWebsite("https://whatsapp.com/channel/abc"), true);

    // Google Maps & g.page
    assert.equal(hasNoWebsite("https://www.google.com/maps/place/The+Corner+Cafe"), true);
    assert.equal(hasNoWebsite("https://maps.google.com/?cid=123456"), true);
    assert.equal(hasNoWebsite("https://g.page/r/Cb123"), true);

    // business.site
    assert.equal(hasNoWebsite("https://thecornercafe.business.site"), true);
    assert.equal(hasNoWebsite("business.site"), true);
  });

  it("normalizes URLs accurately", () => {
    assert.equal(normalizeWebsiteUrlForFilter("  https://www.Facebook.com/test  "), "facebook.com/test");
    assert.equal(normalizeWebsiteUrlForFilter("http://www.ACME.com/  "), "acme.com/");
    assert.equal(normalizeWebsiteUrlForFilter(null), "");
    assert.equal(normalizeWebsiteUrlForFilter(""), "");
  });
});
