<?php

declare(strict_types=1);

namespace Klog;

final class Client
{
    private string $url;
    private bool $closed = false;

    public function __construct(private Config $config)
    {
        $base = rtrim(trim($config->baseUrl), '/');
        if ($base === '' || $config->tenantId === '' || $config->token === '' || $config->applicationId === '') {
            throw new \InvalidArgumentException('faltan baseUrl, tenantId, token o applicationId');
        }
        if (!function_exists('curl_init')) {
            throw new \RuntimeException('se requiere la extensión curl de PHP');
        }
        $this->url = sprintf('%s/v1/ingest/%s/events', $base, $config->tenantId);
    }

    /** @param array<string, mixed> $env */
    public static function fromEnv(?array $env = null, array $overrides = []): self
    {
        $env ??= $_ENV + $_SERVER;
        $cfg = new Config(
            baseUrl: (string) ($overrides['baseUrl'] ?? $env['KLOG_URL'] ?? $env['KLOG_API_URL'] ?? ''),
            tenantId: (string) ($overrides['tenantId'] ?? $env['KLOG_TENANT_ID'] ?? ''),
            token: (string) ($overrides['token'] ?? $env['KLOG_TOKEN'] ?? ''),
            applicationId: (string) ($overrides['applicationId'] ?? $env['KLOG_APPLICATION_ID'] ?? ''),
            defaultTags: $overrides['defaultTags'] ?? [],
            defaultLevel: $overrides['defaultLevel'] ?? 'info',
            maxRetries: $overrides['maxRetries'] ?? 3,
            timeoutSeconds: $overrides['timeoutSeconds'] ?? 10.0,
            maxQueueSize: $overrides['maxQueueSize'] ?? 1000,
            onDropped: $overrides['onDropped'] ?? null,
            onOverflow: $overrides['onOverflow'] ?? null,
            onError: $overrides['onError'] ?? null,
        );

        return new self($cfg);
    }

    public function debug(string $message, mixed $payload = null, ?array $tags = null, ?string $traceId = null): Result
    {
        return $this->log(new Entry($message, 'debug', $payload, $tags, $traceId));
    }

    public function info(string $message, mixed $payload = null, ?array $tags = null, ?string $traceId = null): Result
    {
        return $this->log(new Entry($message, 'info', $payload, $tags, $traceId));
    }

    public function warn(string $message, mixed $payload = null, ?array $tags = null, ?string $traceId = null): Result
    {
        return $this->log(new Entry($message, 'warn', $payload, $tags, $traceId));
    }

    public function error(string $message, mixed $payload = null, ?array $tags = null, ?string $traceId = null): Result
    {
        return $this->log(new Entry($message, 'error', $payload, $tags, $traceId));
    }

    public function log(Entry $entry): Result
    {
        if ($this->closed) {
            throw new \RuntimeException('el cliente está cerrado');
        }
        $entry = $this->normalize($entry);

        $last = null;
        $attempts = $this->config->maxRetries + 1;
        for ($attempt = 1; $attempt <= $attempts; $attempt++) {
            try {
                $result = $this->sendOnce($entry);
                if ($result->dropped && $this->config->onDropped !== null) {
                    ($this->config->onDropped)($result->id);
                }

                return $result;
            } catch (HttpError $e) {
                $last = $e;
                if (!$e->retryable) {
                    break;
                }
            } catch (\Throwable $e) {
                $last = $e;
            }
            if ($attempt >= $attempts) {
                break;
            }
            $delayMs = (int) min(3200, 200 * (2 ** ($attempt - 1))) + random_int(0, 100);
            usleep($delayMs * 1000);
        }
        if ($this->config->onError !== null && $last instanceof \Throwable) {
            ($this->config->onError)($last);
        }
        throw $last instanceof \Throwable ? $last : new \RuntimeException('fallo de ingesta');
    }

    public function flush(): void
    {
        // Envío síncrono: no hay cola pendiente.
    }

    public function close(): void
    {
        $this->flush();
        $this->closed = true;
    }

    private function normalize(Entry $entry): Entry
    {
        if (trim($entry->message) === '') {
            $entry->message = '(empty)';
        }
        $entry->level ??= $this->config->defaultLevel;
        $entry->applicationId ??= $this->config->applicationId;
        if ($entry->tags === null && $this->config->defaultTags !== []) {
            $entry->tags = $this->config->defaultTags;
        }
        $entry->payload ??= new \stdClass();

        return $entry;
    }

    private function sendOnce(Entry $entry): Result
    {
        $body = [
            'message' => $entry->message,
            'level' => $entry->level,
            'applicationId' => $entry->applicationId,
            'payload' => $entry->payload,
        ];
        if ($entry->tags !== null) {
            $body['tags'] = $entry->tags;
        }
        if ($entry->traceId !== null && $entry->traceId !== '') {
            $body['traceId'] = $entry->traceId;
        }
        $json = json_encode($body, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);

        $ch = curl_init($this->url);
        if ($ch === false) {
            throw new \RuntimeException('no se pudo iniciar curl');
        }
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $json,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => (int) ceil($this->config->timeoutSeconds),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $this->config->token,
                'User-Agent: klog-sdk-php/0.1',
            ],
        ]);
        $raw = curl_exec($ch);
        $errno = curl_errno($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        unset($ch);

        if ($errno !== 0 || $raw === false) {
            throw new HttpError(0, 'network error', true);
        }
        $parsed = json_decode((string) $raw, true);
        if (!is_array($parsed)) {
            $parsed = [];
        }

        return match (true) {
            $status === 201 => new Result(created: true, id: (string) ($parsed['id'] ?? ''), raw: $parsed),
            $status === 202 => new Result(dropped: true, id: (string) ($parsed['id'] ?? ''), raw: $parsed),
            in_array($status, [429, 502, 503, 504], true) => throw new HttpError($status, (string) $raw, true),
            in_array($status, [400, 401, 403], true) => throw new HttpError($status, (string) $raw, false),
            default => throw new HttpError($status, (string) $raw, $status >= 500),
        };
    }
}
