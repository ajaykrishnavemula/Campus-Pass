import init from './init/fastify';

const serve = async () => {
    await init();
}

serve();