
import { MatchingEngine } from './matchingEngine';
import { supabase } from '@/integrations/supabase/client';

export interface MatchingJobStatus {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  type: 'full_recalculation' | 'founder_update' | 'advisor_update';
  progress: number;
  total: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

export class BackgroundMatchingService {
  private static jobs = new Map<string, MatchingJobStatus>();

  // Start a full recalculation job
  static async startFullRecalculation(): Promise<string> {
    const jobId = crypto.randomUUID();
    
    const job: MatchingJobStatus = {
      id: jobId,
      status: 'pending',
      type: 'full_recalculation',
      progress: 0,
      total: 0,
      startedAt: new Date().toISOString()
    };

    this.jobs.set(jobId, job);

    // Start the job asynchronously
    this.executeFullRecalculation(jobId).catch(error => {
      console.error('Full recalculation job failed:', error);
      this.updateJobStatus(jobId, { status: 'failed', error: error.message });
    });

    return jobId;
  }

  // Execute full recalculation
  private static async executeFullRecalculation(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    try {
      this.updateJobStatus(jobId, { status: 'running' });

      // Get total counts for progress tracking
      const [foundersData, advisorsData] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact' }).eq('role', 'founder').eq('status', 'active'),
        supabase.from('users').select('id', { count: 'exact' }).eq('role', 'advisor').eq('status', 'active')
      ]);

      const totalFounders = foundersData.count || 0;
      const totalAdvisors = advisorsData.count || 0;
      
      this.updateJobStatus(jobId, { 
        total: totalFounders,
        progress: 0 
      });

      // Use the edge function for batch calculation
      await MatchingEngine.calculateAllMatches((current, total) => {
        this.updateJobStatus(jobId, { 
          progress: current,
          total: total 
        });
      });

      this.updateJobStatus(jobId, { 
        status: 'completed',
        completedAt: new Date().toISOString()
      });

      console.log(`Full recalculation job ${jobId} completed successfully`);

    } catch (error) {
      console.error(`Full recalculation job ${jobId} failed:`, error);
      this.updateJobStatus(jobId, { 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date().toISOString()
      });
    }
  }

  // Start a founder-specific recalculation job
  static async startFounderRecalculation(founderId: string): Promise<string> {
    const jobId = crypto.randomUUID();
    
    const job: MatchingJobStatus = {
      id: jobId,
      status: 'pending',
      type: 'founder_update',
      progress: 0,
      total: 1,
      startedAt: new Date().toISOString()
    };

    this.jobs.set(jobId, job);

    // Start the job asynchronously
    this.executeFounderRecalculation(jobId, founderId).catch(error => {
      console.error('Founder recalculation job failed:', error);
      this.updateJobStatus(jobId, { status: 'failed', error: error.message });
    });

    return jobId;
  }

  // Execute founder-specific recalculation
  private static async executeFounderRecalculation(jobId: string, founderId: string): Promise<void> {
    try {
      this.updateJobStatus(jobId, { status: 'running' });

      await MatchingEngine.calculateFounderMatches(founderId, true);

      this.updateJobStatus(jobId, { 
        status: 'completed',
        progress: 1,
        completedAt: new Date().toISOString()
      });

      console.log(`Founder recalculation job ${jobId} completed for founder ${founderId}`);

    } catch (error) {
      console.error(`Founder recalculation job ${jobId} failed:`, error);
      this.updateJobStatus(jobId, { 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date().toISOString()
      });
    }
  }

  // Update job status
  private static updateJobStatus(jobId: string, updates: Partial<MatchingJobStatus>): void {
    const job = this.jobs.get(jobId);
    if (job) {
      Object.assign(job, updates);
      this.jobs.set(jobId, job);
    }
  }

  // Get job status
  static getJobStatus(jobId: string): MatchingJobStatus | null {
    return this.jobs.get(jobId) || null;
  }

  // Get all active jobs
  static getAllJobs(): MatchingJobStatus[] {
    return Array.from(this.jobs.values());
  }

  // Clean up completed jobs older than 1 hour
  static cleanupOldJobs(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    for (const [jobId, job] of this.jobs.entries()) {
      if (
        (job.status === 'completed' || job.status === 'failed') &&
        job.completedAt &&
        new Date(job.completedAt) < oneHourAgo
      ) {
        this.jobs.delete(jobId);
      }
    }
  }

  // Schedule automatic cleanup every 30 minutes
  static startCleanupScheduler(): void {
    setInterval(() => {
      this.cleanupOldJobs();
    }, 30 * 60 * 1000);
  }
}

// Start the cleanup scheduler when the service is imported
BackgroundMatchingService.startCleanupScheduler();
