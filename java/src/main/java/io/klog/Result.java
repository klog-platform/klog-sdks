package io.klog;

public final class Result {
  public final boolean created;
  public final boolean dropped;
  public final String id;
  public final String raw;

  public Result(boolean created, boolean dropped, String id, String raw) {
    this.created = created;
    this.dropped = dropped;
    this.id = id == null ? "" : id;
    this.raw = raw;
  }
}
