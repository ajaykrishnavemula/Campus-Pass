import Fastify from 'fastify';
import mongoose from 'mongoose';
import config from '../config';
import authPlugin from '../plugins/token';
import routes from '../routes';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import logger from '../utils/logger';
import systemLoader from './loader';

export default async () => {
  try {
    const server = Fastify({ logger: true });
    server.register(authPlugin);
    server.register(fastifyCors);
    server.register(fastifyHelmet);

    routes(server);

    mongoose.set('strictQuery', true);
    await mongoose.connect(config.db.url);
    await systemLoader();

    server.addHook('onRequest', (req, reply, done) => {
      logger.debug(`Request received ${req.method} ${req.url}`, {
        body: req.body,
        query: req.query,
      });

      done();
    });

    server.listen(
      { host: config.host, port: +config.serverPort },
      function (err, address) {
        if (err) {
          server.log.error(err);
          process.exit(1);
        }
        logger.debug(`Server listening to ${address}`);
      },
    );
  } catch (error) {
    console.log(error);
  }
};
