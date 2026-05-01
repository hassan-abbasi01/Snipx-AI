import os
import logging
import platform
import time
import traceback
import threading

from redis import Redis
from rq import Queue
from rq.job import Job, JobStatus

# Import app module so job function `app.process_video_job` is available.
import app  # noqa: F401

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def _heartbeat_key(queue_name):
    return f"rq:worker:{queue_name}:heartbeat"


def _start_heartbeat(conn, queue_name, stop_event):
    """Keep a short-lived heartbeat in Redis so app.py knows a worker is alive."""
    key = _heartbeat_key(queue_name)

    def _beat():
        while not stop_event.is_set():
            try:
                conn.setex(key, 30, str(os.getpid()))
            except Exception as heartbeat_err:
                logger.error(f"[WORKER] Heartbeat update failed: {heartbeat_err}")
            stop_event.wait(10)

    thread = threading.Thread(target=_beat, daemon=True)
    thread.start()
    return key


def execute_job_windows(job):
    """
    Execute a job directly without forking (Windows-compatible).
    Manually handles job status updates.
    """
    try:
        logger.info(f"[WORKER] Starting job {job.id}")
        job.set_status(JobStatus.STARTED)
        
        # Execute the actual job function
        result = job.perform()
        
        # Mark as complete
        job.set_status(JobStatus.FINISHED)
        job.result = result
        job.save()
        logger.info(f"[WORKER] Job {job.id} completed successfully")
        return result
        
    except Exception as e:
        logger.error(f"[WORKER] Job {job.id} failed: {str(e)}")
        logger.error(traceback.format_exc())
        job.set_status(JobStatus.FAILED)
        job.exc_info = traceback.format_exc()
        job.save()
        return None


def main():
    redis_url = os.getenv('REDIS_URL', 'redis://127.0.0.1:6379/0')
    queue_name = os.getenv('RQ_QUEUE_NAME', 'video-processing')

    conn = Redis.from_url(redis_url)
    conn.ping()

    logger.info(f"[WORKER] Connected to Redis at {redis_url}")
    logger.info(f"[WORKER] Listening on queue: {queue_name}")

    is_windows = platform.system() == 'Windows'
    if is_windows:
        logger.info("[WORKER] Running in Windows mode (manual job execution - no forking)")

    stop_event = threading.Event()
    heartbeat_key = _start_heartbeat(conn, queue_name, stop_event)
    
    # Main loop: pull jobs directly from Redis queue
    logger.info("[WORKER] Starting job listener loop...")
    
    try:
        while True:
            try:
                # Get queue key name from RQ naming convention
                queue_key = f"rq:queue:{queue_name}"

                # Blocking pop from queue (timeout 1 second)
                job_id = conn.blpop(queue_key, timeout=1)

                if job_id:
                    # job_id is a tuple: (queue_key, job_id_bytes)
                    job_id = job_id[1].decode('utf-8')
                    logger.info(f"[WORKER] Dequeued job: {job_id}")

                    # Fetch job from Redis
                    job = Job.fetch(job_id, connection=conn)

                    if is_windows:
                        # Windows: execute directly without fork
                        execute_job_windows(job)
                    else:
                        # Unix: use standard RQ execution (with fork)
                        from rq import Worker
                        worker = Worker([queue_name], connection=conn)
                        worker.work(with_scheduler=False, burst=True)
                        break  # One job done, restart worker
                else:
                    # No job available, keep listening
                    pass

            except KeyboardInterrupt:
                logger.info("[WORKER] Shutting down gracefully...")
                break
            except Exception as e:
                logger.error(f"[WORKER] Unexpected error: {str(e)}")
                logger.error(traceback.format_exc())
                time.sleep(2)  # Wait before retrying
    finally:
        stop_event.set()
        try:
            conn.delete(heartbeat_key)
        except Exception:
            pass


if __name__ == '__main__':
    main()
