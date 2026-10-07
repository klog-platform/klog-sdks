<?php

declare(strict_types=1);

namespace Klog;

final class Config
{
    /** @param list<string> $defaultTags */
    public function __construct(
        public string $baseUrl,
        public string $tenantId,
        public string $token,
        public string $applicationId,
        public array $defaultTags = [],
        public string $defaultLevel = 'info',
        public int $maxRetries = 3,
        public float $timeoutSeconds = 10.0,
        public int $maxQueueSize = 1000,
        public ?\Closure $onDropped = null,
        public ?\Closure $onOverflow = null,
        public ?\Closure $onError = null,
    ) {
    }
}
