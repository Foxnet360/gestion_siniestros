import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getConfig,
  getAllConfigs,
  updateConfig,
  resetConfigToDefault,
  validateConfig,
  compareConfigs,
  getConfigDefault,
  getConfigMetadata,
  DEFAULT_FOLLOW_UP_RULES,
  DEFAULT_PRESCRIPTION_RULES,
  DEFAULT_ALERT_THRESHOLDS,
  DEFAULT_NOTIFICATION_SETTINGS,
  DEFAULT_AUTO_CLOSE_RULES,
} from '../configService';
import { supabase } from '../../lib/supabase';
import { logAction } from '../auditService';

// Mock dependencies
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          then: vi.fn(),
        })),
        then: vi.fn(),
      })),
      upsert: vi.fn(() => ({
        then: vi.fn(),
      })),
    })),
  },
}));

vi.mock('../auditService', () => ({
  logAction: vi.fn(() => Promise.resolve()),
}));

describe('ConfigService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getConfig', () => {
    it('should return config from database when available and valid', async () => {
      const mockConfig = {
        standard: { phases: [1, 2, 3], days: 15, description: 'Test' },
        legal: {
          state: 'PROCESO JURÍDICO',
          minDays: 30,
          maxDays: 60,
          defaultDays: 30,
          description: 'Test',
        },
        prescription: { state: 'PRESCRIPCIÓN', days: 10, description: 'Test' },
      };

      const mockSingle = vi.fn().mockResolvedValue({
        data: { config_value: mockConfig },
        error: null,
      });

      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const result = await getConfig('follow_up_rules');

      expect(result).toEqual(mockConfig);
    });

    it('should return default when config not found in database', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const result = await getConfig('follow_up_rules');

      expect(result).toEqual(DEFAULT_FOLLOW_UP_RULES);
    });

    it('should return default when config is invalid', async () => {
      const invalidConfig = {
        standard: { days: -5 }, // Invalid: negative days
        legal: {},
      };

      const mockSingle = vi.fn().mockResolvedValue({
        data: { config_value: invalidConfig },
        error: null,
      });

      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const result = await getConfig('follow_up_rules');

      expect(result).toEqual(DEFAULT_FOLLOW_UP_RULES);
    });

    it('should return default when database throws error', async () => {
      const mockSingle = vi.fn().mockRejectedValue(new Error('Database connection failed'));

      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const result = await getConfig('prescription_rules');

      expect(result).toEqual(DEFAULT_PRESCRIPTION_RULES);
    });

    it('should return correct default for each config type', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      expect(await getConfig('follow_up_rules')).toEqual(DEFAULT_FOLLOW_UP_RULES);
      expect(await getConfig('prescription_rules')).toEqual(DEFAULT_PRESCRIPTION_RULES);
      expect(await getConfig('alert_thresholds')).toEqual(DEFAULT_ALERT_THRESHOLDS);
      expect(await getConfig('notification_settings')).toEqual(DEFAULT_NOTIFICATION_SETTINGS);
      expect(await getConfig('auto_close_rules')).toEqual(DEFAULT_AUTO_CLOSE_RULES);
    });
  });

  describe('getAllConfigs', () => {
    it('should return all configs from database merged with defaults', async () => {
      const mockConfigs = [
        {
          config_key: 'follow_up_rules',
          config_value: {
            standard: { phases: [1, 2, 3, 4, 5], days: 15, description: 'Test' },
            legal: {
              state: 'PROCESO JURÍDICO',
              minDays: 30,
              maxDays: 60,
              defaultDays: 30,
              description: 'Test',
            },
            prescription: { state: 'PRESCRIPCIÓN', days: 10, description: 'Test' },
          },
        },
        {
          config_key: 'prescription_rules',
          config_value: {
            ordinary: { years: 3, description: 'Test', excludes: [] },
            extraordinary: { years: 6, description: 'Test', includes: ['Responsabilidad Civil'] },
          },
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: mockConfigs, error: null }),
      });

      const result = await getAllConfigs();

      // Should merge database values with defaults
      expect((result.follow_up_rules as any).standard.days).toBe(15);
      expect((result.prescription_rules as any).ordinary.years).toBe(3);
      // Should still have other default fields
      expect((result.follow_up_rules as any).legal).toBeDefined();
    });

    it('should return defaults when database error occurs', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') }),
      });

      const result = await getAllConfigs();

      expect(result.follow_up_rules).toEqual(DEFAULT_FOLLOW_UP_RULES);
      expect(result.prescription_rules).toEqual(DEFAULT_PRESCRIPTION_RULES);
    });

    it('should merge database configs with defaults', async () => {
      const customFollowUpRules = {
        standard: { phases: [1, 2, 3, 4, 5], days: 20, description: 'Custom' },
        legal: {
          state: 'PROCESO JURÍDICO',
          minDays: 30,
          maxDays: 60,
          defaultDays: 30,
          description: 'Custom',
        },
        prescription: { state: 'PRESCRIPCIÓN', days: 10, description: 'Custom' },
      };
      const mockConfigs = [{ config_key: 'follow_up_rules', config_value: customFollowUpRules }];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: mockConfigs, error: null }),
      });

      const result = await getAllConfigs();

      // Should have the custom value
      expect((result.follow_up_rules as any).standard.days).toBe(20);
      // Should still have defaults for missing configs
      expect(result.prescription_rules).toEqual(DEFAULT_PRESCRIPTION_RULES);
    });
  });

  describe('updateConfig', () => {
    it('should update config successfully when valid', async () => {
      const newConfig = {
        standard: { phases: [1, 2, 3, 4, 5], days: 15, description: 'Updated' },
        legal: {
          state: 'PROCESO JURÍDICO',
          minDays: 30,
          maxDays: 60,
          defaultDays: 30,
          description: 'Updated',
        },
        prescription: { state: 'PRESCRIPCIÓN', days: 10, description: 'Updated' },
      };

      const mockSingle = vi.fn().mockResolvedValue({
        data: { config_value: DEFAULT_FOLLOW_UP_RULES },
        error: null,
      });

      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      const mockUpsert = vi.fn().mockResolvedValue({ error: null });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'app_config') {
          return {
            select: mockSelect,
            upsert: mockUpsert,
          };
        }
        return { select: vi.fn() };
      });

      const result = await updateConfig('follow_up_rules', newConfig, 'user-001');

      expect(result.success).toBe(true);
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          config_key: 'follow_up_rules',
          config_value: newConfig,
          updated_by: 'user-001',
        }),
        expect.any(Object)
      );
      expect(logAction).toHaveBeenCalledWith(
        'UPDATE_CONFIG',
        'app_config',
        'follow_up_rules',
        expect.any(Object)
      );
    });

    it('should return validation errors when config is invalid', async () => {
      const invalidConfig = {
        standard: { phases: [], days: -5 }, // Invalid values
        legal: { minDays: 100, maxDays: 50 }, // min > max
      };

      const result = await updateConfig('follow_up_rules', invalidConfig, 'user-001');

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it('should handle database errors during update', async () => {
      const newConfig = { ...DEFAULT_FOLLOW_UP_RULES };

      const mockSingle = vi.fn().mockResolvedValue({
        data: { config_value: DEFAULT_FOLLOW_UP_RULES },
        error: null,
      });

      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      const mockUpsert = vi.fn().mockResolvedValue({ error: { message: 'DB Error' } });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'app_config') {
          return {
            select: mockSelect,
            upsert: mockUpsert,
          };
        }
        return { select: vi.fn() };
      });

      const result = await updateConfig('follow_up_rules', newConfig, 'user-001');

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('resetConfigToDefault', () => {
    it('should reset config to default values', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: { config_value: { custom: 'value' } },
        error: null,
      });

      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      const mockUpsert = vi.fn().mockResolvedValue({ error: null });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'app_config') {
          return {
            select: mockSelect,
            upsert: mockUpsert,
          };
        }
        return { select: vi.fn() };
      });

      const result = await resetConfigToDefault('follow_up_rules', 'user-001');

      expect(result.success).toBe(true);
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          config_value: DEFAULT_FOLLOW_UP_RULES,
        }),
        expect.any(Object)
      );
    });
  });

  describe('validateConfig', () => {
    describe('follow_up_rules validation', () => {
      it('should validate correct follow_up_rules', () => {
        const result = validateConfig('follow_up_rules', DEFAULT_FOLLOW_UP_RULES);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject negative days', () => {
        const config = {
          ...DEFAULT_FOLLOW_UP_RULES,
          standard: { ...DEFAULT_FOLLOW_UP_RULES.standard, days: -5 },
        };
        const result = validateConfig('follow_up_rules', config);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.field === 'standard.days')).toBe(true);
      });

      it('should reject days > 365', () => {
        const config = {
          ...DEFAULT_FOLLOW_UP_RULES,
          standard: { ...DEFAULT_FOLLOW_UP_RULES.standard, days: 400 },
        };
        const result = validateConfig('follow_up_rules', config);
        expect(result.valid).toBe(false);
      });

      it('should reject minDays >= maxDays', () => {
        const config = {
          ...DEFAULT_FOLLOW_UP_RULES,
          legal: { ...DEFAULT_FOLLOW_UP_RULES.legal, minDays: 60, maxDays: 30 },
        };
        const result = validateConfig('follow_up_rules', config);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.field === 'legal')).toBe(true);
      });
    });

    describe('prescription_rules validation', () => {
      it('should validate correct prescription_rules', () => {
        const result = validateConfig('prescription_rules', DEFAULT_PRESCRIPTION_RULES);
        expect(result.valid).toBe(true);
      });

      it('should reject ordinary.years > 10', () => {
        const config = {
          ...DEFAULT_PRESCRIPTION_RULES,
          ordinary: { ...DEFAULT_PRESCRIPTION_RULES.ordinary, years: 15 },
        };
        const result = validateConfig('prescription_rules', config);
        expect(result.valid).toBe(false);
      });

      it('should reject extraordinary.years < ordinary.years', () => {
        const config = {
          ...DEFAULT_PRESCRIPTION_RULES,
          ordinary: { ...DEFAULT_PRESCRIPTION_RULES.ordinary, years: 5 },
          extraordinary: { ...DEFAULT_PRESCRIPTION_RULES.extraordinary, years: 3 },
        };
        const result = validateConfig('prescription_rules', config);
        expect(result.valid).toBe(false);
      });

      it('should reject non-array includes', () => {
        const config = {
          ...DEFAULT_PRESCRIPTION_RULES,
          extraordinary: { ...DEFAULT_PRESCRIPTION_RULES.extraordinary, includes: 'not-an-array' },
        };
        const result = validateConfig('prescription_rules', config);
        expect(result.valid).toBe(false);
      });
    });

    describe('alert_thresholds validation', () => {
      it('should validate correct alert_thresholds', () => {
        const result = validateConfig('alert_thresholds', DEFAULT_ALERT_THRESHOLDS);
        expect(result.valid).toBe(true);
      });

      it('should reject warning <= critical', () => {
        const config = {
          ...DEFAULT_ALERT_THRESHOLDS,
          prescription: { ...DEFAULT_ALERT_THRESHOLDS.prescription, warning: 20, critical: 30 },
        };
        const result = validateConfig('alert_thresholds', config);
        expect(result.valid).toBe(false);
      });
    });

    describe('notification_settings validation', () => {
      it('should validate correct notification_settings', () => {
        const result = validateConfig('notification_settings', DEFAULT_NOTIFICATION_SETTINGS);
        expect(result.valid).toBe(true);
      });

      it('should reject invalid digestTime format', () => {
        const config = { ...DEFAULT_NOTIFICATION_SETTINGS, digestTime: '25:00' };
        const result = validateConfig('notification_settings', config);
        expect(result.valid).toBe(false);
      });

      it('should reject non-boolean ui', () => {
        const config = { ...DEFAULT_NOTIFICATION_SETTINGS, ui: 'yes' };
        const result = validateConfig('notification_settings', config);
        expect(result.valid).toBe(false);
      });
    });

    describe('auto_close_rules validation', () => {
      it('should validate correct auto_close_rules', () => {
        const result = validateConfig('auto_close_rules', DEFAULT_AUTO_CLOSE_RULES);
        expect(result.valid).toBe(true);
      });

      it('should reject negative threshold', () => {
        const config = { ...DEFAULT_AUTO_CLOSE_RULES, highValueThreshold: -1000 };
        const result = validateConfig('auto_close_rules', config);
        expect(result.valid).toBe(false);
      });
    });

    it('should reject null values', () => {
      const result = validateConfig('follow_up_rules', null);
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('root');
    });

    it('should reject non-object values', () => {
      const result = validateConfig('follow_up_rules', 'string');
      expect(result.valid).toBe(false);
    });
  });

  describe('compareConfigs', () => {
    it('should return empty array for identical configs', () => {
      const oldValue = { a: 1, b: { c: 2 } };
      const newValue = { a: 1, b: { c: 2 } };

      const result = compareConfigs(oldValue, newValue);

      expect(result).toHaveLength(0);
    });

    it('should detect simple value changes', () => {
      const oldValue = { a: 1, b: 2 };
      const newValue = { a: 1, b: 3 };

      const result = compareConfigs(oldValue, newValue);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ path: 'b', old: 2, new: 3 });
    });

    it('should detect nested value changes', () => {
      const oldValue = { a: { b: { c: 1 } } };
      const newValue = { a: { b: { c: 2 } } };

      const result = compareConfigs(oldValue, newValue);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ path: 'a.b.c', old: 1, new: 2 });
    });

    it('should detect added fields', () => {
      const oldValue = { a: 1 };
      const newValue = { a: 1, b: 2 };

      const result = compareConfigs(oldValue, newValue);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ path: 'b', old: undefined, new: 2 });
    });

    it('should detect removed fields', () => {
      const oldValue = { a: 1, b: 2 };
      const newValue = { a: 1 };

      const result = compareConfigs(oldValue, newValue);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ path: 'b', old: 2, new: undefined });
    });
  });

  describe('getConfigDefault', () => {
    it('should return correct defaults for all keys', () => {
      expect(getConfigDefault('follow_up_rules')).toEqual(DEFAULT_FOLLOW_UP_RULES);
      expect(getConfigDefault('prescription_rules')).toEqual(DEFAULT_PRESCRIPTION_RULES);
      expect(getConfigDefault('alert_thresholds')).toEqual(DEFAULT_ALERT_THRESHOLDS);
      expect(getConfigDefault('notification_settings')).toEqual(DEFAULT_NOTIFICATION_SETTINGS);
      expect(getConfigDefault('auto_close_rules')).toEqual(DEFAULT_AUTO_CLOSE_RULES);
    });
  });

  describe('getConfigMetadata', () => {
    it('should return metadata for all config keys', () => {
      const metadata = getConfigMetadata();

      expect(metadata).toHaveLength(5);
      expect(metadata.map(m => m.key)).toContain('follow_up_rules');
      expect(metadata.map(m => m.key)).toContain('prescription_rules');
      expect(metadata.map(m => m.key)).toContain('alert_thresholds');
      expect(metadata.map(m => m.key)).toContain('notification_settings');
      expect(metadata.map(m => m.key)).toContain('auto_close_rules');

      // Each should have description and type
      metadata.forEach(m => {
        expect(m.description).toBeDefined();
        expect(m.type).toBe('object');
      });
    });
  });
});
