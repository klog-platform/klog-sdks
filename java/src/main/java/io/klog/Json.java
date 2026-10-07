package io.klog;

import java.util.Collection;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

/** Codificador JSON mínimo para el cuerpo de ingesta (sin dependencias externas). */
final class Json {
  private Json() {}

  static String stringify(Object value) {
    StringBuilder sb = new StringBuilder();
    write(sb, value);
    return sb.toString();
  }

  @SuppressWarnings("unchecked")
  private static void write(StringBuilder sb, Object value) {
    if (value == null) {
      sb.append("null");
    } else if (value instanceof String s) {
      quote(sb, s);
    } else if (value instanceof Number || value instanceof Boolean) {
      sb.append(value);
    } else if (value instanceof Map<?, ?> map) {
      sb.append('{');
      boolean first = true;
      for (Map.Entry<?, ?> e : map.entrySet()) {
        if (!first) sb.append(',');
        first = false;
        quote(sb, String.valueOf(e.getKey()));
        sb.append(':');
        write(sb, e.getValue());
      }
      sb.append('}');
    } else if (value instanceof Collection<?> col) {
      sb.append('[');
      Iterator<?> it = col.iterator();
      boolean first = true;
      while (it.hasNext()) {
        if (!first) sb.append(',');
        first = false;
        write(sb, it.next());
      }
      sb.append(']');
    } else if (value.getClass().isArray()) {
      write(sb, List.of((Object[]) value));
    } else {
      quote(sb, String.valueOf(value));
    }
  }

  private static void quote(StringBuilder sb, String s) {
    sb.append('"');
    for (int i = 0; i < s.length(); i++) {
      char c = s.charAt(i);
      switch (c) {
        case '\\', '"' -> sb.append('\\').append(c);
        case '\b' -> sb.append("\\b");
        case '\f' -> sb.append("\\f");
        case '\n' -> sb.append("\\n");
        case '\r' -> sb.append("\\r");
        case '\t' -> sb.append("\\t");
        default -> {
          if (c < 0x20) sb.append(String.format("\\u%04x", (int) c));
          else sb.append(c);
        }
      }
    }
    sb.append('"');
  }

  static String extractId(String json) {
    if (json == null) return "";
    int idx = json.indexOf("\"id\"");
    if (idx < 0) return "";
    int colon = json.indexOf(':', idx + 4);
    if (colon < 0) return "";
    int q1 = json.indexOf('"', colon + 1);
    if (q1 < 0) return "";
    int q2 = json.indexOf('"', q1 + 1);
    if (q2 < 0) return "";
    return json.substring(q1 + 1, q2);
  }
}
