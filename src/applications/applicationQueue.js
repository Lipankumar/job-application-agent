class ApplicationQueue {
    constructor() {
        this.jobs = [];
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
        const job = this.jobs.find(job => job.id === jobId);

        if (job) {
            job.status = "processing";
        }
    }

    markWaitingForHuman(jobId) {
        const job = this.jobs.find(job => job.id === jobId);

        if (job) {
            job.status = "waiting_for_human";
        }
    }

    markCompleted(jobId) {
        const job = this.jobs.find(job => job.id === jobId);

        if (job) {
            job.status = "completed";
        }
    }

    markSkipped(jobId, reason) {
        const job = this.jobs.find(job => job.id === jobId);

        if (job) {
            job.status = "skipped";
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