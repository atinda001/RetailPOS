import type { Request, Response } from 'express';

import * as service from './stores.service.js';

export const list = async (req: Request, res: Response): Promise<void> => {
  const stores = await service.listStores(req.tenantId as string);
  res.json({ success: true, data: stores });
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  const store = await service.getStore(req.tenantId as string, req.params['id'] as string);
  res.json({ success: true, data: store });
};

export const create = async (req: Request, res: Response): Promise<void> => {
  const result = await service.createStore(req.tenantId as string, req.body);
  res.status(201).json({ success: true, data: result });
};

export const update = async (req: Request, res: Response): Promise<void> => {
  const store = await service.updateStore(req.tenantId as string, req.params['id'] as string, req.body);
  res.json({ success: true, data: store });
};

export const deactivate = async (req: Request, res: Response): Promise<void> => {
  const store = await service.deactivateStore(req.tenantId as string, req.params['id'] as string);
  res.json({ success: true, data: store });
};

export const getTerminals = async (req: Request, res: Response): Promise<void> => {
  const terminals = await service.listTerminals(req.tenantId as string, req.params['id'] as string);
  res.json({ success: true, data: terminals });
};

export const addTerminal = async (req: Request, res: Response): Promise<void> => {
  const terminal = await service.addTerminal(req.tenantId as string, req.params['id'] as string, req.body.name);
  res.status(201).json({ success: true, data: terminal });
};

export const deactivateTerminal = async (req: Request, res: Response): Promise<void> => {
  await service.deactivateTerminal(req.tenantId as string, req.params['terminalId'] as string);
  res.json({ success: true, data: { message: 'Terminal deactivated' } });
};
