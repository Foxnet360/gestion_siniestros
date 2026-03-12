#!/usr/bin/env node
/**
 * Data Migration Script for SLA System
 *
 * This script performs the following tasks:
 * 1. Extract dates from all historical observations
 * 2. Validate extracted dates against manual samples
 * 3. Generate extraction coverage report
 * 4. Fix edge cases
 * 5. Populate amparos list
 *
 * Usage: npx ts-node scripts/run-full-migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import { SlaBatchProcessor } from '../src/services/SlaBatchProcessor';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const BATCH_SIZE = 100;
const VALIDATION_SAMPLE_SIZE = 100;
const REPORT_OUTPUT_DIR = './migration-reports';

interface MigrationConfig {
  supabaseUrl: string;
  supabaseKey: string;
  dryRun: boolean;
  validationMode: boolean;
}

interface MigrationResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  extractedByStage: { [key: number]: number };
  errors: Array<{ claimId: string; error: string }>;
  validationResults?: ValidationResult[];
}

interface ValidationResult {
  claimId: string;
  stage: number;
  extractedDate: string;
  manualDate: string | null;
  match: boolean;
}

class DataMigration {
  private processor: SlaBatchProcessor;
  private supabase;
  private config: MigrationConfig;

  constructor(config: MigrationConfig) {
    this.config = config;
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
    this.processor = new SlaBatchProcessor(config.supabaseUrl, config.supabaseKey);
  }

  /**
   * Task 7.1: Run extraction job on all historical observations
   */
  async runExtraction(): Promise<MigrationResult> {
    console.log('🚀 Task 7.1: Starting extraction of historical observations...\n');

    const startTime = Date.now();

    try {
      const result = await this.processor.processAll(BATCH_SIZE);

      const duration = (Date.now() - startTime) / 1000;

      console.log(`✅ Extraction completed in ${duration.toFixed(2)}s`);
      console.log(`   Total processed: ${result.totalProcessed}`);
      console.log(`   Successful: ${result.successful}`);
      console.log(`   Failed: ${result.failed}`);
      console.log(
        `   Success rate: ${((result.successful / result.totalProcessed) * 100).toFixed(2)}%\n`
      );

      return result;
    } catch (error) {
      console.error('❌ Extraction failed:', error);
      throw error;
    }
  }

  /**
   * Task 7.2: Validate extracted dates against manual samples
   */
  async validateExtraction(
    sampleSize: number = VALIDATION_SAMPLE_SIZE
  ): Promise<ValidationResult[]> {
    console.log(`🧪 Task 7.2: Validating extraction against ${sampleSize} manual samples...\n`);

    try {
      // Get random sample of claims with both extracted and manual data
      const { data: samples, error } = await this.supabase
        .from('siniestro_etapas')
        .select('claim_id, etapa_6_fecha, etapa_10_fecha, validation_data')
        .not('validation_data', 'is', null)
        .limit(sampleSize);

      if (error) throw error;

      const results: ValidationResult[] = [];
      let matchCount = 0;

      for (const sample of samples || []) {
        const validation = sample.validation_data;

        // Compare extracted dates with manual validation
        if (validation.manual_liquidacion_date) {
          const match = sample.etapa_6_fecha === validation.manual_liquidacion_date;
          results.push({
            claimId: sample.claim_id,
            stage: 6,
            extractedDate: sample.etapa_6_fecha,
            manualDate: validation.manual_liquidacion_date,
            match,
          });
          if (match) matchCount++;
        }

        if (validation.manual_desistimiento_date) {
          const match = sample.etapa_10_fecha === validation.manual_desistimiento_date;
          results.push({
            claimId: sample.claim_id,
            stage: 10,
            extractedDate: sample.etapa_10_fecha,
            manualDate: validation.manual_desistimiento_date,
            match,
          });
          if (match) matchCount++;
        }
      }

      const accuracy = results.length > 0 ? (matchCount / results.length) * 100 : 0;

      console.log(`✅ Validation completed`);
      console.log(`   Total validations: ${results.length}`);
      console.log(`   Matches: ${matchCount}`);
      console.log(`   Accuracy: ${accuracy.toFixed(2)}%\n`);

      return results;
    } catch (error) {
      console.error('❌ Validation failed:', error);
      throw error;
    }
  }

  /**
   * Task 7.3: Generate extraction report (coverage % by stage)
   */
  async generateReport(): Promise<void> {
    console.log('📊 Task 7.3: Generating extraction coverage report...\n');

    try {
      const report = await this.processor.generateReport();

      // Create report content
      const reportContent = `
# Data Migration Report
Generated: ${new Date().toISOString()}

## Summary
- Total Claims: ${report.totalClaims}
- Claims with Stage Data: ${report.claimsWithStages}
- Overall Coverage: ${((report.claimsWithStages / report.totalClaims) * 100).toFixed(2)}%

## Coverage by Stage
| Stage | Coverage % | Count |
|-------|-----------|-------|
${Object.entries(report.coverageByStage)
  .map(
    ([stage, coverage]) =>
      `| ${stage} | ${coverage}% | ${Math.round((coverage / 100) * report.totalClaims)} |`
  )
  .join('\n')}

## Recommendations
${this.generateRecommendations(report.coverageByStage)}
`;

      // Ensure output directory exists
      if (!fs.existsSync(REPORT_OUTPUT_DIR)) {
        fs.mkdirSync(REPORT_OUTPUT_DIR, { recursive: true });
      }

      // Save report
      const reportPath = path.join(REPORT_OUTPUT_DIR, `migration-report-${Date.now()}.md`);
      fs.writeFileSync(reportPath, reportContent);

      console.log(`✅ Report saved to: ${reportPath}\n`);

      // Display summary
      console.log('Coverage Summary:');
      Object.entries(report.coverageByStage).forEach(([stage, coverage]) => {
        const status = coverage >= 80 ? '🟢' : coverage >= 50 ? '🟡' : '🔴';
        console.log(`   ${status} Stage ${stage}: ${coverage}%`);
      });
      console.log();
    } catch (error) {
      console.error('❌ Report generation failed:', error);
      throw error;
    }
  }

  /**
   * Task 7.4: Fix edge cases and re-run if needed
   */
  async fixEdgeCases(): Promise<void> {
    console.log('🔧 Task 7.4: Fixing edge cases...\n');

    try {
      // Find claims with extraction errors
      const { data: errorClaims, error } = await this.supabase
        .from('siniestro_etapas')
        .select('claim_id, extraction_errors')
        .not('extraction_errors', 'is', null)
        .gt('array_length(extraction_errors, 1)', 0);

      if (error) throw error;

      console.log(`   Found ${errorClaims?.length || 0} claims with errors`);

      let fixedCount = 0;

      for (const claim of errorClaims || []) {
        // Check if errors are fixable
        const fixableErrors = claim.extraction_errors.filter(
          (err: string) => err.includes('formato') || err.includes('parse')
        );

        if (fixableErrors.length > 0) {
          // Re-process claim
          try {
            await this.processor.reprocessClaim(claim.claim_id);
            fixedCount++;
          } catch (e) {
            console.log(`   ⚠️  Could not fix claim ${claim.claim_id}`);
          }
        }
      }

      console.log(`✅ Fixed ${fixedCount} edge cases\n`);
    } catch (error) {
      console.error('❌ Edge case fixing failed:', error);
      throw error;
    }
  }

  /**
   * Task 7.5: Populate amparos list from "Tipo de siniestro" → "OTRO"
   */
  async populateAmparos(): Promise<void> {
    console.log('📋 Task 7.5: Populating amparos list...\n');

    try {
      // Get unique "OTRO" types from claims
      const { data: otroTypes, error } = await this.supabase
        .from('claims')
        .select('tipo_siniestro')
        .eq('categoria_tipo', 'OTRO')
        .not('tipo_siniestro', 'is', null);

      if (error) throw error;

      // Extract unique values
      const uniqueTypes = [...new Set(otroTypes?.map(c => c.tipo_siniestro))];

      console.log(`   Found ${uniqueTypes.length} unique "OTRO" types`);

      // Insert into amparos table
      let insertedCount = 0;

      for (const tipo of uniqueTypes) {
        // Check if already exists
        const { data: existing } = await this.supabase
          .from('amparos')
          .select('id')
          .eq('nombre', tipo)
          .single();

        if (!existing) {
          const { error: insertError } = await this.supabase.from('amparos').insert({
            nombre: tipo,
            categoria: 'OTRO',
            activo: true,
          });

          if (!insertError) {
            insertedCount++;
          }
        }
      }

      console.log(`✅ Inserted ${insertedCount} new amparos\n`);
    } catch (error) {
      console.error('❌ Amparos population failed:', error);
      throw error;
    }
  }

  /**
   * Generate recommendations based on coverage
   */
  private generateRecommendations(coverageByStage: { [key: number]: number }): string {
    const recommendations: string[] = [];

    Object.entries(coverageByStage).forEach(([stage, coverage]) => {
      if (coverage < 50) {
        recommendations.push(
          `- **Stage ${stage}**: Low coverage (${coverage}%). Review extraction patterns.`
        );
      } else if (coverage < 80) {
        recommendations.push(
          `- **Stage ${stage}**: Medium coverage (${coverage}%). Consider manual review.`
        );
      }
    });

    return recommendations.length > 0
      ? recommendations.join('\n')
      : '- All stages have good coverage (≥80%). No action required.';
  }

  /**
   * Run full migration process
   */
  async runFullMigration(): Promise<void> {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║        DATA MIGRATION - SLA SYSTEM                     ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    const startTime = Date.now();

    try {
      // Task 7.1: Extraction
      const extractionResult = await this.runExtraction();

      // Task 7.2: Validation
      const validationResults = await this.validateExtraction();

      // Task 7.3: Report
      await this.generateReport();

      // Task 7.4: Fix edge cases
      await this.fixEdgeCases();

      // Task 7.5: Populate amparos
      await this.populateAmparos();

      const duration = (Date.now() - startTime) / 1000;

      // Final summary
      console.log('╔════════════════════════════════════════════════════════╗');
      console.log('║           MIGRATION COMPLETED SUCCESSFULLY             ║');
      console.log('╚════════════════════════════════════════════════════════╝\n');
      console.log(`⏱️  Total duration: ${duration.toFixed(2)}s`);
      console.log(`📊 Total claims processed: ${extractionResult.totalProcessed}`);
      console.log(
        `✅ Success rate: ${((extractionResult.successful / extractionResult.totalProcessed) * 100).toFixed(2)}%`
      );
      console.log(
        `🧪 Validation accuracy: ${
          validationResults.length > 0
            ? (
                (validationResults.filter(v => v.match).length / validationResults.length) *
                100
              ).toFixed(2)
            : 0
        }%`
      );
      console.log(`📁 Reports saved to: ${REPORT_OUTPUT_DIR}\n`);
    } catch (error) {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const config: MigrationConfig = {
    supabaseUrl: process.env.VITE_SUPABASE_URL || '',
    supabaseKey: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '',
    dryRun: process.env.DRY_RUN === 'true',
    validationMode: process.env.VALIDATION_MODE === 'true',
  };

  if (!config.supabaseUrl || !config.supabaseKey) {
    console.error('❌ Error: Missing Supabase environment variables');
    console.log('   Required: VITE_SUPABASE_URL, VITE_SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const migration = new DataMigration(config);
  await migration.runFullMigration();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { DataMigration };
export default DataMigration;
