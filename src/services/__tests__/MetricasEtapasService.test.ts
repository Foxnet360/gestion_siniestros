import { describe, it, expect } from 'vitest';
import { metricasEtapasService } from '../MetricasEtapasService';

describe('MetricasEtapasService', () => {
  describe('calcularDiasHabiles', () => {
    it('debe calcular correctamente dias habiles en la misma semana', () => {
      // Lunes a Viernes = 5 dias habiles
      const dias = metricasEtapasService.calcularDiasHabiles('2024-01-01', '2024-01-05');
      expect(dias).toBe(5);
    });

    it('debe excluir fines de semana', () => {
      // Viernes a Lunes = 2 dias habiles (excluye sabado y domingo)
      const dias = metricasEtapasService.calcularDiasHabiles('2024-01-05', '2024-01-08');
      expect(dias).toBe(2);
    });

    it('debe retornar 1 dia para la misma fecha', () => {
      const dias = metricasEtapasService.calcularDiasHabiles('2024-01-01', '2024-01-01');
      expect(dias).toBe(1);
    });

    it('debe manejar fechas en formato Date', () => {
      const inicio = new Date('2024-01-01');
      const fin = new Date('2024-01-05');
      const dias = metricasEtapasService.calcularDiasHabiles(inicio, fin);
      expect(dias).toBe(5);
    });
  });

  describe('clasificarTipoProceso', () => {
    it('debe clasificar como normal si no tiene prescripcion y < 365 dias', () => {
      const etapas = [{ etapaNum: 1 }, { etapaNum: 16 }];
      const tipo = metricasEtapasService.clasificarTipoProceso(etapas, 180);
      expect(tipo).toBe('normal');
    });

    it('debe clasificar como prescripcion ordinaria si tiene etapa 13 y < 1095 dias', () => {
      const etapas = [{ etapaNum: 1 }, { etapaNum: 13 }, { etapaNum: 16 }];
      const tipo = metricasEtapasService.clasificarTipoProceso(etapas, 730);
      expect(tipo).toBe('prescripcion_ordinaria');
    });

    it('debe clasificar como prescripcion extraordinaria si > 1095 dias', () => {
      const etapas = [{ etapaNum: 1 }, { etapaNum: 13 }, { etapaNum: 16 }];
      const tipo = metricasEtapasService.clasificarTipoProceso(etapas, 1500);
      expect(tipo).toBe('prescripcion_extraordinaria');
    });
  });

  describe('validarCompletitudDatos', () => {
    it('debe marcar como completo si tiene etapa 1 y 16', () => {
      const etapas = [
        { etapaNum: 1, fecha: '2024-01-01' },
        { etapaNum: 16, fecha: '2024-06-01' },
      ];
      const validacion = metricasEtapasService.validarCompletitudDatos(etapas);
      expect(validacion.esCompleto).toBe(true);
      expect(validacion.tieneEtapa1).toBe(true);
      expect(validacion.tieneEtapa16).toBe(true);
    });

    it('debe marcar como incompleto si falta etapa 1', () => {
      const etapas = [{ etapaNum: 16, fecha: '2024-06-01' }];
      const validacion = metricasEtapasService.validarCompletitudDatos(etapas);
      expect(validacion.esCompleto).toBe(false);
      expect(validacion.tieneEtapa1).toBe(false);
      expect(validacion.razon).toBe('sin_etapa_1');
    });

    it('debe marcar como incompleto si falta etapa 16', () => {
      const etapas = [{ etapaNum: 1, fecha: '2024-01-01' }];
      const validacion = metricasEtapasService.validarCompletitudDatos(etapas);
      expect(validacion.esCompleto).toBe(false);
      expect(validacion.tieneEtapa16).toBe(false);
      expect(validacion.razon).toBe('sin_etapa_16');
    });
  });

  describe('evaluarCumplimientoSLA', () => {
    it('debe retornar cumple=true si esta dentro del SLA', () => {
      const resultado = metricasEtapasService.evaluarCumplimientoSLA(5, 10);
      expect(resultado?.cumple).toBe(true);
      expect(resultado?.desviacion).toBe(-5);
    });

    it('debe retornar cumple=false si excede el SLA', () => {
      const resultado = metricasEtapasService.evaluarCumplimientoSLA(15, 10);
      expect(resultado?.cumple).toBe(false);
      expect(resultado?.desviacion).toBe(5);
    });

    it('debe retornar null si no hay SLA definido', () => {
      const resultado = metricasEtapasService.evaluarCumplimientoSLA(10, undefined);
      expect(resultado).toBeNull();
    });
  });
});
