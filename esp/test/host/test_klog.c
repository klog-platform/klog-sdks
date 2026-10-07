#include "../../include/klog.h"

#include <assert.h>
#include <stdio.h>
#include <string.h>

extern int g_fake_status;
extern const char *g_fake_body;
extern int g_http_calls;
extern char g_last_body[2048];

static void reset(void) {
  g_fake_status = 201;
  g_fake_body = "{\"id\":\"evt-host-1\"}";
  g_http_calls = 0;
  g_last_body[0] = 0;
  klog_deinit();
}

static void test_info_ok(void) {
  reset();
  klog_config_t cfg = {
      .base_url = "http://localhost:3100",
      .tenant_id = "tenant",
      .token = "klog_test",
      .application_id = "app",
      .max_retries = 0,
      .timeout_ms = 1000,
  };
  assert(klog_init(&cfg) == KLOG_OK);
  klog_result_t res;
  assert(klog_log(KLOG_LEVEL_INFO, "hola", "{\"n\":1}", NULL, &res) == KLOG_OK);
  assert(res.created);
  assert(strcmp(res.id, "evt-host-1") == 0);
  assert(strstr(g_last_body, "\"message\":\"hola\"") != NULL);
  assert(strstr(g_last_body, "\"applicationId\":\"app\"") != NULL);
}

static void test_dropped(void) {
  reset();
  g_fake_status = 202;
  g_fake_body = "{\"dropped\":true,\"id\":\"evt-2\"}";
  klog_config_t cfg = {
      .base_url = "http://localhost:3100",
      .tenant_id = "tenant",
      .token = "klog_test",
      .application_id = "app",
      .max_retries = 0,
  };
  assert(klog_init(&cfg) == KLOG_OK);
  klog_result_t res;
  assert(klog_info("x", "{}") == KLOG_OK);
  assert(klog_log(KLOG_LEVEL_WARN, "filtrado", NULL, NULL, &res) == KLOG_OK);
  assert(res.dropped);
  assert(strcmp(res.id, "evt-2") == 0);
}

static void test_no_retry_401(void) {
  reset();
  g_fake_status = 401;
  g_fake_body = "{\"error\":\"unauthorized\"}";
  klog_config_t cfg = {
      .base_url = "http://localhost:3100",
      .tenant_id = "tenant",
      .token = "bad",
      .application_id = "app",
      .max_retries = 3,
  };
  assert(klog_init(&cfg) == KLOG_OK);
  assert(klog_error("x", NULL) == KLOG_ERR_HTTP);
  assert(g_http_calls == 1);
}

int main(void) {
  test_info_ok();
  test_dropped();
  test_no_retry_401();
  puts("ok");
  return 0;
}
