import { vi } from 'vitest';

/**
 * Performance testing utilities for measuring component and service performance
 */

export interface PerformanceMetrics {
  executionTime: number;
  memoryUsage?: {
    used: number;
    total: number;
    peak: number;
  };
  renderTime?: number;
  reRenderCount?: number;
  domUpdates?: number;
}

export interface PerformanceBenchmark {
  name: string;
  iterations: number;
  results: PerformanceMetrics[];
  average: PerformanceMetrics;
  median: PerformanceMetrics;
  percentile95: PerformanceMetrics;
}

/**
 * Measure execution time of a function
 */
export const measureExecutionTime = async <T>(
  fn: () => T | Promise<T>,
  iterations: number = 1
): Promise<PerformanceMetrics[]> => {
  const results: PerformanceMetrics[] = [];

  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0;

    await fn();

    const endTime = performance.now();
    const endMemory = (performance as any).memory?.usedJSHeapSize || 0;

    results.push({
      executionTime: endTime - startTime,
      memoryUsage: {
        used: endMemory - startMemory,
        total: (performance as any).memory?.totalJSHeapSize || 0,
        peak: (performance as any).memory?.usedJSHeapSize || 0,
      },
    });
  }

  return results;
};

/**
 * Benchmark a function with statistical analysis
 */
export const benchmark = async <T>(
  name: string,
  fn: () => T | Promise<T>,
  iterations: number = 100
): Promise<PerformanceBenchmark> => {
  console.log(`Running benchmark: ${name} (${iterations} iterations)`);

  const results = await measureExecutionTime(fn, iterations);

  const sortedByTime = [...results].sort((a, b) => a.executionTime - b.executionTime);
  const average = calculateAverage(results);
  const median = sortedByTime[Math.floor(sortedByTime.length / 2)];
  const percentile95 = sortedByTime[Math.floor(sortedByTime.length * 0.95)];

  const benchmark: PerformanceBenchmark = {
    name,
    iterations,
    results,
    average,
    median,
    percentile95,
  };

  console.log(`Benchmark complete: ${name}`);
  console.log(`   Average: ${average.executionTime.toFixed(2)}ms`);
  console.log(`   Median: ${median.executionTime.toFixed(2)}ms`);
  console.log(`   95th percentile: ${percentile95.executionTime.toFixed(2)}ms`);

  return benchmark;
};

/**
 * Calculate average metrics
 */
const calculateAverage = (results: PerformanceMetrics[]): PerformanceMetrics => {
  const sum = results.reduce(
    (acc, result) => ({
      executionTime: acc.executionTime + result.executionTime,
      memoryUsage: {
        used: acc.memoryUsage.used + (result.memoryUsage?.used || 0),
        total: acc.memoryUsage.total + (result.memoryUsage?.total || 0),
        peak: Math.max(acc.memoryUsage.peak, result.memoryUsage?.peak || 0),
      },
      renderTime: acc.renderTime + (result.renderTime || 0),
      reRenderCount: acc.reRenderCount + (result.reRenderCount || 0),
      domUpdates: acc.domUpdates + (result.domUpdates || 0),
    }),
    {
      executionTime: 0,
      memoryUsage: { used: 0, total: 0, peak: 0 },
      renderTime: 0,
      reRenderCount: 0,
      domUpdates: 0,
    }
  );

  const count = results.length;
  return {
    executionTime: sum.executionTime / count,
    memoryUsage: {
      used: sum.memoryUsage.used / count,
      total: sum.memoryUsage.total / count,
      peak: sum.memoryUsage.peak,
    },
    renderTime: sum.renderTime / count,
    reRenderCount: sum.reRenderCount / count,
    domUpdates: sum.domUpdates / count,
  };
};

/**
 * Performance assertion helpers
 */
export const expectPerformance = (metrics: PerformanceMetrics) => ({
  toBeFasterThan: (threshold: number) => {
    if (metrics.executionTime > threshold) {
      throw new Error(
        `Expected execution time ${metrics.executionTime.toFixed(2)}ms to be less than ${threshold}ms`
      );
    }
  },

  toHaveMemoryUsageLessThan: (threshold: number) => {
    const memoryUsed = metrics.memoryUsage?.used || 0;
    if (memoryUsed > threshold) {
      throw new Error(
        `Expected memory usage ${memoryUsed} bytes to be less than ${threshold} bytes`
      );
    }
  },

  toHaveFewerReRendersThan: (threshold: number) => {
    const reRenders = metrics.reRenderCount || 0;
    if (reRenders > threshold) {
      throw new Error(
        `Expected ${reRenders} re-renders to be less than ${threshold}`
      );
    }
  },
});

/**
 * React component performance testing
 */
export class ReactPerformanceProfiler {
  private renderCount = 0;
  private renderTimes: number[] = [];
  private commitTimes: number[] = [];

  onRender = (
    id: string,
    phase: 'mount' | 'update',
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number
  ) => {
    this.renderCount++;
    this.renderTimes.push(actualDuration);
    this.commitTimes.push(commitTime - startTime);
  };

