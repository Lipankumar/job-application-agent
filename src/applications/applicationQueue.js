class ApplicationQueue {
    constructor() {
        this.jobs = [];
    }

    findJob(jobOrId) {
        if (jobOrId && typeof jobOrId === "object") {
            return this.jobs.find(job => job === jobOrId);
        }

        return this.jobs.find(job => job.id === jobOrId);
    }

    add(job) {
        this.jobs.push({
            ...job,
            status: "pending"
        });
    }

    addMany(jobs) {
        jobs.forEach(job => this.add(job));
    }

    getNext() {
        return this.jobs.find(job => job.status === "pending");
    }

    markProcessing(jobId) {
        const job = this.findJob(jobId);

        if (job) {
            job.status = "processing";
        }
    }

    markWaitingForHuman(jobId, reason = "") {
        const job = this.findJob(jobId);

        if (job) {
            job.status = "waiting_for_human";
            job.reason = reason;
        }
    }

    markCompleted(jobId) {
        const job = this.findJob(jobId);

        if (job) {
            job.status = "completed";
            job.outcome = "applied";
            job.reason = null;
        }
    }

    markSkipped(jobId, reason) {
        const job = this.findJob(jobId);

        if (job) {
            job.status = "skipped";
            job.reason = reason;
        }
    }

    markFailed(jobId, reason) {
        const job = this.findJob(jobId);

        if (job && job.status !== "completed") {
            job.status = "failed";
            job.outcome = "failed";
            job.reason = reason;
        }
    }

    getPendingJobs() {
        return this.jobs.filter(job => job.status === "pending");
    }

    getAll() {
        return this.jobs;
    }
}

module.exports = ApplicationQueue;
