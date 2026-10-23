package com.kriverdevice.klog;

import java.util.List;
import java.util.Map;

public final class Entry {
  public final String message;
  public final String level;
  public final Object payload;
  public final List<String> tags;
  public final String traceId;
  public final String applicationId;

  public Entry(String message, String level, Object payload, List<String> tags, String traceId, String applicationId) {
    this.message = message;
    this.level = level;
    this.payload = payload;
    this.tags = tags;
    this.traceId = traceId;
    this.applicationId = applicationId;
  }

  public static Entry of(String level, String message, Object payload) {
    return new Entry(message, level, payload == null ? Map.of() : payload, null, null, null);
  }
}