  getMetrics(): PerformanceMetrics {
    const avgRenderTime = this.renderTimes.reduce((a, b) => a + b, 0) / this.renderTimes.length;
    const avgCommitTime = this.commitTimes.reduce((a, b) => a + b, 0) / this.commitTimes.length;

    return {
      executionTime: avgRenderTime,
      renderTime: avgRenderTime,
      reRenderCount: this.renderCount,
      domUpdates: avgCommitTime,
    };
  }

  reset() {
    this.renderCount = 0;
    this.renderTimes = [];
    this.commitTimes = [];
  }
}

/**
 * Service performance testing
 */
export const measureServicePerformance = async <T>(
  serviceName: string,
  method: string,
  serviceCall: () => Promise<T>,
  iterations: number = 50
): Promise<PerformanceBenchmark> => {
  return benchmark(
    `${serviceName}.${method}`,
    serviceCall,
    iterations
  );
};

/**
 * Bulk operation performance testing
 */
export const measureBulkOperation = async <T>(
  operationName: string,
  operation: (item: T) => Promise<any>,
  items: T[],
  batchSize: number = 10
): Promise<PerformanceBenchmark> => {
  const processBatch = async () => {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      await Promise.all(batch.map(operation));
    }
  };

  return benchmark(`${operationName} (${items.length} items, batch size: ${batchSize})`, processBatch, 5);
};

/**
 * Memory leak detection
 */
export class MemoryLeakDetector {
  private initialMemory: number;
  private samples: number[] = [];
  private interval: NodeJS.Timeout | null = null;

  start() {
    this.initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
    this.samples = [this.initialMemory];

    this.interval = setInterval(() => {
      const currentMemory = (performance as any).memory?.usedJSHeapSize || 0;
      this.samples.push(currentMemory);
    }, 100);
  }

  stop(): MemoryLeakReport {
    if (this.interval) {
      clearInterval(this.interval);
    }

    const finalMemory = this.samples[this.samples.length - 1];
    const maxMemory = Math.max(...this.samples);
    const memoryGrowth = finalMemory - this.initialMemory;
    const growthRate = this.samples.length > 1
      ? (finalMemory - this.initialMemory) / (this.samples.length * 100) // per second
      : 0;

    const isLeaking = growthRate > 1000; // Growing more than 1KB per second

    return {
      initialMemory: this.initialMemory,
      finalMemory,
      maxMemory,
      memoryGrowth,
      growthRate,
      samples: this.samples.length,
      isLeaking,
      report: `Memory ${isLeaking ? 'LEAK DETECTED' : 'OK'}: ${memoryGrowth} bytes growth (${growthRate.toFixed(2)} bytes/sec)`,
    };
  }
}

export interface MemoryLeakReport {
  initialMemory: number;
  finalMemory: number;
  maxMemory: number;
  memoryGrowth: number;
  growthRate: number;
  samples: number;
  isLeaking: boolean;
  report: string;
}

/**
 * Performance test decorators
 */
export const withPerformanceTest = (threshold: number) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const start = performance.now();
      const result = await original.apply(this, args);
      const end = performance.now();
      const duration = end - start;

      if (duration > threshold) {
        console.warn(
          `⚠️  Performance warning: ${propertyKey} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`
        );
      }

      return result;
    };
    return descriptor;
  };
};

/**
 * Performance regression testing
 */
export class PerformanceRegression {
  private static baselines: Map<string, PerformanceMetrics> = new Map();

  static setBaseline(testName: string, metrics: PerformanceMetrics) {
    this.baselines.set(testName, metrics);
  }

  static checkRegression(testName: string, currentMetrics: PerformanceMetrics, tolerance: number = 0.2): boolean {
    const baseline = this.baselines.get(testName);
    if (!baseline) {
      console.warn(`No baseline found for test: ${testName}`);
      return false;
    }

    const regressionThreshold = baseline.executionTime * (1 + tolerance);
    const hasRegression = currentMetrics.executionTime > regressionThreshold;

    if (hasRegression) {
      console.error(
        `🔴 Performance regression detected in ${testName}:\n` +
        `   Baseline: ${baseline.executionTime.toFixed(2)}ms\n` +
        `   Current: ${currentMetrics.executionTime.toFixed(2)}ms\n` +
        `   Regression: ${((currentMetrics.executionTime / baseline.executionTime - 1) * 100).toFixed(2)}%`
      );
    }

    return hasRegression;
  }
}

/**
 * Utility to create performance test suites
 */
export const createPerformanceTestSuite = (suiteName: string) => {
  const tests: Array<() => Promise<PerformanceBenchmark>> = [];

  return {
    addTest: (testName: string, testFn: () => Promise<any>, iterations: number = 100) => {
      tests.push(() => benchmark(`${suiteName}.${testName}`, testFn, iterations));
    },

    run: async (): Promise<PerformanceBenchmark[]> => {
      console.log(`Running performance test suite: ${suiteName}`);
      const results = await Promise.all(tests.map(test => test()));
      console.log(`Performance test suite completed: ${suiteName}`);
      return results;
    },
  };
};
