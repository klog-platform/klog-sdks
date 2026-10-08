CC ?= gcc
CFLAGS ?= -std=c11 -Wall -Wextra -I../../include -I../../src
SRC = test_klog.c klog_platform_host.c ../../src/klog.c

.PHONY: test lint build clean

test: test_klog
	./test_klog

test_klog: $(SRC)
	$(CC) $(CFLAGS) -o $@ $(SRC)

build: klog.o

klog.o: ../../src/klog.c
	$(CC) $(CFLAGS) -c -o $@ ../../src/klog.c

lint:
	$(CC) $(CFLAGS) -Werror -o test_klog.lint $(SRC)
	rm -f test_klog.lint

clean:
	rm -f test_klog test_klog.lint klog.o
