import { describe, expect, it } from 'vitest';
import { NotFoundError } from '@/data/errors/NotFoundError.js';
import { ValidationError } from '@/data/errors/ValidationError.js';
import { REPOSITORY_METHODS } from '@/data/repositories/SubscriptionRepository.js';

const SUBSCRIPTION = {
  name: 'Netflix',
  amount: 15000,
  frequency: 'MENSUAL',
  category: 'ENTRETENIMIENTO',
  nextChargeDate: '2026-10-05',
};

const VALID_CHANGES = {
  name: 'Netflix Premium',
  amount: 21000,
  frequency: 'ANUAL',
  category: 'TRABAJO',
  nextChargeDate: '2026-12-01',
};

/**
 * Suite de contrato reutilizable (puerta G-03).
 *
 * Recibe una fábrica de repositorios y debe pasar, sin cambios, contra cualquier
 * adaptador: el de localStorage, un stub HTTP futuro o un doble en memoria.
 * Si un adaptador falla aquí, el problema es del adaptador, no de la suite.
 *
 * @param {() => import('@/data/repositories/SubscriptionRepository.js').Repository} createRepo
 * @param {{ name?: string }} [options]
 */
export function repositoryContract(createRepo, { name = 'adaptador' } = {}) {
  describe(`Contrato de SubscriptionRepository — ${name}`, () => {
    it('expone los 10 métodos del contrato', () => {
      const repo = createRepo();

      expect(REPOSITORY_METHODS).toHaveLength(10);
      for (const method of REPOSITORY_METHODS) {
        expect(typeof repo[method], `${method} debe existir`).toBe('function');
      }
    });

    it('devuelve listas vacías sobre un repositorio nuevo', async () => {
      const repo = createRepo();

      await expect(repo.findAll()).resolves.toEqual([]);
      await expect(repo.findById('no-existe')).resolves.toBeNull();
    });

    it('crea una suscripción completa y la persiste', async () => {
      const repo = createRepo();

      const created = await repo.create(SUBSCRIPTION);

      expect(created).toMatchObject({
        ...SUBSCRIPTION,
        status: 'ACTIVA',
        lastPaidDate: null,
        cancelledAt: null,
      });
      expect(typeof created.id).toBe('string');
      expect(created.id).not.toBe('');
      await expect(repo.findById(created.id)).resolves.toEqual(created);
    });

    it('rechaza un alta inválida con ValidationError y errores por campo', async () => {
      const repo = createRepo();

      await expect(repo.create({ ...SUBSCRIPTION, amount: 0 })).rejects.toBeInstanceOf(
        ValidationError,
      );
      await expect(repo.create({ ...SUBSCRIPTION, name: '   ' })).rejects.toThrow(ValidationError);
      await expect(repo.create({ ...SUBSCRIPTION, category: 'INVALIDA' })).rejects.toMatchObject({
        name: 'ValidationError',
        errors: { category: expect.any(String) },
      });
    });

    it('findAll ordena por próximo cobro ascendente', async () => {
      const repo = createRepo();

      await repo.create({ ...SUBSCRIPTION, nextChargeDate: '2026-12-01' });
      await repo.create({ ...SUBSCRIPTION, nextChargeDate: '2026-10-03' });
      await repo.create({ ...SUBSCRIPTION, nextChargeDate: '2026-10-20' });

      const dates = (await repo.findAll()).map((subscription) => subscription.nextChargeDate);
      expect(dates).toEqual(['2026-10-03', '2026-10-20', '2026-12-01']);
    });

    it('findAll devuelve copias que no alteran lo persistido', async () => {
      const repo = createRepo();
      const created = await repo.create(SUBSCRIPTION);

      const [listed] = await repo.findAll();
      listed.amount = 999999;
      listed.nextChargeDate = '2030-01-01';

      await expect(repo.findById(created.id)).resolves.toMatchObject({
        amount: 15000,
        nextChargeDate: '2026-10-05',
      });
    });

    it('update aplica los campos editables', async () => {
      const repo = createRepo();
      const created = await repo.create(SUBSCRIPTION);

      const updated = await repo.update(created.id, VALID_CHANGES);

      expect(updated).toMatchObject(VALID_CHANGES);
      expect(updated.id).toBe(created.id);
      expect(updated.status).toBe('ACTIVA');
    });

    it('update falla con NotFoundError ante un id inexistente', async () => {
      const repo = createRepo();

      await expect(repo.update('no-existe', VALID_CHANGES)).rejects.toBeInstanceOf(NotFoundError);
    });

    it('update rechaza datos inválidos con ValidationError', async () => {
      const repo = createRepo();
      const created = await repo.create(SUBSCRIPTION);

      await expect(repo.update(created.id, { amount: -5 })).rejects.toBeInstanceOf(ValidationError);
      await expect(repo.update(created.id, { nextChargeDate: 'ayer' })).rejects.toBeInstanceOf(
        ValidationError,
      );
    });

    it('update ignora status, lastPaidDate y cancelledAt aunque vengan en el parche', async () => {
      const repo = createRepo();
      const created = await repo.create(SUBSCRIPTION);

      const updated = await repo.update(created.id, {
        name: 'Netflix Premium',
        status: 'CANCELADA',
        lastPaidDate: '2020-01-01',
        cancelledAt: '2020-01-02',
      });

      expect(updated.status).toBe('ACTIVA');
      expect(updated.lastPaidDate).toBeNull();
      expect(updated.cancelledAt).toBeNull();
      expect(updated.name).toBe('Netflix Premium');
    });

    it('setStatus pausa y reanuda conservando el resto', async () => {
      const repo = createRepo();
      const created = await repo.create(SUBSCRIPTION);

      const paused = await repo.setStatus(created.id, 'PAUSADA');
      expect(paused).toMatchObject({
        status: 'PAUSADA',
        amount: 15000,
        frequency: 'MENSUAL',
        category: 'ENTRETENIMIENTO',
        nextChargeDate: '2026-10-05',
      });

      const resumed = await repo.setStatus(created.id, 'ACTIVA');
      expect(resumed.status).toBe('ACTIVA');
    });

    it('setStatus rechaza estados fuera de ACTIVA y PAUSADA', async () => {
      const repo = createRepo();
      const created = await repo.create(SUBSCRIPTION);

      await expect(repo.setStatus(created.id, 'CANCELADA')).rejects.toBeInstanceOf(ValidationError);
      await expect(repo.setStatus(created.id, 'BAJADA')).rejects.toBeInstanceOf(ValidationError);
    });

    it('setStatus falla con NotFoundError ante un id inexistente', async () => {
      const repo = createRepo();

      await expect(repo.setStatus('no-existe', 'PAUSADA')).rejects.toBeInstanceOf(NotFoundError);
    });

    it('markPaid escribe el próximo cobro y la fecha del último pago', async () => {
      const repo = createRepo();
      const created = await repo.create(SUBSCRIPTION);

      const paid = await repo.markPaid(created.id, {
        nextChargeDate: '2026-11-05',
        lastPaidDate: '2026-10-05',
      });

      expect(paid.nextChargeDate).toBe('2026-11-05');
      expect(paid.lastPaidDate).toBe('2026-10-05');
      expect(paid.status).toBe('ACTIVA');
      await expect(repo.findById(created.id)).resolves.toMatchObject({
        lastPaidDate: '2026-10-05',
      });
    });

    it('markPaid no cambia el estado ni las fechas que no le corresponden', async () => {
      const repo = createRepo();
      const created = await repo.create(SUBSCRIPTION);
      await repo.cancel(created.id, '2026-09-01');

      const paid = await repo.markPaid(created.id, {
        nextChargeDate: '2026-11-05',
        lastPaidDate: '2026-10-05',
      });

      expect(paid.status).toBe('CANCELADA');
      expect(paid.cancelledAt).toBe('2026-09-01');
    });

    it('markPaid falla con NotFoundError ante un id inexistente', async () => {
      const repo = createRepo();

      await expect(
        repo.markPaid('no-existe', { nextChargeDate: '2026-11-05', lastPaidDate: '2026-10-05' }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('cancel escribe el estado y la fecha de baja conservando el resto', async () => {
      const repo = createRepo();
      const created = await repo.create(SUBSCRIPTION);

      const cancelled = await repo.cancel(created.id, '2026-10-01');

      expect(cancelled.status).toBe('CANCELADA');
      expect(cancelled.cancelledAt).toBe('2026-10-01');
      expect(cancelled.nextChargeDate).toBe('2026-10-05');
      expect(cancelled.amount).toBe(15000);
    });

    it('cancel falla con NotFoundError ante un id inexistente', async () => {
      const repo = createRepo();

      await expect(repo.cancel('no-existe', '2026-10-01')).rejects.toBeInstanceOf(NotFoundError);
    });

    it('reactivate limpia la fecha de baja y conserva el próximo cobro', async () => {
      const repo = createRepo();
      const created = await repo.create(SUBSCRIPTION);
      await repo.cancel(created.id, '2026-10-01');

      const reactivated = await repo.reactivate(created.id);

      expect(reactivated.status).toBe('ACTIVA');
      expect(reactivated.cancelledAt).toBeNull();
      expect(reactivated.nextChargeDate).toBe('2026-10-05');
    });

    it('reactivate falla con NotFoundError ante un id inexistente', async () => {
      const repo = createRepo();

      await expect(repo.reactivate('no-existe')).rejects.toBeInstanceOf(NotFoundError);
    });

    it('delete elimina la suscripción y falla con NotFoundError si no existe', async () => {
      const repo = createRepo();
      const created = await repo.create(SUBSCRIPTION);

      await expect(repo.delete(created.id)).resolves.toBeUndefined();
      await expect(repo.findById(created.id)).resolves.toBeNull();
      await expect(repo.delete(created.id)).rejects.toBeInstanceOf(NotFoundError);
    });

    it('clear borra todo el documento y deja el repositorio usable', async () => {
      const repo = createRepo();
      await repo.create(SUBSCRIPTION);
      await repo.create({ ...SUBSCRIPTION, name: 'Spotify' });

      await expect(repo.clear()).resolves.toBeUndefined();
      await expect(repo.findAll()).resolves.toEqual([]);

      await expect(repo.create(SUBSCRIPTION)).resolves.toMatchObject({ status: 'ACTIVA' });
    });
  });
}
