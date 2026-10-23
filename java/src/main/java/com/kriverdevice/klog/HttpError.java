package com.kriverdevice.klog;

public final class HttpError extends RuntimeException {
  public final int status;
  public final String body;
  public final boolean retryable;

  public HttpError(int status, String body, boolean retryable) {
    super("klog ingest http " + status + ": " + body);
    this.status = status;
    this.body = body;
    this.retryable = retryable;
  }
}
