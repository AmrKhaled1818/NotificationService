const { DataSource } = require('typeorm');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const {
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASS,
  DB_NAME
} = process.env;

const AppDataSource = new DataSource({
  type: 'postgres',
  host: DB_HOST,
  port: DB_PORT ? parseInt(DB_PORT, 10) : 5432,
  username: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  synchronize: false, // Set to true only for dev
  logging: true,
  entities: [], // Add entity paths here
  migrations: [],
  subscribers: [],
});

AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized!');
  })
  .catch((err) => {
    console.error('Error during Data Source initialization:', err);
  });

module.exports = { AppDataSource };
