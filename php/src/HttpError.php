<?php

declare(strict_types=1);

namespace Klog;

final class HttpError extends \RuntimeException
{
    public function __construct(
        public readonly int $status,
        public readonly string $body,
        public readonly bool $retryable,
    ) {
        parent::__construct(sprintf('klog ingest http %d: %s', $status, $body));
    }
}
