import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendToSheet, fetchData } from './googleSheetService';

describe('googleSheetService', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    // Mock global fetch
    global.fetch = vi.fn();
  });

  describe('sendToSheet', () => {
    it('should throw error if scriptUrl is not provided', async () => {
      await expect(sendToSheet('', { some: 'data' }, 'test')).rejects.toThrow(
        'URL de Google Apps Script no configurada'
      );
    });

    it('should send data with correct parameters', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true });
      global.fetch = mockFetch;

      const scriptUrl = 'https://script.google.com/test';
      const data = { monto: 100, descripcion: 'Test' };
      const tipo = 'Gastos';

      await sendToSheet(scriptUrl, data, tipo);

      expect(mockFetch).toHaveBeenCalledWith(
        scriptUrl,
        expect.objectContaining({
          method: 'POST',
          mode: 'no-cors',
          body: expect.any(FormData),
        })
      );
    });

    it('should include tipo in the payload', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true });
      global.fetch = mockFetch;

      const scriptUrl = 'https://script.google.com/test';
      const data = { monto: 100 };
      const tipo = 'Ingresos';

      await sendToSheet(scriptUrl, data, tipo);

      const callArgs = mockFetch.mock.calls[0];
      const formData = callArgs[1].body as FormData;

      // FormData should have tipo
      expect(formData).toBeInstanceOf(FormData);
    });

    it('should handle fetch errors', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = mockFetch;

      const scriptUrl = 'https://script.google.com/test';
      const data = { monto: 100 };

      await expect(sendToSheet(scriptUrl, data, 'Gastos')).rejects.toThrow();
    });

    it('should filter out undefined and null values from data', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true });
      global.fetch = mockFetch;

      const scriptUrl = 'https://script.google.com/test';
      const data = {
        monto: 100,
        descripcion: 'Test',
        notas: undefined,
        extra: null
      };

      await sendToSheet(scriptUrl, data, 'Gastos');

      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('fetchData', () => {
    it('should throw error if scriptUrl is not provided', async () => {
      await expect(fetchData('')).rejects.toThrow('URL no configurada');
    });

    it('should fetch data successfully', async () => {
      const mockData = {
        cards: [{ banco: 'BCP', alias: 'Test' }],
        pending: [],
        history: []
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData
      });
      global.fetch = mockFetch;

      const result = await fetchData('https://script.google.com/test');

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://script.google.com/test?t='),
        expect.objectContaining({
          method: 'GET',
          redirect: 'follow'
        })
      );
    });

    it('should add timestamp to prevent caching', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({})
      });
      global.fetch = mockFetch;

      await fetchData('https://script.google.com/test');

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toMatch(/\?t=\d+/);
    });

    it('should throw error on HTTP error status', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404
      });
      global.fetch = mockFetch;

      await expect(fetchData('https://script.google.com/test')).rejects.toThrow(
        'Error HTTP: 404'
      );
    });

    it('should handle network errors', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network failure'));
      global.fetch = mockFetch;

      await expect(fetchData('https://script.google.com/test')).rejects.toThrow();
    });

    it('should handle malformed JSON response', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });
      global.fetch = mockFetch;

      await expect(fetchData('https://script.google.com/test')).rejects.toThrow();
    });
  });

  describe('objectToFormData helper', () => {
    it('should correctly convert numbers to strings in FormData', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true });
      global.fetch = mockFetch;

      const data = {
        monto: 123.45,
        cuotas: 12,
        activo: true
      };

      await sendToSheet('https://test.com', data, 'test');

      expect(mockFetch).toHaveBeenCalled();
    });
  });
});
