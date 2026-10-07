<?php

declare(strict_types=1);

namespace Klog\Tests;

use Klog\Client;
use Klog\Config;
use Klog\HttpError;
use PHPUnit\Framework\TestCase;

final class ClientTest extends TestCase
{
    public function testInfoCreatesEvent(): void
    {
        $server = new MockIngestServer([
            ['status' => 201, 'body' => '{"id":"evt-1"}'],
        ]);
        $client = new Client(new Config(
            baseUrl: $server->baseUrl(),
            tenantId: 'tenant',
            token: 'klog_test',
            applicationId: 'app',
            maxRetries: 0,
        ));

        $result = $client->info('hola', ['n' => 1]);
        self::assertTrue($result->created);
        self::assertSame('evt-1', $result->id);
        self::assertSame('Bearer klog_test', $server->lastAuth());
        self::assertSame('hola', $server->lastBody()['message'] ?? null);
        self::assertSame('app', $server->lastBody()['applicationId'] ?? null);
        $server->stop();
    }

    public function testDroppedIsDistinct(): void
    {
        $dropped = [];
        $server = new MockIngestServer([
            ['status' => 202, 'body' => '{"dropped":true,"id":"evt-2"}'],
        ]);
        $client = new Client(new Config(
            baseUrl: $server->baseUrl(),
            tenantId: 'tenant',
            token: 'klog_test',
            applicationId: 'app',
            maxRetries: 0,
            onDropped: static function (string $id) use (&$dropped): void {
                $dropped[] = $id;
            },
        ));

        $result = $client->warn('filtrado');
        self::assertTrue($result->dropped);
        self::assertSame(['evt-2'], $dropped);
        $server->stop();
    }

    public function testDoesNotRetryUnauthorized(): void
    {
        $server = new MockIngestServer([
            ['status' => 401, 'body' => '{"error":"unauthorized"}'],
            ['status' => 201, 'body' => '{"id":"x"}'],
        ]);
        $client = new Client(new Config(
            baseUrl: $server->baseUrl(),
            tenantId: 'tenant',
            token: 'bad',
            applicationId: 'app',
            maxRetries: 3,
        ));

        try {
            $client->error('x');
            self::fail('expected HttpError');
        } catch (HttpError $e) {
            self::assertSame(401, $e->status);
            self::assertFalse($e->retryable);
        }
        self::assertSame(1, $server->calls());
        $server->stop();
    }
}
