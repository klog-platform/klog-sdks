<?php

declare(strict_types=1);

namespace Klog;

final class Result
{
    /** @param array<string, mixed>|null $raw */
    public function __construct(
        public bool $created = false,
        public bool $dropped = false,
        public string $id = '',
        public ?array $raw = null,
    ) {
    }
}
