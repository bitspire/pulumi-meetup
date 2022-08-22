/*
 * Copyright 2020 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { errorHandler } from '@backstage/backend-common';
import { Config } from '@backstage/config';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import PulumiAws from './pulumi-aws';
import PulumiGcp from './pulumi-gcp';

export interface RouterOptions {
  logger: Logger;
  config: Config;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {

  const { logger } = options;

  const pulumiAws = new PulumiAws(options);
  const pulumiGcp = new PulumiGcp(options);

  const router = Router();
  router.use(express.json());

  router.post('/gcp/functions', pulumiGcp.createHandler);
  router.get('/gcp/functions', pulumiGcp.listHandler);
  router.get('/gcp/functions/:id', pulumiGcp.getHandler);
  router.put('/gcp/functions/:id', pulumiGcp.updateHandler);
  router.delete('/gcp/functions/:id', pulumiGcp.deleteHandler);

  router.post('/aws/sites', pulumiAws.createHandler);
  router.get('/aws/sites', pulumiAws.listHandler);
  router.get('/aws/sites/:id', pulumiAws.getHandler);
  router.put('/aws/sites/:id', pulumiAws.updateHandler);
  router.delete('/aws/sites/:id', pulumiAws.deleteHandler);

  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.send({ status: 'ok' });
  });
  router.use(errorHandler());
  return router;
}
