<?php

declare(strict_types=1);

namespace Klog;

final class Entry
{
    /** @param list<string>|null $tags */
    public function __construct(
        public string $message,
        public ?string $level = null,
        public mixed $payload = null,
        public ?array $tags = null,
        public ?string $traceId = null,
        public ?string $applicationId = null,
    ) {
    }
}
