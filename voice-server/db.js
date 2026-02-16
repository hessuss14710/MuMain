const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'openmu-db',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'openmu',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 5,
  idleTimeoutMillis: 30000,
});

const POSITION_QUERY = `
  SELECT c."Name", c."PositionX", c."PositionY", m."Number" as "MapNumber"
  FROM data."Character" c
  JOIN config."GameMapDefinition" m ON c."CurrentMapId" = m."Id"
  WHERE c."Name" = ANY($1)
`;

async function getPositions(characterNames) {
  if (characterNames.length === 0) return [];
  const { rows } = await pool.query(POSITION_QUERY, [characterNames]);
  return rows.map(r => ({
    name: r.Name,
    x: r.PositionX,
    y: r.PositionY,
    map: r.MapNumber,
  }));
}

async function testConnection() {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    console.log('[DB] Connected to PostgreSQL');
  } finally {
    client.release();
  }
}

module.exports = { getPositions, testConnection };
