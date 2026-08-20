export const LOCATION_METADATA: Record<string, { openingHours?: string; officialUrl?: string }> = {
  "gunung jerai": {
    openingHours: "Daily, 10:00 AM - 5:00 PM",
    officialUrl: "https://greaterkedah.com/gunung-jerai-lokasi-percutian-dan-aktiviti-menarik/",
  },
  "jerai hill": {
    openingHours: "Daily, 8:00 AM - 6:00 PM",
    officialUrl: "https://visitmalaysia.in/jerai-hill-gunung-jerai-recreational-park/",
  },
  "klcc park": {
    openingHours: "Daily, 10:00 AM - 10:00 PM",
    officialUrl: "https://www.suriaklcc.com.my/attractions/klcc-park/",
  },
  "kinabalu park trail": {
    openingHours: "Daily, 8:00 AM - 5:00 PM",
    officialUrl: "https://sabahparks.org.my/index.php/kinabalu-park",
  },
  "kinabalu park": {
    openingHours: "Daily, 8:00 AM - 5:00 PM",
    officialUrl: "https://sabahparks.org.my/index.php/kinabalu-park",
  },
  "bako national park": {
    openingHours: "Daily, 8:00 AM - 5:00 PM",
    officialUrl: "https://www.sarawaktourism.com/web/things-to-do/thing-view/nature/national-parks-wildlife-reserves/bako-national-park",
  },
  "bako national park trail": {
    openingHours: "Daily, 8:00 AM - 5:00 PM",
    officialUrl: "https://www.sarawaktourism.com/web/things-to-do/thing-view/nature/national-parks-wildlife-reserves/bako-national-park",
  },
  "kanching eco forest park": {
    openingHours: "Daily, 8:00 AM - 5:00 PM",
    officialUrl: "https://selangor.travel/listing/kanching-eco-forest-park/",
  },
};

export function locationMetadataFor(name: string) {
  const normalized = name.trim().toLowerCase();
  return LOCATION_METADATA[normalized];
}
