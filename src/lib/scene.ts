const NOT_SCENE = /\.gif|motion|size-guide|toolkit/i;

/**
 * Picks a photo of a set being worn, for banners and tiles. Each entry is one product's image list:
 * its first still photo after the cover (skipping animations and the size-guide/toolkit cards) is
 * used, else the cover. Products are tried in order; pass `used` to keep several banners on one page
 * from showing the same photo (the pick is added to it). Null when there are no photos at all.
 */
export function pickScene(imageLists: (string[] | undefined)[], used?: Set<string>): string | null {
  let fallback: string | null = null;
  for (const list of imageLists) {
    const imgs = list ?? [];
    const pick = imgs.slice(1).find((u) => !NOT_SCENE.test(u)) ?? imgs[0];
    if (!pick) continue;
    fallback ??= pick;
    if (!used?.has(pick)) {
      used?.add(pick);
      return pick;
    }
  }
  return fallback;
}
