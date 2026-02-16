const FULL_VOLUME_RANGE = 15;
const MAX_RANGE = 40;

function distance(p1, p2) {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

function calcVolume(dist) {
  if (dist <= FULL_VOLUME_RANGE) return 1.0;
  if (dist >= MAX_RANGE) return 0.0;
  return 1.0 - (dist - FULL_VOLUME_RANGE) / (MAX_RANGE - FULL_VOLUME_RANGE);
}

/**
 * Given a map of positions { name: { x, y, map } },
 * returns for each player a list of nearby peers with distance and volume.
 * Result: { playerName: [{ name, distance, volume }, ...] }
 */
function computeProximity(positions) {
  const players = Object.entries(positions);
  const result = {};

  for (const [name] of players) {
    result[name] = [];
  }

  for (let i = 0; i < players.length; i++) {
    const [nameA, posA] = players[i];
    for (let j = i + 1; j < players.length; j++) {
      const [nameB, posB] = players[j];

      if (posA.map !== posB.map) continue;

      const dist = distance(posA, posB);
      if (dist >= MAX_RANGE) continue;

      const vol = calcVolume(dist);
      result[nameA].push({ name: nameB, distance: Math.round(dist * 10) / 10, volume: Math.round(vol * 100) / 100 });
      result[nameB].push({ name: nameA, distance: Math.round(dist * 10) / 10, volume: Math.round(vol * 100) / 100 });
    }
  }

  return result;
}

module.exports = { computeProximity, distance, calcVolume };
