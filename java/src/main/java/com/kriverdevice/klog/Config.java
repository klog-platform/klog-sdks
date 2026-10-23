package com.kriverdevice.klog;

import java.time.Duration;
import java.util.List;
import java.util.Objects;
import java.util.function.Consumer;

public final class Config {
  public final String baseUrl;
  public final String tenantId;
  public final String token;
  public final String applicationId;
  public final List<String> defaultTags;
  public final String defaultLevel;
  public final int maxRetries;
  public final Duration timeout;
  public final int maxQueueSize;
  public final Consumer<String> onDropped;
  public final Consumer<Entry> onOverflow;
  public final Consumer<Exception> onError;

  private Config(Builder b) {
    this.baseUrl = Objects.requireNonNull(b.baseUrl, "baseUrl");
    this.tenantId = Objects.requireNonNull(b.tenantId, "tenantId");
    this.token = Objects.requireNonNull(b.token, "token");
    this.applicationId = Objects.requireNonNull(b.applicationId, "applicationId");
    this.defaultTags = List.copyOf(b.defaultTags);
    this.defaultLevel = b.defaultLevel;
    this.maxRetries = b.maxRetries;
    this.timeout = b.timeout;
    this.maxQueueSize = b.maxQueueSize;
    this.onDropped = b.onDropped;
    this.onOverflow = b.onOverflow;
    this.onError = b.onError;
  }

  public static Builder builder() {
    return new Builder();
  }

  public static final class Builder {
    private String baseUrl = "";
    private String tenantId = "";
    private String token = "";
    private String applicationId = "";
    private List<String> defaultTags = List.of();
    private String defaultLevel = "info";
    private int maxRetries = 3;
    private Duration timeout = Duration.ofSeconds(10);
    private int maxQueueSize = 1000;
    private Consumer<String> onDropped;
    private Consumer<Entry> onOverflow;
    private Consumer<Exception> onError;

    public Builder baseUrl(String v) { this.baseUrl = v; return this; }
    public Builder tenantId(String v) { this.tenantId = v; return this; }
    public Builder token(String v) { this.token = v; return this; }
    public Builder applicationId(String v) { this.applicationId = v; return this; }
    public Builder defaultTags(List<String> v) { this.defaultTags = v == null ? List.of() : v; return this; }
    public Builder defaultLevel(String v) { this.defaultLevel = v; return this; }
    public Builder maxRetries(int v) { this.maxRetries = v; return this; }
    public Builder timeout(Duration v) { this.timeout = v; return this; }
    public Builder maxQueueSize(int v) { this.maxQueueSize = v; return this; }
    public Builder onDropped(Consumer<String> v) { this.onDropped = v; return this; }
    public Builder onOverflow(Consumer<Entry> v) { this.onOverflow = v; return this; }
    public Builder onError(Consumer<Exception> v) { this.onError = v; return this; }

    public Config build() {
      return new Config(this);
    }
  }
}
