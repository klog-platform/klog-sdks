CC ?= gcc
CFLAGS ?= -std=c11 -Wall -Wextra -I../../include -I../../src

.PHONY: test clean

test: test_klog
	./test_klog

test_klog: test_klog.c klog_platform_host.c ../../src/klog.c
	$(CC) $(CFLAGS) -o $@ test_klog.c klog_platform_host.c ../../src/klog.c

clean:
	rm -f test_klog
