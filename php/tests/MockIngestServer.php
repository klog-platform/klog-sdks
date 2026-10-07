<?php

declare(strict_types=1);

namespace Klog\Tests;

/**
 * Servidor HTTP mínimo en un proceso hijo para las pruebas del SDK.
 */
final class MockIngestServer
{
    /** @var resource|false */
    private $proc = false;

    private string $host;
    private int $port;
    private string $stateFile;
    private string $scriptFile;

    /** @param list<array{status:int,body:string}> $responses */
    public function __construct(private array $responses)
    {
        $this->host = '127.0.0.1';
        $this->port = random_int(19000, 29000);
        $this->stateFile = sys_get_temp_dir() . '/klog-php-mock-' . getmypid() . '-' . $this->port . '.json';
        $this->scriptFile = sys_get_temp_dir() . '/klog-php-mock-' . getmypid() . '-' . $this->port . '.php';
        file_put_contents($this->stateFile, json_encode([
            'responses' => $this->responses,
            'calls' => 0,
            'lastAuth' => null,
            'lastBody' => null,
        ], JSON_THROW_ON_ERROR));

        $state = var_export($this->stateFile, true);
        $script = <<<PHP
<?php
\$stateFile = {$state};
\$raw = file_get_contents('php://input');
\$state = json_decode(file_get_contents(\$stateFile), true);
\$state['calls'] = (\$state['calls'] ?? 0) + 1;
\$state['lastAuth'] = \$_SERVER['HTTP_AUTHORIZATION'] ?? null;
\$state['lastBody'] = json_decode(\$raw ?: '{}', true);
\$resp = array_shift(\$state['responses']) ?? ['status' => 201, 'body' => '{"id":"e"}'];
file_put_contents(\$stateFile, json_encode(\$state));
http_response_code((int) \$resp['status']);
header('Content-Type: application/json');
echo \$resp['body'];
PHP;
        file_put_contents($this->scriptFile, $script);

        $cmd = sprintf(
            'php -S %s:%d %s',
            escapeshellarg($this->host),
            $this->port,
            escapeshellarg($this->scriptFile),
        );
        // php -S no acepta escapeshellarg en host:port igual; construir limpio
        $cmd = sprintf('php -S %s:%d %s', $this->host, $this->port, escapeshellarg($this->scriptFile));
        $descriptors = [
            0 => ['pipe', 'r'],
            1 => ['file', sys_get_temp_dir() . '/klog-php-mock.out', 'a'],
            2 => ['file', sys_get_temp_dir() . '/klog-php-mock.err', 'a'],
        ];
        $this->proc = proc_open($cmd, $descriptors, $pipes);
        if (!is_resource($this->proc)) {
            throw new \RuntimeException('no se pudo arrancar el mock HTTP');
        }
        usleep(200_000);
    }

    public function baseUrl(): string
    {
        return sprintf('http://%s:%d', $this->host, $this->port);
    }

    public function calls(): int
    {
        return (int) ($this->state()['calls'] ?? 0);
    }

    public function lastAuth(): ?string
    {
        $auth = $this->state()['lastAuth'] ?? null;

        return is_string($auth) ? $auth : null;
    }

    /** @return array<string, mixed>|null */
    public function lastBody(): ?array
    {
        $body = $this->state()['lastBody'] ?? null;

        return is_array($body) ? $body : null;
    }

    public function stop(): void
    {
        if (is_resource($this->proc)) {
            proc_terminate($this->proc);
            proc_close($this->proc);
            $this->proc = false;
        }
        @unlink($this->stateFile);
        @unlink($this->scriptFile);
    }

    /** @return array<string, mixed> */
    private function state(): array
    {
        $raw = @file_get_contents($this->stateFile);
        if ($raw === false) {
            return [];
        }
        $decoded = json_decode($raw, true);

        return is_array($decoded) ? $decoded : [];
    }
}
