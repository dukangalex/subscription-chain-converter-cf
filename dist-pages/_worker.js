// node_modules/js-yaml/dist/js-yaml.mjs
var NOT_RESOLVED = /* @__PURE__ */ Symbol("NOT_RESOLVED");
function defineScalarTag(tagName, options) {
  return {
    tagName,
    nodeKind: "scalar",
    implicit: options.implicit ?? false,
    matchByTagPrefix: options.matchByTagPrefix ?? false,
    implicitFirstChars: options.implicitFirstChars ?? null,
    resolve: options.resolve,
    identify: options.identify,
    represent: options.represent ?? ((data) => String(data)),
    representTagName: options.representTagName ?? (() => tagName)
  };
}
function defineSequenceTag(tagName, options) {
  const carrierIsResult = options.finalize === void 0;
  return {
    tagName,
    nodeKind: "sequence",
    implicit: false,
    matchByTagPrefix: options.matchByTagPrefix ?? false,
    create: options.create,
    addItem: options.addItem,
    finalize: options.finalize ?? ((carrier) => carrier),
    carrierIsResult,
    identify: options.identify,
    represent: options.represent ?? ((data) => data),
    representTagName: options.representTagName ?? (() => tagName)
  };
}
function defineMappingTag(tagName, options) {
  const carrierIsResult = options.finalize === void 0;
  return {
    tagName,
    nodeKind: "mapping",
    implicit: false,
    matchByTagPrefix: options.matchByTagPrefix ?? false,
    create: options.create,
    addPair: options.addPair,
    has: options.has,
    keys: options.keys,
    get: options.get,
    finalize: options.finalize ?? ((carrier) => carrier),
    carrierIsResult,
    identify: options.identify,
    represent: options.represent ?? ((data) => data),
    representTagName: options.representTagName ?? (() => tagName)
  };
}
var strTag = defineScalarTag("tag:yaml.org,2002:str", {
  resolve: (source) => source,
  identify: (data) => typeof data === "string"
});
var NULL_VALUES$1 = [
  "",
  "~",
  "null",
  "Null",
  "NULL"
];
var nullCoreTag = defineScalarTag("tag:yaml.org,2002:null", {
  implicit: true,
  implicitFirstChars: [
    "",
    "~",
    "n",
    "N"
  ],
  resolve: (source) => {
    if (NULL_VALUES$1.indexOf(source) !== -1) return null;
    return NOT_RESOLVED;
  },
  identify: (object) => object === null,
  represent: () => "null"
});
var nullJsonTag = defineScalarTag("tag:yaml.org,2002:null", {
  implicit: true,
  implicitFirstChars: ["n"],
  resolve: (source, isExplicit) => {
    if (source === "null" || isExplicit && source === "") return null;
    return NOT_RESOLVED;
  },
  identify: (object) => object === null,
  represent: () => "null"
});
var NULL_VALUES = [
  "",
  "~",
  "null",
  "Null",
  "NULL"
];
var nullYaml11Tag = defineScalarTag("tag:yaml.org,2002:null", {
  implicit: true,
  implicitFirstChars: [
    "",
    "~",
    "n",
    "N"
  ],
  resolve: (source) => {
    if (NULL_VALUES.indexOf(source) !== -1) return null;
    return NOT_RESOLVED;
  },
  identify: (object) => object === null,
  represent: () => "null"
});
var TRUE_VALUES$2 = [
  "true",
  "True",
  "TRUE"
];
var FALSE_VALUES$2 = [
  "false",
  "False",
  "FALSE"
];
var boolCoreTag = defineScalarTag("tag:yaml.org,2002:bool", {
  implicit: true,
  implicitFirstChars: [
    "t",
    "T",
    "f",
    "F"
  ],
  resolve: (source) => {
    if (TRUE_VALUES$2.indexOf(source) !== -1) return true;
    if (FALSE_VALUES$2.indexOf(source) !== -1) return false;
    return NOT_RESOLVED;
  },
  identify: (object) => Object.prototype.toString.call(object) === "[object Boolean]",
  represent: (object) => object ? "true" : "false"
});
var TRUE_VALUES$1 = ["true"];
var FALSE_VALUES$1 = ["false"];
var boolJsonTag = defineScalarTag("tag:yaml.org,2002:bool", {
  implicit: true,
  implicitFirstChars: ["t", "f"],
  resolve: (source) => {
    if (TRUE_VALUES$1.indexOf(source) !== -1) return true;
    if (FALSE_VALUES$1.indexOf(source) !== -1) return false;
    return NOT_RESOLVED;
  },
  identify: (object) => Object.prototype.toString.call(object) === "[object Boolean]",
  represent: (object) => object ? "true" : "false"
});
var TRUE_VALUES = [
  "true",
  "True",
  "TRUE",
  "y",
  "Y",
  "yes",
  "Yes",
  "YES",
  "on",
  "On",
  "ON"
];
var FALSE_VALUES = [
  "false",
  "False",
  "FALSE",
  "n",
  "N",
  "no",
  "No",
  "NO",
  "off",
  "Off",
  "OFF"
];
var boolYaml11Tag = defineScalarTag("tag:yaml.org,2002:bool", {
  implicit: true,
  implicitFirstChars: [
    "y",
    "Y",
    "n",
    "N",
    "t",
    "T",
    "f",
    "F",
    "o",
    "O"
  ],
  resolve: (source) => {
    if (TRUE_VALUES.indexOf(source) !== -1) return true;
    if (FALSE_VALUES.indexOf(source) !== -1) return false;
    return NOT_RESOLVED;
  },
  identify: (object) => Object.prototype.toString.call(object) === "[object Boolean]",
  represent: (object) => object ? "true" : "false"
});
var YAML_INTEGER_IMPLICIT_PATTERN$1 = /* @__PURE__ */ new RegExp("^(?:0o[0-7]+|0x[0-9a-fA-F]+|[-+]?[0-9]+)$");
var YAML_INTEGER_EXPLICIT_PATTERN$1 = /* @__PURE__ */ new RegExp("^(?:[-+]?0b[0-1]+|[-+]?0o[0-7]+|[-+]?0x[0-9a-fA-F]+|[-+]?[0-9]+)$");
function parseYamlInteger$2(source) {
  let value = source;
  let sign = 1;
  if (value[0] === "-" || value[0] === "+") {
    if (value[0] === "-") sign = -1;
    value = value.slice(1);
  }
  if (value.startsWith("0b")) return sign * parseInt(value.slice(2), 2);
  if (value.startsWith("0o")) return sign * parseInt(value.slice(2), 8);
  if (value.startsWith("0x")) return sign * parseInt(value.slice(2), 16);
  return sign * parseInt(value, 10);
}
function resolveYamlInteger$2(source, isExplicit) {
  if (isExplicit) {
    if (!YAML_INTEGER_EXPLICIT_PATTERN$1.test(source)) return NOT_RESOLVED;
  } else if (!YAML_INTEGER_IMPLICIT_PATTERN$1.test(source)) return NOT_RESOLVED;
  const result = parseYamlInteger$2(source);
  return Number.isFinite(result) ? result : NOT_RESOLVED;
}
var intCoreTag = defineScalarTag("tag:yaml.org,2002:int", {
  implicit: true,
  implicitFirstChars: [
    "-",
    "+",
    ..."0123456789"
  ],
  resolve: resolveYamlInteger$2,
  identify: (object) => Number.isInteger(object) && !Object.is(object, -0) && object.toString(10).indexOf("e") < 0,
  represent: (object) => object.toString(10)
});
var YAML_INTEGER_IMPLICIT_PATTERN = /* @__PURE__ */ new RegExp("^-?(?:0|[1-9][0-9]*)$");
var YAML_INTEGER_EXPLICIT_PATTERN = /* @__PURE__ */ new RegExp("^(?:[-+]?0b[0-1]+|[-+]?0o[0-7]+|[-+]?0x[0-9a-fA-F]+|[-+]?[0-9]+)$");
function parseYamlInteger$1(source) {
  let value = source;
  let sign = 1;
  if (value[0] === "-" || value[0] === "+") {
    if (value[0] === "-") sign = -1;
    value = value.slice(1);
  }
  if (value.startsWith("0b")) return sign * parseInt(value.slice(2), 2);
  if (value.startsWith("0o")) return sign * parseInt(value.slice(2), 8);
  if (value.startsWith("0x")) return sign * parseInt(value.slice(2), 16);
  return sign * parseInt(value, 10);
}
function resolveYamlInteger$1(source, isExplicit) {
  if (isExplicit) {
    if (!YAML_INTEGER_EXPLICIT_PATTERN.test(source)) return NOT_RESOLVED;
  } else if (!YAML_INTEGER_IMPLICIT_PATTERN.test(source)) return NOT_RESOLVED;
  const result = parseYamlInteger$1(source);
  return Number.isFinite(result) ? result : NOT_RESOLVED;
}
var intJsonTag = defineScalarTag("tag:yaml.org,2002:int", {
  implicit: true,
  implicitFirstChars: ["-", ..."0123456789"],
  resolve: resolveYamlInteger$1,
  identify: (object) => Number.isInteger(object) && !Object.is(object, -0) && object.toString(10).indexOf("e") < 0,
  represent: (object) => object.toString(10)
});
var YAML_INTEGER_PATTERN = /* @__PURE__ */ new RegExp("^(?:[-+]?0b[0-1_]+|[-+]?0[0-7_]+|[-+]?0x[0-9a-fA-F_]+|[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+|[-+]?(?:0|[1-9][0-9_]*))$");
function parseYamlInteger(source) {
  let value = source.replace(/_/g, "");
  let sign = 1;
  if (value[0] === "-" || value[0] === "+") {
    if (value[0] === "-") sign = -1;
    value = value.slice(1);
  }
  if (value.startsWith("0b")) return sign * parseInt(value.slice(2), 2);
  if (value.startsWith("0x")) return sign * parseInt(value.slice(2), 16);
  if (value.includes(":")) {
    let result = 0;
    for (const part of value.split(":")) result = result * 60 + Number(part);
    return sign * result;
  }
  if (value !== "0" && value[0] === "0") return sign * parseInt(value, 8);
  return sign * parseInt(value, 10);
}
function resolveYamlInteger(source) {
  if (!YAML_INTEGER_PATTERN.test(source)) return NOT_RESOLVED;
  const result = parseYamlInteger(source);
  return Number.isFinite(result) ? result : NOT_RESOLVED;
}
var intYaml11Tag = defineScalarTag("tag:yaml.org,2002:int", {
  implicit: true,
  implicitFirstChars: [
    "-",
    "+",
    ..."0123456789"
  ],
  resolve: resolveYamlInteger,
  identify: (object) => Number.isInteger(object) && !Object.is(object, -0) && object.toString(10).indexOf("e") < 0,
  represent: (object) => object.toString(10)
});
var YAML_FLOAT_PATTERN$1 = /* @__PURE__ */ new RegExp("^(?:[-+]?[0-9]+(?:\\.[0-9]*)?(?:[eE][-+]?[0-9]+)?|[-+]?\\.[0-9]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");
var YAML_FLOAT_SPECIAL_PATTERN$1 = /* @__PURE__ */ new RegExp("^(?:[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");
function resolveYamlFloat$2(source) {
  if (!YAML_FLOAT_PATTERN$1.test(source)) return NOT_RESOLVED;
  let value = source.toLowerCase();
  const sign = value[0] === "-" ? -1 : 1;
  if ("+-".includes(value[0])) value = value.slice(1);
  if (value === ".inf") return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
  if (value === ".nan") return NaN;
  const result = sign * parseFloat(value);
  if (Number.isFinite(result) || YAML_FLOAT_SPECIAL_PATTERN$1.test(source)) return result;
  return NOT_RESOLVED;
}
function representYamlFloat$2(object) {
  if (isNaN(object)) return ".nan";
  if (object === Number.POSITIVE_INFINITY) return ".inf";
  if (object === Number.NEGATIVE_INFINITY) return "-.inf";
  if (Object.is(object, -0)) return "-0.0";
  const result = object.toString(10);
  return /^[-+]?[0-9]+e/.test(result) ? result.replace("e", ".e") : result;
}
var floatCoreTag = defineScalarTag("tag:yaml.org,2002:float", {
  implicit: true,
  implicitFirstChars: [
    "-",
    "+",
    ".",
    ..."0123456789"
  ],
  resolve: resolveYamlFloat$2,
  identify: (object) => typeof object === "number" && (!Number.isInteger(object) || Object.is(object, -0) || object.toString(10).indexOf("e") >= 0),
  represent: representYamlFloat$2
});
var YAML_FLOAT_IMPLICIT_PATTERN = /* @__PURE__ */ new RegExp("^-?(?:0|[1-9][0-9]*)(?:\\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$");
var YAML_FLOAT_EXPLICIT_PATTERN = /* @__PURE__ */ new RegExp("^(?:[-+]?[0-9]+(?:\\.[0-9]*)?(?:[eE][-+]?[0-9]+)?|[-+]?\\.[0-9]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");
function resolveYamlFloat$1(source, isExplicit) {
  if (isExplicit) {
    if (!YAML_FLOAT_EXPLICIT_PATTERN.test(source)) return NOT_RESOLVED;
    let value = source.toLowerCase();
    const sign = value[0] === "-" ? -1 : 1;
    if ("+-".includes(value[0])) value = value.slice(1);
    if (value === ".inf") return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
    if (value === ".nan") return NaN;
    const result2 = sign * parseFloat(value);
    return Number.isFinite(result2) ? result2 : NOT_RESOLVED;
  }
  if (!YAML_FLOAT_IMPLICIT_PATTERN.test(source)) return NOT_RESOLVED;
  const result = Number(source);
  if (Number.isFinite(result)) return result;
  return NOT_RESOLVED;
}
function representYamlFloat$1(object) {
  if (isNaN(object)) return ".nan";
  if (object === Number.POSITIVE_INFINITY) return ".inf";
  if (object === Number.NEGATIVE_INFINITY) return "-.inf";
  if (Object.is(object, -0)) return "-0.0";
  const result = object.toString(10);
  return /^[-+]?[0-9]+e/.test(result) ? result.replace("e", ".e") : result;
}
var floatJsonTag = defineScalarTag("tag:yaml.org,2002:float", {
  implicit: true,
  implicitFirstChars: ["-", ..."0123456789"],
  resolve: resolveYamlFloat$1,
  identify: (object) => typeof object === "number" && (!Number.isInteger(object) || Object.is(object, -0) || object.toString(10).indexOf("e") >= 0),
  represent: representYamlFloat$1
});
var YAML_FLOAT_PATTERN = /* @__PURE__ */ new RegExp("^(?:[-+]?(?:(?:[0-9][0-9_]*)?\\.[0-9_]*)(?:[eE][-+][0-9]+)?|[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\\.[0-9_]*|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");
var YAML_FLOAT_SPECIAL_PATTERN = /* @__PURE__ */ new RegExp("^(?:[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");
function resolveYamlFloat(source) {
  if (!YAML_FLOAT_PATTERN.test(source)) return NOT_RESOLVED;
  let value = source.toLowerCase().replace(/_/g, "");
  const sign = value[0] === "-" ? -1 : 1;
  if ("+-".includes(value[0])) value = value.slice(1);
  if (value === ".inf") return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
  if (value === ".nan") return NaN;
  let result = 0;
  if (value.includes(":")) {
    for (const part of value.split(":")) result = result * 60 + Number(part);
    result *= sign;
  } else result = sign * parseFloat(value);
  if (Number.isFinite(result) || YAML_FLOAT_SPECIAL_PATTERN.test(source)) return result;
  return NOT_RESOLVED;
}
function representYamlFloat(object) {
  if (isNaN(object)) return ".nan";
  if (object === Number.POSITIVE_INFINITY) return ".inf";
  if (object === Number.NEGATIVE_INFINITY) return "-.inf";
  if (Object.is(object, -0)) return "-0.0";
  const result = object.toString(10);
  return /^[-+]?[0-9]+e/.test(result) ? result.replace("e", ".e") : result;
}
var floatYaml11Tag = defineScalarTag("tag:yaml.org,2002:float", {
  implicit: true,
  implicitFirstChars: [
    "-",
    "+",
    ".",
    ..."0123456789"
  ],
  resolve: resolveYamlFloat,
  identify: (object) => typeof object === "number" && (!Number.isInteger(object) || Object.is(object, -0) || object.toString(10).indexOf("e") >= 0),
  represent: representYamlFloat
});
var mergeTag = defineScalarTag("tag:yaml.org,2002:merge", {
  implicit: true,
  implicitFirstChars: ["<"],
  resolve: (source, isExplicit) => {
    if (source === "<<" || isExplicit && source === "") return "<<";
    return NOT_RESOLVED;
  },
  identify: () => false
});
var BASE64_PATTERN = /^[A-Za-z0-9+/]*={0,2}$/;
function resolveYamlBinary(source) {
  const input = source.replace(/\s/g, "");
  if (input.length % 4 !== 0 || !BASE64_PATTERN.test(input)) return NOT_RESOLVED;
  const binary = atob(input);
  const result = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) result[index] = binary.charCodeAt(index);
  return result;
}
function representYamlBinary(object) {
  let binary = "";
  for (let index = 0; index < object.length; index++) binary += String.fromCharCode(object[index]);
  return btoa(binary);
}
var binaryTag = defineScalarTag("tag:yaml.org,2002:binary", {
  resolve: resolveYamlBinary,
  identify: (object) => Object.prototype.toString.call(object) === "[object Uint8Array]",
  represent: representYamlBinary
});
var YAML_DATE_REGEXP = /* @__PURE__ */ new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$");
var YAML_TIMESTAMP_REGEXP = /* @__PURE__ */ new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$");
function makeUtcDate(year, month, day, hour = 0, minute = 0, second = 0, fraction = 0) {
  const date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));
  date.setUTCFullYear(year, month, day);
  return date;
}
function resolveYamlTimestamp(source) {
  let match = YAML_DATE_REGEXP.exec(source);
  if (match === null) match = YAML_TIMESTAMP_REGEXP.exec(source);
  if (match === null) return NOT_RESOLVED;
  const year = +match[1];
  const month = +match[2] - 1;
  const day = +match[3];
  if (!match[4]) {
    const date2 = makeUtcDate(year, month, day);
    if (date2.getUTCFullYear() !== year || date2.getUTCMonth() !== month || date2.getUTCDate() !== day) return NOT_RESOLVED;
    return date2;
  }
  const hour = +match[4];
  const minute = +match[5];
  const second = +match[6];
  let fraction = 0;
  if (hour > 23 || minute > 59 || second > 59) return NOT_RESOLVED;
  if (match[7]) {
    let value = match[7].slice(0, 3);
    while (value.length < 3) value += "0";
    fraction = +value;
  }
  const date = makeUtcDate(year, month, day, hour, minute, second, fraction);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month || date.getUTCDate() !== day) return NOT_RESOLVED;
  if (match[9]) {
    const offsetHour = +match[10];
    const offsetMinute = +(match[11] || 0);
    if (offsetHour > 23 || offsetMinute > 59) return NOT_RESOLVED;
    const offset = (offsetHour * 60 + offsetMinute) * 6e4;
    date.setTime(date.getTime() - (match[9] === "-" ? -offset : offset));
  }
  return date;
}
var timestampTag = defineScalarTag("tag:yaml.org,2002:timestamp", {
  implicit: true,
  implicitFirstChars: [..."0123456789"],
  resolve: resolveYamlTimestamp,
  identify: (object) => object instanceof Date,
  represent: (object) => object.toISOString()
});
var seqTag = defineSequenceTag("tag:yaml.org,2002:seq", {
  create: () => [],
  addItem: (container, item) => {
    container.push(item);
  },
  identify: Array.isArray
});
function isPlainObject(data) {
  if (data === null || typeof data !== "object" || Array.isArray(data)) return false;
  const prototype = Object.getPrototypeOf(data);
  return prototype === null || prototype === Object.prototype;
}
function pick(object, keys) {
  const result = {};
  for (const key of keys) if (object[key] !== void 0) result[key] = object[key];
  return result;
}
var omapTag = defineSequenceTag("tag:yaml.org,2002:omap", {
  create: () => ({
    list: [],
    seen: /* @__PURE__ */ new Set()
  }),
  addItem: (carrier, item) => {
    let key;
    if (item instanceof Map) {
      if (item.size !== 1) return "cannot resolve an ordered map item";
      key = item.keys().next().value;
    } else if (isPlainObject(item)) {
      const itemKeys = Object.keys(item);
      if (itemKeys.length !== 1) return "cannot resolve an ordered map item";
      key = itemKeys[0];
    } else return "cannot resolve an ordered map item";
    if (carrier.seen.has(key)) return "duplicate key in ordered map";
    carrier.seen.add(key);
    carrier.list.push(item);
    return "";
  },
  finalize: (carrier) => carrier.list,
  identify: () => false
});
var pairsTag = defineSequenceTag("tag:yaml.org,2002:pairs", {
  create: () => [],
  addItem: (container, item) => {
    if (item instanceof Map) {
      if (item.size !== 1) return "cannot resolve a pairs item";
      container.push(item.entries().next().value);
      return "";
    }
    if (Object.prototype.toString.call(item) !== "[object Object]") return "cannot resolve a pairs item";
    const object = item;
    const keys = Object.keys(object);
    if (keys.length !== 1) return "cannot resolve a pairs item";
    container.push([keys[0], object[keys[0]]]);
    return "";
  },
  identify: () => false
});
var mapTag = defineMappingTag("tag:yaml.org,2002:map", {
  create: () => ({}),
  identify: isPlainObject,
  represent: (o) => {
    const map = /* @__PURE__ */ new Map();
    for (const key of Object.keys(o)) map.set(key, o[key]);
    return map;
  },
  addPair: (container, key, value) => {
    if (key !== null && typeof key === "object") return "object-based map does not support complex keys";
    const normalizedKey = String(key);
    if (normalizedKey === "__proto__") Object.defineProperty(container, normalizedKey, {
      value,
      enumerable: true,
      configurable: true,
      writable: true
    });
    else container[normalizedKey] = value;
    return "";
  },
  has: (container, key) => {
    if (key !== null && typeof key === "object") return false;
    return Object.prototype.hasOwnProperty.call(container, String(key));
  },
  keys: (container) => Object.keys(container),
  get: (container, key) => {
    const normalizedKey = String(key);
    if (!Object.prototype.hasOwnProperty.call(container, normalizedKey)) return null;
    return container[normalizedKey];
  }
});
var setTag = defineMappingTag("tag:yaml.org,2002:set", {
  create: () => /* @__PURE__ */ new Set(),
  identify: (data) => data instanceof Set,
  represent: (data) => {
    const map = /* @__PURE__ */ new Map();
    for (const key of data) map.set(key, null);
    return map;
  },
  addPair: (container, key, value) => {
    if (value !== null) return "cannot resolve a set item";
    container.add(key);
    return "";
  },
  has: (container, key) => container.has(key),
  keys: (container) => container.keys(),
  get: () => null
});
function createTagDefinitionMap() {
  return {
    scalar: /* @__PURE__ */ Object.create(null),
    sequence: /* @__PURE__ */ Object.create(null),
    mapping: /* @__PURE__ */ Object.create(null)
  };
}
function createTagDefinitionListMap() {
  return {
    scalar: [],
    sequence: [],
    mapping: []
  };
}
function compileTags(tags) {
  const result = [];
  for (const tag of tags) {
    let index = result.length;
    for (let previousIndex = 0; previousIndex < result.length; previousIndex++) {
      const previous = result[previousIndex];
      if (previous.nodeKind === tag.nodeKind && previous.tagName === tag.tagName && previous.matchByTagPrefix === tag.matchByTagPrefix) {
        index = previousIndex;
        break;
      }
    }
    result[index] = tag;
  }
  return result;
}
var Schema = class Schema2 {
  tags;
  /** @internal */
  implicitScalarTags;
  /**
  * Dispatch implicit scalar resolvers by `source.charAt(0)`. Each bucket holds
  * the resolvers that may match that key, in schema order; a key absent from
  * the map uses
  * {@link Schema.implicitScalarAnyFirstChar}
  * (resolvers that declared no first-char constraint, so they apply to any
  * first character).
  */
  implicitScalarByFirstChar;
  implicitScalarAnyFirstChar;
  /**
  * The default scalar tag (`!!str`), resolved once so the composer's fallback
  * for unresolved plain scalars avoids a keyed lookup per scalar.
  *
  * @internal
  */
  defaultScalarTag;
  /**
  * The default container tags (`!!seq` / `!!map`), used by the dumper: when a
  * value is identified by its default tag, the tag is implicit and not
  * printed. Undefined if the schema does not define them (then such values
  * can't be dumped).
  *
  * @internal
  */
  defaultSequenceTag;
  /** @internal */
  defaultMappingTag;
  exact;
  prefix;
  constructor(tags) {
    const compiledTags = compileTags(tags);
    const implicitScalarTags = [];
    const exact = createTagDefinitionMap();
    const prefix = createTagDefinitionListMap();
    for (const tag of compiledTags) {
      if (tag.nodeKind === "scalar" && tag.implicit) {
        if (tag.matchByTagPrefix) throw new Error("Implicit scalar tags cannot match by tag prefix");
        implicitScalarTags.push(tag);
      }
      switch (tag.nodeKind) {
        case "scalar":
          if (tag.matchByTagPrefix) prefix.scalar.push(tag);
          else exact.scalar[tag.tagName] = tag;
          break;
        case "sequence":
          if (tag.matchByTagPrefix) prefix.sequence.push(tag);
          else exact.sequence[tag.tagName] = tag;
          break;
        case "mapping":
          if (tag.matchByTagPrefix) prefix.mapping.push(tag);
          else exact.mapping[tag.tagName] = tag;
      }
    }
    const implicitScalarAnyFirstChar = implicitScalarTags.filter((tag) => tag.implicitFirstChars === null);
    const keys = /* @__PURE__ */ new Set();
    for (const tag of implicitScalarTags) if (tag.implicitFirstChars !== null) for (const key of tag.implicitFirstChars) keys.add(key);
    const implicitScalarByFirstChar = /* @__PURE__ */ new Map();
    for (const key of keys) implicitScalarByFirstChar.set(key, implicitScalarTags.filter((tag) => tag.implicitFirstChars === null || tag.implicitFirstChars.indexOf(key) !== -1));
    const defaultScalarTag = exact.scalar["tag:yaml.org,2002:str"];
    if (!defaultScalarTag) throw new Error("schema does not define the default scalar tag (tag:yaml.org,2002:str)");
    this.tags = compiledTags;
    this.implicitScalarTags = implicitScalarTags;
    this.implicitScalarByFirstChar = implicitScalarByFirstChar;
    this.implicitScalarAnyFirstChar = implicitScalarAnyFirstChar;
    this.defaultScalarTag = defaultScalarTag;
    this.defaultSequenceTag = exact.sequence["tag:yaml.org,2002:seq"];
    this.defaultMappingTag = exact.mapping["tag:yaml.org,2002:map"];
    this.exact = exact;
    this.prefix = prefix;
  }
  /** @internal */
  lookupScalarTag(tagName) {
    const exactTag = this.exact.scalar[tagName];
    if (exactTag) return exactTag;
    for (const tag of this.prefix.scalar) if (tagName.startsWith(tag.tagName)) return tag;
  }
  /** @internal */
  lookupSequenceTag(tagName) {
    const exactTag = this.exact.sequence[tagName];
    if (exactTag) return exactTag;
    for (const tag of this.prefix.sequence) if (tagName.startsWith(tag.tagName)) return tag;
  }
  /** @internal */
  lookupMappingTag(tagName) {
    const exactTag = this.exact.mapping[tagName];
    if (exactTag) return exactTag;
    for (const tag of this.prefix.mapping) if (tagName.startsWith(tag.tagName)) return tag;
  }
  /** @internal */
  resolveImplicitScalarTag(source) {
    const candidates = this.implicitScalarByFirstChar.get(source.charAt(0)) ?? this.implicitScalarAnyFirstChar;
    for (const tag2 of candidates) {
      const value = tag2.resolve(source, false, tag2.tagName);
      if (value !== NOT_RESOLVED) return {
        value,
        tag: tag2
      };
    }
    const tag = this.defaultScalarTag;
    return {
      value: tag.resolve(source, false, tag.tagName),
      tag
    };
  }
  /**
  * Creates a new schema with the specified tags added. If a tag already
  * exists, it is replaced by the specified tag.
  *
  * @example
  *
  * ```javascript
  * import { CORE_SCHEMA, mergeTag, realMapTag } from 'js-yaml'
  *
  * const schema = CORE_SCHEMA.withTags(mergeTag, realMapTag)
  * ```
  */
  withTags(...tags) {
    let flatTags = [];
    for (const tag of tags) flatTags = flatTags.concat(tag);
    return new Schema2([...this.tags, ...flatTags]);
  }
};
var FAILSAFE_SCHEMA = new Schema([
  strTag,
  seqTag,
  mapTag
]);
var JSON_SCHEMA = new Schema([
  ...FAILSAFE_SCHEMA.tags,
  nullJsonTag,
  boolJsonTag,
  intJsonTag,
  floatJsonTag
]);
var CORE_SCHEMA = new Schema([
  ...FAILSAFE_SCHEMA.tags,
  nullCoreTag,
  boolCoreTag,
  intCoreTag,
  floatCoreTag
]);
var YAML11_SCHEMA = new Schema([
  ...FAILSAFE_SCHEMA.tags,
  nullYaml11Tag,
  boolYaml11Tag,
  intYaml11Tag,
  floatYaml11Tag,
  timestampTag,
  mergeTag,
  binaryTag,
  omapTag,
  pairsTag,
  setTag
]);
var DUMP_SCHEMA = YAML11_SCHEMA.withTags({
  ...intYaml11Tag,
  resolve: (source, isExplicit, tagName) => {
    const result = intYaml11Tag.resolve(source, isExplicit, tagName);
    return result === NOT_RESOLVED ? intCoreTag.resolve(source, isExplicit, tagName) : result;
  }
}, {
  ...floatYaml11Tag,
  resolve: (source, isExplicit, tagName) => {
    const result = floatYaml11Tag.resolve(source, isExplicit, tagName);
    return result === NOT_RESOLVED ? floatCoreTag.resolve(source, isExplicit, tagName) : result;
  }
});
var realMapTag = defineMappingTag("tag:yaml.org,2002:map", {
  create: () => /* @__PURE__ */ new Map(),
  addPair: (container, key, value) => {
    container.set(key, value);
    return "";
  },
  has: (container, key) => container.has(key),
  keys: (container) => container.keys(),
  get: (container, key) => container.get(key),
  identify: (data) => data instanceof Map || isPlainObject(data),
  represent: (data) => {
    if (data instanceof Map) return data;
    const map = /* @__PURE__ */ new Map();
    const obj = data;
    for (const key of Object.keys(obj)) map.set(key, obj[key]);
    return map;
  }
});
function normalizeKey(key) {
  if (Array.isArray(key)) {
    const array = Array.prototype.slice.call(key);
    for (let index = 0; index < array.length; index++) {
      if (Array.isArray(array[index])) return null;
      if (typeof array[index] === "object" && Object.prototype.toString.call(array[index]) === "[object Object]") array[index] = "[object Object]";
    }
    return String(array);
  }
  if (typeof key === "object" && Object.prototype.toString.call(key) === "[object Object]") return "[object Object]";
  return String(key);
}
var legacyMapTag = defineMappingTag("tag:yaml.org,2002:map", {
  create: () => ({}),
  identify: isPlainObject,
  represent: (o) => {
    const map = /* @__PURE__ */ new Map();
    for (const key of Object.keys(o)) map.set(key, o[key]);
    return map;
  },
  addPair: (container, key, value) => {
    const normalizedKey = normalizeKey(key);
    if (normalizedKey === null) return "nested arrays are not supported inside keys";
    if (normalizedKey === "__proto__") Object.defineProperty(container, normalizedKey, {
      value,
      enumerable: true,
      configurable: true,
      writable: true
    });
    else container[normalizedKey] = value;
    return "";
  },
  has: (container, key) => {
    const normalizedKey = normalizeKey(key);
    return normalizedKey !== null && Object.prototype.hasOwnProperty.call(container, normalizedKey);
  },
  keys: (container) => Object.keys(container),
  get: (container, key) => {
    const normalizedKey = String(key);
    if (!Object.prototype.hasOwnProperty.call(container, normalizedKey)) return null;
    return container[normalizedKey];
  }
});
var DEFAULT_SNIPPET_OPTIONS = {
  maxLength: 79,
  indent: 1,
  linesBefore: 3,
  linesAfter: 2
};
function getLine(buffer, lineStart, lineEnd, position, maxLineLength) {
  let head = "";
  let tail = "";
  const maxHalfLength = Math.floor(maxLineLength / 2) - 1;
  if (position - lineStart > maxHalfLength) {
    head = " ... ";
    lineStart = position - maxHalfLength + head.length;
  }
  if (lineEnd - position > maxHalfLength) {
    tail = " ...";
    lineEnd = position + maxHalfLength - tail.length;
  }
  return {
    str: head + buffer.slice(lineStart, lineEnd).replace(/\t/g, "\u2192") + tail,
    pos: position - lineStart + head.length
  };
}
function padStart(string, max) {
  return " ".repeat(Math.max(max - string.length, 0)) + string;
}
function makeSnippet(mark, options) {
  if (!mark.buffer) return null;
  const opts = {
    ...DEFAULT_SNIPPET_OPTIONS,
    ...options
  };
  const re = /\r?\n|\r|\0/g;
  const lineStarts = [0];
  const lineEnds = [];
  let match;
  let foundLineNo = -1;
  while (match = re.exec(mark.buffer)) {
    lineEnds.push(match.index);
    lineStarts.push(match.index + match[0].length);
    if (mark.position <= match.index && foundLineNo < 0) foundLineNo = lineStarts.length - 2;
  }
  if (foundLineNo < 0) foundLineNo = lineStarts.length - 1;
  let result = "";
  const lineNoLength = Math.min(mark.line + opts.linesAfter, lineEnds.length).toString().length;
  const maxLineLength = opts.maxLength - (opts.indent + lineNoLength + 3);
  for (let i = 1; i <= opts.linesBefore; i++) {
    if (foundLineNo - i < 0) break;
    const line2 = getLine(mark.buffer, lineStarts[foundLineNo - i], lineEnds[foundLineNo - i], mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo - i]), maxLineLength);
    result = `${" ".repeat(opts.indent)}${padStart((mark.line - i + 1).toString(), lineNoLength)} | ${line2.str}
${result}`;
  }
  const line = getLine(mark.buffer, lineStarts[foundLineNo], lineEnds[foundLineNo], mark.position, maxLineLength);
  result += `${" ".repeat(opts.indent)}${padStart((mark.line + 1).toString(), lineNoLength)} | ${line.str}
`;
  result += `${"-".repeat(opts.indent + lineNoLength + 3 + line.pos)}^
`;
  for (let i = 1; i <= opts.linesAfter; i++) {
    if (foundLineNo + i >= lineEnds.length) break;
    const line2 = getLine(mark.buffer, lineStarts[foundLineNo + i], lineEnds[foundLineNo + i], mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo + i]), maxLineLength);
    result += `${" ".repeat(opts.indent)}${padStart((mark.line + i + 1).toString(), lineNoLength)} | ${line2.str}
`;
  }
  return result.replace(/\n$/, "");
}
function formatError(exception, compact) {
  let where = "";
  if (!exception.mark) return exception.reason;
  if (exception.mark.name) where += `in "${exception.mark.name}" `;
  where += `(${exception.mark.line + 1}:${exception.mark.column + 1})`;
  if (!compact && exception.mark.snippet) where += `

${exception.mark.snippet}`;
  return `${exception.reason} ${where}`;
}
var YAMLException = class YAMLException2 extends Error {
  reason;
  mark;
  /**
  * Optional `mark` contains source snippet data. Usually, use
  * {@link YAMLException.throwAt} instead of passing it directly.
  */
  constructor(reason, mark) {
    super();
    this.name = "YAMLException";
    this.reason = reason;
    this.mark = mark;
    this.message = formatError(this, false);
    if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);
  }
  /**
  * Returns the formatted error, omitting the source snippet in compact mode.
  */
  toString(compact) {
    return `${this.name}: ${formatError(this, compact)}`;
  }
  /**
  * Builds a YAMLException with a source snippet and throws it. `source` is
  * the raw input text; `position` is an offset into it.
  */
  static throwAt(source, position, message, filename = "") {
    let line = 0;
    let lineStart = 0;
    for (let index = 0; index < position; index++) {
      const ch = source.charCodeAt(index);
      if (ch === 10) {
        line++;
        lineStart = index + 1;
      } else if (ch === 13) {
        line++;
        if (source.charCodeAt(index + 1) === 10) index++;
        lineStart = index + 1;
      }
    }
    const mark = {
      name: filename,
      buffer: source,
      position,
      line,
      column: position - lineStart
    };
    mark.snippet = makeSnippet(mark);
    throw new YAMLException2(message, mark);
  }
};
var EVENT_ID = {
  DOCUMENT: 1,
  SEQUENCE: 2,
  MAPPING: 3,
  SCALAR: 4,
  ALIAS: 5,
  POP: 6
};
var SCALAR_STYLE = {
  PLAIN: 1,
  SINGLE_QUOTED: 2,
  DOUBLE_QUOTED: 3,
  LITERAL_BLOCK: 4,
  FOLDED_BLOCK: 5
};
var COLLECTION_STYLE = {
  BLOCK: 1,
  FLOW: 2
};
var CHOMPING_MODE = {
  CLIP: 1,
  STRIP: 2,
  KEEP: 3
};
var NO_RANGE$3 = -1;
function simpleEscapeSequence(c) {
  switch (c) {
    case 48:
      return "\0";
    case 97:
      return "\x07";
    case 98:
      return "\b";
    case 116:
      return "	";
    case 9:
      return "	";
    case 110:
      return "\n";
    case 118:
      return "\v";
    case 102:
      return "\f";
    case 114:
      return "\r";
    case 101:
      return "\x1B";
    case 32:
      return " ";
    case 34:
      return '"';
    case 47:
      return "/";
    case 92:
      return "\\";
    case 78:
      return "\x85";
    case 95:
      return "\xA0";
    case 76:
      return "\u2028";
    case 80:
      return "\u2029";
    default:
      return "";
  }
}
var simpleEscapeCheck = new Array(256);
var simpleEscapeMap = new Array(256);
for (let i = 0; i < 256; i++) {
  simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
  simpleEscapeMap[i] = simpleEscapeSequence(i);
}
function charFromCodepoint(c) {
  if (c <= 65535) return String.fromCharCode(c);
  return String.fromCharCode((c - 65536 >> 10) + 55296, (c - 65536 & 1023) + 56320);
}
function fromHexCode$1(c) {
  if (c >= 48 && c <= 57) return c - 48;
  return (c | 32) - 97 + 10;
}
function escapedHexLen$1(c) {
  if (c === 120) return 2;
  if (c === 117) return 4;
  return 8;
}
function skipFoldedBreaks(input, position, end) {
  let breaks = 0;
  while (position < end) {
    const ch = input.charCodeAt(position);
    if (ch === 10) {
      breaks++;
      position++;
    } else if (ch === 13) {
      breaks++;
      position++;
      if (input.charCodeAt(position) === 10) position++;
    } else if (ch === 32 || ch === 9) position++;
    else break;
  }
  return {
    position,
    breaks
  };
}
function foldedBreaks(count) {
  if (count === 1) return " ";
  return "\n".repeat(count - 1);
}
function getPlainValue(input, start, end) {
  let result = "";
  let position = start;
  let captureStart = start;
  let captureEnd = start;
  while (position < end) {
    const ch = input.charCodeAt(position);
    if (ch === 10 || ch === 13) {
      result += input.slice(captureStart, captureEnd);
      const fold = skipFoldedBreaks(input, position, end);
      result += foldedBreaks(fold.breaks);
      position = captureStart = captureEnd = fold.position;
    } else {
      position++;
      if (ch !== 32 && ch !== 9) captureEnd = position;
    }
  }
  return result + input.slice(captureStart, captureEnd);
}
function getSingleQuotedValue(input, start, end) {
  let result = "";
  let position = start;
  let captureStart = start;
  let captureEnd = start;
  while (position < end) {
    const ch = input.charCodeAt(position);
    if (ch === 39) {
      result += input.slice(captureStart, position) + "'";
      position += 2;
      captureStart = captureEnd = position;
    } else if (ch === 10 || ch === 13) {
      result += input.slice(captureStart, captureEnd);
      const fold = skipFoldedBreaks(input, position, end);
      result += foldedBreaks(fold.breaks);
      position = captureStart = captureEnd = fold.position;
    } else {
      position++;
      if (ch !== 32 && ch !== 9) captureEnd = position;
    }
  }
  return result + input.slice(captureStart, end);
}
function getDoubleQuotedValue(input, start, end) {
  let result = "";
  let position = start;
  let captureStart = start;
  let captureEnd = start;
  while (position < end) {
    const ch = input.charCodeAt(position);
    if (ch === 92) {
      result += input.slice(captureStart, position);
      position++;
      const escaped = input.charCodeAt(position);
      if (escaped === 10 || escaped === 13) position = skipFoldedBreaks(input, position, end).position;
      else if (escaped < 256 && simpleEscapeCheck[escaped]) {
        result += simpleEscapeMap[escaped];
        position++;
      } else {
        let hexLength = escapedHexLen$1(escaped);
        let hexResult = 0;
        for (; hexLength > 0; hexLength--) {
          position++;
          const digit = fromHexCode$1(input.charCodeAt(position));
          hexResult = (hexResult << 4) + digit;
        }
        result += charFromCodepoint(hexResult);
        position++;
      }
      captureStart = captureEnd = position;
    } else if (ch === 10 || ch === 13) {
      result += input.slice(captureStart, captureEnd);
      const fold = skipFoldedBreaks(input, position, end);
      result += foldedBreaks(fold.breaks);
      position = captureStart = captureEnd = fold.position;
    } else {
      position++;
      if (ch !== 32 && ch !== 9) captureEnd = position;
    }
  }
  return result + input.slice(captureStart, end);
}
function getBlockValue(input, start, end, indent, chomping, folded) {
  const textIndent = indent < 0 ? 0 : indent;
  const region = input.slice(start, end).replace(/\r\n?/g, "\n");
  const lines = region === "" ? [] : (region.endsWith("\n") ? region.slice(0, -1) : region).split("\n");
  let result = "";
  let didReadContent = false;
  let emptyLines = 0;
  let atMoreIndented = false;
  for (const line of lines) {
    let column = 0;
    while (column < textIndent && line.charCodeAt(column) === 32) column++;
    if (indent < 0 || column >= line.length) {
      emptyLines++;
      continue;
    }
    const content = line.slice(textIndent);
    const first = content.charCodeAt(0);
    if (folded) {
      if (first === 32 || first === 9) {
        atMoreIndented = true;
        result += "\n".repeat(didReadContent ? 1 + emptyLines : emptyLines);
      } else if (atMoreIndented) {
        atMoreIndented = false;
        result += "\n".repeat(emptyLines + 1);
      } else if (emptyLines === 0) {
        if (didReadContent) result += " ";
      } else result += "\n".repeat(emptyLines);
    } else result += "\n".repeat(didReadContent ? 1 + emptyLines : emptyLines);
    result += content;
    didReadContent = true;
    emptyLines = 0;
  }
  if (chomping === CHOMPING_MODE.KEEP) result += "\n".repeat(didReadContent ? 1 + emptyLines : emptyLines);
  else if (chomping !== CHOMPING_MODE.STRIP) {
    if (didReadContent) result += "\n";
  }
  return result;
}
function getScalarValue(input, scalar) {
  if (scalar.valueStart === NO_RANGE$3) return "";
  const { valueStart, valueEnd } = scalar;
  if (scalar.fast) return input.slice(valueStart, valueEnd);
  switch (scalar.style) {
    case SCALAR_STYLE.SINGLE_QUOTED:
      return getSingleQuotedValue(input, valueStart, valueEnd);
    case SCALAR_STYLE.DOUBLE_QUOTED:
      return getDoubleQuotedValue(input, valueStart, valueEnd);
    case SCALAR_STYLE.LITERAL_BLOCK:
      return getBlockValue(input, valueStart, valueEnd, scalar.indent, scalar.chomping, false);
    case SCALAR_STYLE.FOLDED_BLOCK:
      return getBlockValue(input, valueStart, valueEnd, scalar.indent, scalar.chomping, true);
    default:
      return getPlainValue(input, valueStart, valueEnd);
  }
}
var DEFAULT_TAG_HANDLERS = Object.assign(/* @__PURE__ */ Object.create(null), {
  "!": "!",
  "!!": "tag:yaml.org,2002:"
});
var TAG_SUFFIX_CHARS = "-#;/?:@&=+$_.~*'()";
var TAG_URI_CHARS = TAG_SUFFIX_CHARS + "!,[]";
var HEX = "0123456789ABCDEF";
function percentByte(byte) {
  return "%" + HEX[byte >> 4] + HEX[byte & 15];
}
function tagPercentEncode(source, isSuffix) {
  const allowed = isSuffix ? TAG_SUFFIX_CHARS : TAG_URI_CHARS;
  let result = "";
  for (let index = 0; index < source.length; index++) {
    let ch = source.charCodeAt(index);
    if (ch >= 48 && ch <= 57 || ch >= 65 && ch <= 90 || ch >= 97 && ch <= 122 || allowed.includes(source[index])) {
      result += source[index];
      continue;
    }
    if (ch >= 55296 && ch <= 56319) ch = 65536 + ((ch & 1023) << 10) + (source.charCodeAt(++index) & 1023);
    if (ch < 128) result += percentByte(ch);
    else if (ch < 2048) result += percentByte(192 | ch >> 6) + percentByte(128 | ch & 63);
    else if (ch < 65536) result += percentByte(224 | ch >> 12) + percentByte(128 | ch >> 6 & 63) + percentByte(128 | ch & 63);
    else result += percentByte(240 | ch >> 18) + percentByte(128 | ch >> 12 & 63) + percentByte(128 | ch >> 6 & 63) + percentByte(128 | ch & 63);
  }
  return result;
}
function tagPercentDecode(source) {
  let result = "";
  let index = 0;
  while (index < source.length) {
    if (source.charCodeAt(index) !== 37) {
      result += source[index++];
      continue;
    }
    let ch = parseInt(source.slice(index + 1, index + 3), 16);
    index += 3;
    if (ch >= 192) {
      let remaining = ch < 224 ? 1 : ch < 240 ? 2 : 3;
      ch &= (1 << 6 - remaining) - 1;
      while (remaining-- > 0) {
        ch = ch << 6 | parseInt(source.slice(index + 1, index + 3), 16) & 63;
        index += 3;
      }
    }
    if (ch < 65536) result += String.fromCharCode(ch);
    else {
      ch -= 65536;
      result += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
    }
  }
  return result;
}
function tagNameFull(rawTag, tagHandlers) {
  if (rawTag.startsWith("!<") && rawTag.endsWith(">")) return tagPercentDecode(rawTag.slice(2, -1));
  const handleEnd = rawTag.indexOf("!", 1);
  const handle = handleEnd === -1 ? "!" : rawTag.slice(0, handleEnd + 1);
  return tagPercentDecode(tagHandlers?.[handle] ?? DEFAULT_TAG_HANDLERS[handle] ?? handle) + tagPercentDecode(rawTag.slice(handle.length));
}
function tagNameShort(fullTag) {
  let tag = fullTag;
  if (tag.charCodeAt(0) === 33) {
    tag = tag.slice(1);
    return `!${tagPercentEncode(tag, true)}`;
  }
  if (tag.slice(0, 18) === "tag:yaml.org,2002:") return `!!${tagPercentEncode(tag.slice(18), true)}`;
  return `!<${tagPercentEncode(tag, false)}>`;
}
var NO_RANGE$2 = -1;
var MERGE_TAG_NAME = "tag:yaml.org,2002:merge";
var DEFAULT_CONSTRUCTOR_OPTIONS = {
  filename: "",
  schema: CORE_SCHEMA,
  json: false,
  maxTotalMergeKeys: 1e4,
  maxAliases: -1
};
function eventPosition$1(event) {
  if ("tagStart" in event && event.tagStart !== NO_RANGE$2) return event.tagStart;
  if ("anchorStart" in event && event.anchorStart !== NO_RANGE$2) return event.anchorStart;
  if ("valueStart" in event && event.valueStart !== NO_RANGE$2) return event.valueStart;
  if ("start" in event) return event.start;
  return 0;
}
function throwError$1(state, message) {
  YAMLException.throwAt(state.source, state.position, message, state.filename);
}
function finalizeCollection(state, position, tag, carrier) {
  try {
    return tag.finalize(carrier);
  } catch (error) {
    if (error instanceof YAMLException) throw error;
    YAMLException.throwAt(state.source, position, error instanceof Error ? error.message : String(error), state.filename);
  }
}
function constructScalar(state, event) {
  const source = getScalarValue(state.source, event);
  const rawTag = event.tagStart === NO_RANGE$2 ? "" : state.source.slice(event.tagStart, event.tagEnd);
  const strTag2 = state.schema.defaultScalarTag;
  if (rawTag !== "") {
    if (rawTag === "!") return {
      value: source,
      tag: strTag2
    };
    const tagName = tagNameFull(rawTag, state.tagHandlers);
    const scalarTag = state.schema.lookupScalarTag(tagName);
    if (scalarTag) {
      const result = scalarTag.resolve(source, true, tagName);
      if (result === NOT_RESOLVED) throwError$1(state, `cannot resolve a node with !<${tagName}> explicit tag`);
      return {
        value: result,
        tag: scalarTag
      };
    }
    const collectionTagDef = state.schema.lookupMappingTag(tagName) ?? state.schema.lookupSequenceTag(tagName);
    if (collectionTagDef) {
      if (source !== "") throwError$1(state, `cannot resolve a node with !<${tagName}> explicit tag`);
      const carrier = collectionTagDef.create(tagName);
      return {
        value: collectionTagDef.carrierIsResult ? carrier : finalizeCollection(state, state.position, collectionTagDef, carrier),
        tag: collectionTagDef
      };
    }
    throwError$1(state, `unknown scalar tag !<${tagName}>`);
  }
  if (event.style === SCALAR_STYLE.PLAIN) return state.schema.resolveImplicitScalarTag(source);
  return {
    value: strTag2.resolve(source, false, strTag2.tagName),
    tag: strTag2
  };
}
function collectionTagName(state, event, defaultTagName) {
  const rawTag = event.tagStart === NO_RANGE$2 ? "" : state.source.slice(event.tagStart, event.tagEnd);
  return rawTag === "" || rawTag === "!" ? defaultTagName : tagNameFull(rawTag, state.tagHandlers);
}
function isMappingTag(tag) {
  return tag.nodeKind === "mapping";
}
function chargeMergeWork(state) {
  state.totalMergeKeys++;
  if (state.maxTotalMergeKeys !== -1 && state.totalMergeKeys > state.maxTotalMergeKeys) throwError$1(state, `merge keys exceeded maxTotalMergeKeys (${state.maxTotalMergeKeys})`);
}
function mergeKeys(state, frame, source, sourceTag) {
  chargeMergeWork(state);
  for (const sourceKey of sourceTag.keys(source)) {
    chargeMergeWork(state);
    if (frame.tag.has(frame.value, sourceKey)) continue;
    const err = frame.tag.addPair(frame.value, sourceKey, sourceTag.get(source, sourceKey));
    if (err) throwError$1(state, err);
    frame.overridable ??= /* @__PURE__ */ new Set();
    frame.overridable.add(sourceKey);
  }
}
function mergeSource(state, frame, source, sourceTag) {
  state.position = frame.keyPosition;
  if (isMappingTag(sourceTag)) mergeKeys(state, frame, source, sourceTag);
  else if (sourceTag.nodeKind === "sequence" && Array.isArray(source)) {
    if (source.length > 100) throwError$1(state, "abnormal merge sequence size");
    for (const element of source) {
      const elementTag = state.nodeTags.get(element);
      if (!elementTag) throwError$1(state, "cannot merge mappings; the provided source object is unacceptable");
      mergeKeys(state, frame, element, elementTag);
    }
  } else throwError$1(state, "cannot merge mappings; the provided source object is unacceptable");
}
function addMappingValue(state, frame, key, value, tag) {
  state.position = frame.keyPosition;
  if (frame.keyIsMerge) {
    mergeSource(state, frame, value, tag);
    return;
  }
  if (!state.json && frame.tag.has(frame.value, key) && !frame.overridable?.has(key)) throwError$1(state, "duplicated mapping key");
  const err = frame.tag.addPair(frame.value, key, value);
  if (err) throwError$1(state, err);
  frame.overridable?.delete(key);
}
function addValue(state, value, tag) {
  const frame = state.frames[state.frames.length - 1];
  if (frame.kind === "document") {
    frame.value = value;
    frame.hasValue = true;
  } else if (frame.kind === "sequence") {
    if (isMappingTag(tag)) state.nodeTags.set(value, tag);
    const err = frame.tag.addItem(frame.value, value, frame.index++);
    if (err) throwError$1(state, err);
  } else if (frame.hasKey) {
    const key = frame.key;
    frame.key = void 0;
    frame.hasKey = false;
    addMappingValue(state, frame, key, value, tag);
  } else {
    frame.key = value;
    frame.keyPosition = state.position;
    frame.hasKey = true;
    frame.keyIsMerge = tag.tagName === MERGE_TAG_NAME;
  }
}
function storeAnchor(state, event, value, tag, isValueFinal) {
  if (event.anchorStart !== NO_RANGE$2) {
    const anchor = {
      value,
      tag,
      isValueFinal
    };
    state.anchors.set(state.source.slice(event.anchorStart, event.anchorEnd), anchor);
    return anchor;
  }
  return null;
}
function constructFromEvents(events, options) {
  const state = {
    ...DEFAULT_CONSTRUCTOR_OPTIONS,
    ...options,
    events,
    documents: [],
    eventIndex: 0,
    position: 0,
    frames: [],
    anchors: /* @__PURE__ */ new Map(),
    nodeTags: /* @__PURE__ */ new Map(),
    tagHandlers: /* @__PURE__ */ Object.create(null),
    totalMergeKeys: 0,
    aliasCount: 0
  };
  while (state.eventIndex < state.events.length) {
    const event = state.events[state.eventIndex++];
    state.position = eventPosition$1(event);
    switch (event.type) {
      case EVENT_ID.DOCUMENT:
        state.anchors = /* @__PURE__ */ new Map();
        state.nodeTags = /* @__PURE__ */ new Map();
        state.aliasCount = 0;
        state.tagHandlers = /* @__PURE__ */ Object.create(null);
        for (const directive of event.directives) if (directive.kind === "tag") state.tagHandlers[directive.handle] = directive.prefix;
        state.frames.push({
          kind: "document",
          position: state.position,
          value: void 0,
          hasValue: false
        });
        break;
      case EVENT_ID.SCALAR: {
        const { value, tag } = constructScalar(state, event);
        storeAnchor(state, event, value, tag, true);
        addValue(state, value, tag);
        break;
      }
      case EVENT_ID.SEQUENCE: {
        const tagName = collectionTagName(state, event, "tag:yaml.org,2002:seq");
        const tag = state.schema.lookupSequenceTag(tagName);
        if (!tag) throwError$1(state, `unknown sequence tag !<${tagName}>`);
        const value = tag.create(tagName);
        const anchor = storeAnchor(state, event, value, tag, tag.carrierIsResult);
        state.frames.push({
          kind: "sequence",
          position: state.position,
          value,
          tag,
          anchor,
          index: 0
        });
        break;
      }
      case EVENT_ID.MAPPING: {
        const tagName = collectionTagName(state, event, "tag:yaml.org,2002:map");
        const tag = state.schema.lookupMappingTag(tagName);
        if (!tag) throwError$1(state, `unknown mapping tag !<${tagName}>`);
        const value = tag.create(tagName);
        const anchor = storeAnchor(state, event, value, tag, tag.carrierIsResult);
        state.frames.push({
          kind: "mapping",
          position: state.position,
          value,
          tag,
          anchor,
          key: void 0,
          keyPosition: state.position,
          hasKey: false,
          keyIsMerge: false,
          overridable: null
        });
        break;
      }
      case EVENT_ID.ALIAS: {
        if (state.maxAliases !== -1 && ++state.aliasCount > state.maxAliases) throwError$1(state, `aliases exceeded maxAliases (${state.maxAliases})`);
        const name = state.source.slice(event.anchorStart, event.anchorEnd);
        const anchor = state.anchors.get(name);
        if (!anchor) throwError$1(state, `unidentified alias "${name}"`);
        if (!anchor.isValueFinal) throwError$1(state, `recursive alias "${name}" is not supported for tag ${anchor.tag.tagName} because it uses finalize()`);
        addValue(state, anchor.value, anchor.tag);
        break;
      }
      case EVENT_ID.POP: {
        const frame = state.frames.pop();
        if (frame.kind === "mapping" && frame.hasKey) {
          state.position = frame.keyPosition;
          throwError$1(state, "incomplete mapping pair in event stream");
        }
        if (frame.kind === "document") state.documents.push(frame.value);
        else {
          const value = frame.tag.carrierIsResult ? frame.value : finalizeCollection(state, frame.position, frame.tag, frame.value);
          if (frame.anchor) {
            frame.anchor.value = value;
            frame.anchor.isValueFinal = true;
          }
          addValue(state, value, frame.tag);
        }
        break;
      }
    }
  }
  return state.documents;
}
var NO_RANGE$1 = -1;
var HAS_OWN = Object.prototype.hasOwnProperty;
var CONTEXT_FLOW_IN = 1;
var CONTEXT_FLOW_OUT = 2;
var CONTEXT_BLOCK_IN = 3;
var CONTEXT_BLOCK_OUT = 4;
var PATTERN_NON_PRINTABLE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
var PATTERN_FLOW_INDICATORS = /[,\[\]{}]/;
var PATTERN_TAG_HANDLE = /^(?:!|!!|![0-9A-Za-z-]+!)$/;
var NS_URI_CHAR = String.raw`(?:%[0-9A-Fa-f]{2}|[0-9A-Za-z\-#;/?:@&=+$,_.!~*'()\[\]])`;
var NS_TAG_CHAR = String.raw`(?:%[0-9A-Fa-f]{2}|[0-9A-Za-z\-#;/?:@&=+$.~*'()_])`;
var PATTERN_TAG_URI = new RegExp(`^(?:${NS_URI_CHAR})*$`);
var PATTERN_TAG_SUFFIX = new RegExp(`^(?:${NS_TAG_CHAR})+$`);
var PATTERN_TAG_PREFIX = new RegExp(`^(?:!(?:${NS_URI_CHAR})*|${NS_TAG_CHAR}(?:${NS_URI_CHAR})*)$`);
var DEFAULT_PARSER_OPTIONS = {
  filename: "",
  maxDepth: 100
};
function addDocumentEvent(state, explicitStart, explicitEnd) {
  state.events.push({
    type: EVENT_ID.DOCUMENT,
    explicitStart,
    explicitEnd,
    directives: state.directives
  });
}
function addSequenceEvent(state, start, anchorStart, anchorEnd, tagStart, tagEnd, style) {
  state.events.push({
    type: EVENT_ID.SEQUENCE,
    start,
    anchorStart,
    anchorEnd,
    tagStart,
    tagEnd,
    style
  });
}
function addMappingEvent(state, start, anchorStart, anchorEnd, tagStart, tagEnd, style) {
  state.events.push({
    type: EVENT_ID.MAPPING,
    start,
    anchorStart,
    anchorEnd,
    tagStart,
    tagEnd,
    style
  });
}
function insertFlowPairMappingEvent(state, snapshot) {
  state.events.splice(snapshot.eventsLength, 0, {
    type: EVENT_ID.MAPPING,
    start: snapshot.position,
    anchorStart: NO_RANGE$1,
    anchorEnd: NO_RANGE$1,
    tagStart: NO_RANGE$1,
    tagEnd: NO_RANGE$1,
    style: COLLECTION_STYLE.FLOW
  });
}
function addScalarEvent(state, valueStart, valueEnd, anchorStart, anchorEnd, tagStart, tagEnd, style, chomping = CHOMPING_MODE.CLIP, indent = -1, fast = false) {
  state.events.push({
    type: EVENT_ID.SCALAR,
    valueStart,
    valueEnd,
    anchorStart,
    anchorEnd,
    tagStart,
    tagEnd,
    style,
    chomping,
    indent,
    fast
  });
}
function addAliasEvent(state, anchorStart, anchorEnd) {
  state.events.push({
    type: EVENT_ID.ALIAS,
    anchorStart,
    anchorEnd
  });
}
function addPopEvent(state) {
  state.events.push({ type: EVENT_ID.POP });
}
function addEmptyScalarEvent(state) {
  addScalarEvent(state, NO_RANGE$1, NO_RANGE$1, NO_RANGE$1, NO_RANGE$1, NO_RANGE$1, NO_RANGE$1, SCALAR_STYLE.PLAIN);
}
function emptyProperties() {
  return {
    anchorStart: NO_RANGE$1,
    anchorEnd: NO_RANGE$1,
    tagStart: NO_RANGE$1,
    tagEnd: NO_RANGE$1
  };
}
function snapshotState(state) {
  return {
    position: state.position,
    line: state.line,
    lineStart: state.lineStart,
    lineIndent: state.lineIndent,
    firstTabInLine: state.firstTabInLine,
    eventsLength: state.events.length
  };
}
function restoreState(state, snapshot) {
  state.position = snapshot.position;
  state.line = snapshot.line;
  state.lineStart = snapshot.lineStart;
  state.lineIndent = snapshot.lineIndent;
  state.firstTabInLine = snapshot.firstTabInLine;
  state.events.length = snapshot.eventsLength;
}
function throwError(state, message) {
  YAMLException.throwAt(state.input.slice(0, state.length), state.position, message, state.filename);
}
function isEol(c) {
  return c === 10 || c === 13;
}
function isWhiteSpace(c) {
  return c === 9 || c === 32;
}
function isWsOrEol(c) {
  return isWhiteSpace(c) || isEol(c);
}
function isWsOrEolOrEnd(c) {
  return c === 0 || isWsOrEol(c);
}
function isFlowIndicator(c) {
  return c === 44 || c === 91 || c === 93 || c === 123 || c === 125;
}
function fromDecimalCode(c) {
  return c >= 48 && c <= 57 ? c - 48 : -1;
}
function fromHexCode(c) {
  if (c >= 48 && c <= 57) return c - 48;
  const lc = c | 32;
  if (lc >= 97 && lc <= 102) return lc - 97 + 10;
  return -1;
}
function escapedHexLen(c) {
  if (c === 120) return 2;
  if (c === 117) return 4;
  if (c === 85) return 8;
  return 0;
}
function isSimpleEscape(c) {
  return c === 48 || c === 97 || c === 98 || c === 116 || c === 9 || c === 110 || c === 118 || c === 102 || c === 114 || c === 101 || c === 32 || c === 34 || c === 47 || c === 92 || c === 78 || c === 95 || c === 76 || c === 80;
}
function consumeLineBreak(state) {
  if (state.input.charCodeAt(state.position) === 10) state.position++;
  else {
    state.position++;
    if (state.input.charCodeAt(state.position) === 10) state.position++;
  }
  state.line++;
  state.lineStart = state.position;
  state.lineIndent = 0;
  state.firstTabInLine = -1;
}
function skipSeparationSpace(state, allowComments) {
  let lineBreaks = 0;
  let ch = state.input.charCodeAt(state.position);
  let hasSeparation = state.position === state.lineStart || isWsOrEol(state.input.charCodeAt(state.position - 1));
  while (ch !== 0) {
    while (isWhiteSpace(ch)) {
      hasSeparation = true;
      if (ch === 9 && state.firstTabInLine === -1) state.firstTabInLine = state.position;
      ch = state.input.charCodeAt(++state.position);
    }
    if (allowComments && hasSeparation && ch === 35) do
      ch = state.input.charCodeAt(++state.position);
    while (!isEol(ch) && ch !== 0);
    if (!isEol(ch)) break;
    consumeLineBreak(state);
    lineBreaks++;
    hasSeparation = true;
    ch = state.input.charCodeAt(state.position);
    while (ch === 32) {
      state.lineIndent++;
      ch = state.input.charCodeAt(++state.position);
    }
  }
  return lineBreaks;
}
function testDocumentSeparator(state, position = state.position) {
  const ch = state.input.charCodeAt(position);
  if ((ch === 45 || ch === 46) && ch === state.input.charCodeAt(position + 1) && ch === state.input.charCodeAt(position + 2)) {
    const following = state.input.charCodeAt(position + 3);
    return following === 0 || isWsOrEol(following);
  }
  return false;
}
function skipByteOrderMark(state) {
  if (state.position === state.lineStart && state.input.charCodeAt(state.position) === 65279) {
    state.position++;
    state.lineStart = state.position;
  }
}
function testDocumentBoundary(state) {
  if (state.position !== state.lineStart) return false;
  if (testDocumentSeparator(state)) return true;
  if (state.input.charCodeAt(state.position) !== 65279) return false;
  const snapshot = snapshotState(state);
  skipByteOrderMark(state);
  skipSeparationSpace(state, true);
  const ch = state.input.charCodeAt(state.position);
  const result = state.position === state.lineStart && (ch === 37 || ch === 45 && testDocumentSeparator(state));
  restoreState(state, snapshot);
  return result;
}
function skipUntilLineEnd(state) {
  let ch = state.input.charCodeAt(state.position);
  while (ch !== 0 && !isEol(ch)) ch = state.input.charCodeAt(++state.position);
}
function checkPrintable(state, start, end) {
  const match = PATTERN_NON_PRINTABLE.exec(state.input.slice(start, end));
  if (match !== null) {
    state.position = start + match.index + match[0].length - 1;
    throwError(state, "the stream contains non-printable characters");
  }
}
function readTagProperty(state, props, inFlow) {
  if (state.input.charCodeAt(state.position) !== 33) return false;
  if (props.tagStart !== NO_RANGE$1) throwError(state, "duplication of a tag property");
  const start = state.position;
  let isVerbatim = false;
  let isNamed = false;
  let tagHandle = "!";
  let ch = state.input.charCodeAt(++state.position);
  if (ch === 60) {
    isVerbatim = true;
    ch = state.input.charCodeAt(++state.position);
  } else if (ch === 33) {
    isNamed = true;
    tagHandle = "!!";
    ch = state.input.charCodeAt(++state.position);
  }
  let suffixStart = state.position;
  let tagName;
  if (isVerbatim) {
    while (ch !== 0 && ch !== 62) ch = state.input.charCodeAt(++state.position);
    if (ch !== 62) throwError(state, "unexpected end of the stream within a verbatim tag");
    tagName = state.input.slice(suffixStart, state.position);
    state.position++;
  } else {
    while (ch !== 0 && !isWsOrEol(ch) && !(inFlow && isFlowIndicator(ch))) {
      if (ch === 33) {
        if (!isNamed) {
          tagHandle = state.input.slice(suffixStart - 1, state.position + 1);
          if (!PATTERN_TAG_HANDLE.test(tagHandle)) throwError(state, "named tag handle cannot contain such characters");
          isNamed = true;
          suffixStart = state.position + 1;
        } else throwError(state, "tag suffix cannot contain exclamation marks");
      }
      ch = state.input.charCodeAt(++state.position);
    }
    tagName = state.input.slice(suffixStart, state.position);
    if (PATTERN_FLOW_INDICATORS.test(tagName)) throwError(state, "tag suffix cannot contain flow indicator characters");
  }
  if (tagName && !(isVerbatim ? PATTERN_TAG_URI.test(tagName) : PATTERN_TAG_SUFFIX.test(tagName))) throwError(state, `tag name cannot contain such characters: ${tagName}`);
  if (!isVerbatim && tagHandle !== "!" && tagHandle !== "!!" && !HAS_OWN.call(state.tagHandlers, tagHandle)) throwError(state, `undeclared tag handle "${tagHandle}"`);
  props.tagStart = start;
  props.tagEnd = state.position;
  return true;
}
function readAnchorProperty(state, props) {
  if (state.input.charCodeAt(state.position) !== 38) return false;
  if (props.anchorStart !== NO_RANGE$1) throwError(state, "duplication of an anchor property");
  state.position++;
  const start = state.position;
  while (state.input.charCodeAt(state.position) !== 0 && !isWsOrEol(state.input.charCodeAt(state.position)) && !isFlowIndicator(state.input.charCodeAt(state.position))) state.position++;
  if (state.position === start) throwError(state, "name of an anchor node must contain at least one character");
  props.anchorStart = start;
  props.anchorEnd = state.position;
  return true;
}
function readAlias(state, props) {
  if (state.input.charCodeAt(state.position) !== 42) return false;
  if (props.anchorStart !== NO_RANGE$1 || props.tagStart !== NO_RANGE$1) throwError(state, "alias node should not have any properties");
  state.position++;
  const start = state.position;
  while (state.input.charCodeAt(state.position) !== 0 && !isWsOrEol(state.input.charCodeAt(state.position)) && !isFlowIndicator(state.input.charCodeAt(state.position))) state.position++;
  if (state.position === start) throwError(state, "name of an alias node must contain at least one character");
  addAliasEvent(state, start, state.position);
  return true;
}
function readFlowScalarBreak(state, nodeIndent) {
  skipSeparationSpace(state, false);
  if (state.lineIndent < nodeIndent) throwError(state, "deficient indentation");
}
function readSingleQuotedScalar(state, nodeIndent, props) {
  if (state.input.charCodeAt(state.position) !== 39) return false;
  state.position++;
  const start = state.position;
  let simple = true;
  while (state.input.charCodeAt(state.position) !== 0) {
    const ch = state.input.charCodeAt(state.position);
    if (ch === 39) {
      if (state.input.charCodeAt(state.position + 1) === 39) {
        simple = false;
        state.position += 2;
        continue;
      }
      const end = state.position;
      state.position++;
      addScalarEvent(state, start, end, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, SCALAR_STYLE.SINGLE_QUOTED, CHOMPING_MODE.CLIP, -1, simple);
      return true;
    }
    if (isEol(ch)) {
      simple = false;
      readFlowScalarBreak(state, nodeIndent);
    } else if (state.position === state.lineStart && testDocumentSeparator(state)) throwError(state, "unexpected end of the document within a single quoted scalar");
    else if (ch !== 9 && ch < 32) throwError(state, "expected valid JSON character");
    else state.position++;
  }
  throwError(state, "unexpected end of the stream within a single quoted scalar");
}
function readDoubleQuotedScalar(state, nodeIndent, props) {
  if (state.input.charCodeAt(state.position) !== 34) return false;
  state.position++;
  const start = state.position;
  let simple = true;
  while (state.input.charCodeAt(state.position) !== 0) {
    const ch = state.input.charCodeAt(state.position);
    if (ch === 34) {
      const end = state.position;
      state.position++;
      addScalarEvent(state, start, end, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, SCALAR_STYLE.DOUBLE_QUOTED, CHOMPING_MODE.CLIP, -1, simple);
      return true;
    }
    if (ch === 92) {
      simple = false;
      const escaped = state.input.charCodeAt(++state.position);
      if (isEol(escaped)) readFlowScalarBreak(state, nodeIndent);
      else if (isSimpleEscape(escaped)) state.position++;
      else {
        let hexLength = escapedHexLen(escaped);
        if (hexLength === 0) throwError(state, "unknown escape sequence");
        while (hexLength-- > 0) {
          state.position++;
          if (fromHexCode(state.input.charCodeAt(state.position)) < 0) throwError(state, "expected hexadecimal character");
        }
        state.position++;
      }
    } else if (isEol(ch)) {
      simple = false;
      readFlowScalarBreak(state, nodeIndent);
    } else if (state.position === state.lineStart && testDocumentSeparator(state)) throwError(state, "unexpected end of the document within a double quoted scalar");
    else if (ch !== 9 && ch < 32) throwError(state, "expected valid JSON character");
    else state.position++;
  }
  throwError(state, "unexpected end of the stream within a double quoted scalar");
}
function readBlockScalar(state, parentIndent, props) {
  const ch = state.input.charCodeAt(state.position);
  let chomping = CHOMPING_MODE.CLIP;
  let indent = -1;
  let detectedIndent = false;
  if (ch !== 124 && ch !== 62) return false;
  const style = ch === 124 ? SCALAR_STYLE.LITERAL_BLOCK : SCALAR_STYLE.FOLDED_BLOCK;
  state.position++;
  while (state.input.charCodeAt(state.position) !== 0) {
    const current = state.input.charCodeAt(state.position);
    const digit = fromDecimalCode(current);
    if (current === 43 || current === 45) {
      if (chomping !== CHOMPING_MODE.CLIP) throwError(state, "repeat of a chomping mode identifier");
      chomping = current === 43 ? CHOMPING_MODE.KEEP : CHOMPING_MODE.STRIP;
      state.position++;
    } else if (digit >= 0) {
      if (digit === 0) throwError(state, "bad explicit indentation width of a block scalar; it cannot be less than one");
      if (detectedIndent) throwError(state, "repeat of an indentation width identifier");
      indent = parentIndent + digit - 1;
      detectedIndent = true;
      state.position++;
    } else break;
  }
  let hadWhitespace = false;
  while (isWhiteSpace(state.input.charCodeAt(state.position))) {
    hadWhitespace = true;
    state.position++;
  }
  if (hadWhitespace && state.input.charCodeAt(state.position) === 35) skipUntilLineEnd(state);
  if (isEol(state.input.charCodeAt(state.position))) consumeLineBreak(state);
  else if (state.input.charCodeAt(state.position) !== 0) throwError(state, "a line break is expected");
  let contentIndent = detectedIndent ? indent : -1;
  let maxLeadingIndent = 0;
  const valueStart = state.position;
  let valueEnd = state.position;
  while (state.input.charCodeAt(state.position) !== 0) {
    const linePosition = state.position;
    let column = 0;
    while (state.input.charCodeAt(linePosition + column) === 32) column++;
    const first = state.input.charCodeAt(linePosition + column);
    if (first === 0) {
      if (contentIndent >= 0) {
        if (column > contentIndent) valueEnd = linePosition + column;
      } else if (column > 0) valueEnd = linePosition + column;
      break;
    }
    if (testDocumentBoundary(state)) break;
    if (!detectedIndent && contentIndent === -1 && isEol(first)) maxLeadingIndent = Math.max(maxLeadingIndent, column);
    if (!detectedIndent && contentIndent === -1 && !isEol(first)) {
      if (first === 9 && column < parentIndent) {
        state.position = linePosition + column;
        throwError(state, "tab characters must not be used in indentation");
      }
      if (column >= parentIndent && column < maxLeadingIndent) {
        state.position = linePosition + column;
        throwError(state, "bad indentation of a mapping entry");
      }
    }
    if (contentIndent === -1 && first !== 0 && !isEol(first) && column < parentIndent) {
      state.lineIndent = column;
      state.position = linePosition + column;
      break;
    }
    if (!detectedIndent && first !== 0 && !isEol(first) && contentIndent === -1) contentIndent = column;
    const requiredIndent = contentIndent === -1 ? parentIndent + 1 : contentIndent;
    if (first !== 0 && !isEol(first) && column < requiredIndent) {
      state.lineIndent = column;
      state.position = linePosition + column;
      break;
    }
    skipUntilLineEnd(state);
    valueEnd = state.position;
    if (isEol(state.input.charCodeAt(state.position))) {
      consumeLineBreak(state);
      valueEnd = state.position;
    }
  }
  checkPrintable(state, valueStart, valueEnd);
  addScalarEvent(state, valueStart, valueEnd, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, style, chomping, contentIndent);
  return true;
}
function canStartPlainScalar(state, nodeContext) {
  const ch = state.input.charCodeAt(state.position);
  const inFlow = nodeContext === CONTEXT_FLOW_IN;
  if (ch === 0 || isWsOrEol(ch) || ch === 35 || ch === 38 || ch === 42 || ch === 33 || ch === 124 || ch === 62 || ch === 39 || ch === 34 || ch === 37 || ch === 64 || ch === 96 || isFlowIndicator(ch)) return false;
  if (ch === 63 || ch === 45) {
    const following = state.input.charCodeAt(state.position + 1);
    if (isWsOrEolOrEnd(following) || inFlow && isFlowIndicator(following)) return false;
  }
  return true;
}
function readPlainScalar(state, nodeIndent, nodeContext, props) {
  if (!canStartPlainScalar(state, nodeContext)) return false;
  const start = state.position;
  let end = state.position;
  let ch = state.input.charCodeAt(state.position);
  const inFlow = nodeContext === CONTEXT_FLOW_IN;
  let multiline = false;
  while (ch !== 0) {
    if (testDocumentBoundary(state)) break;
    if (ch === 58) {
      const following = state.input.charCodeAt(state.position + 1);
      if (isWsOrEolOrEnd(following) || inFlow && isFlowIndicator(following)) break;
    } else if (ch === 35) {
      if (isWsOrEol(state.input.charCodeAt(state.position - 1))) break;
    } else if (inFlow && isFlowIndicator(ch)) break;
    else if (isEol(ch)) {
      const savedPosition = state.position;
      const savedLine = state.line;
      const savedLineStart = state.lineStart;
      const savedLineIndent = state.lineIndent;
      skipSeparationSpace(state, false);
      if (state.lineIndent >= nodeIndent) {
        multiline = true;
        ch = state.input.charCodeAt(state.position);
        continue;
      }
      state.position = savedPosition;
      state.line = savedLine;
      state.lineStart = savedLineStart;
      state.lineIndent = savedLineIndent;
      break;
    }
    if (!isWhiteSpace(ch)) end = state.position + 1;
    ch = state.input.charCodeAt(++state.position);
  }
  if (end === start) return false;
  checkPrintable(state, start, end);
  addScalarEvent(state, start, end, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, SCALAR_STYLE.PLAIN, CHOMPING_MODE.CLIP, -1, !multiline);
  return true;
}
function skipFlowSeparationSpace(state, nodeIndent) {
  const startLine = state.line;
  skipSeparationSpace(state, true);
  if (state.line > startLine && state.lineIndent < nodeIndent || state.firstTabInLine !== -1 && state.lineIndent < nodeIndent) throwError(state, "deficient indentation");
}
function readFlowCollection(state, nodeIndent, props) {
  const ch = state.input.charCodeAt(state.position);
  const isMapping = ch === 123;
  const start = state.position;
  let readNext = true;
  if (ch !== 91 && ch !== 123) return false;
  const terminator = isMapping ? 125 : 93;
  if (isMapping) addMappingEvent(state, start, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, COLLECTION_STYLE.FLOW);
  else addSequenceEvent(state, start, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, COLLECTION_STYLE.FLOW);
  state.position++;
  while (state.input.charCodeAt(state.position) !== 0) {
    skipFlowSeparationSpace(state, nodeIndent);
    let ch2 = state.input.charCodeAt(state.position);
    if (ch2 === terminator) {
      state.position++;
      addPopEvent(state);
      return true;
    } else if (!readNext) throwError(state, "missed comma between flow collection entries");
    else if (ch2 === 44) throwError(state, "expected the node content, but found ','");
    let isPair = false;
    let isExplicitPair = false;
    if (ch2 === 63 && isWsOrEol(state.input.charCodeAt(state.position + 1))) {
      isPair = isExplicitPair = true;
      state.position += 1;
      skipFlowSeparationSpace(state, nodeIndent);
    }
    const entryLine = state.line;
    const entryStart = snapshotState(state);
    const keyWasRead = parseNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
    skipFlowSeparationSpace(state, nodeIndent);
    ch2 = state.input.charCodeAt(state.position);
    if ((isMapping || isExplicitPair || state.line === entryLine) && ch2 === 58) {
      isPair = true;
      state.position++;
      skipFlowSeparationSpace(state, nodeIndent);
      if (!isMapping) {
        insertFlowPairMappingEvent(state, entryStart);
        if (!keyWasRead) addEmptyScalarEvent(state);
      } else if (!keyWasRead) addEmptyScalarEvent(state);
      if (!parseNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true)) addEmptyScalarEvent(state);
      skipFlowSeparationSpace(state, nodeIndent);
      if (!isMapping) addPopEvent(state);
    } else if (isMapping && isPair) {
      if (!keyWasRead) addEmptyScalarEvent(state);
      addEmptyScalarEvent(state);
    } else if (isMapping) addEmptyScalarEvent(state);
    else if (isPair) {
      insertFlowPairMappingEvent(state, entryStart);
      if (!keyWasRead) addEmptyScalarEvent(state);
      addEmptyScalarEvent(state);
      addPopEvent(state);
    }
    ch2 = state.input.charCodeAt(state.position);
    if (ch2 === 44) {
      readNext = true;
      state.position++;
    } else readNext = false;
  }
  throwError(state, "unexpected end of the stream within a flow collection");
}
function readBlockSequence(state, nodeIndent, props) {
  if (state.firstTabInLine !== -1 || state.input.charCodeAt(state.position) !== 45 || !isWsOrEolOrEnd(state.input.charCodeAt(state.position + 1))) return false;
  addSequenceEvent(state, state.position, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, COLLECTION_STYLE.BLOCK);
  while (state.input.charCodeAt(state.position) === 45 && isWsOrEolOrEnd(state.input.charCodeAt(state.position + 1))) {
    if (state.firstTabInLine !== -1) {
      state.position = state.firstTabInLine;
      throwError(state, "tab characters must not be used in indentation");
    }
    const entryLine = state.line;
    state.position++;
    const hadBreak = skipSeparationSpace(state, true) > 0;
    if (state.firstTabInLine !== -1 && state.input.charCodeAt(state.position) === 45 && isWsOrEolOrEnd(state.input.charCodeAt(state.position + 1))) throwError(state, "bad indentation of a sequence entry");
    if (hadBreak && state.lineIndent <= nodeIndent) addEmptyScalarEvent(state);
    else parseNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
    skipSeparationSpace(state, true);
    if (state.lineIndent < nodeIndent || state.position >= state.length) break;
    if (state.lineIndent > nodeIndent) throwError(state, "bad indentation of a sequence entry");
    if (state.line === entryLine && state.input.charCodeAt(state.position) === 45 && isWsOrEolOrEnd(state.input.charCodeAt(state.position + 1))) throwError(state, "bad indentation of a sequence entry");
  }
  addPopEvent(state);
  return true;
}
function readBlockMapping(state, nodeIndent, flowIndent, props) {
  let atExplicitKey = false;
  let detected = false;
  let mappingOpened = false;
  let pendingExplicitKey = false;
  if (state.firstTabInLine !== -1) return false;
  let ch = state.input.charCodeAt(state.position);
  while (ch !== 0) {
    if (!atExplicitKey && state.firstTabInLine !== -1) {
      state.position = state.firstTabInLine;
      throwError(state, "tab characters must not be used in indentation");
    }
    const following = state.input.charCodeAt(state.position + 1);
    const entryLine = state.line;
    if ((ch === 63 || ch === 58) && isWsOrEolOrEnd(following)) {
      if (!mappingOpened) {
        addMappingEvent(state, state.position, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, COLLECTION_STYLE.BLOCK);
        mappingOpened = true;
      }
      if (ch === 63) {
        if (atExplicitKey) addEmptyScalarEvent(state);
        detected = true;
        atExplicitKey = true;
      } else if (atExplicitKey) atExplicitKey = false;
      else {
        addEmptyScalarEvent(state);
        detected = true;
        atExplicitKey = false;
      }
      state.position += 1;
      pendingExplicitKey = true;
    } else {
      if (atExplicitKey) {
        addEmptyScalarEvent(state);
        atExplicitKey = false;
      }
      const beforeKey = snapshotState(state);
      if (!parseNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) break;
      if (state.line === entryLine) {
        ch = state.input.charCodeAt(state.position);
        while (isWhiteSpace(ch)) ch = state.input.charCodeAt(++state.position);
        if (ch === 58) {
          ch = state.input.charCodeAt(++state.position);
          if (!isWsOrEolOrEnd(ch)) throwError(state, "a whitespace character is expected after the key-value separator within a block mapping");
          if (!mappingOpened) {
            state.events.splice(beforeKey.eventsLength, 0, {
              type: EVENT_ID.MAPPING,
              start: beforeKey.position,
              anchorStart: props.anchorStart,
              anchorEnd: props.anchorEnd,
              tagStart: props.tagStart,
              tagEnd: props.tagEnd,
              style: COLLECTION_STYLE.BLOCK
            });
            mappingOpened = true;
          }
          detected = true;
          atExplicitKey = false;
          pendingExplicitKey = false;
        } else if (detected) throwError(state, "expected ':' after a mapping key");
        else {
          if (props.anchorStart !== NO_RANGE$1 || props.tagStart !== NO_RANGE$1) {
            restoreState(state, beforeKey);
            return false;
          }
          return true;
        }
      } else if (detected) throwError(state, "can not read a block mapping entry; a multiline key may not be an implicit key");
      else {
        if (props.anchorStart !== NO_RANGE$1 || props.tagStart !== NO_RANGE$1) {
          restoreState(state, beforeKey);
          return false;
        }
        return true;
      }
    }
    if (parseNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, pendingExplicitKey)) pendingExplicitKey = false;
    if (!atExplicitKey) {
      if (pendingExplicitKey) {
        addEmptyScalarEvent(state);
        pendingExplicitKey = false;
      }
    }
    skipSeparationSpace(state, true);
    ch = state.input.charCodeAt(state.position);
    if ((state.line === entryLine || state.lineIndent > nodeIndent) && ch !== 0) throwError(state, "bad indentation of a mapping entry");
    else if (state.lineIndent < nodeIndent) break;
  }
  if (!detected) return false;
  if (atExplicitKey) addEmptyScalarEvent(state);
  if (mappingOpened) addPopEvent(state);
  return true;
}
function parseNode(state, parentIndent, nodeContext, allowToSeek, allowCompact, allowPropertyMapping = true) {
  if (state.depth >= state.maxDepth) throwError(state, `nesting exceeded maxDepth (${state.maxDepth})`);
  state.depth++;
  let indentStatus = 1;
  let atNewLine = false;
  let hasContent = false;
  let propertyStart = null;
  const props = emptyProperties();
  let allowBlockScalars = nodeContext === CONTEXT_BLOCK_OUT || nodeContext === CONTEXT_BLOCK_IN;
  let allowBlockCollections = allowBlockScalars;
  const allowBlockStyles = allowBlockScalars;
  if (allowToSeek && skipSeparationSpace(state, true)) {
    atNewLine = true;
    if (state.lineIndent > parentIndent) indentStatus = 1;
    else if (state.lineIndent === parentIndent) indentStatus = 0;
    else indentStatus = -1;
  }
  if (indentStatus === 1) while (true) {
    const ch = state.input.charCodeAt(state.position);
    const propertyState = snapshotState(state);
    if (atNewLine && indentStatus !== 1 && (ch === 33 || ch === 38)) break;
    if (atNewLine && allowBlockStyles && (props.tagStart !== NO_RANGE$1 || props.anchorStart !== NO_RANGE$1) && (ch === 33 || ch === 38)) {
      const fallbackState = snapshotState(state);
      const flowIndent = parentIndent + 1;
      if (readBlockMapping(state, state.position - state.lineStart, flowIndent, props) && state.events[fallbackState.eventsLength]?.type === EVENT_ID.MAPPING) {
        state.depth--;
        return true;
      }
      restoreState(state, fallbackState);
    }
    if (atNewLine && (ch === 33 && props.tagStart !== NO_RANGE$1 || ch === 38 && props.anchorStart !== NO_RANGE$1)) break;
    if (!readTagProperty(state, props, nodeContext === CONTEXT_FLOW_IN) && !readAnchorProperty(state, props)) break;
    if (propertyStart === null) propertyStart = propertyState;
    if (skipSeparationSpace(state, true)) {
      atNewLine = true;
      allowBlockCollections = allowBlockStyles;
      if (state.lineIndent > parentIndent) indentStatus = 1;
      else if (state.lineIndent === parentIndent) indentStatus = 0;
      else indentStatus = -1;
    } else allowBlockCollections = false;
  }
  if (allowBlockCollections) allowBlockCollections = atNewLine || allowCompact;
  if (indentStatus === 1 || nodeContext === CONTEXT_BLOCK_OUT) {
    const flowIndent = nodeContext === CONTEXT_FLOW_IN || nodeContext === CONTEXT_FLOW_OUT ? parentIndent : parentIndent + 1;
    const blockIndent = state.position - state.lineStart;
    if (indentStatus === 1) {
      if (allowBlockCollections && (readBlockSequence(state, blockIndent, props) || readBlockMapping(state, blockIndent, flowIndent, props)) || readFlowCollection(state, flowIndent, props)) hasContent = true;
      else {
        const ch = state.input.charCodeAt(state.position);
        if (propertyStart !== null && allowPropertyMapping && allowBlockStyles && !allowBlockCollections && ch !== 124 && ch !== 62) {
          const fallbackState = snapshotState(state);
          const propertyIndent = propertyStart.position - propertyStart.lineStart;
          restoreState(state, propertyStart);
          if (readBlockMapping(state, propertyIndent, flowIndent, emptyProperties()) && state.events[fallbackState.eventsLength]?.type === EVENT_ID.MAPPING) hasContent = true;
          else restoreState(state, fallbackState);
        }
        if (!hasContent && (allowBlockScalars && readBlockScalar(state, flowIndent, props) || readSingleQuotedScalar(state, flowIndent, props) || readDoubleQuotedScalar(state, flowIndent, props) || readAlias(state, props) || readPlainScalar(state, flowIndent, nodeContext, props))) hasContent = true;
      }
    } else if (indentStatus === 0) hasContent = allowBlockCollections && readBlockSequence(state, blockIndent, props);
  }
  allowBlockScalars = allowBlockScalars && !hasContent;
  if (!hasContent && (props.anchorStart !== NO_RANGE$1 || props.tagStart !== NO_RANGE$1 || allowBlockScalars)) {
    addScalarEvent(state, NO_RANGE$1, NO_RANGE$1, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, SCALAR_STYLE.PLAIN);
    hasContent = true;
  }
  state.depth--;
  return hasContent || props.anchorStart !== NO_RANGE$1 || props.tagStart !== NO_RANGE$1;
}
function readDirective(state) {
  if (state.lineIndent > 0 || state.input.charCodeAt(state.position) !== 37) return false;
  state.position++;
  const nameStart = state.position;
  while (state.input.charCodeAt(state.position) !== 0 && !isWsOrEol(state.input.charCodeAt(state.position))) state.position++;
  const name = state.input.slice(nameStart, state.position);
  const args = [];
  if (name.length === 0) throwError(state, "directive name must not be less than one character in length");
  while (state.input.charCodeAt(state.position) !== 0 && !isEol(state.input.charCodeAt(state.position))) {
    while (isWhiteSpace(state.input.charCodeAt(state.position))) state.position++;
    if (state.input.charCodeAt(state.position) === 35 || isEol(state.input.charCodeAt(state.position)) || state.input.charCodeAt(state.position) === 0) break;
    const start = state.position;
    while (state.input.charCodeAt(state.position) !== 0 && !isWsOrEol(state.input.charCodeAt(state.position))) state.position++;
    args.push(state.input.slice(start, state.position));
  }
  if (isEol(state.input.charCodeAt(state.position))) consumeLineBreak(state);
  if (name === "YAML") {
    if (state.directives.some((directive) => directive.kind === "yaml")) throwError(state, "duplication of %YAML directive");
    if (args.length !== 1) throwError(state, "YAML directive accepts exactly one argument");
    const match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);
    if (match === null) throwError(state, "ill-formed argument of the YAML directive");
    if (parseInt(match[1], 10) !== 1) throwError(state, "unacceptable YAML version of the document");
    state.directives.push({
      kind: "yaml",
      version: args[0]
    });
  } else if (name === "TAG") {
    if (args.length !== 2) throwError(state, "TAG directive accepts exactly two arguments");
    const [handle, prefix] = args;
    if (!PATTERN_TAG_HANDLE.test(handle)) throwError(state, "ill-formed tag handle (first argument) of the TAG directive");
    if (HAS_OWN.call(state.tagHandlers, handle)) throwError(state, `there is a previously declared suffix for "${handle}" tag handle`);
    if (!PATTERN_TAG_PREFIX.test(prefix)) throwError(state, "ill-formed tag prefix (second argument) of the TAG directive");
    state.tagHandlers[handle] = prefix;
    state.directives.push({
      kind: "tag",
      handle,
      prefix
    });
  }
  return true;
}
function readDocument(state) {
  state.directives = [];
  state.tagHandlers = /* @__PURE__ */ Object.create(null);
  let hasDirectives = false;
  skipSeparationSpace(state, true);
  while (readDirective(state)) {
    hasDirectives = true;
    skipSeparationSpace(state, true);
  }
  let explicitStart = false;
  let explicitEnd = false;
  let allowCompact = true;
  if (state.lineIndent === 0 && state.input.charCodeAt(state.position) === 45 && state.input.charCodeAt(state.position + 1) === 45 && state.input.charCodeAt(state.position + 2) === 45 && isWsOrEolOrEnd(state.input.charCodeAt(state.position + 3))) {
    explicitStart = true;
    const markerLine = state.line;
    state.position += 3;
    skipSeparationSpace(state, true);
    allowCompact = state.line > markerLine;
  } else if (hasDirectives) throwError(state, "directives end mark is expected");
  const documentEventIndex = state.events.length;
  if (!explicitStart && state.position === state.lineStart && state.input.charCodeAt(state.position) === 46 && testDocumentSeparator(state)) {
    state.position += 3;
    skipSeparationSpace(state, true);
    return;
  }
  addDocumentEvent(state, explicitStart, false);
  if (!parseNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, allowCompact, allowCompact)) addEmptyScalarEvent(state);
  skipSeparationSpace(state, true);
  if (state.position === state.lineStart && testDocumentSeparator(state)) {
    explicitEnd = state.input.charCodeAt(state.position) === 46;
    if (explicitEnd) {
      const markerLine = state.line;
      state.position += 3;
      skipSeparationSpace(state, true);
      if (state.line === markerLine && state.position < state.length) throwError(state, "end of the stream or a document separator is expected");
    }
  }
  const documentEvent = state.events[documentEventIndex];
  if (documentEvent?.type === EVENT_ID.DOCUMENT) documentEvent.explicitEnd = explicitEnd;
  addPopEvent(state);
  if (!explicitEnd && state.position < state.length && !testDocumentBoundary(state)) throwError(state, "end of the stream or a document separator is expected");
}
function parseEvents(input, options) {
  const length = input.length;
  const state = {
    ...DEFAULT_PARSER_OPTIONS,
    ...options,
    input: `${input}\0`,
    length,
    position: 0,
    line: 0,
    lineStart: 0,
    lineIndent: 0,
    firstTabInLine: -1,
    depth: 0,
    directives: [],
    tagHandlers: /* @__PURE__ */ Object.create(null),
    events: []
  };
  const nullpos = input.indexOf("\0");
  if (nullpos !== -1) YAMLException.throwAt(input, nullpos, "null byte is not allowed in input", state.filename);
  while (state.position < state.length) {
    skipByteOrderMark(state);
    skipSeparationSpace(state, true);
    if (state.position >= state.length) break;
    const documentStart = state.position;
    readDocument(state);
    if (state.position === documentStart)
      throwError(state, "can not read a document");
  }
  return state.events;
}
var DEFAULT_LOAD_OPTIONS = {
  ...DEFAULT_PARSER_OPTIONS,
  ...DEFAULT_CONSTRUCTOR_OPTIONS
};
function loadDocuments(input, options = {}) {
  const opts = {
    ...DEFAULT_LOAD_OPTIONS,
    ...options
  };
  const source = String(input);
  const PARSER_OPT_KEYS = Object.keys(DEFAULT_PARSER_OPTIONS);
  const CONSTRUCTOR_OPT_KEYS = Object.keys(DEFAULT_CONSTRUCTOR_OPTIONS);
  return constructFromEvents(parseEvents(source, pick(opts, PARSER_OPT_KEYS)), {
    ...pick(opts, CONSTRUCTOR_OPT_KEYS),
    source
  });
}
function load(input, options) {
  const documents = loadDocuments(input, options);
  if (documents.length === 0) throw new YAMLException("expected a document, but the input is empty");
  if (documents.length === 1) return documents[0];
  throw new YAMLException("expected a single document in the stream, but found more");
}
var INVALID = /* @__PURE__ */ Symbol("INVALID");
function buildRepresentTypes(schema) {
  const defaultTags = new Set([
    schema.defaultScalarTag,
    schema.defaultSequenceTag,
    schema.defaultMappingTag
  ].filter((t) => t !== void 0));
  const implicitScalars = schema.implicitScalarTags;
  const explicitTags = schema.tags.filter((t) => !(t.nodeKind === "scalar" && t.implicit) && !defaultTags.has(t));
  const defaultTagsLast = schema.tags.filter((t) => defaultTags.has(t));
  return [
    ...implicitScalars.map((tag) => ({
      tag,
      implicitTag: true
    })),
    ...explicitTags.map((tag) => ({
      tag,
      implicitTag: false
    })),
    ...defaultTagsLast.map((tag) => ({
      tag,
      implicitTag: true
    }))
  ];
}
function matchTag(state, object) {
  for (let index = 0, length = state.representTypes.length; index < length; index += 1) {
    const { tag, implicitTag } = state.representTypes[index];
    if (tag.identify(object)) {
      let tagName;
      if (tag.matchByTagPrefix) tagName = tag.representTagName(object);
      else tagName = tag.tagName;
      return {
        tag,
        tagName,
        implicitTag
      };
    }
  }
  return null;
}
function build(state, object) {
  if (!state.noRefs && object !== null && typeof object === "object") {
    const existing = state.refs.get(object);
    if (existing) {
      if (existing.anchor === void 0) existing.anchor = `ref_${state.refCounter++}`;
      return {
        kind: "alias",
        anchor: existing.anchor
      };
    }
  }
  const matched = matchTag(state, object);
  if (!matched) {
    if (object === void 0) return INVALID;
    if (state.skipInvalid) return INVALID;
    throw new YAMLException(`unacceptable kind of an object to dump ${Object.prototype.toString.call(object)}`);
  }
  const { tag, tagName, implicitTag } = matched;
  const nodeTagName = implicitTag ? tagName : tagNameShort(tagName);
  if (tag.nodeKind === "scalar") return {
    kind: "scalar",
    tag: nodeTagName,
    tagged: !implicitTag,
    style: SCALAR_STYLE.PLAIN,
    value: tag.represent(object)
  };
  if (tag.nodeKind === "sequence") {
    const container = tag.represent(object);
    const node2 = {
      kind: "sequence",
      tag: nodeTagName,
      tagged: !implicitTag,
      style: COLLECTION_STYLE.BLOCK,
      items: []
    };
    if (!state.noRefs) state.refs.set(object, node2);
    for (let index = 0, length = container.length; index < length; index += 1) {
      let item = build(state, container[index]);
      if (item === INVALID && container[index] === void 0) item = build(state, null);
      if (item === INVALID) continue;
      node2.items.push(item);
    }
    return node2;
  }
  const map = tag.represent(object);
  const node = {
    kind: "mapping",
    tag: nodeTagName,
    tagged: !implicitTag,
    style: COLLECTION_STYLE.BLOCK,
    items: []
  };
  if (!state.noRefs) state.refs.set(object, node);
  for (const [objectKey, objectValue] of map) {
    const key = build(state, objectKey);
    if (key === INVALID) continue;
    const value = build(state, objectValue);
    if (value === INVALID) continue;
    node.items.push({
      key,
      value
    });
  }
  return node;
}
function jsToAst(input, schema, options = {}) {
  const root = build({
    representTypes: buildRepresentTypes(schema),
    noRefs: options.noRefs ?? false,
    skipInvalid: options.skipInvalid ?? false,
    refs: /* @__PURE__ */ new Map(),
    refCounter: 0
  }, input);
  return [{
    contents: root === INVALID ? null : root,
    directives: []
  }];
}
var VISIT_BREAK = /* @__PURE__ */ Symbol("visit:break");
var VISIT_SKIP = /* @__PURE__ */ Symbol("visit:skip");
function visitNode(node, visitor, ctx) {
  const control = visitor(node, ctx);
  if (control === VISIT_BREAK) return true;
  if (control === VISIT_SKIP) return false;
  const depth = ctx.depth + 1;
  switch (node.kind) {
    case "sequence":
      for (const item of node.items) if (visitNode(item, visitor, {
        depth,
        parent: node,
        isKey: false
      })) return true;
      break;
    case "mapping":
      for (const { key, value } of node.items) {
        if (visitNode(key, visitor, {
          depth,
          parent: node,
          isKey: true
        })) return true;
        if (visitNode(value, visitor, {
          depth,
          parent: node,
          isKey: false
        })) return true;
      }
  }
  return false;
}
function visit(documents, visitor) {
  for (const doc of documents) if (doc.contents && visitNode(doc.contents, visitor, {
    depth: 0,
    parent: null,
    isKey: false
  })) return;
}
function hasBit(mask, bit) {
  return (mask & 1 << bit) !== 0;
}
var DEFAULT_SCALAR_STYLE_RULES = {
  applyQuoteFlowKeysOption,
  doubleQuoteForInvisibles,
  doubleQuoteWhitespaceOnly,
  applyForceQuotesOption,
  tryLongOrMultilineAsBlock,
  quoteInvalidPlain,
  fallbackToDoubleQuoted
};
function _preferredQuotedStyle(layout) {
  if (layout.presenterOptions.quoteStyle === "single" && hasBit(layout.allowedStylesMask, SCALAR_STYLE.SINGLE_QUOTED)) return SCALAR_STYLE.SINGLE_QUOTED;
  return SCALAR_STYLE.DOUBLE_QUOTED;
}
function applyQuoteFlowKeysOption(layout) {
  if (!layout.presenterOptions.quoteFlowKeys) return;
  if (!layout.isKey || !layout.flowOnly || layout.style !== SCALAR_STYLE.PLAIN) return;
  layout.style = SCALAR_STYLE.DOUBLE_QUOTED;
}
function doubleQuoteForInvisibles(layout) {
  if (layout.style === SCALAR_STYLE.PLAIN && /[\t\x7F-\xA0\u2028\u2029\uFEFF\uFFFE\uFFFF]/.test(layout.node.value)) layout.style = SCALAR_STYLE.DOUBLE_QUOTED;
}
function doubleQuoteWhitespaceOnly(layout) {
  if (layout.style === SCALAR_STYLE.PLAIN && /^\s+$/.test(layout.node.value)) layout.style = SCALAR_STYLE.DOUBLE_QUOTED;
}
function applyForceQuotesOption(layout) {
  if (!layout.presenterOptions.forceQuotes) return;
  if (layout.isKey || layout.style !== SCALAR_STYLE.PLAIN) return;
  if (layout.node.tag !== layout.presenterOptions.schema.defaultScalarTag.tagName) return;
  layout.style = layout.node.value.includes("\n") ? SCALAR_STYLE.DOUBLE_QUOTED : _preferredQuotedStyle(layout);
}
function tryLongOrMultilineAsBlock(layout) {
  if (layout.style !== SCALAR_STYLE.PLAIN || layout.isKey) return;
  const value = layout.node.value;
  const multiline = value.indexOf("\n") !== -1;
  if (!hasBit(layout.allowedStylesMask, SCALAR_STYLE.LITERAL_BLOCK)) {
    if (multiline) layout.style = SCALAR_STYLE.DOUBLE_QUOTED;
    return;
  }
  const w = layout.presenterOptions.lineWidth;
  if (w === -1) {
    if (multiline) layout.style = SCALAR_STYLE.LITERAL_BLOCK;
    return;
  }
  const availableWidth = Math.max(Math.min(w, 40), w - layout.shiftOfContent);
  let position = 0;
  let shouldFold = false;
  while (position <= value.length) {
    let lineEnd = value.length;
    const nextLineBreak = value.indexOf("\n", position);
    if (nextLineBreak !== -1) lineEnd = nextLineBreak;
    const line = value.slice(position, lineEnd);
    if (line.length > availableWidth && line[0] !== " " && / [^ \t]/.test(line)) shouldFold = true;
    if (nextLineBreak === -1) break;
    position = nextLineBreak + 1;
  }
  if (shouldFold) layout.style = SCALAR_STYLE.FOLDED_BLOCK;
  else if (multiline) layout.style = SCALAR_STYLE.LITERAL_BLOCK;
}
function quoteInvalidPlain(layout) {
  if (layout.style === SCALAR_STYLE.PLAIN && !hasBit(layout.allowedStylesMask, SCALAR_STYLE.PLAIN)) layout.style = _preferredQuotedStyle(layout);
}
function fallbackToDoubleQuoted(layout) {
  if (!hasBit(layout.allowedStylesMask, layout.style)) layout.style = SCALAR_STYLE.DOUBLE_QUOTED;
}
function setBit(mask, bit) {
  return mask | 1 << bit;
}
var SRC_C_PRINTABLE = "[\\x09\\x0A\\x0D\\x20-\\x7E\\x85\\xA0-\\uD7FF\\uE000-\\uFFFD\\u{10000}-\\u{10FFFF}]";
var SRC_B_CHAR = "[\\n\\r]";
var SRC_C_BYTE_ORDER_MARK = "\\uFEFF";
var SRC_S_WHITE = "[ \\t]";
var SRC_NB_CHAR = `(?:(?!(?:${SRC_B_CHAR}|${SRC_C_BYTE_ORDER_MARK}))${SRC_C_PRINTABLE})`;
var SRC_NS_CHAR = `(?:(?!${SRC_S_WHITE})${SRC_NB_CHAR})`;
var SRC_NB_JSON = "[\\x09\\x20-\\uD7FF\\uE000-\\uFFFF\\u{10000}-\\u{10FFFF}]";
var SRC_C_INDICATOR = "[-?:,\\[\\]{}#&*!|>'\"%@`]";
var SRC_C_FLOW_INDICATOR = "[,\\[\\]{}]";
var SRC_NS_PLAIN_SAFE_FLOW_OUT = SRC_NS_CHAR;
var SRC_NS_PLAIN_SAFE_FLOW_IN = `(?:(?!${SRC_C_FLOW_INDICATOR})${SRC_NS_CHAR})`;
var SRC_NS_PLAIN_FIRST_FLOW_OUT = `(?:(?:(?!${SRC_C_INDICATOR})${SRC_NS_CHAR})|[?:-](?=${SRC_NS_PLAIN_SAFE_FLOW_OUT}))`;
var SRC_NS_PLAIN_FIRST_FLOW_IN = `(?:(?:(?!${SRC_C_INDICATOR})${SRC_NS_CHAR})|[?:-](?=${SRC_NS_PLAIN_SAFE_FLOW_IN}))`;
var SRC_NS_PLAIN_CHAR_FLOW_OUT = `(?:(?:(?![:#])${SRC_NS_PLAIN_SAFE_FLOW_OUT})|:(?=${SRC_NS_PLAIN_SAFE_FLOW_OUT}))#*`;
var SRC_NS_PLAIN_CHAR_FLOW_IN = `(?:(?:(?![:#])${SRC_NS_PLAIN_SAFE_FLOW_IN})|:(?=${SRC_NS_PLAIN_SAFE_FLOW_IN}))#*`;
var SRC_NB_NS_PLAIN_IN_LINE_FLOW_OUT = `(?:${SRC_S_WHITE}*${SRC_NS_PLAIN_CHAR_FLOW_OUT})*`;
var SRC_NB_NS_PLAIN_IN_LINE_FLOW_IN = `(?:${SRC_S_WHITE}*${SRC_NS_PLAIN_CHAR_FLOW_IN})*`;
var SRC_NS_PLAIN_ONE_LINE_FLOW_OUT = `${SRC_NS_PLAIN_FIRST_FLOW_OUT}#*${SRC_NB_NS_PLAIN_IN_LINE_FLOW_OUT}`;
var SRC_NS_PLAIN_ONE_LINE_FLOW_IN = `${SRC_NS_PLAIN_FIRST_FLOW_IN}#*${SRC_NB_NS_PLAIN_IN_LINE_FLOW_IN}`;
var SRC_NS_PLAIN_ONE_LINE_BLOCK_KEY = SRC_NS_PLAIN_ONE_LINE_FLOW_OUT;
var SRC_NS_PLAIN_ONE_LINE_FLOW_KEY = SRC_NS_PLAIN_ONE_LINE_FLOW_IN;
var SRC_S_NS_PLAIN_NEXT_LINE_FLOW_OUT = `\\n+${SRC_NS_PLAIN_CHAR_FLOW_OUT}${SRC_NB_NS_PLAIN_IN_LINE_FLOW_OUT}`;
var SRC_S_NS_PLAIN_NEXT_LINE_FLOW_IN = `\\n+${SRC_NS_PLAIN_CHAR_FLOW_IN}${SRC_NB_NS_PLAIN_IN_LINE_FLOW_IN}`;
var SRC_NS_PLAIN_MULTI_LINE_FLOW_OUT = `${SRC_NS_PLAIN_ONE_LINE_FLOW_OUT}(?:${SRC_S_NS_PLAIN_NEXT_LINE_FLOW_OUT})*`;
var SRC_NS_PLAIN_MULTI_LINE_FLOW_IN = `${SRC_NS_PLAIN_ONE_LINE_FLOW_IN}(?:${SRC_S_NS_PLAIN_NEXT_LINE_FLOW_IN})*`;
var NS_PLAIN_FLOW_OUT = new RegExp(`^(?:${SRC_NS_PLAIN_MULTI_LINE_FLOW_OUT})$`, "u");
var NS_PLAIN_FLOW_IN = new RegExp(`^(?:${SRC_NS_PLAIN_MULTI_LINE_FLOW_IN})$`, "u");
var NS_PLAIN_BLOCK_KEY = new RegExp(`^(?:${SRC_NS_PLAIN_ONE_LINE_BLOCK_KEY})$`, "u");
var NS_PLAIN_FLOW_KEY = new RegExp(`^(?:${SRC_NS_PLAIN_ONE_LINE_FLOW_KEY})$`, "u");
var NB_SINGLE_ONE_LINE = new RegExp(`^(?:${SRC_NB_JSON})*$`, "u");
var NB_SINGLE_MULTI_LINE = new RegExp(`^(?:${SRC_NB_JSON}|\\n)*$`, "u");
var BLOCK_SCALAR_CONTENT = new RegExp(`^(?:${SRC_NB_CHAR}|\\n)*$`, "u");
var C_FORBIDDEN_FIRST_LINE = /^(?:---|\.\.\.)(?=$|[ \t\n\r])/;
var C_FORBIDDEN_CONTENT = /^(?:---|\.\.\.)(?=$|[ \t\n\r])/m;
function canUsePlain(layout) {
  const str = layout.node.value;
  if (str !== "") {
    if (!(layout.isKey ? layout.flowOnly ? NS_PLAIN_FLOW_KEY : NS_PLAIN_BLOCK_KEY : layout.flowOnly ? NS_PLAIN_FLOW_IN : NS_PLAIN_FLOW_OUT).test(str)) return false;
    if (layout.shiftOfFirstLine === 0 && C_FORBIDDEN_FIRST_LINE.test(str)) return false;
    if (layout.shiftOfContent === 0) {
      const firstLineBreak = str.indexOf("\n");
      if (firstLineBreak !== -1) {
        const content = str.slice(firstLineBreak + 1);
        if (C_FORBIDDEN_CONTENT.test(content)) return false;
      }
    }
  }
  const resolvedTag = layout.presenterOptions.schema.resolveImplicitScalarTag(str).tag.tagName;
  if (!layout.node.tagged && resolvedTag !== layout.node.tag) return false;
  if (!layout.node.tagged && str === "=" && resolvedTag === layout.presenterOptions.schema.defaultScalarTag.tagName) return false;
  return true;
}
function canUseSingleQuoted(layout) {
  const str = layout.node.value;
  if (!(layout.isKey ? NB_SINGLE_ONE_LINE : NB_SINGLE_MULTI_LINE).test(str)) return false;
  if (/[ \t]\n|\n[ \t]/.test(str)) return false;
  if (!layout.isKey && layout.shiftOfContent === 0) {
    const firstLineBreak = str.indexOf("\n");
    if (firstLineBreak !== -1 && C_FORBIDDEN_CONTENT.test(str.slice(firstLineBreak + 1))) return false;
  }
  return true;
}
function canUseBlock(layout) {
  if (layout.flowOnly || !BLOCK_SCALAR_CONTENT.test(layout.node.value)) return false;
  const contentIndent = layout.shiftOfContent - layout.shiftOfParent;
  if (contentIndent < 1) return false;
  if (contentIndent > 9 && /^\n* /.test(layout.node.value)) return false;
  if (layout.shiftOfContent === 0 && C_FORBIDDEN_CONTENT.test(layout.node.value)) return false;
  return true;
}
function detectAllowedStyles(layout) {
  let mask = setBit(0, SCALAR_STYLE.DOUBLE_QUOTED);
  if (canUsePlain(layout)) mask = setBit(mask, SCALAR_STYLE.PLAIN);
  if (canUseSingleQuoted(layout)) mask = setBit(mask, SCALAR_STYLE.SINGLE_QUOTED);
  if (canUseBlock(layout)) mask = setBit(setBit(mask, SCALAR_STYLE.LITERAL_BLOCK), SCALAR_STYLE.FOLDED_BLOCK);
  layout.allowedStylesMask = mask;
}
function renderScalar(layout) {
  switch (layout.style) {
    case SCALAR_STYLE.PLAIN:
      return renderPlain(layout);
    case SCALAR_STYLE.SINGLE_QUOTED:
      return renderSingleQuoted(layout);
    case SCALAR_STYLE.LITERAL_BLOCK:
      return renderLiteralBlock(layout);
    case SCALAR_STYLE.FOLDED_BLOCK:
      return renderFoldedBlock(layout);
    case SCALAR_STYLE.DOUBLE_QUOTED:
      return renderDoubleQuoted(layout);
  }
}
function renderPlain(layout) {
  return encodeFlowBreaks(layout.node.value, layout.shiftOfContent);
}
function renderSingleQuoted(layout) {
  return `'${encodeFlowBreaks(layout.node.value, layout.shiftOfContent).replace(/'/g, "''")}'`;
}
function renderLiteralBlock(layout) {
  const value = layout.node.value;
  return "|" + blockHeader(value, layout.shiftOfParent, layout.shiftOfContent) + dropEndingNewline(indentString(value, layout.shiftOfContent));
}
function renderFoldedBlock(layout) {
  const value = layout.node.value;
  const w = layout.presenterOptions.lineWidth;
  let availableWidth = Infinity;
  if (w !== -1) availableWidth = Math.max(Math.min(w, 40), w - layout.shiftOfContent);
  return ">" + blockHeader(value, layout.shiftOfParent, layout.shiftOfContent) + dropEndingNewline(indentString(foldBlockScalar(value, availableWidth), layout.shiftOfContent));
}
function renderDoubleQuoted(layout) {
  return `"${escapeString(layout.node.value)}"`;
}
function encodeFlowBreaks(string, shiftOfContent) {
  let nextLF = string.indexOf("\n");
  if (nextLF === -1) return string;
  const pad = " ".repeat(shiftOfContent);
  let result = string.slice(0, nextLF);
  const lineRe = /(\n+)([^\n]*)/g;
  lineRe.lastIndex = nextLF;
  let match;
  while (match = lineRe.exec(string)) {
    const breaks = match[1].length;
    const line = match[2];
    result += "\n".repeat(breaks + 1) + pad + line;
  }
  return result;
}
function indentString(string, spaces) {
  const indent = " ".repeat(spaces);
  let position = 0;
  let result = "";
  const length = string.length;
  while (position < length) {
    let line;
    const next = string.indexOf("\n", position);
    if (next === -1) {
      line = string.slice(position);
      position = length;
    } else {
      line = string.slice(position, next + 1);
      position = next + 1;
    }
    if (line.length && line !== "\n") result += indent;
    result += line;
  }
  return result;
}
function needIndentIndicator(string) {
  return /^\n* /.test(string);
}
function blockHeader(string, shiftOfParent, shiftOfContent) {
  const indentIndicator = needIndentIndicator(string) ? String(shiftOfContent - shiftOfParent) : "";
  const clip = string[string.length - 1] === "\n";
  return `${indentIndicator}${clip && (string[string.length - 2] === "\n" || string === "\n") ? "+" : clip ? "" : "-"}
`;
}
function dropEndingNewline(string) {
  return string[string.length - 1] === "\n" ? string.slice(0, -1) : string;
}
function isMoreIndented(char) {
  return char === " " || char === "	";
}
function foldLine(line, width) {
  if (line === "" || isMoreIndented(line[0])) return line;
  const breakRe = / [^ \t]/g;
  let match;
  let start = 0;
  let end;
  let curr = 0;
  let next = 0;
  let result = "";
  while (match = breakRe.exec(line)) {
    next = match.index;
    if (next - start > width) {
      end = curr > start ? curr : next;
      result += `
${line.slice(start, end)}`;
      start = end + 1;
    }
    curr = next;
  }
  result += "\n";
  if (line.length - start > width && curr > start) result += `${line.slice(start, curr)}
${line.slice(curr + 1)}`;
  else result += line.slice(start);
  return result.slice(1);
}
function foldBlockScalar(string, width) {
  const lineRe = /(\n+)([^\n]*)/g;
  let nextLF = string.indexOf("\n");
  if (nextLF === -1) nextLF = string.length;
  lineRe.lastIndex = nextLF;
  let result = foldLine(string.slice(0, nextLF), width);
  let prevMoreIndented = string[0] === "\n" || isMoreIndented(string[0]);
  let moreIndented;
  let match;
  while (match = lineRe.exec(string)) {
    const prefix = match[1];
    const line = match[2];
    moreIndented = line !== "" && isMoreIndented(line[0]);
    result += prefix + (!prevMoreIndented && !moreIndented && line !== "" ? "\n" : "") + foldLine(line, width);
    prevMoreIndented = moreIndented;
  }
  return result;
}
var CHARACTERS_TO_ESCAPE = /["\\\x00-\x1F\x7F-\xA0\u2028\u2029\uD800-\uDFFF\uFEFF\uFFFE\uFFFF]/gu;
function escapeCharacter(character) {
  switch (character) {
    case "\0":
      return "\\0";
    case "\x07":
      return "\\a";
    case "\b":
      return "\\b";
    case "	":
      return "\\t";
    case "\n":
      return "\\n";
    case "\v":
      return "\\v";
    case "\f":
      return "\\f";
    case "\r":
      return "\\r";
    case "\x1B":
      return "\\e";
    case '"':
      return '\\"';
    case "\\":
      return "\\\\";
    case "\x85":
      return "\\N";
    case "\xA0":
      return "\\_";
    case "\u2028":
      return "\\L";
    case "\u2029":
      return "\\P";
  }
  const code = character.charCodeAt(0);
  const hex = code.toString(16).toUpperCase();
  if (code <= 255) return `\\x${"0".repeat(2 - hex.length)}${hex}`;
  return `\\u${"0".repeat(4 - hex.length)}${hex}`;
}
function escapeString(string) {
  return string.replace(CHARACTERS_TO_ESCAPE, escapeCharacter);
}
var CHAR_LINE_FEED = 10;
var DEFAULT_PRESENTER_OPTIONS = {
  indent: 2,
  seqNoIndent: false,
  seqInlineFirst: true,
  lineWidth: 80,
  flowBracketPadding: false,
  flowSkipCommaSpace: false,
  flowSkipColonSpace: false,
  quoteFlowKeys: false,
  quoteStyle: "single",
  forceQuotes: false,
  scalarStyleRules: Object.keys(DEFAULT_SCALAR_STYLE_RULES).map((name) => Reflect.get(DEFAULT_SCALAR_STYLE_RULES, name)),
  tagBeforeAnchor: false
};
function nodeTagShort(node) {
  return node.tagged ? node.tag : tagNameShort(node.tag);
}
function createPresenterState(options) {
  const opts = {
    ...DEFAULT_PRESENTER_OPTIONS,
    ...options
  };
  if (opts.flowSkipColonSpace) opts.quoteFlowKeys = true;
  return {
    ...opts,
    defaultScalarTagName: opts.schema.defaultScalarTag.tagName,
    openEnded: false
  };
}
function generateNextLine(state, level) {
  return `
${" ".repeat(state.indent * level)}`;
}
function scalarLayout(state, node, parent, level, isKey, flowOnly) {
  return {
    node,
    parent,
    level,
    isKey,
    flowOnly,
    shiftOfParent: level === 0 ? -1 : state.indent * (level - 1),
    shiftOfContent: state.indent * Math.max(1, level),
    shiftOfFirstLine: level === 0 ? 0 : state.indent * level,
    presenterOptions: state,
    allowedStylesMask: 0,
    style: node.style
  };
}
function writeFlowSequence(state, level, node) {
  let result = "";
  for (let index = 0, length = node.items.length; index < length; index += 1) {
    const item = writeNode(state, level, node.items[index], node, {}).text;
    if (index > 0) result += `,${!state.flowSkipCommaSpace ? " " : ""}`;
    result += item;
  }
  const pad = state.flowBracketPadding && node.items.length > 0 ? " " : "";
  return `[${pad}${result}${pad}]`;
}
function writeBlockSequence(state, level, node, compact) {
  let result = "";
  for (let index = 0, length = node.items.length; index < length; index += 1) {
    const item = writeNode(state, level + 1, node.items[index], node, {
      block: true,
      compact: state.seqInlineFirst,
      isblockseq: true
    }).text;
    if (!compact || result !== "") result += generateNextLine(state, level);
    if (item === "" || CHAR_LINE_FEED === item.charCodeAt(0)) result += "-";
    else result += "- ";
    result += item;
  }
  return result;
}
function writeFlowMapping(state, level, node) {
  let result = "";
  for (const { key, value } of node.items) {
    let pairBuffer = "";
    if (result !== "") pairBuffer += `,${!state.flowSkipCommaSpace ? " " : ""}`;
    const keyRender = writeNode(state, level, key, node, { iskey: true });
    const keyText = keyRender.text;
    const valueText = writeNode(state, level, value, node, {}).text;
    const sep = state.flowSkipColonSpace || valueText === "" ? "" : " ";
    const keyIsBareProps = key.kind === "scalar" && keyRender.noBody && (key.tagged || key.anchor !== void 0);
    const keyColonSep = key.kind === "alias" || keyIsBareProps ? " " : "";
    pairBuffer += `${keyText}${keyColonSep}:${sep}${valueText}`;
    result += pairBuffer;
  }
  const pad = state.flowBracketPadding && result !== "" ? " " : "";
  return `{${pad}${result}${pad}}`;
}
function writeBlockMapping(state, level, node, compact) {
  let result = "";
  for (let index = 0, length = node.items.length; index < length; index += 1) {
    let pairBuffer = "";
    if (!compact || result !== "") pairBuffer += generateNextLine(state, level);
    const { key, value } = node.items[index];
    const keyIsBlock = (key.kind === "mapping" || key.kind === "sequence") && key.style === COLLECTION_STYLE.BLOCK && key.items.length !== 0 || key.kind === "scalar" && (key.style === SCALAR_STYLE.LITERAL_BLOCK || key.style === SCALAR_STYLE.FOLDED_BLOCK);
    const keyRender = keyIsBlock ? writeNode(state, level + 1, key, node, {
      block: true,
      compact: true,
      isblockseq: !cannotBeCompact(state, key, level + 1)
    }) : writeNode(state, level + 1, key, node, {
      block: true,
      compact: true,
      iskey: true
    });
    const keyText = keyRender.text;
    const keyHasLineBreak = key.kind === "scalar" && key.value.indexOf("\n") !== -1;
    const keyIsTooLong = keyText.length > 1024 && /^[\s\S]{1025}/u.test(keyText);
    const explicitPair = keyIsBlock || keyHasLineBreak || keyIsTooLong;
    if (explicitPair) {
      if (keyText && CHAR_LINE_FEED === keyText.charCodeAt(0)) pairBuffer += "?";
      else pairBuffer += "? ";
    }
    pairBuffer += keyText;
    if (explicitPair) pairBuffer += generateNextLine(state, level);
    const valueText = writeNode(state, level + 1, value, node, {
      block: true,
      compact: explicitPair,
      isblockseq: explicitPair && !cannotBeCompact(state, value, level + 1)
    }).text;
    const keyIsBareProps = key.kind === "scalar" && keyRender.noBody && (key.tagged || key.anchor !== void 0);
    const keyColonSep = !explicitPair && (key.kind === "alias" || keyIsBareProps) ? " " : "";
    if (valueText === "" || CHAR_LINE_FEED === valueText.charCodeAt(0)) pairBuffer += `${keyColonSep}:`;
    else pairBuffer += `${keyColonSep}: `;
    pairBuffer += valueText;
    result += pairBuffer;
  }
  return result;
}
function cannotBeCompact(state, node, level) {
  if (node.kind === "alias") return true;
  return node.tagged || node.anchor !== void 0 || state.indent < 2 && level > 0;
}
function writeNode(state, level, node, parent, ctx) {
  if (node.kind === "alias") {
    state.openEnded = false;
    return {
      text: `*${node.anchor}`,
      noBody: false
    };
  }
  const { block = false, iskey = false, isblockseq = false } = ctx;
  let compact = ctx.compact ?? false;
  const hasAnchor = node.anchor !== void 0;
  if (cannotBeCompact(state, node, level)) compact = false;
  let body;
  let shouldPrintTag = node.tagged;
  const useBlockCollection = block && (node.kind === "mapping" || node.kind === "sequence") && node.style === COLLECTION_STYLE.BLOCK && node.items.length !== 0;
  if (node.kind === "mapping") {
    if (useBlockCollection) body = writeBlockMapping(state, level, node, compact);
    else body = writeFlowMapping(state, level, node);
  } else if (node.kind === "sequence") {
    if (useBlockCollection) {
      if (state.seqNoIndent && !isblockseq && level > 0) body = writeBlockSequence(state, level - 1, node, compact);
      else body = writeBlockSequence(state, level, node, compact);
    } else body = writeFlowSequence(state, level, node);
  } else {
    const layout = scalarLayout(state, node, parent, level, iskey, !block);
    detectAllowedStyles(layout);
    for (const rule of state.scalarStyleRules) rule(layout);
    body = renderScalar(layout);
    state.openEnded = (layout.style === SCALAR_STYLE.LITERAL_BLOCK || layout.style === SCALAR_STYLE.FOLDED_BLOCK) && (node.value === "\n" || node.value.endsWith("\n\n"));
    shouldPrintTag = node.tagged || body === "" && layout.flowOnly && parent?.kind === "sequence" && !hasAnchor || layout.style !== SCALAR_STYLE.PLAIN && node.tag !== state.defaultScalarTagName;
  }
  if ((node.kind === "mapping" || node.kind === "sequence") && !useBlockCollection) state.openEnded = false;
  if (useBlockCollection && compact && level > 0 && state.indent > 2) body = `${" ".repeat(state.indent - 2)}${body}`;
  const noBody = body === "";
  let text = body;
  if (shouldPrintTag || hasAnchor) {
    const props = [];
    const tag = shouldPrintTag ? nodeTagShort(node) : null;
    const anchor = hasAnchor ? `&${node.anchor}` : null;
    if (state.tagBeforeAnchor) {
      if (tag !== null) props.push(tag);
      if (anchor !== null) props.push(anchor);
    } else {
      if (anchor !== null) props.push(anchor);
      if (tag !== null) props.push(tag);
    }
    const sep = body === "" || body.charCodeAt(0) === CHAR_LINE_FEED ? "" : " ";
    text = `${props.join(" ")}${sep}${body}`;
  }
  return {
    text,
    noBody
  };
}
function rootStartsOwnLine(node) {
  return (node.kind === "sequence" || node.kind === "mapping") && node.style === COLLECTION_STYLE.BLOCK && node.items.length !== 0 && !node.tagged && node.anchor === void 0;
}
function writeDocumentDirectives(doc) {
  let result = "";
  for (const directive of doc.directives) {
    if (directive.kind === "yaml") {
      result += `%YAML ${directive.version}
`;
      continue;
    }
    const { handle, prefix } = directive;
    result += `%TAG ${handle} ${prefix}
`;
  }
  return result;
}
function present(documents, options) {
  const state = createPresenterState(options);
  let result = "";
  let previousEnded = false;
  for (let index = 0; index < documents.length; index += 1) {
    const doc = documents[index];
    state.openEnded = false;
    const directives = writeDocumentDirectives(doc);
    const hasDirectives = directives !== "";
    const marker = doc.explicitStart || hasDirectives || index > 0 && !previousEnded;
    result += directives;
    if (doc.contents === null) {
      if (marker) result += "---\n";
    } else if (marker) {
      const body = writeNode(state, 0, doc.contents, null, {
        block: true,
        compact: true
      }).text;
      const sep = body === "" ? "" : hasDirectives || rootStartsOwnLine(doc.contents) ? "\n" : " ";
      result += `---${sep}${body}
`;
    } else result += writeNode(state, 0, doc.contents, null, {
      block: true,
      compact: true
    }).text + "\n";
    previousEnded = doc.explicitEnd || state.openEnded;
    if (previousEnded) result += "...\n";
  }
  return result;
}
var DEFAULT_DUMP_OPTIONS = {
  ...DEFAULT_PRESENTER_OPTIONS,
  schema: DUMP_SCHEMA,
  skipInvalid: false,
  noRefs: false,
  flowLevel: -1,
  sortKeys: false,
  transform: () => {
  }
};
function defaultCompareFn(a, b) {
  const x = String(a);
  const y = String(b);
  if (x < y) return -1;
  if (x > y) return 1;
  return 0;
}
function dump(input, options = {}) {
  const opts = {
    ...DEFAULT_DUMP_OPTIONS,
    ...options
  };
  const documents = jsToAst(input, opts.schema, {
    noRefs: opts.noRefs,
    skipInvalid: opts.skipInvalid
  });
  if (opts.flowLevel >= 0) visit(documents, (node, ctx) => {
    if (ctx.depth < opts.flowLevel) return;
    if (node.kind === "sequence" || node.kind === "mapping") node.style = COLLECTION_STYLE.FLOW;
    return VISIT_SKIP;
  });
  if (opts.sortKeys) {
    const compareFn = opts.sortKeys === true ? defaultCompareFn : opts.sortKeys;
    visit(documents, (node) => {
      if (node.kind !== "mapping") return;
      node.items.sort((a, b) => compareFn(a.key.kind === "scalar" ? a.key.value : "", b.key.kind === "scalar" ? b.key.value : ""));
    });
  }
  opts.transform(documents);
  return present(documents, {
    ...pick(opts, Object.keys(DEFAULT_PRESENTER_OPTIONS)),
    schema: opts.schema
  });
}
var EVENT_DOCUMENT = EVENT_ID.DOCUMENT;
var EVENT_SEQUENCE = EVENT_ID.SEQUENCE;
var EVENT_MAPPING = EVENT_ID.MAPPING;
var EVENT_SCALAR = EVENT_ID.SCALAR;
var EVENT_ALIAS = EVENT_ID.ALIAS;
var EVENT_POP = EVENT_ID.POP;
var SCALAR_STYLE_PLAIN = SCALAR_STYLE.PLAIN;
var SCALAR_STYLE_SINGLE_QUOTED = SCALAR_STYLE.SINGLE_QUOTED;
var SCALAR_STYLE_DOUBLE_QUOTED = SCALAR_STYLE.DOUBLE_QUOTED;
var SCALAR_STYLE_LITERAL_BLOCK = SCALAR_STYLE.LITERAL_BLOCK;
var SCALAR_STYLE_FOLDED_BLOCK = SCALAR_STYLE.FOLDED_BLOCK;
var COLLECTION_STYLE_BLOCK = COLLECTION_STYLE.BLOCK;
var COLLECTION_STYLE_FLOW = COLLECTION_STYLE.FLOW;
var CHOMPING_CLIP = CHOMPING_MODE.CLIP;
var CHOMPING_STRIP = CHOMPING_MODE.STRIP;
var CHOMPING_KEEP = CHOMPING_MODE.KEEP;

// src/skeleton_clash.json
var skeleton_clash_default = {
  dns: {
    enable: true,
    ipv6: true,
    "use-hosts": true,
    "cache-algorithm": "arc",
    "prefer-h3": false,
    "use-system-hosts": true,
    "enhanced-mode": "fake-ip",
    "fake-ip-range": "198.18.0.1/15",
    "fake-ip-range6": "2001:2::1/48",
    "fake-ip-filter": [
      "rule-set:private",
      "rule-set:fakeip_filter",
      "rule-set:geolocation-cn",
      "rule-set:googlefcm"
    ],
    "default-nameserver": [
      "tls://223.5.5.5#DIRECT",
      "https://1.12.12.12/dns-query#DIRECT"
    ],
    "proxy-server-nameserver": [
      "tls://223.5.5.5#DIRECT",
      "https://doh.pub/dns-query#DIRECT"
    ],
    nameserver: [
      "https://cloudflare-dns.com/dns-query#\u9ED8\u8BA4\u4EE3\u7406",
      "https://dns.google/dns-query#\u9ED8\u8BA4\u4EE3\u7406"
    ],
    "nameserver-policy": {
      "rule-set:cn": [
        "https://223.5.5.5/dns-query#DIRECT",
        "https://1.12.12.12/dns-query#DIRECT"
      ]
    },
    "direct-nameserver": [
      "https://223.5.5.5/dns-query#DIRECT",
      "https://1.12.12.12/dns-query#DIRECT"
    ],
    "fake-ip-filter-mode": "blacklist",
    "respect-rules": false
  },
  hosts: {
    "dns.alidns.com": [
      "223.5.5.5",
      "223.6.6.6",
      "2400:3200::1",
      "2400:3200:baba::1"
    ],
    "doh.pub": [
      "1.12.12.12",
      "120.53.53.53"
    ],
    "dns.google": [
      "8.8.8.8",
      "8.8.4.4"
    ],
    "cloudflare-dns.com": [
      "1.1.1.1",
      "1.0.0.1"
    ],
    "services.googleapis.cn": "services.googleapis.com",
    "+.mcdn.bilivideo.com": [
      "0.0.0.0"
    ],
    "+.mcdn.bilivideo.cn": [
      "0.0.0.0"
    ],
    "+.edge.mountaintoys.cn": [
      "0.0.0.0"
    ],
    "+.h2.smtcdns.net": [
      "0.0.0.0"
    ]
  },
  "mixed-port": 7890,
  "allow-lan": false,
  "bind-address": "127.0.0.1",
  ipv6: true,
  mode: "rule",
  "log-level": "info",
  "unified-delay": true,
  "tcp-concurrent": true,
  "keep-alive-interval": 15,
  "keep-alive-idle": 15,
  "disable-keep-alive": false,
  "find-process-mode": "strict",
  "etag-support": true,
  "external-controller": "127.0.0.1:9090",
  "external-ui": "ui",
  "external-ui-url": "https://github.com/Zephyruso/zashboard/releases/download/v3.29.1/dist.zip",
  "geodata-mode": false,
  "geodata-loader": "memconservative",
  "geosite-matcher": "succinct",
  "geo-auto-update": true,
  "geo-update-interval": 168,
  "geox-url": {
    geoip: "__PUBLIC_ORIGIN__/rules/clash/geoip.dat",
    geosite: "__PUBLIC_ORIGIN__/rules/clash/geosite.dat",
    mmdb: "__PUBLIC_ORIGIN__/rules/clash/geoip.metadb",
    asn: "__PUBLIC_ORIGIN__/rules/clash/GeoLite2-ASN.mmdb"
  },
  profile: {
    "store-selected": true,
    "store-fake-ip": true
  },
  ntp: {
    enable: false,
    "write-to-system": false,
    server: "ntp.aliyun.com",
    port: 123,
    interval: 30
  },
  experimental: {
    "quic-go-disable-gso": false,
    "quic-go-disable-ecn": false
  },
  "external-controller-cors": {
    "allow-origins": [
      "http://127.0.0.1:9090",
      "https://127.0.0.1:9090",
      "http://localhost:9090",
      "https://localhost:9090"
    ],
    "allow-private-network": false
  },
  sniffer: {
    enable: true,
    "force-dns-mapping": true,
    "parse-pure-ip": true,
    "override-destination": false,
    sniff: {
      HTTP: {
        ports: [
          "80",
          "8080-8880"
        ],
        "override-destination": true
      },
      TLS: {
        ports: [
          "443",
          "8443"
        ]
      },
      QUIC: {
        ports: [
          "443",
          "8443"
        ]
      }
    },
    "force-domain": [
      "+.google.com",
      "+.youtube.com",
      "+.telegram.org",
      "+.openai.com",
      "+.anthropic.com",
      "+.claude.ai",
      "+.claude.com",
      "+.claude.dev",
      "+.claudeusercontent.com",
      "+.twitter.com",
      "+.x.com",
      "+.googlevideo.com",
      "+.ytimg.com",
      "+.chatgpt.com"
    ],
    "skip-dst-address": [
      "91.105.192.0/23",
      "91.108.4.0/22",
      "91.108.8.0/21",
      "91.108.16.0/21",
      "91.108.56.0/22",
      "95.161.64.0/20",
      "149.154.160.0/20",
      "185.76.151.0/24",
      "2001:b28:f23d::/48",
      "2001:b28:f23f::/48",
      "2001:67c:4e8::/48"
    ],
    "skip-domain": [
      "geosite:cn",
      "geosite:geolocation-cn",
      "geosite:category-ads-all",
      "geosite:category-games-cn",
      "+.gstatic.com",
      "+.msftconnecttest.com",
      "+.msftncsi.com",
      "+.captive.apple.com",
      "+.router.asus.com",
      "+.tplogin.cn",
      "+.hiwifi.com",
      "+.phicomm.me",
      "+.local",
      "+.lan",
      "+.home.arpa",
      "+.unionpay.com",
      "+.95516.com",
      "+.alipay.com",
      "+.alipayobjects.com",
      "+.tenpay.com",
      "+.wechatpay.cn",
      "+.abchina.com",
      "+.abchina.com.cn",
      "+.icbc.com.cn",
      "+.ccb.com",
      "+.boc.cn",
      "+.bankofchina.com",
      "+.cmbchina.com",
      "+.bankcomm.com",
      "+.psbc.com",
      "+.spdb.com.cn",
      "+.cib.com.cn",
      "+.cmbc.com.cn",
      "+.pingan.com",
      "+.cgbchina.com.cn",
      "+.hxb.com.cn",
      "+.cebbank.com",
      "+.citicbank.com",
      "+.ecitic.com",
      "+.gfbazc.com",
      "+.fzuol.com",
      "+.netsunion.org.cn",
      "+.tongdun.net",
      "+.ishumei.com",
      "+.geetest.com",
      "+.trustdevice.net",
      "+.rongcloud.cn",
      "+.rongcloud.com",
      "+.umeng.com",
      "+.umengcloud.com",
      "+.tongduncdn.com",
      "+.dingxiangyun.com",
      "+.dingxiangyun.cn",
      "+.rong360.com",
      "+.99bill.com",
      "+.chinapay.com",
      "+.yeepay.com",
      "+.jdpay.com",
      "+.unionpaysecure.com",
      "+.pingan.com.cn",
      "+.aegis.qq.com",
      "+.riskradar.net",
      "+.cpic.com.cn",
      "+.zhongan.com",
      "+.eastmoney.com",
      "+.htsc.com.cn",
      "+.gtja.com",
      "+.jpush.cn",
      "+.jpush.io",
      "+.jiguang.cn",
      "+.weixin.qq.com",
      "+.wx.qq.com",
      "+.servicewechat.com",
      "+.12306.cn",
      "+.railway12306.cn",
      "+.chinatax.gov.cn",
      "+.fuwu.nhsa.gov.cn",
      "+.gjzwfw.gov.cn",
      "+.xiaojukeji.com",
      "+.didichuxing.com",
      "+.work.weixin.qq.com",
      "+.meeting.tencent.com",
      "+.taobao.com",
      "+.jd.com",
      "+.pinduoduo.com",
      "+.meituan.com",
      "+.dianping.com",
      "+.ele.me",
      "+.amap.com",
      "+.baidu.com",
      "+.xiaohongshu.com",
      "+.kuaishou.com",
      "+.163.com",
      "+.weibo.com",
      "+.zhihu.com",
      "+.ctrip.com",
      "+.qunar.com",
      "+.sf-express.com",
      "+.dingtalk.com",
      "+.feishu.cn",
      "+.xuexi.cn",
      "+.chsi.com.cn"
    ]
  },
  tun: {
    enable: true,
    stack: "mips",
    "congestion-controller": "bbr",
    "auto-route": true,
    "strict-route": true,
    "auto-redirect": true,
    "auto-detect-interface": true,
    "dns-hijack": [
      "0.0.0.0:53"
    ],
    "udp-timeout": 300,
    "route-exclude-address": [
      "127.0.0.0/8",
      "::1/128"
    ]
  },
  proxies: [
    "@NODES@",
    {
      name: "\u{1F1E8}\u{1F1F3} \u76F4\u8FDE | \u53CC\u6808",
      type: "direct"
    },
    {
      name: "\u{1F1E8}\u{1F1F3} \u76F4\u8FDE | IPv4\u4F18\u5148",
      type: "direct",
      "ip-version": "ipv4-prefer"
    },
    {
      name: "\u{1F1E8}\u{1F1F3} \u76F4\u8FDE | IPv6\u4F18\u5148",
      type: "direct",
      "ip-version": "ipv6-prefer"
    },
    {
      name: "\u{1F1E8}\u{1F1F3} \u76F4\u8FDE | \u4EC5IPv4",
      type: "direct",
      "ip-version": "ipv4"
    },
    {
      name: "\u{1F1E8}\u{1F1F3} \u76F4\u8FDE | \u4EC5IPv6",
      type: "direct",
      "ip-version": "ipv6"
    }
  ],
  "proxy-groups": [
    {
      name: "\u26D3 \u51FA\u53E3\u4F18\u9009",
      type: "url-test",
      url: "https://www.gstatic.com/generate_204",
      interval: 60,
      tolerance: 100,
      lazy: false,
      timeout: 5e3,
      "max-failed-times": 3,
      proxies: [
        "@EXITS@"
      ]
    },
    {
      name: "\u26D3 \u5165\u53E3\u4F18\u9009",
      type: "url-test",
      url: "https://www.gstatic.com/generate_204",
      interval: 60,
      tolerance: 100,
      lazy: false,
      timeout: 5e3,
      "max-failed-times": 3,
      proxies: [
        "@ENTRIES@"
      ]
    },
    {
      interval: 600,
      timeout: 3e3,
      url: "https://www.apple.com/library/test/success.html",
      lazy: true,
      "max-failed-times": 3,
      "empty-fallback": "REJECT",
      type: "select",
      name: "GLOBAL",
      proxies: [
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u624B\u52A8\u9009\u62E9",
        "\u81EA\u52A8\u9009\u62E9",
        "\u8D1F\u8F7D\u5747\u8861",
        "\u6545\u969C\u8F6C\u79FB",
        "FCM",
        "YouTube",
        "Google",
        "Claude",
        "AI",
        "GitHub",
        "Microsoft",
        "Apple",
        "Telegram",
        "Steam",
        "TikTok",
        "Twitter",
        "Meta",
        "Line",
        "Netflix",
        "Emby",
        "PikPak",
        "Spotify",
        "Crypto",
        "EHentai",
        "\u8FDC\u63A7\u5DE5\u5177",
        "AdBlock",
        "\u6F0F\u7F51\u4E4B\u9C7C",
        "\u26D3 \u51FA\u53E3\u4F18\u9009"
      ],
      icon: "https://fastly.jsdelivr.net/gh/dukangalex/HiClash@assets-v1/Icons/svg/Global.svg"
    },
    {
      interval: 600,
      timeout: 3e3,
      url: "https://www.apple.com/library/test/success.html",
      lazy: true,
      "max-failed-times": 3,
      "empty-fallback": "REJECT",
      type: "select",
      name: "\u9ED8\u8BA4\u4EE3\u7406",
      proxies: [
        "\u26D3 \u51FA\u53E3\u4F18\u9009",
        "\u26D3 \u5165\u53E3\u4F18\u9009",
        "\u624B\u52A8\u9009\u62E9",
        "\u81EA\u52A8\u9009\u62E9",
        "\u8D1F\u8F7D\u5747\u8861",
        "\u6545\u969C\u8F6C\u79FB"
      ],
      icon: "https://fastly.jsdelivr.net/gh/dukangalex/HiClash@assets-v1/Icons/svg/Proxy.svg"
    },
    {
      interval: 600,
      timeout: 3e3,
      url: "https://www.apple.com/library/test/success.html",
      lazy: true,
      "max-failed-times": 3,
      "empty-fallback": "REJECT",
      type: "select",
      name: "\u624B\u52A8\u9009\u62E9",
      proxies: [
        "@ALL@"
      ],
      icon: "https://fastly.jsdelivr.net/gh/dukangalex/HiClash@assets-v1/Icons/svg/Static.svg"
    },
    {
      interval: 600,
      timeout: 3e3,
      url: "https://www.apple.com/library/test/success.html",
      lazy: true,
      "max-failed-times": 3,
      "empty-fallback": "REJECT",
      type: "url-test",
      tolerance: 50,
      "exclude-type": "DIRECT",
      hidden: true,
      name: "\u81EA\u52A8\u9009\u62E9",
      proxies: [
        "@EXITS@"
      ],
      icon: "https://fastly.jsdelivr.net/gh/dukangalex/HiClash@assets-v1/Icons/svg/Auto.svg"
    },
    {
      interval: 600,
      timeout: 3e3,
      url: "https://www.apple.com/library/test/success.html",
      lazy: true,
      "max-failed-times": 3,
      "empty-fallback": "REJECT",
      type: "load-balance",
      strategy: "sticky-sessions",
      "exclude-type": "DIRECT",
      hidden: true,
      name: "\u8D1F\u8F7D\u5747\u8861",
      proxies: [
        "@EXITS@"
      ],
      icon: "https://fastly.jsdelivr.net/gh/dukangalex/HiClash@assets-v1/Icons/svg/RoundRobin.svg"
    },
    {
      interval: 600,
      timeout: 3e3,
      url: "https://www.apple.com/library/test/success.html",
      lazy: true,
      "max-failed-times": 3,
      "empty-fallback": "REJECT",
      type: "fallback",
      "exclude-type": "DIRECT",
      name: "\u6545\u969C\u8F6C\u79FB",
      proxies: [
        "@EXITS@"
      ],
      icon: "https://fastly.jsdelivr.net/gh/dukangalex/HiClash@assets-v1/Icons/svg/Auto.svg"
    },
    {
      interval: 600,
      timeout: 3e3,
      url: "https://www.apple.com/library/test/success.html",
      lazy: true,
      "max-failed-times": 3,
      "empty-fallback": "REJECT",
      type: "select",
      name: "FCM",
      proxies: [
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u624B\u52A8\u9009\u62E9",
        "\u81EA\u52A8\u9009\u62E9",
        "\u8D1F\u8F7D\u5747\u8861",
        "\u6545\u969C\u8F6C\u79FB",
        "\u26D3 \u51FA\u53E3\u4F18\u9009"
      ],
      icon: "https://fastly.jsdelivr.net/gh/dukangalex/HiClash@assets-v1/Icons/svg/Fcm.svg"
    },
    {
      interval: 600,
      timeout: 3e3,
      url: "https://www.apple.com/library/test/success.html",
      lazy: true,
      "max-failed-times": 3,
      "empty-fallback": "REJECT",
      type: "select",
      name: "YouTube",
      proxies: [
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u624B\u52A8\u9009\u62E9",
        "\u81EA\u52A8\u9009\u62E9",
        "\u8D1F\u8F7D\u5747\u8861",
        "\u6545\u969C\u8F6C\u79FB",
        "\u26D3 \u51FA\u53E3\u4F18\u9009"
      ],
      icon: "https://fastly.jsdelivr.net/gh/dukangalex/HiClash@assets-v1/Icons/svg/YouTube.svg"
    },
    {
      interval: 600,
      timeout: 3e3,
      url: "https://www.apple.com/library/test/success.html",
      lazy: true,
      "max-failed-times": 3,
      "empty-fallback": "REJECT",
      type: "select",
      name: "Google",
      proxies: [
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u624B\u52A8\u9009\u62E9",
        "\u81EA\u52A8\u9009\u62E9",
        "\u8D1F\u8F7D\u5747\u8861",
        "\u6545\u969C\u8F6C\u79FB",
        "\u26D3 \u51FA\u53E3\u4F18\u9009"
      ],
      icon: "https://fastly.jsdelivr.net/gh/dukangalex/HiClash@assets-v1/Icons/svg/Google.svg"
    },
    {
      interval: 600,
      timeout: 3e3,
      url: "https://www.apple.com/library/test/success.html",
      lazy: true,
      "max-failed-times": 3,
      "empty-fallback": "REJECT",
      type: "select",
      name: "Claude",
      proxies: [
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u624B\u52A8\u9009\u62E9",
        "\u81EA\u52A8\u9009\u62E9",
        "\u8D1F\u8F7D\u5747\u8861",
        "\u6545\u969C\u8F6C\u79FB",
        "\u26D3 \u51FA\u53E3\u4F18\u9009"
      ],
      "default-selected": "\u7F8E\u56FD",
      icon: "https://fastly.jsdelivr.net/gh/dukangalex/HiClash@assets-v1/Icons/svg/Proxy.svg"
    },
    {
      interval: 600,
      timeout: 3e3,
      url: "https://www.apple.com/library/test/success.html",
      lazy: true,
      "max-failed-times": 3,
      "empty-fallback": "REJECT",
      type: "select",
      name: "AI",
      proxies: [
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u624B\u52A8\u9009\u62E9",
        "\u81EA\u52A8\u9009\u62E9",
        "\u8D1F\u8F7D\u5747\u8861",
        "\u6545\u969C\u8F6C\u79FB",
        "\u26D3 \u51FA\u53E3\u4F18\u9009"
      ],
      "default-selected": "\u7F8E\u56FD",
      icon: "https://fastly.jsdelivr.net/gh/dukangalex/HiClash@assets-v1/Icons/svg/ChatGPT.svg"
    },
    {
      interval: 600,
      timeout: 3e3,
      url: "https://www.apple.com/library/test/success.html",
      lazy: true,
      "max-failed-times": 3,
      "empty-fallback": "REJECT",
      type: "select",
      name: "GitHub",
      proxies: [
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u624B\u52A8\u9009\u62E9",
        "\u81EA\u52A8\u9009\u62E9",
        "\u8D1F\u8F7D\u5747\u8861",
        "\u6545\u969C\u8F6C\u79FB",
        "\u26D3 \u51FA\u53E3\u4F18\u9009"
      ],
      icon: "https://fastly.jsdelivr.net/gh/dukangalex/HiClash@assets-v1/Icons/svg/GitHub.svg"
    },
    {
      interval: 600,
      timeout: 3e3,
      url: "https://www.apple.com/library/test/success.html",
      lazy: true,
      "max-failed-times": 3,
      "empty-fallback": "REJECT",
      type: "select",
      name: "Microsoft",
      proxies: [
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u624B\u52A8\u9009\u62E9",
        "\u81EA\u52A8\u9009\u62E9",
        "\u8D1F\u8F7D\u5747\u8861",
        "\u6545\u969C\u8F6C\u79FB",
        "\u26D3 \u51FA\u53E3\u4F18\u9009"
      ],
      icon: "https://fastly.jsdelivr.net/gh/dukangalex/HiClash@assets-v1/Icons/svg/Microsoft.svg"
    },
    {
      interval: 600,
      timeout: 3e3,
      url: "https://www.apple.com/library/test/success.html",
      lazy: true,
      "max-failed-times": 3,
      "empty-fallback": "REJECT",
      type: "select",
      name: "Apple",
      proxies: [
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u624B\u52A8\u9009\u62E9",
        "\u81EA\u52A8\u9009\u62E9",
        "\u8D1F\u8F7D\u5747\u8861",
        "\u6545\u969C\u8F6C\u79FB",
        "\u26D3 \u51FA\u53E3\u4F18\u9009"
      ],
      icon: "https://fastly.jsdelivr.net/gh/dukangalex/HiClash@assets-v1/Icons/svg/Apple.svg"
    },
    {
      interval: 600,
      timeout: 3e3,
      url: "https://www.apple.com/library/test/success.html",
      lazy: true,
      "max-failed-times": 3,
      "empty-fallback": "REJECT",
      type: "select",
      name: "Telegram",
      proxies: [
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u624B\u52A8\u9009\u62E9",
        "\u81EA\u52A8\u9009\u62E9",
        "\u8D1F\u8F7D\u5747\u8861",
        "\u6545\u969C\u8F6C\u79FB",
        "\u26D3 \u51FA\u53E3\u4F18\u9009"
      ],
      icon: "https://fastly.jsdelivr.net/gh/dukangalex/HiClash@assets-v1/Icons/svg/Telegram.svg"
    },
    {
      interval: 600,
      timeout: 3e3,
      url: "https://www.apple.com/library/test/success.html",
      lazy: true,
      "max-failed-times": 3,
      "empty-fallback": "REJECT",
      type: "select",
      name: "Steam",
      proxies: [
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u624B\u52A8\u9009\u62E9",
        "\u81EA\u52A8\u9009\u62E9",
        "\u8D1F\u8F7D\u5747\u8861",
        "\u6545\u969C\u8F6C\u79FB",
        "\u26D3 \u51FA\u53E3\u4F18\u9009"
      ],
      icon: "https://fastly.jsdelivr.net/gh/dukangalex/HiClash@assets-v1/Icons/svg/Steam.svg"
    },
    {
      interval: 600,
      timeout: 3e3,
      url: "https://www.apple.com/library/test/success.html",
      lazy: true,
      "max-failed-times": 3,
      "empty-fallback": "REJECT",
      type: "select",
      name: "TikTok",
      proxies: [
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u624B\u52A8\u9009\u62E9",
        "\u81EA\u52A8\u9009\u62E9",
        "\u8D1F\u8F7D\u5747\u8861",
        "\u6545\u969C\u8F6C\u79FB",
        "\u26D3 \u51FA\u53E3\u4F18\u9009"
      ],
      "default-selected": "\u65E5\u672C",
      icon: "https://fastly.jsdelivr.net/gh/dukangalex/HiClash@assets-v1/Icons/svg/TikTok.svg"
    },
    {
      interval: 600,
      timeout: 3e3,
      url: "https://www.apple.com/library/test/success.html",
      lazy: true,
      "max-failed-times": 3,
      "empty-fallback": "REJECT",
      type: "select",
      name: "Twitter",
      proxies: [
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u624B\u52A8\u9009\u62E9",
        "\u81EA\u52A8\u9009\u62E9",
        "\u8D1F\u8F7D\u5747\u8861",
        "\u6545\u969C\u8F6C\u79FB",
        "\u26D3 \u51FA\u53E3\u4F18\u9009"
      ],
      icon: "https://fastly.jsdelivr.net/gh/dukangalex/HiClash@assets-v1/Icons/svg/Twitter.svg"
    },
    {
      interval: 600,
      timeout: 3e3,
      url: "https://www.apple.com/library/test/success.html",
      lazy: true,
      "max-failed-times": 3,
      "empty-fallback": "REJECT",
      type: "select",
      name: "Meta",
      proxies: [
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u624B\u52A8\u9009\u62E9",
        "\u81EA\u52A8\u9009\u62E9",
        "\u8D1F\u8F7D\u5747\u8861",
        "\u6545\u969C\u8F6C\u79FB",
        "\u26D3 \u51FA\u53E3\u4F18\u9009"
      ],
      icon: "https://fastly.jsdelivr.net/gh/dukangalex/HiClash@assets-v1/Icons/svg/Meta.svg"
    },
    {
      interval: 600,
      timeout: 3e3,
      url: "https://www.apple.com/library/test/success.html",
      lazy: true,
      "max-failed-times": 3,
      "empty-fallback": "REJECT",
      type: "select",
      name: "Line",
      proxies: [
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u624B\u52A8\u9009\u62E9",
        "\u81EA\u52A8\u9009\u62E9",
        "\u8D1F\u8F7D\u5747\u8861",
        "\u6545\u969C\u8F6C\u79FB",
        "\u26D3 \u51FA\u53E3\u4F18\u9009"
      ],
      icon: "https://fastly.jsdelivr.net/gh/dukangalex/HiClash@assets-v1/Icons/svg/Line.svg"
    },
    {
      interval: 600,
      timeout: 3e3,
      url: "https://www.apple.com/library/test/success.html",
      lazy: true,
      "max-failed-times": 3,
      "empty-fallback": "REJECT",
      type: "select",
      name: "Netflix",
      proxies: [
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u624B\u52A8\u9009\u62E9",
        "\u81EA\u52A8\u9009\u62E9",
        "\u8D1F\u8F7D\u5747\u8861",
        "\u6545\u969C\u8F6C\u79FB",
        "\u26D3 \u51FA\u53E3\u4F18\u9009"
      ],
      icon: "https://fastly.jsdelivr.net/gh/dukangalex/HiClash@assets-v1/Icons/svg/Netflix.svg"
    },
    {
      interval: 600,
      timeout: 3e3,
      url: "https://www.apple.com/library/test/success.html",
      lazy: true,
      "max-failed-times": 3,
      "empty-fallback": "REJECT",
      type: "select",
      name: "Emby",
      proxies: [
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u624B\u52A8\u9009\u62E9",
        "\u81EA\u52A8\u9009\u62E9",
        "\u8D1F\u8F7D\u5747\u8861",
        "\u6545\u969C\u8F6C\u79FB",
        "\u26D3 \u51FA\u53E3\u4F18\u9009"
      ],
      icon: "https://fastly.jsdelivr.net/gh/dukangalex/HiClash@assets-v1/Icons/svg/Emby.svg"
    },
    {
      interval: 600,
      timeout: 3e3,
      url: "https://www.apple.com/library/test/success.html",
      lazy: true,
      "max-failed-times": 3,
      "empty-fallback": "REJECT",
      type: "select",
      name: "PikPak",
      proxies: [
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u624B\u52A8\u9009\u62E9",
        "\u81EA\u52A8\u9009\u62E9",
        "\u8D1F\u8F7D\u5747\u8861",
        "\u6545\u969C\u8F6C\u79FB",
        "\u26D3 \u51FA\u53E3\u4F18\u9009"
      ],
      icon: "https://fastly.jsdelivr.net/gh/dukangalex/HiClash@assets-v1/Icons/svg/Pikpak.svg"
    },
    {
      interval: 600,
      timeout: 3e3,
      url: "https://www.apple.com/library/test/success.html",
      lazy: true,
      "max-failed-times": 3,
      "empty-fallback": "REJECT",
      type: "select",
      name: "Spotify",
      proxies: [
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u624B\u52A8\u9009\u62E9",
        "\u81EA\u52A8\u9009\u62E9",
        "\u8D1F\u8F7D\u5747\u8861",
        "\u6545\u969C\u8F6C\u79FB",
        "\u26D3 \u51FA\u53E3\u4F18\u9009"
      ],
      icon: "https://fastly.jsdelivr.net/gh/dukangalex/HiClash@assets-v1/Icons/svg/Spotify.svg"
    },
    {
      interval: 600,
      timeout: 3e3,
      url: "https://www.apple.com/library/test/success.html",
      lazy: true,
      "max-failed-times": 3,
      "empty-fallback": "REJECT",
      type: "select",
      name: "Crypto",
      proxies: [
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u624B\u52A8\u9009\u62E9",
        "\u81EA\u52A8\u9009\u62E9",
        "\u8D1F\u8F7D\u5747\u8861",
        "\u6545\u969C\u8F6C\u79FB",
        "\u26D3 \u51FA\u53E3\u4F18\u9009"
      ],
      "default-selected": "\u65E5\u672C",
      icon: "https://fastly.jsdelivr.net/gh/dukangalex/HiClash@assets-v1/Icons/svg/Bitcoin.svg"
    },
    {
      interval: 600,
      timeout: 3e3,
      url: "https://www.apple.com/library/test/success.html",
      lazy: true,
      "max-failed-times": 3,
      "empty-fallback": "REJECT",
      type: "select",
      name: "EHentai",
      proxies: [
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u624B\u52A8\u9009\u62E9",
        "\u81EA\u52A8\u9009\u62E9",
        "\u8D1F\u8F7D\u5747\u8861",
        "\u6545\u969C\u8F6C\u79FB",
        "\u26D3 \u51FA\u53E3\u4F18\u9009"
      ],
      "default-selected": "\u7F8E\u56FD",
      icon: "https://fastly.jsdelivr.net/gh/dukangalex/HiClash@assets-v1/Icons/svg/Ehentai.svg"
    },
    {
      interval: 600,
      timeout: 3e3,
      url: "https://www.apple.com/library/test/success.html",
      lazy: true,
      "max-failed-times": 3,
      "empty-fallback": "REJECT",
      type: "select",
      name: "\u8FDC\u63A7\u5DE5\u5177",
      proxies: [
        "\u9ED8\u8BA4\u4EE3\u7406",
        "REJECT-DROP"
      ],
      icon: "https://fastly.jsdelivr.net/gh/dukangalex/HiClash@assets-v1/Icons/svg/Remote.svg"
    },
    {
      interval: 600,
      timeout: 3e3,
      url: "https://www.apple.com/library/test/success.html",
      lazy: true,
      "max-failed-times": 3,
      "empty-fallback": "REJECT",
      type: "select",
      name: "AdBlock",
      proxies: [
        "REJECT",
        "REJECT-DROP",
        "PASS"
      ],
      icon: "https://fastly.jsdelivr.net/gh/dukangalex/HiClash@assets-v1/Icons/svg/AdBlock.svg"
    },
    {
      interval: 600,
      timeout: 3e3,
      url: "https://www.apple.com/library/test/success.html",
      lazy: true,
      "max-failed-times": 3,
      "empty-fallback": "REJECT",
      type: "select",
      name: "\u6F0F\u7F51\u4E4B\u9C7C",
      proxies: [
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u26D3 \u51FA\u53E3\u4F18\u9009"
      ],
      "default-selected": "\u9ED8\u8BA4\u4EE3\u7406",
      icon: "https://fastly.jsdelivr.net/gh/dukangalex/HiClash@assets-v1/Icons/svg/Stack.svg"
    },
    {
      interval: 600,
      timeout: 3e3,
      url: "https://www.apple.com/library/test/success.html",
      lazy: true,
      "max-failed-times": 3,
      "empty-fallback": "REJECT",
      type: "select",
      name: "\u76F4\u8FDE",
      proxies: [
        "\u{1F1E8}\u{1F1F3} \u76F4\u8FDE | \u53CC\u6808",
        "\u{1F1E8}\u{1F1F3} \u76F4\u8FDE | IPv4\u4F18\u5148",
        "\u{1F1E8}\u{1F1F3} \u76F4\u8FDE | IPv6\u4F18\u5148",
        "\u{1F1E8}\u{1F1F3} \u76F4\u8FDE | \u4EC5IPv4",
        "\u{1F1E8}\u{1F1F3} \u76F4\u8FDE | \u4EC5IPv6"
      ],
      hidden: false,
      icon: "https://fastly.jsdelivr.net/gh/dukangalex/HiClash@assets-v1/Icons/svg/China.svg"
    }
  ],
  "rule-providers": {
    private: {
      type: "http",
      behavior: "domain",
      format: "mrs",
      interval: 86400,
      proxy: "\u9ED8\u8BA4\u4EE3\u7406",
      header: {
        "User-Agent": [
          "mihomo"
        ]
      },
      url: "__PUBLIC_ORIGIN__/rules/clash/private.mrs",
      path: "./ruleset/private.mrs",
      "path-in-bundle": "geo/geosite/private.mrs"
    },
    private_ip: {
      type: "http",
      behavior: "ipcidr",
      format: "mrs",
      interval: 86400,
      proxy: "\u9ED8\u8BA4\u4EE3\u7406",
      header: {
        "User-Agent": [
          "mihomo"
        ]
      },
      url: "__PUBLIC_ORIGIN__/rules/clash/private.mrs",
      path: "./ruleset/private_ip.mrs",
      "path-in-bundle": "geo/geoip/private.mrs"
    },
    games_cn: {
      type: "http",
      behavior: "domain",
      format: "mrs",
      interval: 86400,
      proxy: "\u9ED8\u8BA4\u4EE3\u7406",
      header: {
        "User-Agent": [
          "mihomo"
        ]
      },
      url: "__PUBLIC_ORIGIN__/rules/clash/category-games@cn.mrs",
      path: "./ruleset/category-games@cn.mrs",
      "path-in-bundle": "geo/geosite/category-games@cn.mrs"
    },
    nvidia_cn: {
      type: "http",
      behavior: "domain",
      format: "mrs",
      interval: 86400,
      proxy: "\u9ED8\u8BA4\u4EE3\u7406",
      header: {
        "User-Agent": [
          "mihomo"
        ]
      },
      url: "__PUBLIC_ORIGIN__/rules/clash/nvidia@cn.mrs",
      path: "./ruleset/nvidia@cn.mrs",
      "path-in-bundle": "geo/geosite/nvidia@cn.mrs"
    },
    apple_cn: {
      type: "http",
      behavior: "domain",
      format: "mrs",
      interval: 86400,
      proxy: "\u9ED8\u8BA4\u4EE3\u7406",
      header: {
        "User-Agent": [
          "mihomo"
        ]
      },
      url: "__PUBLIC_ORIGIN__/rules/clash/apple@cn.mrs",
      path: "./ruleset/apple@cn.mrs",
      "path-in-bundle": "geo/geosite/apple@cn.mrs"
    },
    microsoft_cn: {
      type: "http",
      behavior: "domain",
      format: "mrs",
      interval: 86400,
      proxy: "\u9ED8\u8BA4\u4EE3\u7406",
      header: {
        "User-Agent": [
          "mihomo"
        ]
      },
      url: "__PUBLIC_ORIGIN__/rules/clash/microsoft@cn.mrs",
      path: "./ruleset/microsoft@cn.mrs",
      "path-in-bundle": "geo/geosite/microsoft@cn.mrs"
    },
    "geolocation-cn": {
      type: "http",
      behavior: "domain",
      format: "mrs",
      interval: 86400,
      proxy: "\u9ED8\u8BA4\u4EE3\u7406",
      header: {
        "User-Agent": [
          "mihomo"
        ]
      },
      url: "__PUBLIC_ORIGIN__/rules/clash/geolocation-cn.mrs",
      path: "./ruleset/geolocation-cn.mrs",
      "path-in-bundle": "geo/geosite/geolocation-cn.mrs"
    },
    cn_ip: {
      type: "http",
      behavior: "ipcidr",
      format: "mrs",
      interval: 86400,
      proxy: "\u9ED8\u8BA4\u4EE3\u7406",
      header: {
        "User-Agent": [
          "mihomo"
        ]
      },
      url: "__PUBLIC_ORIGIN__/rules/clash/cn.mrs",
      path: "./ruleset/cn_ip.mrs",
      "path-in-bundle": "geo/geoip/cn.mrs"
    },
    "geolocation-!cn": {
      type: "http",
      behavior: "domain",
      format: "mrs",
      interval: 86400,
      proxy: "\u9ED8\u8BA4\u4EE3\u7406",
      header: {
        "User-Agent": [
          "mihomo"
        ]
      },
      url: "__PUBLIC_ORIGIN__/rules/clash/geolocation-!cn.mrs",
      path: "./ruleset/geolocation-!cn.mrs",
      "path-in-bundle": "geo/geosite/geolocation-!cn.mrs"
    },
    fakeip_filter: {
      type: "http",
      behavior: "domain",
      format: "mrs",
      interval: 86400,
      proxy: "\u9ED8\u8BA4\u4EE3\u7406",
      header: {
        "User-Agent": [
          "mihomo"
        ]
      },
      url: "__PUBLIC_ORIGIN__/rules/clash/category-stun.mrs",
      path: "./ruleset/category-stun.mrs",
      "path-in-bundle": "geo/geosite/category-stun.mrs"
    },
    cn: {
      type: "http",
      behavior: "domain",
      format: "mrs",
      interval: 86400,
      proxy: "\u9ED8\u8BA4\u4EE3\u7406",
      header: {
        "User-Agent": [
          "mihomo"
        ]
      },
      url: "__PUBLIC_ORIGIN__/rules/clash/cn.mrs",
      path: "./ruleset/cn.mrs",
      "path-in-bundle": "geo/geosite/cn.mrs"
    },
    bilibili: {
      type: "http",
      behavior: "domain",
      format: "mrs",
      interval: 86400,
      proxy: "\u9ED8\u8BA4\u4EE3\u7406",
      header: {
        "User-Agent": [
          "mihomo"
        ]
      },
      url: "__PUBLIC_ORIGIN__/rules/clash/bilibili.mrs",
      path: "./ruleset/bilibili.mrs",
      "path-in-bundle": "geo/geosite/bilibili.mrs"
    },
    biliintl: {
      type: "http",
      behavior: "domain",
      format: "mrs",
      interval: 86400,
      proxy: "\u9ED8\u8BA4\u4EE3\u7406",
      header: {
        "User-Agent": [
          "mihomo"
        ]
      },
      url: "__PUBLIC_ORIGIN__/rules/clash/biliintl.mrs",
      path: "./ruleset/biliintl.mrs",
      "path-in-bundle": "geo/geosite/biliintl.mrs"
    },
    disney: {
      type: "http",
      behavior: "domain",
      format: "mrs",
      interval: 86400,
      proxy: "\u9ED8\u8BA4\u4EE3\u7406",
      header: {
        "User-Agent": [
          "mihomo"
        ]
      },
      url: "__PUBLIC_ORIGIN__/rules/clash/disney.mrs",
      path: "./ruleset/disney.mrs",
      "path-in-bundle": "geo/geosite/disney.mrs"
    },
    adblockmihomolite: {
      type: "http",
      behavior: "domain",
      format: "mrs",
      interval: 86400,
      proxy: "\u9ED8\u8BA4\u4EE3\u7406",
      header: {
        "User-Agent": [
          "mihomo"
        ]
      },
      url: "__PUBLIC_ORIGIN__/rules/clash/category-ads-all.mrs",
      path: "./ruleset/category-ads-all.mrs",
      "path-in-bundle": "geo/geosite/category-ads-all.mrs"
    },
    googlefcm: {
      type: "http",
      behavior: "domain",
      format: "mrs",
      interval: 86400,
      proxy: "\u9ED8\u8BA4\u4EE3\u7406",
      header: {
        "User-Agent": [
          "mihomo"
        ]
      },
      url: "__PUBLIC_ORIGIN__/rules/clash/googlefcm.mrs",
      path: "./ruleset/googlefcm.mrs",
      "path-in-bundle": "geo/geosite/googlefcm.mrs"
    },
    youtube: {
      type: "http",
      behavior: "domain",
      format: "mrs",
      interval: 86400,
      proxy: "\u9ED8\u8BA4\u4EE3\u7406",
      header: {
        "User-Agent": [
          "mihomo"
        ]
      },
      url: "__PUBLIC_ORIGIN__/rules/clash/youtube.mrs",
      path: "./ruleset/youtube.mrs",
      "path-in-bundle": "geo/geosite/youtube.mrs"
    },
    google: {
      type: "http",
      behavior: "domain",
      format: "mrs",
      interval: 86400,
      proxy: "\u9ED8\u8BA4\u4EE3\u7406",
      header: {
        "User-Agent": [
          "mihomo"
        ]
      },
      url: "__PUBLIC_ORIGIN__/rules/clash/google.mrs",
      path: "./ruleset/google.mrs",
      "path-in-bundle": "geo/geosite/google.mrs"
    },
    google_ip: {
      type: "http",
      behavior: "ipcidr",
      format: "mrs",
      interval: 86400,
      proxy: "\u9ED8\u8BA4\u4EE3\u7406",
      header: {
        "User-Agent": [
          "mihomo"
        ]
      },
      url: "__PUBLIC_ORIGIN__/rules/clash/google.mrs",
      path: "./ruleset/google_ip.mrs",
      "path-in-bundle": "geo/geoip/google.mrs"
    },
    anthropic: {
      type: "http",
      behavior: "domain",
      format: "mrs",
      interval: 86400,
      proxy: "\u9ED8\u8BA4\u4EE3\u7406",
      header: {
        "User-Agent": [
          "mihomo"
        ]
      },
      url: "__PUBLIC_ORIGIN__/rules/clash/anthropic.mrs",
      path: "./ruleset/anthropic.mrs",
      "path-in-bundle": "geo/geosite/anthropic.mrs"
    },
    ai: {
      type: "http",
      behavior: "domain",
      format: "mrs",
      interval: 86400,
      proxy: "\u9ED8\u8BA4\u4EE3\u7406",
      header: {
        "User-Agent": [
          "mihomo"
        ]
      },
      url: "__PUBLIC_ORIGIN__/rules/clash/category-ai-!cn.mrs",
      path: "./ruleset/ai.mrs",
      "path-in-bundle": "geo/geosite/category-ai-!cn.mrs"
    },
    github: {
      type: "http",
      behavior: "domain",
      format: "mrs",
      interval: 86400,
      proxy: "\u9ED8\u8BA4\u4EE3\u7406",
      header: {
        "User-Agent": [
          "mihomo"
        ]
      },
      url: "__PUBLIC_ORIGIN__/rules/clash/github.mrs",
      path: "./ruleset/github.mrs",
      "path-in-bundle": "geo/geosite/github.mrs"
    },
    microsoft: {
      type: "http",
      behavior: "domain",
      format: "mrs",
      interval: 86400,
      proxy: "\u9ED8\u8BA4\u4EE3\u7406",
      header: {
        "User-Agent": [
          "mihomo"
        ]
      },
      url: "__PUBLIC_ORIGIN__/rules/clash/microsoft.mrs",
      path: "./ruleset/microsoft.mrs",
      "path-in-bundle": "geo/geosite/microsoft.mrs"
    },
    apple: {
      type: "http",
      behavior: "domain",
      format: "mrs",
      interval: 86400,
      proxy: "\u9ED8\u8BA4\u4EE3\u7406",
      header: {
        "User-Agent": [
          "mihomo"
        ]
      },
      url: "__PUBLIC_ORIGIN__/rules/clash/apple.mrs",
      path: "./ruleset/apple.mrs",
      "path-in-bundle": "geo/geosite/apple.mrs"
    },
    telegram: {
      type: "http",
      behavior: "domain",
      format: "mrs",
      interval: 86400,
      proxy: "\u9ED8\u8BA4\u4EE3\u7406",
      header: {
        "User-Agent": [
          "mihomo"
        ]
      },
      url: "__PUBLIC_ORIGIN__/rules/clash/telegram.mrs",
      path: "./ruleset/telegram.mrs",
      "path-in-bundle": "geo/geosite/telegram.mrs"
    },
    telegram_ip: {
      type: "http",
      behavior: "ipcidr",
      format: "mrs",
      interval: 86400,
      proxy: "\u9ED8\u8BA4\u4EE3\u7406",
      header: {
        "User-Agent": [
          "mihomo"
        ]
      },
      url: "__PUBLIC_ORIGIN__/rules/clash/telegram.mrs",
      path: "./ruleset/telegram_ip.mrs",
      "path-in-bundle": "geo/geoip/telegram.mrs"
    },
    steam: {
      type: "http",
      behavior: "domain",
      format: "mrs",
      interval: 86400,
      proxy: "\u9ED8\u8BA4\u4EE3\u7406",
      header: {
        "User-Agent": [
          "mihomo"
        ]
      },
      url: "__PUBLIC_ORIGIN__/rules/clash/steam.mrs",
      path: "./ruleset/steam.mrs",
      "path-in-bundle": "geo/geosite/steam.mrs"
    },
    tiktok: {
      type: "http",
      behavior: "domain",
      format: "mrs",
      interval: 86400,
      proxy: "\u9ED8\u8BA4\u4EE3\u7406",
      header: {
        "User-Agent": [
          "mihomo"
        ]
      },
      url: "__PUBLIC_ORIGIN__/rules/clash/tiktok.mrs",
      path: "./ruleset/tiktok.mrs",
      "path-in-bundle": "geo/geosite/tiktok.mrs"
    },
    twitter: {
      type: "http",
      behavior: "domain",
      format: "mrs",
      interval: 86400,
      proxy: "\u9ED8\u8BA4\u4EE3\u7406",
      header: {
        "User-Agent": [
          "mihomo"
        ]
      },
      url: "__PUBLIC_ORIGIN__/rules/clash/twitter.mrs",
      path: "./ruleset/twitter.mrs",
      "path-in-bundle": "geo/geosite/twitter.mrs"
    },
    twitter_ip: {
      type: "http",
      behavior: "ipcidr",
      format: "mrs",
      interval: 86400,
      proxy: "\u9ED8\u8BA4\u4EE3\u7406",
      header: {
        "User-Agent": [
          "mihomo"
        ]
      },
      url: "__PUBLIC_ORIGIN__/rules/clash/twitter.mrs",
      path: "./ruleset/twitter_ip.mrs",
      "path-in-bundle": "geo/geoip/twitter.mrs"
    },
    meta: {
      type: "http",
      behavior: "domain",
      format: "mrs",
      interval: 86400,
      proxy: "\u9ED8\u8BA4\u4EE3\u7406",
      header: {
        "User-Agent": [
          "mihomo"
        ]
      },
      url: "__PUBLIC_ORIGIN__/rules/clash/meta.mrs",
      path: "./ruleset/meta.mrs",
      "path-in-bundle": "geo/geosite/meta.mrs"
    },
    facebook_ip: {
      type: "http",
      behavior: "ipcidr",
      format: "mrs",
      interval: 86400,
      proxy: "\u9ED8\u8BA4\u4EE3\u7406",
      header: {
        "User-Agent": [
          "mihomo"
        ]
      },
      url: "__PUBLIC_ORIGIN__/rules/clash/facebook.mrs",
      path: "./ruleset/facebook_ip.mrs",
      "path-in-bundle": "geo/geoip/facebook.mrs"
    },
    line: {
      type: "http",
      behavior: "domain",
      format: "mrs",
      interval: 86400,
      proxy: "\u9ED8\u8BA4\u4EE3\u7406",
      header: {
        "User-Agent": [
          "mihomo"
        ]
      },
      url: "__PUBLIC_ORIGIN__/rules/clash/line.mrs",
      path: "./ruleset/line.mrs",
      "path-in-bundle": "geo/geosite/line.mrs"
    },
    netflix: {
      type: "http",
      behavior: "domain",
      format: "mrs",
      interval: 86400,
      proxy: "\u9ED8\u8BA4\u4EE3\u7406",
      header: {
        "User-Agent": [
          "mihomo"
        ]
      },
      url: "__PUBLIC_ORIGIN__/rules/clash/netflix.mrs",
      path: "./ruleset/netflix.mrs",
      "path-in-bundle": "geo/geosite/netflix.mrs"
    },
    netflix_ip: {
      type: "http",
      behavior: "ipcidr",
      format: "mrs",
      interval: 86400,
      proxy: "\u9ED8\u8BA4\u4EE3\u7406",
      header: {
        "User-Agent": [
          "mihomo"
        ]
      },
      url: "__PUBLIC_ORIGIN__/rules/clash/netflix.mrs",
      path: "./ruleset/netflix_ip.mrs",
      "path-in-bundle": "geo/geoip/netflix.mrs"
    },
    emby: {
      type: "http",
      behavior: "domain",
      format: "mrs",
      interval: 86400,
      proxy: "\u9ED8\u8BA4\u4EE3\u7406",
      header: {
        "User-Agent": [
          "mihomo"
        ]
      },
      url: "__PUBLIC_ORIGIN__/rules/clash/category-emby.mrs",
      path: "./ruleset/category-emby.mrs",
      "path-in-bundle": "geo/geosite/category-emby.mrs"
    },
    pikpak: {
      type: "http",
      behavior: "domain",
      format: "mrs",
      interval: 86400,
      proxy: "\u9ED8\u8BA4\u4EE3\u7406",
      header: {
        "User-Agent": [
          "mihomo"
        ]
      },
      url: "__PUBLIC_ORIGIN__/rules/clash/pikpak.mrs",
      path: "./ruleset/pikpak.mrs",
      "path-in-bundle": "geo/geosite/pikpak.mrs"
    },
    spotify: {
      type: "http",
      behavior: "domain",
      format: "mrs",
      interval: 86400,
      proxy: "\u9ED8\u8BA4\u4EE3\u7406",
      header: {
        "User-Agent": [
          "mihomo"
        ]
      },
      url: "__PUBLIC_ORIGIN__/rules/clash/spotify.mrs",
      path: "./ruleset/spotify.mrs",
      "path-in-bundle": "geo/geosite/spotify.mrs"
    },
    cryptocurrency: {
      type: "http",
      behavior: "domain",
      format: "mrs",
      interval: 86400,
      proxy: "\u9ED8\u8BA4\u4EE3\u7406",
      header: {
        "User-Agent": [
          "mihomo"
        ]
      },
      url: "__PUBLIC_ORIGIN__/rules/clash/category-cryptocurrency.mrs",
      path: "./ruleset/cryptocurrency.mrs",
      "path-in-bundle": "geo/geosite/category-cryptocurrency.mrs"
    },
    ehentai: {
      type: "http",
      behavior: "domain",
      format: "mrs",
      interval: 86400,
      proxy: "\u9ED8\u8BA4\u4EE3\u7406",
      header: {
        "User-Agent": [
          "mihomo"
        ]
      },
      url: "__PUBLIC_ORIGIN__/rules/clash/ehentai.mrs",
      path: "./ruleset/ehentai.mrs",
      "path-in-bundle": "geo/geosite/ehentai.mrs"
    }
  },
  rules: [
    "IP-CIDR,127.0.0.0/8,DIRECT,no-resolve",
    "IP-CIDR6,::1/128,DIRECT,no-resolve",
    "RULE-SET,private,\u76F4\u8FDE",
    "RULE-SET,geolocation-cn,\u76F4\u8FDE",
    "RULE-SET,games_cn,\u76F4\u8FDE",
    "RULE-SET,nvidia_cn,\u76F4\u8FDE",
    "RULE-SET,apple_cn,\u76F4\u8FDE",
    "RULE-SET,microsoft_cn,\u76F4\u8FDE",
    "RULE-SET,bilibili,\u76F4\u8FDE",
    "DOMAIN,fsend.cn,\u76F4\u8FDE",
    "RULE-SET,biliintl,\u9ED8\u8BA4\u4EE3\u7406",
    "RULE-SET,disney,\u9ED8\u8BA4\u4EE3\u7406",
    "AND,((NETWORK,UDP),(DST-PORT,3478-3497)),REJECT",
    "AND,((NETWORK,UDP),(DST-PORT,5349)),REJECT",
    "AND,((NETWORK,UDP),(DST-PORT,19302-19309)),REJECT",
    "AND,((NETWORK,TCP),(DST-PORT,3478-3497)),REJECT",
    "AND,((NETWORK,TCP),(DST-PORT,5349)),REJECT",
    "AND,((NETWORK,UDP),(DST-PORT,443),(NOT,((OR,((RULE-SET,cn),(RULE-SET,cn_ip,no-resolve)))))),REJECT",
    "RULE-SET,adblockmihomolite,AdBlock",
    "RULE-SET,googlefcm,FCM",
    "RULE-SET,youtube,YouTube",
    "RULE-SET,google,Google",
    "RULE-SET,google_ip,Google,no-resolve",
    "RULE-SET,anthropic,Claude",
    "DOMAIN,anthropic.auth0.com,Claude",
    "DOMAIN,anthropic.com.cdn.cloudflare.net,Claude",
    "DOMAIN,browser-intake-us5-datadoghq.com,Claude",
    "IP-CIDR,160.79.104.0/21,Claude,no-resolve",
    "IP-CIDR6,2607:6bc0::/48,Claude,no-resolve",
    "IP-CIDR6,2607:6bc0:11::/48,Claude,no-resolve",
    "IP-ASN,399358,Claude,no-resolve",
    "RULE-SET,ai,AI",
    "RULE-SET,github,GitHub",
    "RULE-SET,microsoft,Microsoft",
    "RULE-SET,apple,Apple",
    "RULE-SET,telegram,Telegram",
    "RULE-SET,telegram_ip,Telegram,no-resolve",
    "RULE-SET,steam,Steam",
    "RULE-SET,tiktok,TikTok",
    "RULE-SET,twitter,Twitter",
    "RULE-SET,twitter_ip,Twitter,no-resolve",
    "RULE-SET,meta,Meta",
    "RULE-SET,facebook_ip,Meta,no-resolve",
    "RULE-SET,line,Line",
    "RULE-SET,netflix,Netflix",
    "RULE-SET,netflix_ip,Netflix,no-resolve",
    "RULE-SET,emby,Emby",
    "DOMAIN-SUFFIX,mb3admin.com,Emby",
    "DOMAIN-SUFFIX,nubebelle.com,Emby",
    "DOMAIN-KEYWORD,emby,Emby",
    "PROCESS-NAME,com.mb.android,Emby",
    "PROCESS-NAME,tv.emby.embyatv,Emby",
    "PROCESS-NAME,com.hush.yamby,Emby",
    "PROCESS-NAME,com.jellycine.app,Emby",
    "PROCESS-NAME,com.mountains.hills,Emby",
    "PROCESS-NAME,RodelPlayer.App.exe,Emby",
    "PROCESS-NAME,com.feifeiduck.capyplayer,Emby",
    "RULE-SET,pikpak,PikPak",
    "RULE-SET,spotify,Spotify",
    "RULE-SET,cryptocurrency,Crypto",
    "RULE-SET,ehentai,EHentai",
    "PROCESS-NAME-WILDCARD,*AnyDesk*,\u8FDC\u63A7\u5DE5\u5177",
    "PROCESS-NAME-WILDCARD,*ToDesk*,\u8FDC\u63A7\u5DE5\u5177",
    "PROCESS-NAME-WILDCARD,*TeamViewer*,\u8FDC\u63A7\u5DE5\u5177",
    "PROCESS-NAME-WILDCARD,*RustDesk*,\u8FDC\u63A7\u5DE5\u5177",
    "PROCESS-NAME-WILDCARD,*rustdesk*,\u8FDC\u63A7\u5DE5\u5177",
    "PROCESS-NAME-WILDCARD,*tailscale*,\u8FDC\u63A7\u5DE5\u5177",
    "PROCESS-NAME-WILDCARD,*zerotier*,\u8FDC\u63A7\u5DE5\u5177",
    "PROCESS-NAME-WILDCARD,*ngrok*,\u8FDC\u63A7\u5DE5\u5177",
    "PROCESS-NAME-WILDCARD,*frpc*,\u8FDC\u63A7\u5DE5\u5177",
    "PROCESS-NAME-WILDCARD,*frps*,\u8FDC\u63A7\u5DE5\u5177",
    "PROCESS-NAME-WILDCARD,*cloudflared*,\u8FDC\u63A7\u5DE5\u5177",
    "PROCESS-NAME-WILDCARD,*natapp*,\u8FDC\u63A7\u5DE5\u5177",
    "PROCESS-NAME-WILDCARD,*nblink*,\u8FDC\u63A7\u5DE5\u5177",
    "RULE-SET,geolocation-!cn,\u9ED8\u8BA4\u4EE3\u7406",
    "RULE-SET,cn_ip,\u76F4\u8FDE",
    "RULE-SET,private_ip,\u76F4\u8FDE",
    "MATCH,\u6F0F\u7F51\u4E4B\u9C7C"
  ]
};

// src/skeleton_singbox.json
var skeleton_singbox_default = {
  outbounds: [
    {
      type: "urltest",
      tag: "\u26D3 \u51FA\u53E3\u4F18\u9009",
      outbounds: [
        "@EXITS@"
      ],
      url: "https://www.gstatic.com/generate_204",
      interval: "1m",
      tolerance: 100,
      interrupt_exist_connections: false
    },
    {
      type: "urltest",
      tag: "\u26D3 \u5165\u53E3\u4F18\u9009",
      outbounds: [
        "@ENTRIES@"
      ],
      url: "https://www.gstatic.com/generate_204",
      interval: "1m",
      tolerance: 100,
      interrupt_exist_connections: false
    },
    {
      type: "@nodes@"
    },
    {
      type: "direct",
      tag: "direct",
      connect_timeout: "8s"
    },
    {
      type: "direct",
      tag: "\u{1F1E8}\u{1F1F3} \u76F4\u8FDE | \u53CC\u6808",
      connect_timeout: "8s"
    },
    {
      type: "direct",
      tag: "\u{1F1E8}\u{1F1F3} \u76F4\u8FDE | IPv4\u4F18\u5148",
      connect_timeout: "8s",
      domain_resolver: {
        server: "dns-cn",
        strategy: "prefer_ipv4"
      }
    },
    {
      type: "direct",
      tag: "\u{1F1E8}\u{1F1F3} \u76F4\u8FDE | IPv6\u4F18\u5148",
      connect_timeout: "8s",
      domain_resolver: {
        server: "dns-cn",
        strategy: "prefer_ipv6"
      }
    },
    {
      type: "direct",
      tag: "\u{1F1E8}\u{1F1F3} \u76F4\u8FDE | \u4EC5IPv4",
      connect_timeout: "8s",
      domain_resolver: {
        server: "dns-cn",
        strategy: "ipv4_only"
      }
    },
    {
      type: "direct",
      tag: "\u{1F1E8}\u{1F1F3} \u76F4\u8FDE | \u4EC5IPv6",
      connect_timeout: "8s",
      domain_resolver: {
        server: "dns-cn",
        strategy: "ipv6_only"
      }
    },
    {
      type: "socks",
      tag: "REJECT",
      server: "127.0.0.1",
      server_port: 9
    },
    {
      type: "selector",
      tag: "\u9ED8\u8BA4\u4EE3\u7406",
      outbounds: [
        "\u26D3 \u51FA\u53E3\u4F18\u9009",
        "\u26D3 \u5165\u53E3\u4F18\u9009",
        "\u624B\u52A8\u9009\u62E9",
        "\u81EA\u52A8\u9009\u62E9"
      ],
      interrupt_exist_connections: false
    },
    {
      type: "selector",
      tag: "\u624B\u52A8\u9009\u62E9",
      outbounds: [
        "@ALL@"
      ],
      interrupt_exist_connections: false
    },
    {
      type: "urltest",
      tag: "\u81EA\u52A8\u9009\u62E9",
      outbounds: [
        "@EXITS@"
      ],
      url: "https://www.gstatic.com/generate_204",
      interval: "10m",
      tolerance: 50,
      idle_timeout: "30m",
      interrupt_exist_connections: false
    },
    {
      type: "selector",
      tag: "AdBlock",
      outbounds: [
        "REJECT"
      ],
      interrupt_exist_connections: false
    },
    {
      type: "selector",
      tag: "FCM",
      outbounds: [
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u624B\u52A8\u9009\u62E9",
        "\u81EA\u52A8\u9009\u62E9",
        "\u26D3 \u51FA\u53E3\u4F18\u9009"
      ],
      interrupt_exist_connections: false,
      default: "\u9ED8\u8BA4\u4EE3\u7406"
    },
    {
      type: "selector",
      tag: "YouTube",
      outbounds: [
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u624B\u52A8\u9009\u62E9",
        "\u81EA\u52A8\u9009\u62E9",
        "\u26D3 \u51FA\u53E3\u4F18\u9009"
      ],
      interrupt_exist_connections: false
    },
    {
      type: "selector",
      tag: "Google",
      outbounds: [
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u624B\u52A8\u9009\u62E9",
        "\u81EA\u52A8\u9009\u62E9",
        "\u26D3 \u51FA\u53E3\u4F18\u9009"
      ],
      interrupt_exist_connections: false
    },
    {
      type: "selector",
      tag: "ClaudeAI",
      outbounds: [
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u624B\u52A8\u9009\u62E9",
        "\u81EA\u52A8\u9009\u62E9",
        "\u26D3 \u51FA\u53E3\u4F18\u9009"
      ],
      interrupt_exist_connections: false,
      default: "\u26D3 \u51FA\u53E3\u4F18\u9009"
    },
    {
      type: "selector",
      tag: "AI",
      outbounds: [
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u624B\u52A8\u9009\u62E9",
        "\u81EA\u52A8\u9009\u62E9",
        "\u26D3 \u51FA\u53E3\u4F18\u9009"
      ],
      interrupt_exist_connections: false,
      default: "\u26D3 \u51FA\u53E3\u4F18\u9009"
    },
    {
      type: "selector",
      tag: "Microsoft",
      outbounds: [
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u624B\u52A8\u9009\u62E9",
        "\u81EA\u52A8\u9009\u62E9",
        "\u26D3 \u51FA\u53E3\u4F18\u9009"
      ],
      interrupt_exist_connections: false
    },
    {
      type: "selector",
      tag: "Apple",
      outbounds: [
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u624B\u52A8\u9009\u62E9",
        "\u81EA\u52A8\u9009\u62E9",
        "\u26D3 \u51FA\u53E3\u4F18\u9009"
      ],
      interrupt_exist_connections: false
    },
    {
      type: "selector",
      tag: "Telegram",
      outbounds: [
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u624B\u52A8\u9009\u62E9",
        "\u81EA\u52A8\u9009\u62E9",
        "\u26D3 \u51FA\u53E3\u4F18\u9009"
      ],
      interrupt_exist_connections: false
    },
    {
      type: "selector",
      tag: "Steam",
      outbounds: [
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u624B\u52A8\u9009\u62E9",
        "\u81EA\u52A8\u9009\u62E9",
        "\u26D3 \u51FA\u53E3\u4F18\u9009"
      ],
      interrupt_exist_connections: false
    },
    {
      type: "selector",
      tag: "TikTok",
      outbounds: [
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u624B\u52A8\u9009\u62E9",
        "\u81EA\u52A8\u9009\u62E9",
        "\u26D3 \u51FA\u53E3\u4F18\u9009"
      ],
      interrupt_exist_connections: false
    },
    {
      type: "selector",
      tag: "Twitter",
      outbounds: [
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u624B\u52A8\u9009\u62E9",
        "\u81EA\u52A8\u9009\u62E9",
        "\u26D3 \u51FA\u53E3\u4F18\u9009"
      ],
      interrupt_exist_connections: false
    },
    {
      type: "selector",
      tag: "Meta",
      outbounds: [
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u624B\u52A8\u9009\u62E9",
        "\u81EA\u52A8\u9009\u62E9",
        "\u26D3 \u51FA\u53E3\u4F18\u9009"
      ],
      interrupt_exist_connections: false
    },
    {
      type: "selector",
      tag: "Line",
      outbounds: [
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u624B\u52A8\u9009\u62E9",
        "\u81EA\u52A8\u9009\u62E9",
        "\u26D3 \u51FA\u53E3\u4F18\u9009"
      ],
      interrupt_exist_connections: false
    },
    {
      type: "selector",
      tag: "Netflix",
      outbounds: [
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u624B\u52A8\u9009\u62E9",
        "\u81EA\u52A8\u9009\u62E9",
        "\u26D3 \u51FA\u53E3\u4F18\u9009"
      ],
      interrupt_exist_connections: false
    },
    {
      type: "selector",
      tag: "Emby",
      outbounds: [
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u624B\u52A8\u9009\u62E9",
        "\u81EA\u52A8\u9009\u62E9",
        "\u26D3 \u51FA\u53E3\u4F18\u9009"
      ],
      interrupt_exist_connections: false
    },
    {
      type: "selector",
      tag: "PikPak",
      outbounds: [
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u624B\u52A8\u9009\u62E9",
        "\u81EA\u52A8\u9009\u62E9",
        "\u26D3 \u51FA\u53E3\u4F18\u9009"
      ],
      interrupt_exist_connections: false
    },
    {
      type: "selector",
      tag: "Spotify",
      outbounds: [
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u624B\u52A8\u9009\u62E9",
        "\u81EA\u52A8\u9009\u62E9",
        "\u26D3 \u51FA\u53E3\u4F18\u9009"
      ],
      interrupt_exist_connections: false
    },
    {
      type: "selector",
      tag: "Crypto",
      outbounds: [
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u624B\u52A8\u9009\u62E9",
        "\u81EA\u52A8\u9009\u62E9",
        "\u26D3 \u51FA\u53E3\u4F18\u9009"
      ],
      interrupt_exist_connections: false
    },
    {
      type: "selector",
      tag: "EHentai",
      outbounds: [
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u624B\u52A8\u9009\u62E9",
        "\u81EA\u52A8\u9009\u62E9",
        "\u26D3 \u51FA\u53E3\u4F18\u9009"
      ],
      interrupt_exist_connections: false,
      default: "\u26D3 \u51FA\u53E3\u4F18\u9009"
    },
    {
      type: "selector",
      tag: "\u8FDC\u63A7\u5DE5\u5177",
      outbounds: [
        "REJECT",
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u76F4\u8FDE"
      ],
      interrupt_exist_connections: false
    },
    {
      type: "selector",
      tag: "\u76F4\u8FDE",
      outbounds: [
        "direct",
        "\u{1F1E8}\u{1F1F3} \u76F4\u8FDE | \u53CC\u6808",
        "\u{1F1E8}\u{1F1F3} \u76F4\u8FDE | IPv4\u4F18\u5148",
        "\u{1F1E8}\u{1F1F3} \u76F4\u8FDE | IPv6\u4F18\u5148",
        "\u{1F1E8}\u{1F1F3} \u76F4\u8FDE | \u4EC5IPv4",
        "\u{1F1E8}\u{1F1F3} \u76F4\u8FDE | \u4EC5IPv6"
      ],
      interrupt_exist_connections: false
    },
    {
      type: "selector",
      tag: "\u6F0F\u7F51\u4E4B\u9C7C",
      outbounds: [
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u76F4\u8FDE",
        "\u26D3 \u51FA\u53E3\u4F18\u9009"
      ],
      interrupt_exist_connections: false
    }
  ],
  route: {
    rules: [
      {
        action: "sniff"
      },
      {
        protocol: "dns",
        action: "hijack-dns"
      },
      {
        port: 53,
        network: [
          "udp",
          "tcp"
        ],
        action: "hijack-dns"
      },
      {
        clash_mode: "Global",
        outbound: "\u9ED8\u8BA4\u4EE3\u7406"
      },
      {
        clash_mode: "Direct",
        outbound: "direct"
      },
      {
        ip_version: 6,
        action: "reject"
      },
      {
        ip_is_private: true,
        outbound: "\u76F4\u8FDE"
      },
      {
        rule_set: "geosite-private",
        outbound: "\u76F4\u8FDE"
      },
      {
        rule_set: "geoip-cn",
        outbound: "\u76F4\u8FDE"
      },
      {
        rule_set: "geosite-geolocation-cn",
        outbound: "\u76F4\u8FDE"
      },
      {
        rule_set: "geosite-cn",
        outbound: "\u76F4\u8FDE"
      },
      {
        rule_set: "geosite-category-games@cn",
        outbound: "\u76F4\u8FDE"
      },
      {
        rule_set: "geosite-epicgames@cn",
        outbound: "\u76F4\u8FDE"
      },
      {
        rule_set: "geosite-nvidia@cn",
        outbound: "\u76F4\u8FDE"
      },
      {
        rule_set: "geosite-apple@cn",
        outbound: "\u76F4\u8FDE"
      },
      {
        rule_set: "geosite-microsoft@cn",
        outbound: "\u76F4\u8FDE"
      },
      {
        rule_set: "geosite-steam@cn",
        outbound: "\u76F4\u8FDE"
      },
      {
        domain: [
          "fsend.cn"
        ],
        outbound: "\u76F4\u8FDE"
      },
      {
        network: "udp",
        port_range: "3478:3481",
        action: "reject"
      },
      {
        network: "tcp",
        port_range: "3478:3481",
        action: "reject"
      },
      {
        network: "udp",
        port_range: "3478:3497",
        action: "reject"
      },
      {
        network: "tcp",
        port_range: "3478:3497",
        action: "reject"
      },
      {
        network: "udp",
        port_range: "5349:5355",
        action: "reject"
      },
      {
        network: "tcp",
        port_range: "5349:5355",
        action: "reject"
      },
      {
        network: "udp",
        port_range: "19302:19310",
        action: "reject"
      },
      {
        network: "tcp",
        port_range: "19302:19310",
        action: "reject"
      },
      {
        type: "logical",
        mode: "and",
        rules: [
          {
            port: 53,
            network: [
              "udp",
              "tcp"
            ]
          },
          {
            rule_set: "geoip-cn",
            invert: true
          }
        ],
        action: "reject"
      },
      {
        type: "logical",
        mode: "and",
        rules: [
          {
            port: 853,
            network: [
              "udp",
              "tcp"
            ]
          },
          {
            rule_set: "geoip-cn",
            invert: true
          }
        ],
        action: "reject"
      },
      {
        network: "udp",
        port: 443,
        rule_set: [
          "geosite-cn",
          "geosite-geolocation-cn"
        ],
        outbound: "\u76F4\u8FDE"
      },
      {
        network: "udp",
        port: 443,
        action: "reject"
      },
      {
        rule_set: "geosite-category-ads-all",
        outbound: "AdBlock"
      },
      {
        domain_suffix: [
          "mtalk.google.com",
          "android.googleapis.com"
        ],
        outbound: "FCM"
      },
      {
        domain_suffix: [
          "youtube.com",
          "youtu.be",
          "googlevideo.com",
          "ytimg.com",
          "ggpht.com",
          "youtubekids.com",
          "youtubei.googleapis.com",
          "youtube.googleapis.com",
          "wide-youtube.l.google.com"
        ],
        outbound: "YouTube"
      },
      {
        rule_set: "geosite-youtube",
        outbound: "YouTube"
      },
      {
        package_name: [
          "com.google.android.youtube",
          "com.google.android.apps.youtube.music",
          "app.revanced.android.youtube",
          "com.vanced.android.youtube"
        ],
        outbound: "YouTube"
      },
      {
        rule_set: "geosite-google",
        outbound: "Google"
      },
      {
        domain_suffix: [
          "claude.ai",
          "anthropic.com",
          "claudeusercontent.com"
        ],
        outbound: "ClaudeAI"
      },
      {
        rule_set: "geosite-anthropic",
        outbound: "ClaudeAI"
      },
      {
        package_name: [
          "com.anthropic.claude"
        ],
        outbound: "ClaudeAI"
      },
      {
        domain_suffix: [
          "openai.com",
          "chatgpt.com",
          "gemini.google.com",
          "generativelanguage.googleapis.com",
          "aistudio.google.com"
        ],
        outbound: "AI"
      },
      {
        rule_set: "geosite-category-ai-!cn",
        outbound: "AI"
      },
      {
        package_name: [
          "com.google.android.apps.bard"
        ],
        outbound: "AI"
      },
      {
        rule_set: "geosite-github",
        outbound: "\u9ED8\u8BA4\u4EE3\u7406"
      },
      {
        rule_set: "geosite-microsoft",
        outbound: "Microsoft"
      },
      {
        rule_set: "geosite-apple",
        outbound: "Apple"
      },
      {
        rule_set: "geosite-telegram",
        outbound: "Telegram"
      },
      {
        rule_set: "geosite-steam",
        outbound: "Steam"
      },
      {
        rule_set: "geosite-tiktok",
        outbound: "TikTok"
      },
      {
        rule_set: "geosite-twitter",
        outbound: "Twitter"
      },
      {
        domain_suffix: [
          "facebook.com",
          "fb.com",
          "instagram.com",
          "whatsapp.com",
          "threads.net",
          "messenger.com",
          "meta.com",
          "oculus.com"
        ],
        outbound: "Meta"
      },
      {
        rule_set: "geosite-facebook",
        outbound: "Meta"
      },
      {
        rule_set: "geosite-instagram",
        outbound: "Meta"
      },
      {
        rule_set: "geosite-whatsapp",
        outbound: "Meta"
      },
      {
        rule_set: "geosite-threads",
        outbound: "Meta"
      },
      {
        rule_set: "geosite-messenger",
        outbound: "Meta"
      },
      {
        rule_set: "geosite-meta",
        outbound: "Meta"
      },
      {
        rule_set: "geosite-oculus",
        outbound: "Meta"
      },
      {
        domain_suffix: [
          "line.me",
          "line-apps.com",
          "line.naver.jp"
        ],
        outbound: "Line"
      },
      {
        rule_set: "geosite-netflix",
        outbound: "Netflix"
      },
      {
        domain_suffix: [
          "mb3admin.com",
          "nubebelle.com",
          "emby.media"
        ],
        outbound: "Emby"
      },
      {
        domain_keyword: [
          "emby"
        ],
        outbound: "Emby"
      },
      {
        domain_suffix: [
          "mypikpak.com",
          "pikpak.com"
        ],
        outbound: "PikPak"
      },
      {
        rule_set: "geosite-spotify",
        outbound: "Spotify"
      },
      {
        domain_suffix: [
          "htx.com"
        ],
        outbound: "Crypto"
      },
      {
        rule_set: "geosite-paypal",
        outbound: "Crypto"
      },
      {
        rule_set: "geosite-binance",
        outbound: "Crypto"
      },
      {
        rule_set: "geosite-okx",
        outbound: "Crypto"
      },
      {
        rule_set: "geosite-bybit",
        outbound: "Crypto"
      },
      {
        rule_set: "geosite-huobi",
        outbound: "Crypto"
      },
      {
        rule_set: "geosite-category-cryptocurrency",
        outbound: "Crypto"
      },
      {
        domain_suffix: [
          "e-hentai.org",
          "exhentai.org",
          "ehgt.org"
        ],
        outbound: "EHentai"
      },
      {
        process_name: [
          "anydesk",
          "ToDesk",
          "TeamViewer",
          "rustdesk",
          "tailscaled",
          "zerotier-one",
          "ngrok",
          "frpc",
          "frps",
          "cloudflared"
        ],
        outbound: "\u8FDC\u63A7\u5DE5\u5177"
      },
      {
        package_name: [
          "com.anydesk.anydeskandroid",
          "com.oray.todesk",
          "com.teamviewer.teamviewer.market.mobile",
          "com.carriez.flutter_hbb",
          "com.tailscale.ipn",
          "com.zerotier.one"
        ],
        outbound: "\u8FDC\u63A7\u5DE5\u5177"
      },
      {
        rule_set: "geosite-geolocation-!cn",
        outbound: "\u9ED8\u8BA4\u4EE3\u7406"
      }
    ],
    rule_set: [
      {
        type: "remote",
        tag: "geosite-private",
        format: "binary",
        url: "__PUBLIC_ORIGIN__/rules/singbox/geosite-private.srs",
        update_interval: "24h",
        http_client: "http-direct"
      },
      {
        type: "remote",
        tag: "geoip-cn",
        format: "binary",
        url: "__PUBLIC_ORIGIN__/rules/singbox/geoip-cn.srs",
        update_interval: "24h",
        http_client: "http-direct"
      },
      {
        type: "remote",
        tag: "geosite-geolocation-cn",
        format: "binary",
        url: "__PUBLIC_ORIGIN__/rules/singbox/geosite-geolocation-cn.srs",
        update_interval: "24h",
        http_client: "http-direct"
      },
      {
        type: "remote",
        tag: "geosite-cn",
        format: "binary",
        url: "__PUBLIC_ORIGIN__/rules/singbox/geosite-cn.srs",
        update_interval: "24h",
        http_client: "http-direct"
      },
      {
        type: "remote",
        tag: "geosite-category-games@cn",
        format: "binary",
        url: "__PUBLIC_ORIGIN__/rules/singbox/geosite-category-games@cn.srs",
        update_interval: "24h",
        http_client: "http-direct"
      },
      {
        type: "remote",
        tag: "geosite-epicgames@cn",
        format: "binary",
        url: "__PUBLIC_ORIGIN__/rules/singbox/geosite-epicgames@cn.srs",
        update_interval: "24h",
        http_client: "http-direct"
      },
      {
        type: "remote",
        tag: "geosite-nvidia@cn",
        format: "binary",
        url: "__PUBLIC_ORIGIN__/rules/singbox/geosite-nvidia@cn.srs",
        update_interval: "24h",
        http_client: "http-direct"
      },
      {
        type: "remote",
        tag: "geosite-apple@cn",
        format: "binary",
        url: "__PUBLIC_ORIGIN__/rules/singbox/geosite-apple@cn.srs",
        update_interval: "24h",
        http_client: "http-direct"
      },
      {
        type: "remote",
        tag: "geosite-microsoft@cn",
        format: "binary",
        url: "__PUBLIC_ORIGIN__/rules/singbox/geosite-microsoft@cn.srs",
        update_interval: "24h",
        http_client: "http-direct"
      },
      {
        type: "remote",
        tag: "geosite-steam@cn",
        format: "binary",
        url: "__PUBLIC_ORIGIN__/rules/singbox/geosite-steam@cn.srs",
        update_interval: "24h",
        http_client: "http-direct"
      },
      {
        type: "remote",
        tag: "geosite-category-ads-all",
        format: "binary",
        url: "__PUBLIC_ORIGIN__/rules/singbox/geosite-category-ads-all.srs",
        update_interval: "24h",
        http_client: "http-direct"
      },
      {
        type: "remote",
        tag: "geosite-youtube",
        format: "binary",
        url: "__PUBLIC_ORIGIN__/rules/singbox/geosite-youtube.srs",
        update_interval: "24h",
        http_client: "http-direct"
      },
      {
        type: "remote",
        tag: "geosite-google",
        format: "binary",
        url: "__PUBLIC_ORIGIN__/rules/singbox/geosite-google.srs",
        update_interval: "24h",
        http_client: "http-direct"
      },
      {
        type: "remote",
        tag: "geosite-anthropic",
        format: "binary",
        url: "__PUBLIC_ORIGIN__/rules/singbox/geosite-anthropic.srs",
        update_interval: "24h",
        http_client: "http-direct"
      },
      {
        type: "remote",
        tag: "geosite-category-ai-!cn",
        format: "binary",
        url: "__PUBLIC_ORIGIN__/rules/singbox/geosite-category-ai-!cn.srs",
        update_interval: "24h",
        http_client: "http-direct"
      },
      {
        type: "remote",
        tag: "geosite-github",
        format: "binary",
        url: "__PUBLIC_ORIGIN__/rules/singbox/geosite-github.srs",
        update_interval: "24h",
        http_client: "http-direct"
      },
      {
        type: "remote",
        tag: "geosite-microsoft",
        format: "binary",
        url: "__PUBLIC_ORIGIN__/rules/singbox/geosite-microsoft.srs",
        update_interval: "24h",
        http_client: "http-direct"
      },
      {
        type: "remote",
        tag: "geosite-apple",
        format: "binary",
        url: "__PUBLIC_ORIGIN__/rules/singbox/geosite-apple.srs",
        update_interval: "24h",
        http_client: "http-direct"
      },
      {
        type: "remote",
        tag: "geosite-telegram",
        format: "binary",
        url: "__PUBLIC_ORIGIN__/rules/singbox/geosite-telegram.srs",
        update_interval: "24h",
        http_client: "http-direct"
      },
      {
        type: "remote",
        tag: "geosite-steam",
        format: "binary",
        url: "__PUBLIC_ORIGIN__/rules/singbox/geosite-steam.srs",
        update_interval: "24h",
        http_client: "http-direct"
      },
      {
        type: "remote",
        tag: "geosite-tiktok",
        format: "binary",
        url: "__PUBLIC_ORIGIN__/rules/singbox/geosite-tiktok.srs",
        update_interval: "24h",
        http_client: "http-direct"
      },
      {
        type: "remote",
        tag: "geosite-twitter",
        format: "binary",
        url: "__PUBLIC_ORIGIN__/rules/singbox/geosite-twitter.srs",
        update_interval: "24h",
        http_client: "http-direct"
      },
      {
        type: "remote",
        tag: "geosite-facebook",
        format: "binary",
        url: "__PUBLIC_ORIGIN__/rules/singbox/geosite-facebook.srs",
        update_interval: "24h",
        http_client: "http-direct"
      },
      {
        type: "remote",
        tag: "geosite-instagram",
        format: "binary",
        url: "__PUBLIC_ORIGIN__/rules/singbox/geosite-instagram.srs",
        update_interval: "24h",
        http_client: "http-direct"
      },
      {
        type: "remote",
        tag: "geosite-whatsapp",
        format: "binary",
        url: "__PUBLIC_ORIGIN__/rules/singbox/geosite-whatsapp.srs",
        update_interval: "24h",
        http_client: "http-direct"
      },
      {
        type: "remote",
        tag: "geosite-threads",
        format: "binary",
        url: "__PUBLIC_ORIGIN__/rules/singbox/geosite-threads.srs",
        update_interval: "24h",
        http_client: "http-direct"
      },
      {
        type: "remote",
        tag: "geosite-messenger",
        format: "binary",
        url: "__PUBLIC_ORIGIN__/rules/singbox/geosite-messenger.srs",
        update_interval: "24h",
        http_client: "http-direct"
      },
      {
        type: "remote",
        tag: "geosite-meta",
        format: "binary",
        url: "__PUBLIC_ORIGIN__/rules/singbox/geosite-meta.srs",
        update_interval: "24h",
        http_client: "http-direct"
      },
      {
        type: "remote",
        tag: "geosite-oculus",
        format: "binary",
        url: "__PUBLIC_ORIGIN__/rules/singbox/geosite-oculus.srs",
        update_interval: "24h",
        http_client: "http-direct"
      },
      {
        type: "remote",
        tag: "geosite-netflix",
        format: "binary",
        url: "__PUBLIC_ORIGIN__/rules/singbox/geosite-netflix.srs",
        update_interval: "24h",
        http_client: "http-direct"
      },
      {
        type: "remote",
        tag: "geosite-spotify",
        format: "binary",
        url: "__PUBLIC_ORIGIN__/rules/singbox/geosite-spotify.srs",
        update_interval: "24h",
        http_client: "http-direct"
      },
      {
        type: "remote",
        tag: "geosite-paypal",
        format: "binary",
        url: "__PUBLIC_ORIGIN__/rules/singbox/geosite-paypal.srs",
        update_interval: "24h",
        http_client: "http-direct"
      },
      {
        type: "remote",
        tag: "geosite-binance",
        format: "binary",
        url: "__PUBLIC_ORIGIN__/rules/singbox/geosite-binance.srs",
        update_interval: "24h",
        http_client: "http-direct"
      },
      {
        type: "remote",
        tag: "geosite-okx",
        format: "binary",
        url: "__PUBLIC_ORIGIN__/rules/singbox/geosite-okx.srs",
        update_interval: "24h",
        http_client: "http-direct"
      },
      {
        type: "remote",
        tag: "geosite-bybit",
        format: "binary",
        url: "__PUBLIC_ORIGIN__/rules/singbox/geosite-bybit.srs",
        update_interval: "24h",
        http_client: "http-direct"
      },
      {
        type: "remote",
        tag: "geosite-huobi",
        format: "binary",
        url: "__PUBLIC_ORIGIN__/rules/singbox/geosite-huobi.srs",
        update_interval: "24h",
        http_client: "http-direct"
      },
      {
        type: "remote",
        tag: "geosite-category-cryptocurrency",
        format: "binary",
        url: "__PUBLIC_ORIGIN__/rules/singbox/geosite-category-cryptocurrency.srs",
        update_interval: "24h",
        http_client: "http-direct"
      },
      {
        type: "remote",
        tag: "geosite-geolocation-!cn",
        format: "binary",
        url: "__PUBLIC_ORIGIN__/rules/singbox/geosite-geolocation-!cn.srs",
        update_interval: "24h",
        http_client: "http-direct"
      }
    ],
    final: "\u6F0F\u7F51\u4E4B\u9C7C",
    auto_detect_interface: true,
    find_process: false,
    default_domain_resolver: "dns-cn",
    default_http_client: "http-direct"
  },
  http_clients: [
    {
      tag: "http-direct"
    }
  ],
  dns: {
    servers: [
      {
        type: "fakeip",
        tag: "dns-fakeip",
        inet4_range: "198.18.0.0/15"
      },
      {
        type: "udp",
        tag: "dns-cn",
        server: "223.5.5.5",
        server_port: 53,
        detour: "direct"
      },
      {
        type: "tcp",
        tag: "dns-remote",
        server: "1.1.1.1",
        server_port: 53,
        detour: "\u9ED8\u8BA4\u4EE3\u7406"
      }
    ],
    rules: [
      {
        domain: [
          "cloudflare-ech.com"
        ],
        server: "dns-cn"
      },
      {
        rule_set: [
          "geosite-cn",
          "geosite-geolocation-cn"
        ],
        server: "dns-cn"
      },
      {
        query_type: [
          "HTTPS",
          "SVCB"
        ],
        action: "reject"
      },
      {
        query_type: [
          "A",
          "AAAA"
        ],
        server: "dns-fakeip"
      }
    ],
    final: "dns-remote",
    strategy: "ipv4_only"
  },
  inbounds: [
    {
      type: "tun",
      tag: "tun-in",
      address: [
        "172.19.0.1/30"
      ],
      auto_route: true,
      strict_route: true,
      mtu: 1500
    }
  ],
  log: {
    level: "info"
  }
};

// src/rules_manifest.json
var rules_manifest_default = [
  {
    src: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/private.mrs",
    dst: "clash/private.mrs"
  },
  {
    src: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-games@cn.mrs",
    dst: "clash/category-games@cn.mrs"
  },
  {
    src: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/nvidia@cn.mrs",
    dst: "clash/nvidia@cn.mrs"
  },
  {
    src: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/apple@cn.mrs",
    dst: "clash/apple@cn.mrs"
  },
  {
    src: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/microsoft@cn.mrs",
    dst: "clash/microsoft@cn.mrs"
  },
  {
    src: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/geolocation-cn.mrs",
    dst: "clash/geolocation-cn.mrs"
  },
  {
    src: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geoip/cn.mrs",
    dst: "clash/cn.mrs"
  },
  {
    src: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/geolocation-!cn.mrs",
    dst: "clash/geolocation-!cn.mrs"
  },
  {
    src: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-stun.mrs",
    dst: "clash/category-stun.mrs"
  },
  {
    src: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/bilibili.mrs",
    dst: "clash/bilibili.mrs"
  },
  {
    src: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/biliintl.mrs",
    dst: "clash/biliintl.mrs"
  },
  {
    src: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/disney.mrs",
    dst: "clash/disney.mrs"
  },
  {
    src: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-ads-all.mrs",
    dst: "clash/category-ads-all.mrs"
  },
  {
    src: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/googlefcm.mrs",
    dst: "clash/googlefcm.mrs"
  },
  {
    src: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/youtube.mrs",
    dst: "clash/youtube.mrs"
  },
  {
    src: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/google.mrs",
    dst: "clash/google.mrs"
  },
  {
    src: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/anthropic.mrs",
    dst: "clash/anthropic.mrs"
  },
  {
    src: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-ai-!cn.mrs",
    dst: "clash/category-ai-!cn.mrs"
  },
  {
    src: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/github.mrs",
    dst: "clash/github.mrs"
  },
  {
    src: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/microsoft.mrs",
    dst: "clash/microsoft.mrs"
  },
  {
    src: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/apple.mrs",
    dst: "clash/apple.mrs"
  },
  {
    src: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/telegram.mrs",
    dst: "clash/telegram.mrs"
  },
  {
    src: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/steam.mrs",
    dst: "clash/steam.mrs"
  },
  {
    src: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/tiktok.mrs",
    dst: "clash/tiktok.mrs"
  },
  {
    src: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/twitter.mrs",
    dst: "clash/twitter.mrs"
  },
  {
    src: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/meta.mrs",
    dst: "clash/meta.mrs"
  },
  {
    src: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geoip/facebook.mrs",
    dst: "clash/facebook.mrs"
  },
  {
    src: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/line.mrs",
    dst: "clash/line.mrs"
  },
  {
    src: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/netflix.mrs",
    dst: "clash/netflix.mrs"
  },
  {
    src: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-emby.mrs",
    dst: "clash/category-emby.mrs"
  },
  {
    src: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/pikpak.mrs",
    dst: "clash/pikpak.mrs"
  },
  {
    src: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/spotify.mrs",
    dst: "clash/spotify.mrs"
  },
  {
    src: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-cryptocurrency.mrs",
    dst: "clash/category-cryptocurrency.mrs"
  },
  {
    src: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/ehentai.mrs",
    dst: "clash/ehentai.mrs"
  },
  {
    src: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/release/geoip.dat",
    dst: "clash/geoip.dat"
  },
  {
    src: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/release/geosite.dat",
    dst: "clash/geosite.dat"
  },
  {
    src: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/release/geoip.metadb",
    dst: "clash/geoip.metadb"
  },
  {
    src: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/release/GeoLite2-ASN.mmdb",
    dst: "clash/GeoLite2-ASN.mmdb"
  },
  {
    src: "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-private.srs",
    dst: "singbox/geosite-private.srs"
  },
  {
    src: "https://raw.githubusercontent.com/SagerNet/sing-geoip/rule-set/geoip-cn.srs",
    dst: "singbox/geoip-cn.srs"
  },
  {
    src: "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-geolocation-cn.srs",
    dst: "singbox/geosite-geolocation-cn.srs"
  },
  {
    src: "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-cn.srs",
    dst: "singbox/geosite-cn.srs"
  },
  {
    src: "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-category-games@cn.srs",
    dst: "singbox/geosite-category-games@cn.srs"
  },
  {
    src: "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-epicgames@cn.srs",
    dst: "singbox/geosite-epicgames@cn.srs"
  },
  {
    src: "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-nvidia@cn.srs",
    dst: "singbox/geosite-nvidia@cn.srs"
  },
  {
    src: "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-apple@cn.srs",
    dst: "singbox/geosite-apple@cn.srs"
  },
  {
    src: "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-microsoft@cn.srs",
    dst: "singbox/geosite-microsoft@cn.srs"
  },
  {
    src: "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-steam@cn.srs",
    dst: "singbox/geosite-steam@cn.srs"
  },
  {
    src: "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-category-ads-all.srs",
    dst: "singbox/geosite-category-ads-all.srs"
  },
  {
    src: "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-youtube.srs",
    dst: "singbox/geosite-youtube.srs"
  },
  {
    src: "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-google.srs",
    dst: "singbox/geosite-google.srs"
  },
  {
    src: "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-anthropic.srs",
    dst: "singbox/geosite-anthropic.srs"
  },
  {
    src: "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-category-ai-!cn.srs",
    dst: "singbox/geosite-category-ai-!cn.srs"
  },
  {
    src: "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-github.srs",
    dst: "singbox/geosite-github.srs"
  },
  {
    src: "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-microsoft.srs",
    dst: "singbox/geosite-microsoft.srs"
  },
  {
    src: "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-apple.srs",
    dst: "singbox/geosite-apple.srs"
  },
  {
    src: "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-telegram.srs",
    dst: "singbox/geosite-telegram.srs"
  },
  {
    src: "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-steam.srs",
    dst: "singbox/geosite-steam.srs"
  },
  {
    src: "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-tiktok.srs",
    dst: "singbox/geosite-tiktok.srs"
  },
  {
    src: "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-twitter.srs",
    dst: "singbox/geosite-twitter.srs"
  },
  {
    src: "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-facebook.srs",
    dst: "singbox/geosite-facebook.srs"
  },
  {
    src: "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-instagram.srs",
    dst: "singbox/geosite-instagram.srs"
  },
  {
    src: "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-whatsapp.srs",
    dst: "singbox/geosite-whatsapp.srs"
  },
  {
    src: "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-threads.srs",
    dst: "singbox/geosite-threads.srs"
  },
  {
    src: "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-messenger.srs",
    dst: "singbox/geosite-messenger.srs"
  },
  {
    src: "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-meta.srs",
    dst: "singbox/geosite-meta.srs"
  },
  {
    src: "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-oculus.srs",
    dst: "singbox/geosite-oculus.srs"
  },
  {
    src: "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-netflix.srs",
    dst: "singbox/geosite-netflix.srs"
  },
  {
    src: "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-spotify.srs",
    dst: "singbox/geosite-spotify.srs"
  },
  {
    src: "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-paypal.srs",
    dst: "singbox/geosite-paypal.srs"
  },
  {
    src: "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-binance.srs",
    dst: "singbox/geosite-binance.srs"
  },
  {
    src: "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-okx.srs",
    dst: "singbox/geosite-okx.srs"
  },
  {
    src: "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-bybit.srs",
    dst: "singbox/geosite-bybit.srs"
  },
  {
    src: "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-huobi.srs",
    dst: "singbox/geosite-huobi.srs"
  },
  {
    src: "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-category-cryptocurrency.srs",
    dst: "singbox/geosite-category-cryptocurrency.srs"
  },
  {
    src: "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-geolocation-!cn.srs",
    dst: "singbox/geosite-geolocation-!cn.srs"
  }
];

// src/worker.js
var BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
var REFRESH_UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
var GROUP_TYPES = /* @__PURE__ */ new Set(["selector", "urltest"]);
var BUILTIN_TYPES = /* @__PURE__ */ new Set(["direct", "block", "dns"]);
var ENTRY_AUTO = "\u26D3 \u5165\u53E3\u4F18\u9009";
var EXIT_AUTO = "\u26D3 \u51FA\u53E3\u4F18\u9009";
var REGION_DEFS = [
  ["\u9999\u6E2F", "\u{1F1ED}\u{1F1F0}", "\u{1F1ED}\u{1F1F0}|\u9999\u6E2F|\\bHKG?\\b|hong[\\s_-]*kong"],
  ["\u53F0\u6E7E", "\u{1F1F9}\u{1F1FC}", "\u{1F1F9}\u{1F1FC}|\u53F0\u6E7E|\u53F0\u5317|\u9AD8\u96C4|\u65B0\u5317|\u6843\u56ED|\u65B0\u7AF9|\\bTWN?\\b|taiwan|taipei|hinet"],
  ["\u65E5\u672C", "\u{1F1EF}\u{1F1F5}", "\u{1F1EF}\u{1F1F5}|\u65E5\u672C|\\bJPN?\\b|japan|tokyo|osaka|\u4E1C\u4EAC|\u5927\u962A"],
  ["\u97E9\u56FD", "\u{1F1F0}\u{1F1F7}", "\u{1F1F0}\u{1F1F7}|\u97E9\u56FD|(?:^|[^A-Za-z])KR(?:$|[^A-Za-z])|korea|seoul|\u9996\u5C14"],
  ["\u65B0\u52A0\u5761", "\u{1F1F8}\u{1F1EC}", "\u{1F1F8}\u{1F1EC}|\u65B0\u52A0\u5761|\u72EE\u57CE|\\bSGP?\\b|singapore"],
  ["\u7F8E\u56FD", "\u{1F1FA}\u{1F1F8}", "\u{1F1FA}\u{1F1F8}|\u7F8E\u56FD|(?:^|[^A-Za-z])US(?:$|[^A-Za-z])|(?:^|[^A-Za-z])USA(?:$|[^A-Za-z])|america|united[\\s_-]*states|los[\\s_-]*angeles|\u6D1B\u6749\u77F6|san[\\s_-]*jose|\u5723\u4F55\u585E|\u7EBD\u7EA6|new[\\s_-]*york|\u829D\u52A0\u54E5|chicago|\u8FBE\u62C9\u65AF|dallas|\u897F\u96C5\u56FE|seattle|\u7845\u8C37|\u77FD\u8C37|silicon|\u8FC8\u963F\u5BC6|miami|\u51E4\u51F0\u57CE|phoenix"],
  ["\u82F1\u56FD", "\u{1F1EC}\u{1F1E7}", "\u{1F1EC}\u{1F1E7}|\u82F1\u56FD|(?:^|[^A-Za-z0-9])GB(?:$|[^A-Za-z])|united[\\s_-]*kingdom|london|\u4F26\u6566"],
  ["\u5FB7\u56FD", "\u{1F1E9}\u{1F1EA}", "\u{1F1E9}\u{1F1EA}|\u5FB7\u56FD|(?:^|[^A-Za-z])DE(?:$|[^A-Za-z])|germany|frankfurt|\u6CD5\u5170\u514B\u798F"],
  ["\u8377\u5170", "\u{1F1F3}\u{1F1F1}", "\u{1F1F3}\u{1F1F1}|\u8377\u5170|(?:^|[^A-Za-z])NL(?:$|[^A-Za-z])|nether?lands|amsterdam|\u963F\u59C6\u65AF\u7279\u4E39"],
  ["\u9A6C\u6765\u897F\u4E9A", "\u{1F1F2}\u{1F1FE}", "\u{1F1F2}\u{1F1FE}|\u9A6C\u6765\u897F\u4E9A|(?:^|[^A-Za-z])MY(?:$|[^A-Za-z])|malaysia|kuala[\\s_-]*lumpur|\u5409\u9686\u5761"],
  ["\u6CF0\u56FD", "\u{1F1F9}\u{1F1ED}", "\u{1F1F9}\u{1F1ED}|\u6CF0\u56FD|(?:^|[^A-Za-z])TH(?:$|[^A-Za-z])|thailand|bangkok|\u66FC\u8C37"],
  ["\u8D8A\u5357", "\u{1F1FB}\u{1F1F3}", "\u{1F1FB}\u{1F1F3}|\u8D8A\u5357|(?:^|[^A-Za-z])VN(?:$|[^A-Za-z])|vietnam|hanoi|\u6CB3\u5185|ho[\\s_-]*chi[\\s_-]*minh|\u80E1\u5FD7\u660E"],
  ["\u83F2\u5F8B\u5BBE", "\u{1F1F5}\u{1F1ED}", "\u{1F1F5}\u{1F1ED}|\u83F2\u5F8B\u5BBE|(?:^|[^A-Za-z])PH(?:$|[^A-Za-z])|philippines|manila|\u9A6C\u5C3C\u62C9"],
  ["\u5370\u5C3C", "\u{1F1EE}\u{1F1E9}", "\u{1F1EE}\u{1F1E9}|\u5370\u5C3C|\u5370\u5EA6\u5C3C\u897F\u4E9A|(?:^|[^A-Za-z])ID(?:$|[^A-Za-z])|indonesia|jakarta|\u96C5\u52A0\u8FBE"],
  ["\u5370\u5EA6", "\u{1F1EE}\u{1F1F3}", "\u{1F1EE}\u{1F1F3}|\u5370\u5EA6|(?:^|[^A-Za-z])IN(?:$|[^A-Za-z])|india|mumbai|\u5B5F\u4E70|delhi|\u5FB7\u91CC"],
  ["\u6FB3\u5927\u5229\u4E9A", "\u{1F1E6}\u{1F1FA}", "\u{1F1E6}\u{1F1FA}|\u6FB3\u5927\u5229\u4E9A|\u6FB3\u6D32|(?:^|[^A-Za-z])AU(?:$|[^A-Za-z])|australia|sydney|\u6089\u5C3C|melbourne|\u58A8\u5C14\u672C"],
  ["\u6CD5\u56FD", "\u{1F1EB}\u{1F1F7}", "\u{1F1EB}\u{1F1F7}|\u6CD5\u56FD|(?:^|[^A-Za-z])FR(?:$|[^A-Za-z])|france|paris|\u5DF4\u9ECE"],
  ["\u4FC4\u7F57\u65AF", "\u{1F1F7}\u{1F1FA}", "\u{1F1F7}\u{1F1FA}|\u4FC4\u7F57\u65AF|(?:^|[^A-Za-z])RU(?:$|[^A-Za-z])|russia|moscow|\u83AB\u65AF\u79D1"],
  ["\u610F\u5927\u5229", "\u{1F1EE}\u{1F1F9}", "\u{1F1EE}\u{1F1F9}|\u610F\u5927\u5229|(?:^|[^A-Za-z])IT(?:$|[^A-Za-z])|\\bitaly\\b|rome|\u7F57\u9A6C"],
  ["\u52A0\u62FF\u5927", "\u{1F1E8}\u{1F1E6}", "\u{1F1E8}\u{1F1E6}|\u52A0\u62FF\u5927|(?:^|[^A-Za-z])CA(?:$|[^A-Za-z])|canada|toronto|\u591A\u4F26\u591A"],
  ["\u963F\u6839\u5EF7", "\u{1F1E6}\u{1F1F7}", "\u{1F1E6}\u{1F1F7}|\u963F\u6839\u5EF7|(?:^|[^A-Za-z])AR(?:$|[^A-Za-z])|argentina|buenos[\\s_-]*aires|\u5E03\u5B9C\u8BFA\u65AF\u827E\u5229\u65AF"],
  ["\u5DF4\u897F", "\u{1F1E7}\u{1F1F7}", "\u{1F1E7}\u{1F1F7}|\u5DF4\u897F|(?:^|[^A-Za-z])BR(?:$|[^A-Za-z])|brazil|sao[\\s_-]*paulo|\u5723\u4FDD\u7F57"],
  ["\u58A8\u897F\u54E5", "\u{1F1F2}\u{1F1FD}", "\u{1F1F2}\u{1F1FD}|\u58A8\u897F\u54E5|(?:^|[^A-Za-z])MX(?:$|[^A-Za-z])|mexico"],
  ["\u6C99\u7279\u963F\u62C9\u4F2F", "\u{1F1F8}\u{1F1E6}", "\u{1F1F8}\u{1F1E6}|\u6C99\u7279\u963F\u62C9\u4F2F|\u6C99\u7279|(?:^|[^A-Za-z])SA(?:$|[^A-Za-z])|saudi[\\s_-]*arabia"],
  ["\u5357\u975E", "\u{1F1FF}\u{1F1E6}", "\u{1F1FF}\u{1F1E6}|\u5357\u975E|(?:^|[^A-Za-z])ZA(?:$|[^A-Za-z])|south[\\s_-]*africa|johannesburg|\u7EA6\u7FF0\u5185\u65AF\u5821"],
  ["\u571F\u8033\u5176", "\u{1F1F9}\u{1F1F7}", "\u{1F1F9}\u{1F1F7}|\u571F\u8033\u5176|(?:^|[^A-Za-z])TR(?:$|[^A-Za-z])|turkey|istanbul|\u4F0A\u65AF\u5766\u5E03\u5C14"],
  ["\u6587\u83B1", "\u{1F1E7}\u{1F1F3}", "\u{1F1E7}\u{1F1F3}|\u6587\u83B1|(?:^|[^A-Za-z])BN(?:$|[^A-Za-z])|brunei"],
  ["\u67EC\u57D4\u5BE8", "\u{1F1F0}\u{1F1ED}", "\u{1F1F0}\u{1F1ED}|\u67EC\u57D4\u5BE8|(?:^|[^A-Za-z])KH(?:$|[^A-Za-z])|cambodia|phnom[\\s_-]*penh|\u91D1\u8FB9"],
  ["\u8001\u631D", "\u{1F1F1}\u{1F1E6}", "\u{1F1F1}\u{1F1E6}|\u8001\u631D|(?:^|[^A-Za-z])LA(?:$|[^A-Za-z])|\\blaos\\b|vientiane|\u4E07\u8C61"],
  ["\u7F05\u7538", "\u{1F1F2}\u{1F1F2}", "\u{1F1F2}\u{1F1F2}|\u7F05\u7538|(?:^|[^A-Za-z])MM(?:$|[^A-Za-z])|myanmar|yangon|\u4EF0\u5149"],
  ["\u5965\u5730\u5229", "\u{1F1E6}\u{1F1F9}", "\u{1F1E6}\u{1F1F9}|\u5965\u5730\u5229|(?:^|[^A-Za-z])AT(?:$|[^A-Za-z])|austria|vienna|\u7EF4\u4E5F\u7EB3"],
  ["\u6BD4\u5229\u65F6", "\u{1F1E7}\u{1F1EA}", "\u{1F1E7}\u{1F1EA}|\u6BD4\u5229\u65F6|(?:^|[^A-Za-z])BE(?:$|[^A-Za-z])|belgium|brussels|\u5E03\u9C81\u585E\u5C14"],
  ["\u4FDD\u52A0\u5229\u4E9A", "\u{1F1E7}\u{1F1EC}", "\u{1F1E7}\u{1F1EC}|\u4FDD\u52A0\u5229\u4E9A|(?:^|[^A-Za-z])BG(?:$|[^A-Za-z])|bulgaria|sofia|\u7D22\u975E\u4E9A"],
  ["\u514B\u7F57\u5730\u4E9A", "\u{1F1ED}\u{1F1F7}", "\u{1F1ED}\u{1F1F7}|\u514B\u7F57\u5730\u4E9A|(?:^|[^A-Za-z])HR(?:$|[^A-Za-z])|croatia"],
  ["\u585E\u6D66\u8DEF\u65AF", "\u{1F1E8}\u{1F1FE}", "\u{1F1E8}\u{1F1FE}|\u585E\u6D66\u8DEF\u65AF|(?:^|[^A-Za-z])CY(?:$|[^A-Za-z])|cyprus"],
  ["\u6377\u514B", "\u{1F1E8}\u{1F1FF}", "\u{1F1E8}\u{1F1FF}|\u6377\u514B|\u6377\u514B\u5171\u548C\u56FD|(?:^|[^A-Za-z])CZ(?:$|[^A-Za-z])|czech|prague|\u5E03\u62C9\u683C"],
  ["\u4E39\u9EA6", "\u{1F1E9}\u{1F1F0}", "\u{1F1E9}\u{1F1F0}|\u4E39\u9EA6|(?:^|[^A-Za-z])DK(?:$|[^A-Za-z])|denmark|copenhagen|\u54E5\u672C\u54C8\u6839"],
  ["\u7231\u6C99\u5C3C\u4E9A", "\u{1F1EA}\u{1F1EA}", "\u{1F1EA}\u{1F1EA}|\u7231\u6C99\u5C3C\u4E9A|(?:^|[^A-Za-z])EE(?:$|[^A-Za-z])|estonia"],
  ["\u82AC\u5170", "\u{1F1EB}\u{1F1EE}", "\u{1F1EB}\u{1F1EE}|\u82AC\u5170|(?:^|[^A-Za-z])FI(?:$|[^A-Za-z])|finland|helsinki|\u8D6B\u5C14\u8F9B\u57FA"],
  ["\u5E0C\u814A", "\u{1F1EC}\u{1F1F7}", "\u{1F1EC}\u{1F1F7}|\u5E0C\u814A|(?:^|[^A-Za-z])GR(?:$|[^A-Za-z])|greece|athens|\u96C5\u5178"],
  ["\u5308\u7259\u5229", "\u{1F1ED}\u{1F1FA}", "\u{1F1ED}\u{1F1FA}|\u5308\u7259\u5229|(?:^|[^A-Za-z])HU(?:$|[^A-Za-z])|hungary|budapest|\u5E03\u8FBE\u4F69\u65AF"],
  ["\u7231\u5C14\u5170", "\u{1F1EE}\u{1F1EA}", "\u{1F1EE}\u{1F1EA}|\u7231\u5C14\u5170|(?:^|[^A-Za-z])IE(?:$|[^A-Za-z])|ireland|dublin|\u90FD\u67CF\u6797"],
  ["\u62C9\u8131\u7EF4\u4E9A", "\u{1F1F1}\u{1F1FB}", "\u{1F1F1}\u{1F1FB}|\u62C9\u8131\u7EF4\u4E9A|(?:^|[^A-Za-z])LV(?:$|[^A-Za-z])|latvia"],
  ["\u7ACB\u9676\u5B9B", "\u{1F1F1}\u{1F1F9}", "\u{1F1F1}\u{1F1F9}|\u7ACB\u9676\u5B9B|(?:^|[^A-Za-z])LT(?:$|[^A-Za-z])|lithuania"],
  ["\u5362\u68EE\u5821", "\u{1F1F1}\u{1F1FA}", "\u{1F1F1}\u{1F1FA}|\u5362\u68EE\u5821|(?:^|[^A-Za-z])LU(?:$|[^A-Za-z])|luxembourg"],
  ["\u9A6C\u8033\u4ED6", "\u{1F1F2}\u{1F1F9}", "\u{1F1F2}\u{1F1F9}|\u9A6C\u8033\u4ED6|(?:^|[^A-Za-z])MT(?:$|[^A-Za-z])|malta"],
  ["\u6CE2\u5170", "\u{1F1F5}\u{1F1F1}", "\u{1F1F5}\u{1F1F1}|\u6CE2\u5170|(?:^|[^A-Za-z])PL(?:$|[^A-Za-z])|poland|warsaw|\u534E\u6C99"],
  ["\u8461\u8404\u7259", "\u{1F1F5}\u{1F1F9}", "\u{1F1F5}\u{1F1F9}|\u8461\u8404\u7259|(?:^|[^A-Za-z])PT(?:$|[^A-Za-z])|portugal|lisbon|\u91CC\u65AF\u672C"],
  ["\u7F57\u9A6C\u5C3C\u4E9A", "\u{1F1F7}\u{1F1F4}", "\u{1F1F7}\u{1F1F4}|\u7F57\u9A6C\u5C3C\u4E9A|(?:^|[^A-Za-z])RO(?:$|[^A-Za-z])|romania|bucharest|\u5E03\u52A0\u52D2\u65AF\u7279"],
  ["\u65AF\u6D1B\u4F10\u514B", "\u{1F1F8}\u{1F1F0}", "\u{1F1F8}\u{1F1F0}|\u65AF\u6D1B\u4F10\u514B|(?:^|[^A-Za-z])SK(?:$|[^A-Za-z])|slovakia"],
  ["\u65AF\u6D1B\u6587\u5C3C\u4E9A", "\u{1F1F8}\u{1F1EE}", "\u{1F1F8}\u{1F1EE}|\u65AF\u6D1B\u6587\u5C3C\u4E9A|(?:^|[^A-Za-z])SI(?:$|[^A-Za-z])|slovenia"],
  ["\u897F\u73ED\u7259", "\u{1F1EA}\u{1F1F8}", "\u{1F1EA}\u{1F1F8}|\u897F\u73ED\u7259|(?:^|[^A-Za-z])ES(?:$|[^A-Za-z])|\\bspain\\b|madrid|\u9A6C\u5FB7\u91CC"],
  ["\u745E\u5178", "\u{1F1F8}\u{1F1EA}", "\u{1F1F8}\u{1F1EA}|\u745E\u5178|(?:^|[^A-Za-z])SE(?:$|[^A-Za-z])|sweden|stockholm|\u65AF\u5FB7\u54E5\u5C14\u6469"],
  ["\u963F\u5C14\u53CA\u5229\u4E9A", "\u{1F1E9}\u{1F1FF}", "\u{1F1E9}\u{1F1FF}|\u963F\u5C14\u53CA\u5229\u4E9A|(?:^|[^A-Za-z])DZ(?:$|[^A-Za-z])|algeria"],
  ["\u5B89\u54E5\u62C9", "\u{1F1E6}\u{1F1F4}", "\u{1F1E6}\u{1F1F4}|\u5B89\u54E5\u62C9|(?:^|[^A-Za-z])AO(?:$|[^A-Za-z])|angola"],
  ["\u8D1D\u5B81", "\u{1F1E7}\u{1F1EF}", "\u{1F1E7}\u{1F1EF}|\u8D1D\u5B81|(?:^|[^A-Za-z])BJ(?:$|[^A-Za-z])|benin"],
  ["\u535A\u8328\u74E6\u7EB3", "\u{1F1E7}\u{1F1FC}", "\u{1F1E7}\u{1F1FC}|\u535A\u8328\u74E6\u7EB3|(?:^|[^A-Za-z])BW(?:$|[^A-Za-z])|botswana"],
  ["\u5E03\u57FA\u7EB3\u6CD5\u7D22", "\u{1F1E7}\u{1F1EB}", "\u{1F1E7}\u{1F1EB}|\u5E03\u57FA\u7EB3\u6CD5\u7D22|(?:^|[^A-Za-z])BF(?:$|[^A-Za-z])|burkina[\\s_-]*faso"],
  ["\u5E03\u9686\u8FEA", "\u{1F1E7}\u{1F1EE}", "\u{1F1E7}\u{1F1EE}|\u5E03\u9686\u8FEA|(?:^|[^A-Za-z])BI(?:$|[^A-Za-z])|burundi"],
  ["\u4F5B\u5F97\u89D2", "\u{1F1E8}\u{1F1FB}", "\u{1F1E8}\u{1F1FB}|\u4F5B\u5F97\u89D2|(?:^|[^A-Za-z])CV(?:$|[^A-Za-z])|cabo[\\s_-]*verde|cape[\\s_-]*verde"],
  ["\u5580\u9EA6\u9686", "\u{1F1E8}\u{1F1F2}", "\u{1F1E8}\u{1F1F2}|\u5580\u9EA6\u9686|(?:^|[^A-Za-z])CM(?:$|[^A-Za-z])|cameroon"],
  ["\u4E2D\u975E\u5171\u548C\u56FD", "\u{1F1E8}\u{1F1EB}", "\u{1F1E8}\u{1F1EB}|\u4E2D\u975E\u5171\u548C\u56FD|\u4E2D\u975E|(?:^|[^A-Za-z])CF(?:$|[^A-Za-z])|central[\\s_-]*african"],
  ["\u4E4D\u5F97", "\u{1F1F9}\u{1F1E9}", "\u{1F1F9}\u{1F1E9}|\u4E4D\u5F97|(?:^|[^A-Za-z])TD(?:$|[^A-Za-z])|\\bchad\\b"],
  ["\u79D1\u6469\u7F57", "\u{1F1F0}\u{1F1F2}", "\u{1F1F0}\u{1F1F2}|\u79D1\u6469\u7F57|(?:^|[^A-Za-z])KM(?:$|[^A-Za-z])|comoros"],
  ["\u521A\u679C\u5171\u548C\u56FD", "\u{1F1E8}\u{1F1EC}", "\u{1F1E8}\u{1F1EC}|\u521A\u679C\u5171\u548C\u56FD|\u521A\u679C\uFF08\u5E03\uFF09|(?:^|[^A-Za-z])CG(?:$|[^A-Za-z])|\\bcongo\\b"],
  ["\u521A\u679C\u6C11\u4E3B\u5171\u548C\u56FD", "\u{1F1E8}\u{1F1E9}", "\u{1F1E8}\u{1F1E9}|\u521A\u679C\u6C11\u4E3B\u5171\u548C\u56FD|\u521A\u679C\uFF08\u91D1\uFF09|\u6C11\u4E3B\u521A\u679C|(?:^|[^A-Za-z])CD(?:$|[^A-Za-z])|dr[\\s_-]*congo|democratic[\\s_-]*republic[\\s_-]*of[\\s_-]*the[\\s_-]*congo"],
  ["\u79D1\u7279\u8FEA\u74E6", "\u{1F1E8}\u{1F1EE}", "\u{1F1E8}\u{1F1EE}|\u79D1\u7279\u8FEA\u74E6|\u8C61\u7259\u6D77\u5CB8|(?:^|[^A-Za-z])CI(?:$|[^A-Za-z])|cote[\\s_-]*d.ivoire|ivory[\\s_-]*coast"],
  ["\u5409\u5E03\u63D0", "\u{1F1E9}\u{1F1EF}", "\u{1F1E9}\u{1F1EF}|\u5409\u5E03\u63D0|(?:^|[^A-Za-z])DJ(?:$|[^A-Za-z])|djibouti"],
  ["\u57C3\u53CA", "\u{1F1EA}\u{1F1EC}", "\u{1F1EA}\u{1F1EC}|\u57C3\u53CA|(?:^|[^A-Za-z])EG(?:$|[^A-Za-z])|egypt|cairo|\u5F00\u7F57"],
  ["\u8D64\u9053\u51E0\u5185\u4E9A", "\u{1F1EC}\u{1F1F6}", "\u{1F1EC}\u{1F1F6}|\u8D64\u9053\u51E0\u5185\u4E9A|(?:^|[^A-Za-z])GQ(?:$|[^A-Za-z])|equatorial[\\s_-]*guinea"],
  ["\u5384\u7ACB\u7279\u91CC\u4E9A", "\u{1F1EA}\u{1F1F7}", "\u{1F1EA}\u{1F1F7}|\u5384\u7ACB\u7279\u91CC\u4E9A|(?:^|[^A-Za-z])ER(?:$|[^A-Za-z])|eritrea"],
  ["\u65AF\u5A01\u58EB\u5170", "\u{1F1F8}\u{1F1FF}", "\u{1F1F8}\u{1F1FF}|\u65AF\u5A01\u58EB\u5170|\u57C3\u65AF\u74E6\u8482\u5C3C|(?:^|[^A-Za-z])SZ(?:$|[^A-Za-z])|eswatini|swaziland"],
  ["\u57C3\u585E\u4FC4\u6BD4\u4E9A", "\u{1F1EA}\u{1F1F9}", "\u{1F1EA}\u{1F1F9}|\u57C3\u585E\u4FC4\u6BD4\u4E9A|(?:^|[^A-Za-z])ET(?:$|[^A-Za-z])|ethiopia"],
  ["\u52A0\u84EC", "\u{1F1EC}\u{1F1E6}", "\u{1F1EC}\u{1F1E6}|\u52A0\u84EC|(?:^|[^A-Za-z])GA(?:$|[^A-Za-z])|\\bgabon\\b"],
  ["\u5188\u6BD4\u4E9A", "\u{1F1EC}\u{1F1F2}", "\u{1F1EC}\u{1F1F2}|\u5188\u6BD4\u4E9A|(?:^|[^A-Za-z])GM(?:$|[^A-Za-z])|gambia"],
  ["\u52A0\u7EB3", "\u{1F1EC}\u{1F1ED}", "\u{1F1EC}\u{1F1ED}|\u52A0\u7EB3|(?:^|[^A-Za-z])GH(?:$|[^A-Za-z])|\\bghana\\b"],
  ["\u51E0\u5185\u4E9A", "\u{1F1EC}\u{1F1F3}", "\u{1F1EC}\u{1F1F3}|\u51E0\u5185\u4E9A|(?:^|[^A-Za-z])GN(?:$|[^A-Za-z])|\\bguinea\\b"],
  ["\u51E0\u5185\u4E9A\u6BD4\u7ECD", "\u{1F1EC}\u{1F1FC}", "\u{1F1EC}\u{1F1FC}|\u51E0\u5185\u4E9A\u6BD4\u7ECD|(?:^|[^A-Za-z])GW(?:$|[^A-Za-z])|guinea-bissau|guinea[\\s_-]*bissau"],
  ["\u80AF\u5C3C\u4E9A", "\u{1F1F0}\u{1F1EA}", "\u{1F1F0}\u{1F1EA}|\u80AF\u5C3C\u4E9A|(?:^|[^A-Za-z])KE(?:$|[^A-Za-z])|kenya|nairobi|\u5185\u7F57\u6BD5"],
  ["\u83B1\u7D22\u6258", "\u{1F1F1}\u{1F1F8}", "\u{1F1F1}\u{1F1F8}|\u83B1\u7D22\u6258|(?:^|[^A-Za-z])LS(?:$|[^A-Za-z])|lesotho"],
  ["\u5229\u6BD4\u91CC\u4E9A", "\u{1F1F1}\u{1F1F7}", "\u{1F1F1}\u{1F1F7}|\u5229\u6BD4\u91CC\u4E9A|(?:^|[^A-Za-z])LR(?:$|[^A-Za-z])|liberia"],
  ["\u5229\u6BD4\u4E9A", "\u{1F1F1}\u{1F1FE}", "\u{1F1F1}\u{1F1FE}|\u5229\u6BD4\u4E9A|(?:^|[^A-Za-z])LY(?:$|[^A-Za-z])|\\blibya\\b"],
  ["\u9A6C\u8FBE\u52A0\u65AF\u52A0", "\u{1F1F2}\u{1F1EC}", "\u{1F1F2}\u{1F1EC}|\u9A6C\u8FBE\u52A0\u65AF\u52A0|(?:^|[^A-Za-z])MG(?:$|[^A-Za-z])|madagascar"],
  ["\u9A6C\u62C9\u7EF4", "\u{1F1F2}\u{1F1FC}", "\u{1F1F2}\u{1F1FC}|\u9A6C\u62C9\u7EF4|(?:^|[^A-Za-z])MW(?:$|[^A-Za-z])|malawi"],
  ["\u9A6C\u91CC", "\u{1F1F2}\u{1F1F1}", "\u{1F1F2}\u{1F1F1}|\u9A6C\u91CC|(?:^|[^A-Za-z])ML(?:$|[^A-Za-z])|\\bmali\\b"],
  ["\u6BDB\u91CC\u5854\u5C3C\u4E9A", "\u{1F1F2}\u{1F1F7}", "\u{1F1F2}\u{1F1F7}|\u6BDB\u91CC\u5854\u5C3C\u4E9A|(?:^|[^A-Za-z])MR(?:$|[^A-Za-z])|mauritania"],
  ["\u6BDB\u91CC\u6C42\u65AF", "\u{1F1F2}\u{1F1FA}", "\u{1F1F2}\u{1F1FA}|\u6BDB\u91CC\u6C42\u65AF|(?:^|[^A-Za-z])MU(?:$|[^A-Za-z])|mauritius"],
  ["\u6469\u6D1B\u54E5", "\u{1F1F2}\u{1F1E6}", "\u{1F1F2}\u{1F1E6}|\u6469\u6D1B\u54E5|(?:^|[^A-Za-z])MA(?:$|[^A-Za-z])|morocco|casablanca|\u5361\u8428\u5E03\u5170\u5361"],
  ["\u83AB\u6851\u6BD4\u514B", "\u{1F1F2}\u{1F1FF}", "\u{1F1F2}\u{1F1FF}|\u83AB\u6851\u6BD4\u514B|(?:^|[^A-Za-z])MZ(?:$|[^A-Za-z])|mozambique"],
  ["\u7EB3\u7C73\u6BD4\u4E9A", "\u{1F1F3}\u{1F1E6}", "\u{1F1F3}\u{1F1E6}|\u7EB3\u7C73\u6BD4\u4E9A|(?:^|[^A-Za-z])NA(?:$|[^A-Za-z])|\\bnamibia\\b"],
  ["\u5C3C\u65E5\u5C14", "\u{1F1F3}\u{1F1EA}", "\u{1F1F3}\u{1F1EA}|\u5C3C\u65E5\u5C14|(?:^|[^A-Za-z])NE(?:$|[^A-Za-z])|\\bniger\\b"],
  ["\u5C3C\u65E5\u5229\u4E9A", "\u{1F1F3}\u{1F1EC}", "\u{1F1F3}\u{1F1EC}|\u5C3C\u65E5\u5229\u4E9A|(?:^|[^A-Za-z])NG(?:$|[^A-Za-z])|nigeria|lagos|\u62C9\u5404\u65AF"],
  ["\u5362\u65FA\u8FBE", "\u{1F1F7}\u{1F1FC}", "\u{1F1F7}\u{1F1FC}|\u5362\u65FA\u8FBE|(?:^|[^A-Za-z])RW(?:$|[^A-Za-z])|rwanda"],
  ["\u5723\u591A\u7F8E\u548C\u666E\u6797\u897F\u6BD4", "\u{1F1F8}\u{1F1F9}", "\u{1F1F8}\u{1F1F9}|\u5723\u591A\u7F8E\u548C\u666E\u6797\u897F\u6BD4|(?:^|[^A-Za-z])ST(?:$|[^A-Za-z])|sao[\\s_-]*tome"],
  ["\u585E\u5185\u52A0\u5C14", "\u{1F1F8}\u{1F1F3}", "\u{1F1F8}\u{1F1F3}|\u585E\u5185\u52A0\u5C14|(?:^|[^A-Za-z])SN(?:$|[^A-Za-z])|senegal"],
  ["\u585E\u820C\u5C14", "\u{1F1F8}\u{1F1E8}", "\u{1F1F8}\u{1F1E8}|\u585E\u820C\u5C14|(?:^|[^A-Za-z])SC(?:$|[^A-Za-z])|seychelles"],
  ["\u585E\u62C9\u5229\u6602", "\u{1F1F8}\u{1F1F1}", "\u{1F1F8}\u{1F1F1}|\u585E\u62C9\u5229\u6602|(?:^|[^A-Za-z])SL(?:$|[^A-Za-z])|sierra[\\s_-]*leone"],
  ["\u7D22\u9A6C\u91CC", "\u{1F1F8}\u{1F1F4}", "\u{1F1F8}\u{1F1F4}|\u7D22\u9A6C\u91CC|(?:^|[^A-Za-z])SO(?:$|[^A-Za-z])|somalia"],
  ["\u5357\u82CF\u4E39", "\u{1F1F8}\u{1F1F8}", "\u{1F1F8}\u{1F1F8}|\u5357\u82CF\u4E39|(?:^|[^A-Za-z])SS(?:$|[^A-Za-z])|south[\\s_-]*sudan"],
  ["\u82CF\u4E39", "\u{1F1F8}\u{1F1E9}", "\u{1F1F8}\u{1F1E9}|\u82CF\u4E39|(?:^|[^A-Za-z])SD(?:$|[^A-Za-z])|\\bsudan\\b"],
  ["\u5766\u6851\u5C3C\u4E9A", "\u{1F1F9}\u{1F1FF}", "\u{1F1F9}\u{1F1FF}|\u5766\u6851\u5C3C\u4E9A|(?:^|[^A-Za-z])TZ(?:$|[^A-Za-z])|tanzania"],
  ["\u591A\u54E5", "\u{1F1F9}\u{1F1EC}", "\u{1F1F9}\u{1F1EC}|\u591A\u54E5|(?:^|[^A-Za-z])TG(?:$|[^A-Za-z])|\\btogo\\b"],
  ["\u7A81\u5C3C\u65AF", "\u{1F1F9}\u{1F1F3}", "\u{1F1F9}\u{1F1F3}|\u7A81\u5C3C\u65AF|(?:^|[^A-Za-z])TN(?:$|[^A-Za-z])|tunisia"],
  ["\u4E4C\u5E72\u8FBE", "\u{1F1FA}\u{1F1EC}", "\u{1F1FA}\u{1F1EC}|\u4E4C\u5E72\u8FBE|(?:^|[^A-Za-z])UG(?:$|[^A-Za-z])|uganda"],
  ["\u8D5E\u6BD4\u4E9A", "\u{1F1FF}\u{1F1F2}", "\u{1F1FF}\u{1F1F2}|\u8D5E\u6BD4\u4E9A|(?:^|[^A-Za-z])ZM(?:$|[^A-Za-z])|zambia"],
  ["\u6D25\u5DF4\u5E03\u97E6", "\u{1F1FF}\u{1F1FC}", "\u{1F1FF}\u{1F1FC}|\u6D25\u5DF4\u5E03\u97E6|(?:^|[^A-Za-z])ZW(?:$|[^A-Za-z])|zimbabwe"],
  ["\u963F\u5BCC\u6C57", "\u{1F1E6}\u{1F1EB}", "\u{1F1E6}\u{1F1EB}|\u963F\u5BCC\u6C57|afghanistan"],
  ["\u4E9A\u7F8E\u5C3C\u4E9A", "\u{1F1E6}\u{1F1F2}", "\u{1F1E6}\u{1F1F2}|\u4E9A\u7F8E\u5C3C\u4E9A|armenia"],
  ["\u963F\u585E\u62DC\u7586", "\u{1F1E6}\u{1F1FF}", "\u{1F1E6}\u{1F1FF}|\u963F\u585E\u62DC\u7586|azerbaijan"],
  ["\u5DF4\u6797", "\u{1F1E7}\u{1F1ED}", "\u{1F1E7}\u{1F1ED}|\u5DF4\u6797|bahrain"],
  ["\u5B5F\u52A0\u62C9\u56FD", "\u{1F1E7}\u{1F1E9}", "\u{1F1E7}\u{1F1E9}|\u5B5F\u52A0\u62C9\u56FD|bangladesh"],
  ["\u4E0D\u4E39", "\u{1F1E7}\u{1F1F9}", "\u{1F1E7}\u{1F1F9}|\u4E0D\u4E39|bhutan"],
  ["\u683C\u9C81\u5409\u4E9A", "\u{1F1EC}\u{1F1EA}", "\u{1F1EC}\u{1F1EA}|\u683C\u9C81\u5409\u4E9A|georgia"],
  ["\u4F0A\u6717", "\u{1F1EE}\u{1F1F7}", "\u{1F1EE}\u{1F1F7}|\u4F0A\u6717|iran"],
  ["\u4F0A\u62C9\u514B", "\u{1F1EE}\u{1F1F6}", "\u{1F1EE}\u{1F1F6}|\u4F0A\u62C9\u514B|iraq"],
  ["\u4EE5\u8272\u5217", "\u{1F1EE}\u{1F1F1}", "\u{1F1EE}\u{1F1F1}|\u4EE5\u8272\u5217|israel"],
  ["\u7EA6\u65E6", "\u{1F1EF}\u{1F1F4}", "\u{1F1EF}\u{1F1F4}|\u7EA6\u65E6|jordan"],
  ["\u54C8\u8428\u514B\u65AF\u5766", "\u{1F1F0}\u{1F1FF}", "\u{1F1F0}\u{1F1FF}|\u54C8\u8428\u514B\u65AF\u5766|kazakhstan"],
  ["\u79D1\u5A01\u7279", "\u{1F1F0}\u{1F1FC}", "\u{1F1F0}\u{1F1FC}|\u79D1\u5A01\u7279|kuwait"],
  ["\u5409\u5C14\u5409\u65AF\u65AF\u5766", "\u{1F1F0}\u{1F1EC}", "\u{1F1F0}\u{1F1EC}|\u5409\u5C14\u5409\u65AF\u65AF\u5766|kyrgyzstan"],
  ["\u9ECE\u5DF4\u5AE9", "\u{1F1F1}\u{1F1E7}", "\u{1F1F1}\u{1F1E7}|\u9ECE\u5DF4\u5AE9|lebanon"],
  ["\u9A6C\u5C14\u4EE3\u592B", "\u{1F1F2}\u{1F1FB}", "\u{1F1F2}\u{1F1FB}|\u9A6C\u5C14\u4EE3\u592B|maldives"],
  ["\u8499\u53E4", "\u{1F1F2}\u{1F1F3}", "\u{1F1F2}\u{1F1F3}|\u8499\u53E4|mongolia"],
  ["\u5C3C\u6CCA\u5C14", "\u{1F1F3}\u{1F1F5}", "\u{1F1F3}\u{1F1F5}|\u5C3C\u6CCA\u5C14|nepal"],
  ["\u671D\u9C9C", "\u{1F1F0}\u{1F1F5}", "\u{1F1F0}\u{1F1F5}|\u671D\u9C9C|north[\\s_-]*korea|dprk"],
  ["\u963F\u66FC", "\u{1F1F4}\u{1F1F2}", "\u{1F1F4}\u{1F1F2}|\u963F\u66FC|oman"],
  ["\u5DF4\u57FA\u65AF\u5766", "\u{1F1F5}\u{1F1F0}", "\u{1F1F5}\u{1F1F0}|\u5DF4\u57FA\u65AF\u5766|pakistan"],
  ["\u5DF4\u52D2\u65AF\u5766", "\u{1F1F5}\u{1F1F8}", "\u{1F1F5}\u{1F1F8}|\u5DF4\u52D2\u65AF\u5766|palestine|west[\\s_-]*bank|gaza"],
  ["\u5361\u5854\u5C14", "\u{1F1F6}\u{1F1E6}", "\u{1F1F6}\u{1F1E6}|\u5361\u5854\u5C14|qatar"],
  ["\u65AF\u91CC\u5170\u5361", "\u{1F1F1}\u{1F1F0}", "\u{1F1F1}\u{1F1F0}|\u65AF\u91CC\u5170\u5361|sri[\\s_-]*lanka"],
  ["\u53D9\u5229\u4E9A", "\u{1F1F8}\u{1F1FE}", "\u{1F1F8}\u{1F1FE}|\u53D9\u5229\u4E9A|syria"],
  ["\u5854\u5409\u514B\u65AF\u5766", "\u{1F1F9}\u{1F1EF}", "\u{1F1F9}\u{1F1EF}|\u5854\u5409\u514B\u65AF\u5766|tajikistan"],
  ["\u4E1C\u5E1D\u6C76", "\u{1F1F9}\u{1F1F1}", "\u{1F1F9}\u{1F1F1}|\u4E1C\u5E1D\u6C76|timor[\\s_-]*leste|east[\\s_-]*timor"],
  ["\u571F\u5E93\u66FC\u65AF\u5766", "\u{1F1F9}\u{1F1F2}", "\u{1F1F9}\u{1F1F2}|\u571F\u5E93\u66FC\u65AF\u5766|turkmenistan"],
  ["\u963F\u8054\u914B", "\u{1F1E6}\u{1F1EA}", "\u{1F1E6}\u{1F1EA}|\u963F\u8054\u914B|\u8FEA\u62DC|\u963F\u5E03\u624E\u6BD4|dubai|abu[s_-]*dhabi|uae|united[\\s_-]*arab[\\s_-]*emirates"],
  ["\u4E4C\u5179\u522B\u514B\u65AF\u5766", "\u{1F1FA}\u{1F1FF}", "\u{1F1FA}\u{1F1FF}|\u4E4C\u5179\u522B\u514B\u65AF\u5766|uzbekistan"],
  ["\u4E5F\u95E8", "\u{1F1FE}\u{1F1EA}", "\u{1F1FE}\u{1F1EA}|\u4E5F\u95E8|yemen"],
  ["\u6FB3\u95E8", "\u{1F1F2}\u{1F1F4}", "\u{1F1F2}\u{1F1F4}|\u6FB3\u95E8|macau|macao"],
  ["\u963F\u5C14\u5DF4\u5C3C\u4E9A", "\u{1F1E6}\u{1F1F1}", "\u{1F1E6}\u{1F1F1}|\u963F\u5C14\u5DF4\u5C3C\u4E9A|albania"],
  ["\u5B89\u9053\u5C14", "\u{1F1E6}\u{1F1E9}", "\u{1F1E6}\u{1F1E9}|\u5B89\u9053\u5C14|andorra"],
  ["\u767D\u4FC4\u7F57\u65AF", "\u{1F1E7}\u{1F1FE}", "\u{1F1E7}\u{1F1FE}|\u767D\u4FC4\u7F57\u65AF|belarus"],
  ["\u6CE2\u65AF\u5C3C\u4E9A\u548C\u9ED1\u585E\u54E5\u7EF4\u90A3", "\u{1F1E7}\u{1F1E6}", "\u{1F1E7}\u{1F1E6}|\u6CE2\u65AF\u5C3C\u4E9A\u548C\u9ED1\u585E\u54E5\u7EF4\u90A3|bosnia|bosnia[\\s_-]*and[\\s_-]*herzegovina"],
  ["\u51B0\u5C9B", "\u{1F1EE}\u{1F1F8}", "\u{1F1EE}\u{1F1F8}|\u51B0\u5C9B|iceland"],
  ["\u5217\u652F\u6566\u58EB\u767B", "\u{1F1F1}\u{1F1EE}", "\u{1F1F1}\u{1F1EE}|\u5217\u652F\u6566\u58EB\u767B|liechtenstein"],
  ["\u6469\u5C14\u591A\u74E6", "\u{1F1F2}\u{1F1E9}", "\u{1F1F2}\u{1F1E9}|\u6469\u5C14\u591A\u74E6|moldova"],
  ["\u6469\u7EB3\u54E5", "\u{1F1F2}\u{1F1E8}", "\u{1F1F2}\u{1F1E8}|\u6469\u7EB3\u54E5|monaco"],
  ["\u9ED1\u5C71", "\u{1F1F2}\u{1F1EA}", "\u{1F1F2}\u{1F1EA}|\u9ED1\u5C71|montenegro"],
  ["\u5317\u9A6C\u5176\u987F", "\u{1F1F2}\u{1F1F0}", "\u{1F1F2}\u{1F1F0}|\u5317\u9A6C\u5176\u987F|north[\\s_-]*macedonia|macedonia"],
  ["\u632A\u5A01", "\u{1F1F3}\u{1F1F4}", "\u{1F1F3}\u{1F1F4}|\u632A\u5A01|norway"],
  ["\u5723\u9A6C\u529B\u8BFA", "\u{1F1F8}\u{1F1F2}", "\u{1F1F8}\u{1F1F2}|\u5723\u9A6C\u529B\u8BFA|san[\\s_-]*marino"],
  ["\u585E\u5C14\u7EF4\u4E9A", "\u{1F1F7}\u{1F1F8}", "\u{1F1F7}\u{1F1F8}|\u585E\u5C14\u7EF4\u4E9A|serbia"],
  ["\u745E\u58EB", "\u{1F1E8}\u{1F1ED}", "\u{1F1E8}\u{1F1ED}|\u745E\u58EB|switzerland"],
  ["\u4E4C\u514B\u5170", "\u{1F1FA}\u{1F1E6}", "\u{1F1FA}\u{1F1E6}|\u4E4C\u514B\u5170|ukraine"],
  ["\u68B5\u8482\u5188", "\u{1F1FB}\u{1F1E6}", "\u{1F1FB}\u{1F1E6}|\u68B5\u8482\u5188|vatican"],
  ["\u79D1\u7D22\u6C83", "\u{1F1FD}\u{1F1F0}", "\u{1F1FD}\u{1F1F0}|\u79D1\u7D22\u6C83|kosovo"],
  ["\u5DF4\u54C8\u9A6C", "\u{1F1E7}\u{1F1F8}", "\u{1F1E7}\u{1F1F8}|\u5DF4\u54C8\u9A6C|bahamas"],
  ["\u5DF4\u5DF4\u591A\u65AF", "\u{1F1E7}\u{1F1E7}", "\u{1F1E7}\u{1F1E7}|\u5DF4\u5DF4\u591A\u65AF|barbados"],
  ["\u4F2F\u5229\u5179", "\u{1F1E7}\u{1F1FF}", "\u{1F1E7}\u{1F1FF}|\u4F2F\u5229\u5179|belize"],
  ["\u54E5\u65AF\u8FBE\u9ECE\u52A0", "\u{1F1E8}\u{1F1F7}", "\u{1F1E8}\u{1F1F7}|\u54E5\u65AF\u8FBE\u9ECE\u52A0|costa[\\s_-]*rica"],
  ["\u53E4\u5DF4", "\u{1F1E8}\u{1F1FA}", "\u{1F1E8}\u{1F1FA}|\u53E4\u5DF4|cuba"],
  ["\u591A\u7C73\u5C3C\u514B", "\u{1F1E9}\u{1F1F2}", "\u{1F1E9}\u{1F1F2}|\u591A\u7C73\u5C3C\u514B|dominica"],
  ["\u591A\u7C73\u5C3C\u52A0", "\u{1F1E9}\u{1F1F4}", "\u{1F1E9}\u{1F1F4}|\u591A\u7C73\u5C3C\u52A0|dominican[\\s_-]*republic|dominican"],
  ["\u8428\u5C14\u74E6\u591A", "\u{1F1F8}\u{1F1FB}", "\u{1F1F8}\u{1F1FB}|\u8428\u5C14\u74E6\u591A|el[\\s_-]*salvador"],
  ["\u683C\u6797\u7EB3\u8FBE", "\u{1F1EC}\u{1F1E9}", "\u{1F1EC}\u{1F1E9}|\u683C\u6797\u7EB3\u8FBE|grenada"],
  ["\u5371\u5730\u9A6C\u62C9", "\u{1F1EC}\u{1F1F9}", "\u{1F1EC}\u{1F1F9}|\u5371\u5730\u9A6C\u62C9|guatemala"],
  ["\u6D77\u5730", "\u{1F1ED}\u{1F1F9}", "\u{1F1ED}\u{1F1F9}|\u6D77\u5730|haiti"],
  ["\u6D2A\u90FD\u62C9\u65AF", "\u{1F1ED}\u{1F1F3}", "\u{1F1ED}\u{1F1F3}|\u6D2A\u90FD\u62C9\u65AF|honduras"],
  ["\u7259\u4E70\u52A0", "\u{1F1EF}\u{1F1F2}", "\u{1F1EF}\u{1F1F2}|\u7259\u4E70\u52A0|jamaica"],
  ["\u5C3C\u52A0\u62C9\u74DC", "\u{1F1F3}\u{1F1EE}", "\u{1F1F3}\u{1F1EE}|\u5C3C\u52A0\u62C9\u74DC|nicaragua"],
  ["\u5DF4\u62FF\u9A6C", "\u{1F1F5}\u{1F1E6}", "\u{1F1F5}\u{1F1E6}|\u5DF4\u62FF\u9A6C|panama"],
  ["\u5723\u57FA\u8328\u548C\u5C3C\u7EF4\u65AF", "\u{1F1F0}\u{1F1F3}", "\u{1F1F0}\u{1F1F3}|\u5723\u57FA\u8328\u548C\u5C3C\u7EF4\u65AF|saint[\\s_-]*kitts|st[\\s_-]*kitts"],
  ["\u5723\u5362\u897F\u4E9A", "\u{1F1F1}\u{1F1E8}", "\u{1F1F1}\u{1F1E8}|\u5723\u5362\u897F\u4E9A|saint[\\s_-]*lucia|st[\\s_-]*lucia"],
  ["\u5723\u6587\u68EE\u7279\u548C\u683C\u6797\u7EB3\u4E01\u65AF", "\u{1F1FB}\u{1F1E8}", "\u{1F1FB}\u{1F1E8}|\u5723\u6587\u68EE\u7279\u548C\u683C\u6797\u7EB3\u4E01\u65AF|saint[\\s_-]*vincent|st[\\s_-]*vincent"],
  ["\u7279\u7ACB\u5C3C\u8FBE\u548C\u591A\u5DF4\u54E5", "\u{1F1F9}\u{1F1F9}", "\u{1F1F9}\u{1F1F9}|\u7279\u7ACB\u5C3C\u8FBE\u548C\u591A\u5DF4\u54E5|trinidad[\\s_-]*and[\\s_-]*tobago"],
  ["\u5B89\u63D0\u74DC\u548C\u5DF4\u5E03\u8FBE", "\u{1F1E6}\u{1F1EC}", "\u{1F1E6}\u{1F1EC}|\u5B89\u63D0\u74DC\u548C\u5DF4\u5E03\u8FBE|antigua[\\s_-]*and[\\s_-]*barbuda"],
  ["\u54E5\u4F26\u6BD4\u4E9A", "\u{1F1E8}\u{1F1F4}", "\u{1F1E8}\u{1F1F4}|\u54E5\u4F26\u6BD4\u4E9A|\u6CE2\u54E5\u5927|\u9EA6\u5FB7\u6797|(?:^|[^A-Za-z])CO(?:$|[^A-Za-z])|bogot[a\xE1]|medellin|colombia"],
  ["\u667A\u5229", "\u{1F1E8}\u{1F1F1}", "\u{1F1E8}\u{1F1F1}|\u667A\u5229|chile"],
  ["\u79D8\u9C81", "\u{1F1F5}\u{1F1EA}", "\u{1F1F5}\u{1F1EA}|\u79D8\u9C81|peru"],
  ["\u4E4C\u62C9\u572D", "\u{1F1FA}\u{1F1FE}", "\u{1F1FA}\u{1F1FE}|\u4E4C\u62C9\u572D|uruguay"],
  ["\u5DF4\u62C9\u572D", "\u{1F1F5}\u{1F1FE}", "\u{1F1F5}\u{1F1FE}|\u5DF4\u62C9\u572D|paraguay"],
  ["\u73BB\u5229\u7EF4\u4E9A", "\u{1F1E7}\u{1F1F4}", "\u{1F1E7}\u{1F1F4}|\u73BB\u5229\u7EF4\u4E9A|bolivia"],
  ["\u5384\u74DC\u591A\u5C14", "\u{1F1EA}\u{1F1E8}", "\u{1F1EA}\u{1F1E8}|\u5384\u74DC\u591A\u5C14|ecuador"],
  ["\u59D4\u5185\u745E\u62C9", "\u{1F1FB}\u{1F1EA}", "\u{1F1FB}\u{1F1EA}|\u59D4\u5185\u745E\u62C9|venezuela"],
  ["\u572D\u4E9A\u90A3", "\u{1F1EC}\u{1F1FE}", "\u{1F1EC}\u{1F1FE}|\u572D\u4E9A\u90A3|guyana"],
  ["\u82CF\u91CC\u5357", "\u{1F1F8}\u{1F1F7}", "\u{1F1F8}\u{1F1F7}|\u82CF\u91CC\u5357|suriname"],
  ["\u65B0\u897F\u5170", "\u{1F1F3}\u{1F1FF}", "\u{1F1F3}\u{1F1FF}|\u65B0\u897F\u5170|new[\\s_-]*zealand|auckland|\u5965\u514B\u5170|wellington|\u60E0\u7075\u987F"],
  ["\u6590\u6D4E", "\u{1F1EB}\u{1F1EF}", "\u{1F1EB}\u{1F1EF}|\u6590\u6D4E|fiji"],
  ["\u5DF4\u5E03\u4E9A\u65B0\u51E0\u5185\u4E9A", "\u{1F1F5}\u{1F1EC}", "\u{1F1F5}\u{1F1EC}|\u5DF4\u5E03\u4E9A\u65B0\u51E0\u5185\u4E9A|papua[\\s_-]*new[\\s_-]*guinea"],
  ["\u6240\u7F57\u95E8\u7FA4\u5C9B", "\u{1F1F8}\u{1F1E7}", "\u{1F1F8}\u{1F1E7}|\u6240\u7F57\u95E8\u7FA4\u5C9B|solomon[\\s_-]*islands"],
  ["\u74E6\u52AA\u963F\u56FE", "\u{1F1FB}\u{1F1FA}", "\u{1F1FB}\u{1F1FA}|\u74E6\u52AA\u963F\u56FE|vanuatu"],
  ["\u8428\u6469\u4E9A", "\u{1F1FC}\u{1F1F8}", "\u{1F1FC}\u{1F1F8}|\u8428\u6469\u4E9A|samoa"],
  ["\u6C64\u52A0", "\u{1F1F9}\u{1F1F4}", "\u{1F1F9}\u{1F1F4}|\u6C64\u52A0|tonga"],
  ["\u57FA\u91CC\u5DF4\u65AF", "\u{1F1F0}\u{1F1EE}", "\u{1F1F0}\u{1F1EE}|\u57FA\u91CC\u5DF4\u65AF|kiribati"],
  ["\u56FE\u74E6\u5362", "\u{1F1F9}\u{1F1FB}", "\u{1F1F9}\u{1F1FB}|\u56FE\u74E6\u5362|tuvalu"],
  ["\u7459\u9C81", "\u{1F1F3}\u{1F1F7}", "\u{1F1F3}\u{1F1F7}|\u7459\u9C81|nauru"],
  ["\u5E15\u52B3", "\u{1F1F5}\u{1F1FC}", "\u{1F1F5}\u{1F1FC}|\u5E15\u52B3|palau"],
  ["\u9A6C\u7ECD\u5C14\u7FA4\u5C9B", "\u{1F1F2}\u{1F1ED}", "\u{1F1F2}\u{1F1ED}|\u9A6C\u7ECD\u5C14\u7FA4\u5C9B|marshall[\\s_-]*islands"],
  ["\u5BC6\u514B\u7F57\u5C3C\u897F\u4E9A", "\u{1F1EB}\u{1F1F2}", "\u{1F1EB}\u{1F1F2}|\u5BC6\u514B\u7F57\u5C3C\u897F\u4E9A|micronesia|federated[\\s_-]*states[\\s_-]*of[\\s_-]*micronesia"],
  ["\u5173\u5C9B", "\u{1F1EC}\u{1F1FA}", "\u{1F1EC}\u{1F1FA}|\u5173\u5C9B|guam"],
  ["\u6CE2\u591A\u9ECE\u5404", "\u{1F1F5}\u{1F1F7}", "\u{1F1F5}\u{1F1F7}|\u6CE2\u591A\u9ECE\u5404|puerto[\\s_-]*rico"],
  ["\u767E\u6155\u5927", "\u{1F1E7}\u{1F1F2}", "\u{1F1E7}\u{1F1F2}|\u767E\u6155\u5927|bermuda"],
  ["\u683C\u9675\u5170", "\u{1F1EC}\u{1F1F1}", "\u{1F1EC}\u{1F1F1}|\u683C\u9675\u5170|greenland"],
  ["\u5E93\u62C9\u7D22", "\u{1F1E8}\u{1F1FC}", "\u{1F1E8}\u{1F1FC}|\u5E93\u62C9\u7D22|curacao|cura\xE7ao"],
  ["\u963F\u9C81\u5DF4", "\u{1F1E6}\u{1F1FC}", "\u{1F1E6}\u{1F1FC}|\u963F\u9C81\u5DF4|aruba"],
  ["\u5F00\u66FC\u7FA4\u5C9B", "\u{1F1F0}\u{1F1FE}", "\u{1F1F0}\u{1F1FE}|\u5F00\u66FC\u7FA4\u5C9B|cayman[\\s_-]*islands"],
  ["\u82F1\u5C5E\u7EF4\u5C14\u4EAC\u7FA4\u5C9B", "\u{1F1FB}\u{1F1EC}", "\u{1F1FB}\u{1F1EC}|\u82F1\u5C5E\u7EF4\u5C14\u4EAC\u7FA4\u5C9B|british[\\s_-]*virgin[\\s_-]*islands"],
  ["\u7F8E\u5C5E\u7EF4\u5C14\u4EAC\u7FA4\u5C9B", "\u{1F1FB}\u{1F1EE}", "\u{1F1FB}\u{1F1EE}|\u7F8E\u5C5E\u7EF4\u5C14\u4EAC\u7FA4\u5C9B|us[\\s_-]*virgin[\\s_-]*islands|u\\.s\\.[\\s_-]*virgin[\\s_-]*islands"],
  ["\u65B0\u5580\u91CC\u591A\u5C3C\u4E9A", "\u{1F1F3}\u{1F1E8}", "\u{1F1F3}\u{1F1E8}|\u65B0\u5580\u91CC\u591A\u5C3C\u4E9A|new[\\s_-]*caledonia"],
  ["\u6CD5\u5C5E\u6CE2\u5229\u5C3C\u897F\u4E9A", "\u{1F1F5}\u{1F1EB}", "\u{1F1F5}\u{1F1EB}|\u6CD5\u5C5E\u6CE2\u5229\u5C3C\u897F\u4E9A|french[\\s_-]*polynesia"],
  ["\u5E93\u514B\u7FA4\u5C9B", "\u{1F1E8}\u{1F1F0}", "\u{1F1E8}\u{1F1F0}|\u5E93\u514B\u7FA4\u5C9B|cook[\\s_-]*islands"],
  ["\u7EBD\u57C3", "\u{1F1F3}\u{1F1FA}", "\u{1F1F3}\u{1F1FA}|\u7EBD\u57C3|niue"]
];
var REGION_RES = REGION_DEFS.map(([name, , src]) => [name, new RegExp(src, "i")]);
var STRONG_INFO = /剩余|已用|距离下次|下次重置|套餐|到期|过期|官网|官址|客服|订阅|工单|邮箱|网址|流量\s*[:：]|traffic\s*[:：]|\bexpire\b|\bhttps?:\/\/|t\.me\//iu;
var EXCLUDE_FILTER = new RegExp("\u7FA4|\u8FD4\u5229|\u5FAA\u73AF|\u5B98\u7F51|\u5BA2\u670D|\u7F51\u7AD9|\u7F51\u5740|\u83B7\u53D6|\u8BA2\u9605|\u6D41\u91CF|\u5230\u671F|\u673A\u573A|\u4E0B\u6B21|\u7248\u672C|\u5B98\u5740|\u5907\u7528|\u8FC7\u671F|\u5DF2\u7528|\u8054\u7CFB|\u90AE\u7BB1|\u5DE5\u5355|\u8D29\u5356|\u901A\u77E5|\u5012\u5356|\u9632\u6B62|\u56FD\u5185|\u5730\u5740|\u9891\u9053|\u7535\u62A5|\u65E0\u6CD5|\u8BF4\u660E|\u4F7F\u7528|\u63D0\u793A|\u8BBF\u95EE|\u652F\u6301|\u6559\u7A0B|\u5173\u6CE8|\u66F4\u65B0|\u4F5C\u8005|\u52A0\u5165|\u8D85\u65F6|\u6536\u85CF|\u4F18\u60E0|\u798F\u5229|\u9080\u8BF7|\u597D\u53CB|\u5931\u8054|\u9009\u62E9|\u5269\u4F59|\u516C\u76CA|\u53D1\u5E03|DIZTNA|\u901A\u8DEF|\u767B\u5F55|\u7981\u6B62|\u5B9A\u65F6|\u6E20\u9053|\u7262\u8BB0|\u6C38\u4E45|\u4F59\u989D|\u9601\u4E0B|\u672C\u7AD9|\u5237\u65B0|\u5BFC\u822A|\u5EFA\u8BAE|\u91CD\u7F6E|\u4EE5\u4E0B|\u8FC7\u6EE4|\u26A0\uFE0F|@|t\\.me\\/\\+|\\bexpire\\b|\\bhttps?:\\/\\/|\\btraffic\\b", "iu");
var TRAD2SIMP = {
  "\u7063": "\u6E7E",
  "\u570B": "\u56FD",
  "\u81FA": "\u53F0",
  "\u6771": "\u4E1C",
  "\u5CF6": "\u5C9B",
  "\u4E9E": "\u4E9A",
  "\u502B": "\u4F26",
  "\u862D": "\u5170",
  "\u99AC": "\u9A6C",
  "\u8CD3": "\u5BBE",
  "\u7D10": "\u7EBD",
  "\u7D04": "\u7EA6",
  "\u9054": "\u8FBE",
  "\u78EF": "\u77F6",
  "\u8056": "\u5723",
  "\u9580": "\u95E8",
  "\u97D3": "\u97E9",
  "\u7F85": "\u7F57",
  "\u8607": "\u82CF",
  "\u806F": "\u8054",
  "\u611B": "\u7231",
  "\u723E": "\u5C14",
  "\u70CF": "\u4E4C",
  "\u85A9": "\u8428",
  "\u83EF": "\u534E",
  "\u9813": "\u987F",
  "\u7DAD": "\u7EF4",
  "\u7DEC": "\u7F05",
  "\u5EE3": "\u5E7F"
};
var TRAD_RE = new RegExp(`[${Object.keys(TRAD2SIMP).join("")}]`, "g");
function foldTrad(text) {
  return String(text).replace(TRAD_RE, (ch) => TRAD2SIMP[ch]);
}
var ICON_BASE = "https://fastly.jsdelivr.net/gh/dukangalex/HiClash@assets-v1/Icons/svg/";
var EXTRA_DEFS = [
  {
    name: "\u4F4E\u500D\u7387\u8282\u70B9",
    icon: ICON_BASE + "Available.svg",
    re: new RegExp("^(?!.*(?:\u5269|\u671F)).*(?:(?<!\\d)0\\.[0-5]|(?<=[ \\[\\(|\uFF5C\u4E28\u2223\u2503\\-\u2010\u2013\u2014\u2212\uFF0D\uFE63])0[*\xD7\u2715\u2716\u2A2F\u2A09x\u500D])|(?:(?<=[ \\[\\(|\uFF5C\u4E28\u2223\u2503\\-\u2010\u2013\u2014\u2212\uFF0D\uFE63])[*\xD7\u2715\u2716\u2A2F\u2A09x]0(?=[ \\)\\]]|\u500D|$))|^(?!.*(?:\u5BA2\u6237\u7AEF|\u8F6F\u4EF6)).*\u4E0B\u8F7D|\u4F4E\u500D|\u514D\u8D39|(?<![A-Za-z])free(?![A-Za-z])", "i")
  },
  {
    name: "\u9AD8\u500D\u7387\u8282\u70B9",
    icon: ICON_BASE + "Airport.svg",
    re: new RegExp("(?<=[ \\[\\(|\uFF5C\u4E28\u2223\u2503\\-\u2010\u2013\u2014\u2212\uFF0D\uFE63])((?:[*\xD7\u2715\u2716\u2A2F\u2A09x]\\s*(?:[2-9]\\d*|[1-9]\\d+)(?:\\.\\d+)?)|(?:(?<![\\d.])(?:[2-9]\\d*|[1-9]\\d+)(?:\\.\\d+)?\\s*(?:\u500D|[*\xD7\u2715\u2716\u2A2F\u2A09x])))", "i")
  },
  {
    name: "\u5BB6\u5BBD\u8282\u70B9",
    icon: ICON_BASE + "Server.svg",
    re: new RegExp("\u5BB6\u5BBD|\u4F4F\u5B85|\u539F\u751F\\s*IP|\u5BB6\u5EAD\u5BBD\u5E26|\\bISP\\b|\\bRES\\b|residential", "i")
  }
];
var AUTO_ICON = ICON_BASE + "Auto.svg";
var OTHER_ICON = ICON_BASE + "WorldMap.svg";
function matchedRegions(name) {
  const text = foldTrad(name);
  let best = -1;
  const hits = [];
  for (let i = 0; i < REGION_RES.length; i++) {
    const m = text.match(REGION_RES[i][1]);
    if (m) {
      hits.push([i, m[0].length]);
      if (m[0].length > best) best = m[0].length;
    }
  }
  const geo = hits.filter(([, len]) => len === best).map(([i]) => i);
  const extras = [];
  for (let i = 0; i < EXTRA_DEFS.length; i++) {
    if (EXTRA_DEFS[i].re.test(text)) extras.push(i);
  }
  return { geo, extras };
}
function regionPlan(names) {
  const buckets = /* @__PURE__ */ new Map();
  const add = (key, pname, icon, n) => {
    if (!buckets.has(key)) {
      buckets.set(key, { name: pname, icon, members: [] });
    }
    buckets.get(key).members.push(n);
  };
  const matched = /* @__PURE__ */ new Set();
  for (const n of names) {
    if (STRONG_INFO.test(n)) continue;
    const { geo, extras } = matchedRegions(n);
    for (const i of geo) add("g" + i, REGION_DEFS[i][0], "", n);
    for (const i of extras) add("x" + i, EXTRA_DEFS[i].name, EXTRA_DEFS[i].icon, n);
    if (geo.length) matched.add(n);
  }
  const pairs = [];
  for (let i = 0; i < REGION_DEFS.length; i++) {
    const b = buckets.get("g" + i);
    if (b) pairs.push(b);
  }
  for (let i = 0; i < EXTRA_DEFS.length; i++) {
    const b = buckets.get("x" + i);
    if (b) pairs.push(b);
  }
  const other = names.filter(
    (n) => !matched.has(n) && !STRONG_INFO.test(n)
  );
  if (other.length) {
    pairs.push({ name: "\u5176\u4ED6\u8282\u70B9", icon: OTHER_ICON, members: other });
  }
  const selectNames = pairs.map((q) => q.name);
  const pairNames = [];
  for (const q of pairs) pairNames.push(q.name + "-\u81EA\u52A8\u9009\u62E9", q.name);
  return { pairs, selectNames, pairNames };
}
function keepPlainNode(name) {
  if (STRONG_INFO.test(name)) return false;
  if (matchedRegions(name).geo.length) return true;
  return !EXCLUDE_FILTER.test(name);
}
var INVISIBLE_CHARS = /[\u00AD\u180E\u200B\u200E\u200F\u202A-\u202E\u2060-\u206F\uFEFF\u115F\u1160\u3164\uFFA0]/g;
var FLAG_RE = /[\u{1F1E6}-\u{1F1FF}]{2}/u;
function normalizePlainName(name) {
  const clean = String(name).replace(INVISIBLE_CHARS, "");
  const flag = clean.match(FLAG_RE)?.[0];
  const rest = (flag ? clean.replace(flag, "") : clean).replace(/\s+/g, " ").trim();
  const { geo } = matchedRegions(clean);
  const regionFlag = flag || (geo.length ? REGION_DEFS[geo[0]][1] : void 0);
  return regionFlag ? `${regionFlag} ${rest}` : rest;
}
var RESERVED_NAMES = /* @__PURE__ */ new Set([
  "\u9ED8\u8BA4\u4EE3\u7406",
  "GLOBAL",
  "\u624B\u52A8\u9009\u62E9",
  "\u81EA\u52A8\u9009\u62E9",
  "\u8D1F\u8F7D\u5747\u8861",
  "\u6545\u969C\u8F6C\u79FB",
  "\u76F4\u8FDE",
  "\u6F0F\u7F51\u4E4B\u9C7C",
  "\u8FDC\u63A7\u5DE5\u5177",
  "AdBlock",
  "FCM",
  "YouTube",
  "Google",
  "Claude",
  "ClaudeAI",
  "GitHub",
  "AI",
  "Microsoft",
  "Apple",
  "Telegram",
  "Steam",
  "TikTok",
  "Twitter",
  "Meta",
  "Line",
  "Netflix",
  "Emby",
  "PikPak",
  "Spotify",
  "Crypto",
  "EHentai",
  "\u94FE\u5F0F\u4E2D\u8F6C",
  "\u5176\u4ED6\u8282\u70B9",
  "REJECT",
  "REJECT-DROP",
  "PASS",
  "DIRECT",
  "\u{1F1E8}\u{1F1F3} \u76F4\u8FDE | \u53CC\u6808",
  "\u{1F1E8}\u{1F1F3} \u76F4\u8FDE | IPv4\u4F18\u5148",
  "\u{1F1E8}\u{1F1F3} \u76F4\u8FDE | IPv6\u4F18\u5148",
  "\u{1F1E8}\u{1F1F3} \u76F4\u8FDE | \u4EC5IPv4",
  "\u{1F1E8}\u{1F1F3} \u76F4\u8FDE | \u4EC5IPv6",
  ...REGION_DEFS.map(([n]) => n),
  ...REGION_DEFS.map(([n]) => n + "-\u81EA\u52A8\u9009\u62E9"),
  ...EXTRA_DEFS.map((d) => d.name),
  ...EXTRA_DEFS.map((d) => d.name + "-\u81EA\u52A8\u9009\u62E9"),
  "\u5176\u4ED6\u8282\u70B9-\u81EA\u52A8\u9009\u62E9"
]);
function preparePlainNodes(nodes) {
  const kept = [];
  const renameMap = /* @__PURE__ */ new Map();
  const used = /* @__PURE__ */ new Set();
  for (const node of nodes) {
    const raw = String(node.name ?? "");
    const t = String(node.type ?? "").toLowerCase();
    if (t === "direct" || t === "reject") continue;
    if (!keepPlainNode(raw)) continue;
    let nn = normalizePlainName(raw);
    if (RESERVED_NAMES.has(nn)) {
      let cand = "\u8282\u70B9-" + nn;
      let i = 2;
      while (used.has(cand) || RESERVED_NAMES.has(cand)) {
        cand = "\u8282\u70B9-" + nn + "-" + i++;
      }
      nn = cand;
    }
    if (!renameMap.has(raw)) renameMap.set(raw, nn);
    if (used.has(nn)) continue;
    used.add(nn);
    kept.push(nn === raw ? node : { ...node, name: nn });
  }
  return { nodes: kept, renameMap };
}
var MEMBER_TOKENS = /* @__PURE__ */ new Set(["@ENTRIES@", "@EXITS@", "@ALL@"]);
var LINK_ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
var CODE_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_";
var MANIFEST = rules_manifest_default;
var DST_SET = new Set(MANIFEST.map((e) => e.dst));
var STAGE = { cur: "-" };
var ECH_CFG_CACHE = /* @__PURE__ */ new Map();
var PAGE = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>\u8BA2\u9605\u8F6C\u6362</title>
<style>
:root{color-scheme:dark}
*{box-sizing:border-box}
body{font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,"PingFang SC","Microsoft YaHei",sans-serif;background:#060809;color:#eef6f5;margin:0;padding:24px 16px 40px}
.wrap{max-width:600px;margin:0 auto}
h1{font-size:31px;font-weight:800;letter-spacing:.05em;text-align:center;margin:0 0 8px;background:linear-gradient(90deg,#2dd4bf,#3b82f6);-webkit-background-clip:text;background-clip:text;color:transparent}
.sub{color:#a3bab5;font-size:14px;margin:0;text-align:center}
.hero{text-align:center;margin:10px 0 22px}
.hero-badge{display:inline-block;font-size:11px;letter-spacing:.28em;color:#5eead4;border:1px solid rgba(45,212,191,.45);background:rgba(20,184,166,.10);padding:5px 12px 5px 15px;border-radius:999px;margin-bottom:14px}
.hero::after{content:"";display:block;width:64px;height:3px;border-radius:2px;margin:16px auto 0;background:linear-gradient(90deg,#2dd4bf,#3b82f6)}
.card{background:#0c1113;border:1px solid #1f2a2f;border-radius:12px;padding:16px;margin-bottom:16px}
.card h2{font-size:15px;margin:0 0 10px;color:#eef6f5}
.restore{display:flex;gap:8px}
.restore input{flex:1}
.tabs{display:flex;gap:8px;margin-bottom:16px}
.tabs button{flex:1;padding:11px;border:1px solid #31424a;border-radius:10px;background:#11181b;color:#c3d2d0;font-size:15px;cursor:pointer}
.tabs button.on{background:linear-gradient(135deg,#14b8a6,#2563eb);color:#fff;border-color:#14b8a6}
label{display:block;margin:16px 0 6px;color:#c3d2d0;font-size:14px}
label:first-of-type{margin-top:4px}
select,textarea,input{width:100%;padding:10px;border-radius:8px;border:1px solid #31424a;background:#11181b;color:#eef6f5;font-size:15px}
select:focus,textarea:focus,input:focus{outline:2px solid #14b8a6;border-color:#14b8a6}
textarea{resize:vertical;font-family:inherit;line-height:1.5}
.ta-wrap{position:relative}
.clear{position:absolute;top:6px;right:6px;padding:3px 10px;border:1px solid #31424a;border-radius:6px;background:#162024;color:#a3bab5;font-size:12px;cursor:pointer}
.go{margin-top:18px;width:100%;padding:13px;border:0;border-radius:10px;background:linear-gradient(135deg,#14b8a6,#2563eb);color:#fff;font-size:16px;cursor:pointer}
.go:disabled{opacity:.55;cursor:wait}
.err{display:none;color:#ef4444;font-size:14px;margin-top:10px}
.ok{display:none;color:#22c55e;font-size:14px;margin-top:10px}
.out{margin-top:18px;display:none}
.link-row{background:#11181b;border:1px solid #1f2a2f;border-radius:10px;padding:12px;margin-top:10px}
.link-row .tag{font-size:12px;color:#2dd4bf;margin-bottom:6px}
.link-row .u{word-break:break-all;font-size:13px;color:#eef6f5;font-family:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.link-row .ops{display:flex;gap:8px;margin-top:10px}
.link-row .ops button,.link-row .ops a{flex:1;padding:9px;border:0;border-radius:8px;background:#1b272c;color:#eef6f5;font-size:14px;text-align:center;text-decoration:none;cursor:pointer}
.link-row .ops a.imp{background:linear-gradient(135deg,#14b8a6,#2563eb);color:#fff}
.note{color:#a3bab5;font-size:13px;margin-top:10px;line-height:1.6}
.hide{display:none}
.rgchip{padding:4px 11px;border-radius:999px;border:1px solid #31424a;background:#11181b;color:#c3d2d0;font-size:13px;cursor:pointer}
.rgchip.on{border-color:#14b8a6;background:rgba(20,184,166,.2);color:#fff;font-weight:700}
footer{color:#5d726d;font-size:13px;margin-top:24px;line-height:1.6}
/* \u7ED3\u6784\u5C42 (2.2): \u53CC\u5217 \u2014 \u4E3B\u8868\u5355\u5DE6, \u6062\u590D\u5361\u53F3\u8F68 */
.wrap{max-width:860px}
.wrap>.card{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;padding:12px 16px;margin-bottom:16px}
.wrap>.card h2{margin:0;font-size:14px;white-space:nowrap}
.wrap>.card .restore{flex:1;min-width:220px}
.wrap>.card .err,.wrap>.card .ok{flex-basis:100%;margin-top:2px}
</style>
</head>
<body>
<div class="wrap">
<header class="hero">
<div class="hero-badge">SUBSCRIPTION CONVERTER</div>
<h1>\u8BA2\u9605\u8F6C\u6362</h1>
<p class="sub">\u628A\u8282\u70B9\u3001\u8BA2\u9605\u8F6C\u6210\u5BA2\u6237\u7AEF\u80FD\u76F4\u63A5\u7528\u7684\u8BA2\u9605\u94FE\u63A5\uFF0C\u652F\u6301\u666E\u901A\u8F6C\u6362\u4E0E\u94FE\u5F0F\u4EE3\u7406\u3002</p>
</header>

<div class="card">
<h2>\u5DF2\u6709\u77ED\u94FE\uFF1F\u6062\u590D\u4E0A\u6B21\u7684\u586B\u5199</h2>
<div class="restore">
<input id="rcode" placeholder="\u7C98\u8D34\u77ED\u7801\u6216\u5B8C\u6574\u94FE\u63A5">
<button class="go" style="margin-top:0;width:auto;padding:10px 18px" onclick="restore()">\u6062\u590D</button>
</div>
<div class="err" id="rerr">\u6CA1\u627E\u5230\u8FD9\u4E2A\u77ED\u7801</div>
<div class="ok" id="rok">\u5DF2\u6062\u590D\u5230\u4E0B\u65B9\u8868\u5355\uFF0C\u53EF\u4FEE\u6539\u540E\u91CD\u65B0\u751F\u6210</div>
</div>

<div class="tabs">
<button id="tabN" class="on" onclick="mode('n')">\u666E\u901A\u8F6C\u6362</button>
<button id="tabC" onclick="mode('c')">\u94FE\u5F0F\u4EE3\u7406</button>
</div>

<div id="secN">
<label>\u8282\u70B9 / \u8BA2\u9605\uFF08\u6BCF\u884C\u4E00\u4E2A\uFF0C\u53EF\u4EFB\u610F\u6DF7\u586B\uFF09</label>
<div class="ta-wrap"><textarea id="u" rows="6" placeholder="ss://...&#10;trojan://...&#10;https://\u8BA2\u9605\u5730\u5740"></textarea><button class="clear" onclick="clr('u')">\u6E05\u7A7A</button></div>
<label>\u76EE\u6807\u683C\u5F0F</label>
<select id="t">
<option value="clash">Clash / Mihomo</option>
<option value="singbox">sing-box</option>
<option value="v2ray">V2Ray</option>
<option value="surge">Surge</option>
<option value="loon">Loon</option>
<option value="quanx">Quantumult X</option>
</select>
<label>\u53EA\u4FDD\u7559\u8FD9\u4E9B\u5730\u533A\u7684\u8282\u70B9\uFF08\u53EF\u9009\uFF0C\u4E0D\u9009 = \u5168\u90E8\u4FDD\u7559\uFF09</label>
<div id="rgChips" style="display:flex;flex-wrap:wrap;gap:6px"></div>
<input id="rgExtra" placeholder="\u5176\u5B83\u5730\u533A\u4EE3\u7801\uFF0C\u9017\u53F7\u5206\u9694\uFF08\u5982 DE,GB\uFF09" style="margin-top:8px">
<label>\u81EA\u5B9A\u4E49\u540E\u7F00\uFF08\u53EF\u9009\uFF0C\u4E0D\u586B\u5219\u968F\u673A\uFF09</label>
<input id="codeN" placeholder="\u5982 home\uFF0C\u53EA\u7528\u5B57\u6BCD\u3001\u6570\u5B57\u3001-\u3001_">
<button class="go" id="goN" onclick="genN()">\u751F\u6210\u8F6C\u6362\u94FE\u63A5</button>
<div class="err" id="errN"></div>
<div class="out" id="outN"></div>
</div>

<div id="secC" class="hide">
<label>\u5165\u53E3\uFF08\u6BCF\u884C\u4E00\u4E2A\uFF0C\u53EF\u6DF7\u586B\u8282\u70B9\u4E0E\u8BA2\u9605\uFF09</label>
<div class="ta-wrap"><textarea id="ein" rows="4" placeholder="\u94FE\u7684\u7B2C\u4E00\u7AD9\uFF0C\u5982\u65E5\u672C\u5165\u53E3\u8282\u70B9\u6216\u5165\u53E3\u8BA2\u9605"></textarea><button class="clear" onclick="clr('ein')">\u6E05\u7A7A</button></div>
<label>\u51FA\u53E3\uFF08\u6BCF\u884C\u4E00\u4E2A\uFF0C\u53EF\u6DF7\u586B\u8282\u70B9\u4E0E\u8BA2\u9605\uFF09</label>
<div class="ta-wrap"><textarea id="eout" rows="4" placeholder="\u94FE\u7684\u7B2C\u4E8C\u7AD9\uFF0C\u5982\u7F8E\u56FD\u51FA\u53E3\u8282\u70B9\u6216\u51FA\u53E3\u8BA2\u9605"></textarea><button class="clear" onclick="clr('eout')">\u6E05\u7A7A</button></div>
<label>\u76EE\u6807\u683C\u5F0F</label>
<select id="tc">
<option value="singbox">sing-box</option>
<option value="clash">Mihomo / Clash</option>
<option value="surge">Surge</option>
<option value="loon">Loon</option>
<option value="quanx">Quantumult X</option>
</select>
<label>\u81EA\u5B9A\u4E49\u540E\u7F00\uFF08\u53EF\u9009\uFF0C\u4E0D\u586B\u5219\u968F\u673A\uFF09</label>
<input id="codeC" placeholder="\u5982 chain\uFF0C\u53EA\u7528\u5B57\u6BCD\u3001\u6570\u5B57\u3001-\u3001_">
<button class="go" id="goC" onclick="genC()">\u751F\u6210\u94FE\u5F0F\u8BA2\u9605\u94FE\u63A5</button>
<div class="err" id="errC"></div>
<div class="out" id="outC"></div>
<p class="note">\u751F\u6210\u7684\u94FE\u63A5\u53EF\u76F4\u63A5\u5F53\u8BA2\u9605\u5730\u5740\u586B\u8FDB\u5BA2\u6237\u7AEF\uFF0C\u6BCF\u6B21\u66F4\u65B0\u90FD\u4F1A\u91CD\u65B0\u6309\u5165\u53E3\u5230\u51FA\u53E3\u4E32\u597D\u3002\u77ED\u94FE\u91CC\u7684\u5B57\u6BCD\u4EE3\u8868\u683C\u5F0F\uFF1A/m/ \u662F Mihomo\u3001/s/ \u662F sing-box\uFF0C\u540C\u4E00\u4E2A\u7801\u6539\u5B57\u6BCD\u5C31\u80FD\u5207\u6362\u683C\u5F0F\uFF0C\u4E0D\u7528\u91CD\u65B0\u751F\u6210\u3002</p>
</div>

<footer>\u8FD0\u884C\u5728\u4F60\u81EA\u5DF1\u7684 Cloudflare \u8D26\u53F7\u4E0A\uFF08Workers + KV\uFF09\uFF0C\u8BA2\u9605\u5185\u5BB9\u53EA\u4FDD\u5B58\u5728\u4F60\u7684 KV \u4E2D\uFF0C\u4E0D\u7ECF\u8FC7\u4EFB\u4F55\u7B2C\u4E09\u65B9\u3002</footer>
</div>
<script>
function $(id){return document.getElementById(id)}
function mode(m){
  $("secN").className = m==="n" ? "" : "hide";
  $("secC").className = m==="c" ? "" : "hide";
  $("tabN").className = m==="n" ? "on" : "";
  $("tabC").className = m==="c" ? "on" : "";
}
function clr(id){$(id).value="";$(id).focus()}
function lines(id){
  return $(id).value.split(/\\n+/).map(function(s){return s.trim()}).filter(function(s){return s.length>0});
}
function showErr(id,msg){var e=$(id);e.textContent=msg;e.style.display="block"}
function hideErr(id){$(id).style.display="none"}
function extractCode(s){
  s=(s||"").trim();
  if(!s) return "";
  s=s.split(/[?#]/)[0];
  var parts=s.split("/").filter(function(p){return p.length>0});
  return parts.length?parts[parts.length-1]:"";
}
function restore(){
  var code=extractCode($("rcode").value);
  $("rerr").style.display="none";$("rok").style.display="none";
  if(!code){$("rerr").style.display="block";return}
  fetch("/api/link/"+encodeURIComponent(code)).then(function(r){
    if(!r.ok) throw new Error("nf");
    return r.json();
  }).then(function(rec){
    if(rec.kind==="chain"){
      mode("c");
      $("ein").value=(rec.entry||"").split("|").join("\\n");
      $("eout").value=(rec.exit||"").split("|").join("\\n");
      if(rec.target) $("tc").value=rec.target;
      $("codeC").value=code;
    }else{
      mode("n");
      $("u").value=(rec.url||"").split("|").join("\\n");
      if(rec.target) $("t").value=rec.target; RGSEL={};(rec.regions||[]).forEach(function(c){RGSEL[c]=1});rgSync();
      $("codeN").value=code;
    }
    $("rok").style.display="block";
  }).catch(function(){
    $("rerr").style.display="block";
  });
}
function copyText(btn,txt){
  function done(){var o=btn.textContent;btn.textContent="\u5DF2\u590D\u5236";setTimeout(function(){btn.textContent=o},1200)}
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).then(done).catch(function(){fallback()});
  }else{fallback()}
  function fallback(){
    var ta=document.createElement("textarea");
    ta.value=txt;document.body.appendChild(ta);ta.select();
    try{document.execCommand("copy");done()}catch(e){}
    document.body.removeChild(ta);
  }
}
function linkRow(tag,url,imp){
  var row=document.createElement("div");row.className="link-row";
  var t=document.createElement("div");t.className="tag";t.textContent=tag;row.appendChild(t);
  var u=document.createElement("div");u.className="u";u.textContent=url;row.appendChild(u);
  var ops=document.createElement("div");ops.className="ops";
  var cp=document.createElement("button");cp.textContent="\u590D\u5236\u94FE\u63A5";
  cp.onclick=function(){copyText(cp,url)};
  ops.appendChild(cp);
  var op=document.createElement("button");op.textContent="\u6253\u5F00\u94FE\u63A5";
  op.onclick=function(){location.href=url};
  ops.appendChild(op);
  if(imp){
    var a=document.createElement("a");a.className="imp";a.textContent=imp.label;a.href=imp.href;
    ops.appendChild(a);
  }
  row.appendChild(ops);
  return row;
}
function render(outId,rows,note){
  var out=$(outId);out.innerHTML="";
  rows.forEach(function(r){out.appendChild(linkRow(r.tag,r.url,r.imp))});
  if(note){
    var n=document.createElement("div");n.className="note";n.textContent=note;out.appendChild(n);
  }
  out.style.display="block";
}
function shorten(body){
  return fetch("/shorten",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})
    .then(function(r){return r.text().then(function(t){return {ok:r.ok,status:r.status,text:t}})});
}
var RGSEL={};
function rgSync(){document.querySelectorAll(".rgchip").forEach(function(ch){ch.className=RGSEL[ch.getAttribute("data-c")]?"rgchip on":"rgchip"})}
function rgSel(){var s={};for(var k in RGSEL)if(RGSEL[k])s[k]=1;var ex=$("rgExtra");if(ex)ex.value.split(/[,\\s]+/).forEach(function(x){x=x.trim().toUpperCase();if(x)s[x]=1});return Object.keys(s)}
function rgBuild(codes){var box=$("rgChips");if(!box)return;box.innerHTML="";codes.forEach(function(c){var b=document.createElement("button");b.type="button";b.className="rgchip";b.setAttribute("data-c",c);b.textContent=c;b.onclick=function(){RGSEL[c]=!RGSEL[c];rgSync()};box.appendChild(b)});rgSync()}
(function(){var pop=["JP","HK","SG","US","TW","KR","DE","GB","FR","NL","CA","AU"];rgBuild(pop);fetch("/?get_regions=1").then(function(r){return r.json()}).then(function(cs){if(cs&&cs.length)rgBuild(cs)}).catch(function(){})})();
function countItems(s){return (s||"").split("|").filter(function(x){return x.trim().length>0}).length}
function firstHostOf(s){
  var f=((s||"").split("|")[0]||"").split("#")[0];
  var m=f.match(/^[a-zA-Z][a-zA-Z0-9+.-]*:\\/\\/(?:[^@/?#]*@)?([^/:?#]+)/);
  return m?m[1]:f.slice(0,40);
}
function describeOld(code,rec){
  var head="\u540E\u7F00\u300C"+code+"\u300D\u662F\u4F60\u4E4B\u524D\u751F\u6210\u8FC7\u7684\u4E00\u6761";
  var tail="\u53EA\u6539\u5185\u5BB9\u3001\u4E0D\u6362\u5730\u5740\u5C31\u70B9\u300C\u8986\u76D6\u66F4\u65B0\u300D\uFF1A\u4F1A\u7528\u8FD9\u6B21\u586B\u5199\u7684\u5185\u5BB9\u66FF\u6362\u65E7\u5185\u5BB9\uFF0C\u8BA2\u9605\u5730\u5740\u4FDD\u6301\u4E0D\u53D8\uFF0C\u5DF2\u7ECF\u5BFC\u5165\u7684\u5BA2\u6237\u7AEF\u4E0D\u7528\u6539\uFF0C\u4E0B\u6B21\u66F4\u65B0\u5C31\u4F1A\u62FF\u5230\u65B0\u5185\u5BB9\u3002";
  if(!rec) return head+"\u94FE\u63A5\u3002"+tail;
  var kind=rec.kind==="chain"?"\u94FE\u5F0F\u4EE3\u7406":"\u666E\u901A\u8F6C\u6362";
  var bits=[];
  if(rec.kind==="chain"){
    bits.push("\u5165\u53E3 "+countItems(rec.entry)+" \u6761\u3001\u51FA\u53E3 "+countItems(rec.exit)+" \u6761");
  }else{
    bits.push("\u5171 "+countItems(rec.url)+" \u6761\u8F93\u5165");
    var h=firstHostOf(rec.url); if(h) bits.push("\u7B2C\u4E00\u6761\u6765\u81EA "+h);
  }
  if(rec.created) bits.push("\u751F\u6210\u4E8E "+String(rec.created).slice(0,10));
  return head+kind+"\u94FE\u63A5\uFF08"+bits.join("\uFF0C")+"\uFF09\u3002"+tail;
}
function askOverwrite(sec,code,retry,codeInputId){
  var out=$(sec==="N"?"outN":"outC");out.innerHTML="";
  var box=document.createElement("div");box.className="link-row";
  var t=document.createElement("div");t.className="tag";t.textContent="\u8FD9\u4E2A\u540E\u7F00\u662F\u4F60\u81EA\u5DF1\u4E4B\u524D\u7528\u8FC7\u7684";box.appendChild(t);
  var u=document.createElement("div");u.className="u";u.style.fontFamily="inherit";u.textContent="\u6B63\u5728\u8BFB\u53D6\u8FD9\u6761\u65E7\u94FE\u63A5\u7684\u5185\u5BB9\u2026";box.appendChild(u);
  var ops=document.createElement("div");ops.className="ops";
  var b1=document.createElement("button");b1.textContent="\u8986\u76D6\u66F4\u65B0";b1.onclick=function(){retry()};
  var b2=document.createElement("button");b2.textContent="\u6362\u4E2A\u540E\u7F00";b2.onclick=function(){out.style.display="none";var i=$(codeInputId);i.focus();i.select();showErr(sec==="N"?"errN":"errC","\u5DF2\u53D6\u6D88\u8986\u76D6\u3002\u6362\u4E2A\u540E\u7F00\u4F1A\u751F\u6210\u65B0\u5730\u5740\uFF0C\u4F60\u4E4B\u524D\u7684\u94FE\u63A5\u4E0D\u53D7\u5F71\u54CD")};
  ops.appendChild(b1);ops.appendChild(b2);box.appendChild(ops);out.appendChild(box);out.style.display="block";
  fetch("/api/link/"+encodeURIComponent(code)).then(function(r){return r.ok?r.json():null}).then(function(rec){u.textContent=describeOld(code,rec)}).catch(function(){u.textContent=describeOld(code,null)});
}
function genN(){attemptN(false)}
function attemptN(force){
  var it=lines("u");hideErr("errN");
  if(!it.length){showErr("errN","\u5148\u7C98\u8D34\u8282\u70B9\u6216\u8BA2\u9605\u94FE\u63A5");return}
  var tg=$("t").value, cd=$("codeN").value.trim();
  var body={target:tg,url:it.join("|")}; if(cd)body.code=cd; if(force)body.force=true; var rgs=rgSel(); if(rgs.length)body.regions=rgs.join("-");
  var btn=$("goN");btn.disabled=true;btn.textContent="\u751F\u6210\u4E2D\u2026";
  shorten(body).then(function(res){
    if(res.ok){
      var url=res.text.trim(), code=extractCode(url);
      if((tg==="clash"||tg==="singbox")&&code){
        var rows=[
          {tag:"\u751F\u6210\u65F6\u683C\u5F0F",url:location.origin+"/c/"+code},
          {tag:"Mihomo",url:location.origin+"/m/"+code,imp:tg==="clash"?{label:"\u4E00\u952E\u5BFC\u5165 Clash",href:"clash://install-config?url="+encodeURIComponent(location.origin+"/m/"+code)}:null},
          {tag:"sing-box",url:location.origin+"/s/"+code,imp:tg==="singbox"?{label:"\u4E00\u952E\u5BFC\u5165 sing-box",href:"sing-box://import-remote-profile?url="+encodeURIComponent(location.origin+"/s/"+code)}:null}
        ];
        render("outN",rows,force?"\u5DF2\u8986\u76D6\u66F4\u65B0\uFF1A\u8BA2\u9605\u5730\u5740\u6CA1\u6709\u53D8\uFF0C\u5BA2\u6237\u7AEF\u4E0B\u6B21\u66F4\u65B0\u5C31\u4F1A\u62FF\u5230\u65B0\u5185\u5BB9":"");
      }else{
        render("outN",[{tag:"\u8BA2\u9605\u94FE\u63A5",url:url}],force?"\u5DF2\u8986\u76D6\u66F4\u65B0\uFF1A\u8BA2\u9605\u5730\u5740\u6CA1\u6709\u53D8\uFF0C\u5BA2\u6237\u7AEF\u4E0B\u6B21\u66F4\u65B0\u5C31\u4F1A\u62FF\u5230\u65B0\u5185\u5BB9":"");
      }
    }else if(cd){
      if(res.status===409&&!force){askOverwrite("N",cd,function(){attemptN(true)},"codeN")}else{showErr("errN",res.text||"\u751F\u6210\u5931\u8D25")}
    }else{
      var base=(tg==="clash"||tg==="singbox")?"/conv":"/sub";
      var u2=location.origin+base+"?target="+tg+"&url="+encodeURIComponent(it.join("|"));
      render("outN",[{tag:"\u8BA2\u9605\u94FE\u63A5\uFF08\u957F\u94FE\u63A5\uFF09",url:u2}],"\u77ED\u94FE\u670D\u52A1\u6682\u4E0D\u53EF\u7528\uFF0C\u5DF2\u751F\u6210\u957F\u94FE\u63A5");
    }
  }).catch(function(){
    if(cd){showErr("errN","\u751F\u6210\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5")}
    else{
      var base=(tg==="clash"||tg==="singbox")?"/conv":"/sub";
      var u2=location.origin+base+"?target="+tg+"&url="+encodeURIComponent(it.join("|"));
      render("outN",[{tag:"\u8BA2\u9605\u94FE\u63A5\uFF08\u957F\u94FE\u63A5\uFF09",url:u2}],"\u77ED\u94FE\u670D\u52A1\u6682\u4E0D\u53EF\u7528\uFF0C\u5DF2\u751F\u6210\u957F\u94FE\u63A5");
    }
  }).finally(function(){btn.disabled=false;btn.textContent="\u751F\u6210\u8F6C\u6362\u94FE\u63A5"});
}
function genC(){attemptC(false)}
function attemptC(force){
  var a=lines("ein"), b=lines("eout");hideErr("errC");
  if(!a.length||!b.length){showErr("errC","\u5165\u53E3\u548C\u51FA\u53E3\u90FD\u8981\u586B");return}
  var tg=$("tc").value, cd=$("codeC").value.trim();
  var body={target:tg,entry:a.join("|"),exit:b.join("|")}; if(cd)body.code=cd; if(force)body.force=true;
  var btn=$("goC");btn.disabled=true;btn.textContent="\u751F\u6210\u4E2D\u2026";
  shorten(body).then(function(res){
    if(res.ok){
      var url=res.text.trim(), code=extractCode(url);
      if(code){
        var rows=[
          {tag:"\u751F\u6210\u65F6\u683C\u5F0F",url:location.origin+"/c/"+code},
          {tag:"Mihomo",url:location.origin+"/m/"+code,imp:tg==="clash"?{label:"\u4E00\u952E\u5BFC\u5165 Clash",href:"clash://install-config?url="+encodeURIComponent(location.origin+"/m/"+code)}:null},
          {tag:"sing-box",url:location.origin+"/s/"+code,imp:tg==="singbox"?{label:"\u4E00\u952E\u5BFC\u5165 sing-box",href:"sing-box://import-remote-profile?url="+encodeURIComponent(location.origin+"/s/"+code)}:null}
        ];
        render("outC",rows,force?"\u5DF2\u8986\u76D6\u66F4\u65B0\uFF1A\u8BA2\u9605\u5730\u5740\u6CA1\u6709\u53D8\uFF0C\u5BA2\u6237\u7AEF\u4E0B\u6B21\u66F4\u65B0\u5C31\u4F1A\u62FF\u5230\u65B0\u5185\u5BB9":"");
      }else{
        render("outC",[{tag:"\u8BA2\u9605\u94FE\u63A5",url:url}],force?"\u5DF2\u8986\u76D6\u66F4\u65B0\uFF1A\u8BA2\u9605\u5730\u5740\u6CA1\u6709\u53D8\uFF0C\u5BA2\u6237\u7AEF\u4E0B\u6B21\u66F4\u65B0\u5C31\u4F1A\u62FF\u5230\u65B0\u5185\u5BB9":"");
      }
    }else if(cd){
      if(res.status===409&&!force){askOverwrite("C",cd,function(){attemptC(true)},"codeC")}else{showErr("errC",res.text||"\u751F\u6210\u5931\u8D25")}
    }else{
      var u2=location.origin+"/chain?target="+tg+"&entry="+encodeURIComponent(a.join("|"))+"&exit="+encodeURIComponent(b.join("|"));
      render("outC",[{tag:"\u8BA2\u9605\u94FE\u63A5\uFF08\u957F\u94FE\u63A5\uFF09",url:u2}],"\u77ED\u94FE\u670D\u52A1\u6682\u4E0D\u53EF\u7528\uFF0C\u5DF2\u751F\u6210\u957F\u94FE\u63A5");
    }
  }).catch(function(){
    if(cd){showErr("errC","\u751F\u6210\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5")}
    else{
      var u2=location.origin+"/chain?target="+tg+"&entry="+encodeURIComponent(a.join("|"))+"&exit="+encodeURIComponent(b.join("|"));
      render("outC",[{tag:"\u8BA2\u9605\u94FE\u63A5\uFF08\u957F\u94FE\u63A5\uFF09",url:u2}],"\u77ED\u94FE\u670D\u52A1\u6682\u4E0D\u53EF\u7528\uFF0C\u5DF2\u751F\u6210\u957F\u94FE\u63A5");
    }
  }).finally(function(){btn.disabled=false;btn.textContent="\u751F\u6210\u94FE\u5F0F\u8BA2\u9605\u94FE\u63A5"});
}
</script>
</body>
</html>
`;
var _enc = new TextEncoder();
var _dec = new TextDecoder();
function isObj(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
function nonEmptyObj(v) {
  return isObj(v) && Object.keys(v).length > 0;
}
function safeDecode(s) {
  s = s ?? "";
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
function b64ToBytes(s) {
  let t = String(s).replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  t += "=".repeat((4 - t.length % 4) % 4);
  const bin = atob(t);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function b64ToText(s) {
  return _dec.decode(b64ToBytes(s));
}
function intOr(v, dflt) {
  if (!v) return dflt;
  const n = Number(v);
  if (Number.isNaN(n)) throw new Error("bad int");
  return Math.trunc(n);
}
function toPort(v, dflt) {
  if (v === null || v === void 0 || v === "" || v === 0) return dflt;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : dflt;
}
function partition(s, sep) {
  const i = s.indexOf(sep);
  if (i < 0) return [s, ""];
  return [s.slice(0, i), s.slice(i + sep.length)];
}
function rpartition(s, sep) {
  const i = s.lastIndexOf(sep);
  if (i < 0) return ["", s];
  return [s.slice(0, i), s.slice(i + sep.length)];
}
function qmap(searchParams) {
  const m = /* @__PURE__ */ new Map();
  for (const k of new Set(searchParams.keys())) m.set(k, searchParams.getAll(k));
  return m;
}
function q1(q, key) {
  const v = q.get(key);
  return v && v.length ? v[0] : void 0;
}
function errMsg(e) {
  return e instanceof Error ? e.message : String(e);
}
function applyTransport(node, q) {
  const net = (q1(q, "type") || "tcp").toLowerCase();
  node.network = net;
  if (net === "ws") {
    const ws = {};
    const path = q1(q, "path");
    if (path) ws.path = path;
    const host = q1(q, "host");
    if (host) ws.headers = { Host: host };
    if (Object.keys(ws).length) node["ws-opts"] = ws;
  } else if (net === "grpc") {
    const sn = q1(q, "serviceName");
    if (sn) node["grpc-opts"] = { "grpc-service-name": sn };
  }
}
function applyTlsUri(node, q) {
  const sec = (q1(q, "security") || "none").toLowerCase();
  if (sec === "reality") {
    node.tls = true;
    const ro = {};
    const pbk = q1(q, "pbk");
    if (pbk) ro["public-key"] = pbk;
    const sid = q1(q, "sid");
    if (sid) ro["short-id"] = sid;
    node["reality-opts"] = ro;
  } else if (sec === "tls") {
    node.tls = true;
  }
  const sni = q1(q, "sni") ?? q1(q, "peer");
  if (sni) node.servername = sni;
  const fp = q1(q, "fp");
  if (fp) node["client-fingerprint"] = fp;
  const flow = q1(q, "flow");
  if (flow) node.flow = flow;
  const ai = q1(q, "allowInsecure");
  if (ai === "1" || ai === "true") node["skip-cert-verify"] = true;
}
function parseUri(line) {
  line = String(line).trim();
  if (!line.includes("://")) return null;
  const idx = line.indexOf("://");
  const scheme = line.slice(0, idx).toLowerCase();
  const rest = line.slice(idx + 3);
  try {
    if (scheme === "vmess") {
      const doc = JSON.parse(b64ToText(rest.split("#")[0]));
      const node = {
        name: doc.ps || "vmess",
        type: "vmess",
        server: doc.add,
        port: intOr(doc.port, 443),
        uuid: doc.id,
        alterId: intOr(doc.aid, 0),
        cipher: doc.scy || "auto",
        network: String(doc.net || "tcp").toLowerCase()
      };
      if (doc.tls === "tls") node.tls = true;
      if (doc.sni) node.servername = doc.sni;
      if (node.network === "ws") {
        const ws = {};
        if (doc.path) ws.path = doc.path;
        if (doc.host) ws.headers = { Host: doc.host };
        if (Object.keys(ws).length) node["ws-opts"] = ws;
      } else if (node.network === "grpc" && doc.path) {
        node["grpc-opts"] = { "grpc-service-name": doc.path };
      }
      return node;
    }
    const u = new URL(line);
    const host = u.hostname || null;
    const port = u.port ? Number(u.port) : null;
    const name = safeDecode(u.hash ? u.hash.slice(1) : "") || scheme;
    const q = qmap(u.searchParams);
    const user = safeDecode(u.username || "");
    if (scheme === "vless") {
      const node = {
        name,
        type: "vless",
        server: host,
        port: port || 443,
        uuid: user
      };
      applyTlsUri(node, q);
      applyTransport(node, q);
      return node;
    }
    if (scheme === "trojan") {
      const node = {
        name,
        type: "trojan",
        server: host,
        port: port || 443,
        password: user,
        tls: true
      };
      applyTlsUri(node, q);
      applyTransport(node, q);
      return node;
    }
    if (scheme === "ss") {
      if (u.username && u.hostname) {
        const ui = u.username;
        let dec;
        try {
          dec = b64ToText(safeDecode(ui));
        } catch {
          dec = safeDecode(ui);
        }
        const [method2, pwd2] = partition(dec, ":");
        return {
          name,
          type: "ss",
          server: host,
          port: port || 8388,
          cipher: method2,
          password: pwd2
        };
      }
      const doc = b64ToText(rest.split("#")[0]);
      const [cred, addr] = rpartition(doc, "@");
      const [method, pwd] = partition(cred, ":");
      const [h, p] = rpartition(addr, ":");
      return {
        name,
        type: "ss",
        server: h,
        port: intOr(p, 8388),
        cipher: method,
        password: pwd
      };
    }
    if (scheme === "hysteria2" || scheme === "hy2") {
      const node = {
        name,
        type: "hysteria2",
        server: host,
        port: port || 443,
        password: user
      };
      const sni = q1(q, "sni");
      if (sni) node.sni = sni;
      const obfs = q1(q, "obfs");
      if (obfs) node.obfs = obfs;
      const op = q1(q, "obfs-password");
      if (op) node["obfs-password"] = op;
      const ins = q1(q, "insecure");
      if (ins === "1" || ins === "true") node["skip-cert-verify"] = true;
      return node;
    }
    if (scheme === "tuic") {
      const [uuid, pwd] = partition(user, ":");
      const node = {
        name,
        type: "tuic",
        server: host,
        port: port || 443,
        uuid,
        password: pwd
      };
      const sni = q1(q, "sni");
      if (sni) node.sni = sni;
      const alpn = q1(q, "alpn");
      if (alpn) node.alpn = [alpn];
      const cc = q1(q, "congestion_control");
      if (cc) node["congestion-controller"] = cc;
      const urm = q1(q, "udp_relay_mode");
      if (urm) node["udp-relay-mode"] = urm;
      return node;
    }
    if (scheme === "anytls") {
      const node = {
        name,
        type: "anytls",
        server: host,
        port: port || 443,
        password: user,
        tls: true
      };
      const sni = q1(q, "sni");
      if (sni) node.servername = sni;
      return node;
    }
  } catch {
    return null;
  }
  return null;
}
function sbToNode(o) {
  const t = o.type;
  const node = { name: o.tag, type: t, server: o.server, port: o.server_port };
  const tls = o.tls || {};
  if (tls.enabled) {
    node.tls = true;
    if (tls.server_name) node.servername = tls.server_name;
    if (tls.insecure) node["skip-cert-verify"] = true;
    if (tls.utls && tls.utls.fingerprint) {
      node["client-fingerprint"] = tls.utls.fingerprint;
    }
    if (tls.reality && tls.reality.enabled) {
      node["reality-opts"] = {
        "public-key": tls.reality.public_key ?? "",
        "short-id": tls.reality.short_id ?? ""
      };
    }
  }
  const tr = o.transport || {};
  if (tr.type === "ws") {
    node.network = "ws";
    const ws = {};
    if (tr.path) ws.path = tr.path;
    const host = (tr.headers || {}).Host;
    if (host) ws.headers = { Host: host };
    if (Object.keys(ws).length) node["ws-opts"] = ws;
  } else if (tr.type === "grpc") {
    node.network = "grpc";
    if (tr.service_name) {
      node["grpc-opts"] = { "grpc-service-name": tr.service_name };
    }
  }
  if (t === "vless" || t === "vmess" || t === "tuic") node.uuid = o.uuid;
  if (t === "vless" && o.flow) node.flow = o.flow;
  if (t === "vmess") {
    node.alterId = o.alter_id || 0;
    node.cipher = o.security || "auto";
  }
  if (t === "trojan" || t === "anytls") node.password = o.password;
  if (t === "shadowsocks") {
    node.type = "ss";
    node.cipher = o.method;
    node.password = o.password;
  }
  if (t === "tuic") {
    node.password = o.password;
    if (o.congestion_control) node["congestion-controller"] = o.congestion_control;
    if (o.udp_relay_mode) node["udp-relay-mode"] = o.udp_relay_mode;
  }
  if (t === "hysteria2") {
    node.password = o.password || o.auth;
    if (o.obfs && o.obfs.password) {
      node.obfs = o.obfs.type || "salamander";
      node["obfs-password"] = o.obfs.password;
    }
  }
  return node;
}
async function classifyText(text, depth) {
  text = String(text).trim();
  if (!text) return [];
  if (text.startsWith("{")) {
    try {
      const doc = JSON.parse(text);
      if (isObj(doc) && Array.isArray(doc.outbounds)) {
        return doc.outbounds.filter((o) => isObj(o) && !GROUP_TYPES.has(o.type) && !BUILTIN_TYPES.has(o.type) && o.server).map(sbToNode);
      }
    } catch {
    }
  }
  try {
    const doc = load(text);
    if (isObj(doc)) {
      if (Array.isArray(doc.proxies) && doc.proxies.length) {
        return doc.proxies.filter(isObj);
      }
      if (nonEmptyObj(doc["proxy-providers"]) && depth < 2) {
        const nodes = [];
        for (const pv of Object.values(doc["proxy-providers"])) {
          const url = isObj(pv) ? pv.url : void 0;
          if (url) nodes.push(...await nodesFromUrl(url, depth + 1));
        }
        if (nodes.length) return nodes;
      }
    }
  } catch {
  }
  try {
    const decoded = b64ToText(text);
    if (decoded.includes("://") || decoded.includes("proxies:")) {
      const inner = await classifyText(decoded, depth);
      if (inner.length) return inner;
    }
  } catch {
  }
  const out = [];
  for (const l of text.split(/\r\n|\r|\n/)) {
    const n = parseUri(l);
    if (n) out.push(n);
  }
  return out;
}
async function fetchTextWithUa(url, ua) {
  const resp = await fetch(url, {
    headers: { "User-Agent": ua },
    signal: AbortSignal.timeout(2e4)
  });
  if (!resp.ok) throw new Error("HTTP " + resp.status);
  return resp.text();
}
async function nodesFromUrl(url, depth) {
  for (const ua of [
    "clash-verge/2.2.3",
    "clash-verge/2.2.3",
    "sing-box/1.15.0",
    BROWSER_UA
  ]) {
    try {
      const found = await classifyText(await fetchTextWithUa(url, ua), depth);
      if (found.length) return found;
    } catch {
      continue;
    }
  }
  return [];
}
async function gather(items) {
  const nodes = [];
  const seen = /* @__PURE__ */ new Map();
  for (let item of String(items).split("|")) {
    item = item.trim();
    if (!item) continue;
    let found;
    if (item.startsWith("http://") || item.startsWith("https://")) {
      found = await nodesFromUrl(item, 0);
    } else {
      const n = parseUri(item);
      found = n ? [n] : [];
    }
    for (let n of found) {
      if (!n.server || !n.type) continue;
      let name = String(n.name || n.type);
      if (seen.has(name)) {
        const c = seen.get(name) + 1;
        seen.set(name, c);
        name = `${name}-${c}`;
        n = { ...n, name };
      } else {
        seen.set(name, 1);
      }
      nodes.push(n);
    }
  }
  return nodes;
}
function tlsSb(node) {
  const tls = { enabled: true };
  const sni = node.servername || node.sni;
  if (sni) tls.server_name = sni;
  if (node["skip-cert-verify"]) tls.insecure = true;
  if (node["client-fingerprint"]) {
    tls.utls = { enabled: true, fingerprint: node["client-fingerprint"] };
  }
  const ro = node["reality-opts"];
  if (nonEmptyObj(ro)) {
    tls.reality = {
      enabled: true,
      public_key: ro["public-key"] ?? "",
      short_id: ro["short-id"] ?? ""
    };
  }
  const eo = node["ech-opts"];
  if (isObj(eo) && eo.enable && eo["query-server-name"]) {
    tls.ech = { enabled: true, query_server_name: eo["query-server-name"] };
  }
  return tls;
}
function transportSb(node) {
  const net = String(node.network || "tcp").toLowerCase();
  if (net === "ws") {
    const ws = node["ws-opts"] || {};
    const tr = { type: "ws", path: ws.path || "/" };
    const host = (ws.headers || {}).Host;
    if (host) tr.headers = { Host: host };
    return tr;
  }
  if (net === "grpc") {
    return {
      type: "grpc",
      service_name: (node["grpc-opts"] || {})["grpc-service-name"] || ""
    };
  }
  return null;
}
function sbEmit(node) {
  const t = String(node.type || "").toLowerCase();
  const ob = {
    type: t,
    tag: String(node.name || t),
    server: node.server,
    server_port: toPort(node.port, 443),
    // sing-box 1.12 migration: replaces the legacy outbound DNS rule.
    // The chain builders repoint it at dns-cn via sbLeafFix.
    domain_resolver: "dns_resolver"
  };
  if (t === "shadowsocks" || t === "ss") {
    ob.type = "shadowsocks";
    ob.method = node.cipher || "aes-256-gcm";
    ob.password = node.password || "";
  } else if (t === "vless") {
    ob.uuid = node.uuid || "";
    if (node.flow) ob.flow = node.flow;
    if (node.tls || nonEmptyObj(node["reality-opts"])) ob.tls = tlsSb(node);
    const tr = transportSb(node);
    if (tr) ob.transport = tr;
  } else if (t === "vmess") {
    ob.uuid = node.uuid || "";
    ob.alter_id = intOr(node.alterId, 0);
    ob.security = node.cipher || "auto";
    if (node.tls || nonEmptyObj(node["reality-opts"])) ob.tls = tlsSb(node);
    const tr = transportSb(node);
    if (tr) ob.transport = tr;
  } else if (t === "trojan") {
    ob.password = node.password || "";
    ob.tls = tlsSb(node);
    const tr = transportSb(node);
    if (tr) ob.transport = tr;
  } else if (t === "tuic") {
    ob.uuid = node.uuid || "";
    ob.password = node.password || "";
    if (node["congestion-controller"]) {
      ob.congestion_control = node["congestion-controller"];
    }
    if (node["udp-relay-mode"]) ob.udp_relay_mode = node["udp-relay-mode"];
    const tls = { enabled: true };
    if (node.sni) tls.server_name = node.sni;
    if (node.alpn) tls.alpn = node.alpn;
    if (node["skip-cert-verify"]) tls.insecure = true;
    ob.tls = tls;
  } else if (t === "hysteria2" || t === "hy2") {
    ob.type = "hysteria2";
    ob.password = node.password || "";
    if (node.obfs) {
      ob.obfs = { type: node.obfs, password: node["obfs-password"] || "" };
    }
    const tls = { enabled: true };
    if (node.sni) tls.server_name = node.sni;
    if (node["skip-cert-verify"]) tls.insecure = true;
    ob.tls = tls;
  } else if (t === "anytls") {
    ob.password = node.password || "";
    ob.tls = tlsSb(node);
  } else {
    throw new Error(`unsupported node type for sing-box: ${t}`);
  }
  return ob;
}
function clashEmit(node) {
  const p = {};
  for (const [k, v] of Object.entries(node)) {
    if (v !== null && v !== void 0) p[k] = v;
  }
  if (String(p.type || "").toLowerCase() === "ss" && !("cipher" in p)) {
    p.cipher = "aes-256-gcm";
  }
  return p;
}
var TEXT_TARGETS = /* @__PURE__ */ new Set(["v2ray", "surge", "loon", "quanx"]);
var ALL_TARGETS = /* @__PURE__ */ new Set(["clash", "singbox", ...TEXT_TARGETS]);
var TEST_URL = "https://www.gstatic.com/generate_204";
var AUTO_GROUP = "\u81EA\u52A8\u6D4B\u901F";
var CHAIN_GROUP = "\u26D3 \u94FE\u5F0F\u4EE3\u7406";
function textToB64(s) {
  const bytes = _enc.encode(s);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 32768) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 32768));
  }
  return btoa(bin);
}
function b64UrlText(s) {
  return textToB64(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function nodeType(node) {
  const t = String(node.type || "").toLowerCase();
  return t === "hy2" ? "hysteria2" : t;
}
function hostOf(node) {
  return String(node.server ?? "");
}
function urlHost(host) {
  return host.includes(":") && !host.startsWith("[") ? `[${host}]` : host;
}
function sniOf(node) {
  return node.servername || node.sni || "";
}
function wsHostOf(node) {
  return ((node["ws-opts"] || {}).headers || {}).Host || "";
}
function wsPathOf(node) {
  return (node["ws-opts"] || {}).path || "";
}
function grpcNameOf(node) {
  return (node["grpc-opts"] || {})["grpc-service-name"] || "";
}
function netOf(node) {
  return String(node.network || "tcp").toLowerCase();
}
function realityOf(node) {
  return nonEmptyObj(node["reality-opts"]) ? node["reality-opts"] : null;
}
function txtName(name) {
  return String(name ?? "").replace(/=/g, "-").replace(/,/g, " ").replace(/\s+/g, " ").trim();
}
function ssPluginSip002(node) {
  const pl = String(node.plugin || "");
  const o = node["plugin-opts"] || {};
  if (pl === "obfs") {
    const parts = ["obfs-local", "obfs=" + (o.mode || "http")];
    if (o.host) parts.push("obfs-host=" + o.host);
    return parts.join(";");
  }
  if (pl === "v2ray-plugin") {
    const parts = ["v2ray-plugin", "mode=" + (o.mode || "websocket")];
    if (o.tls) parts.push("tls");
    if (o.host) parts.push("host=" + o.host);
    if (o.path) parts.push("path=" + o.path);
    return parts.join(";");
  }
  return "";
}
function nodeToShareLink(node) {
  const t = nodeType(node);
  const host = urlHost(hostOf(node));
  const port = portOf(node);
  const frag = "#" + encodeURIComponent(String(node.name || t));
  const sni = sniOf(node);
  const scv = node["skip-cert-verify"] === true;
  const net = netOf(node);
  const q = (pairs) => {
    const p = pairs.filter(([, v]) => v !== "" && v !== void 0 && v !== null);
    return p.length ? "?" + p.map(([k, v]) => k + "=" + encodeURIComponent(v)).join("&") : "";
  };
  if (t === "ss" || t === "shadowsocks") {
    const cred = b64UrlText(
      `${node.cipher || "aes-256-gcm"}:${node.password || ""}`
    );
    const plugin = ssPluginSip002(node);
    return `ss://${cred}@${host}:${port}` + (plugin ? "/?plugin=" + encodeURIComponent(plugin) : "") + frag;
  }
  if (t === "vmess") {
    const doc = {
      v: "2",
      ps: String(node.name || "vmess"),
      add: hostOf(node),
      port: String(port),
      id: node.uuid || "",
      aid: String(intOr(node.alterId, 0)),
      scy: node.cipher || "auto",
      net,
      type: "none",
      host: wsHostOf(node),
      path: wsPathOf(node),
      tls: node.tls ? "tls" : ""
    };
    if (net === "grpc") doc.path = grpcNameOf(node);
    if (sni) doc.sni = sni;
    if (Array.isArray(node.alpn) && node.alpn.length) {
      doc.alpn = node.alpn.join(",");
    }
    if (node["client-fingerprint"]) doc.fp = node["client-fingerprint"];
    return "vmess://" + textToB64(JSON.stringify(doc));
  }
  if (t === "vless") {
    const ro = realityOf(node);
    return `vless://${node.uuid || ""}@${host}:${port}` + q([
      ["encryption", "none"],
      ["security", ro ? "reality" : node.tls ? "tls" : "none"],
      ["sni", sni],
      ["fp", node["client-fingerprint"] || ""],
      ["pbk", ro ? ro["public-key"] || "" : ""],
      ["sid", ro ? ro["short-id"] || "" : ""],
      ["flow", node.flow || ""],
      ["type", net],
      ["host", wsHostOf(node)],
      ["path", wsPathOf(node)],
      ["serviceName", net === "grpc" ? grpcNameOf(node) : ""],
      ["allowInsecure", scv ? "1" : ""]
    ]) + frag;
  }
  if (t === "trojan") {
    return `trojan://${encodeURIComponent(node.password || "")}@${host}:${port}` + q([
      ["sni", sni],
      ["type", net],
      ["host", wsHostOf(node)],
      ["path", wsPathOf(node)],
      ["serviceName", net === "grpc" ? grpcNameOf(node) : ""],
      ["allowInsecure", scv ? "1" : ""]
    ]) + frag;
  }
  if (t === "hysteria2") {
    return `hysteria2://${encodeURIComponent(node.password || "")}@${host}:${port}` + q([
      ["sni", sni],
      ["obfs", node.obfs || ""],
      ["obfs-password", node["obfs-password"] || ""],
      ["insecure", scv ? "1" : ""]
    ]) + frag;
  }
  if (t === "tuic") {
    return `tuic://${node.uuid || ""}:${encodeURIComponent(node.password || "")}@${host}:${port}` + q([
      ["sni", sni],
      ["alpn", Array.isArray(node.alpn) ? node.alpn.join(",") : ""],
      ["congestion_control", node["congestion-controller"] || ""],
      ["udp_relay_mode", node["udp-relay-mode"] || ""],
      ["allowInsecure", scv ? "1" : ""]
    ]) + frag;
  }
  if (t === "anytls") {
    return `anytls://${encodeURIComponent(node.password || "")}@${host}:${port}` + q([
      ["sni", sni],
      ["insecure", scv ? "1" : ""]
    ]) + frag;
  }
  return null;
}
function portOf(node) {
  return toPort(node.port, 443);
}
function surgeEmit(node) {
  const t = nodeType(node);
  const host = hostOf(node);
  const port = portOf(node);
  const sni = sniOf(node);
  const scv = node["skip-cert-verify"] === true;
  const net = netOf(node);
  const parts = [];
  const wsParams = () => {
    parts.push("ws=true");
    const p = wsPathOf(node);
    if (p) parts.push("ws-path=" + p);
    const h = wsHostOf(node);
    if (h) parts.push("ws-headers=Host:" + h);
  };
  if (t === "ss" || t === "shadowsocks") {
    parts.push(
      "ss",
      host,
      String(port),
      "encrypt-method=" + (node.cipher || "aes-256-gcm"),
      "password=" + (node.password || "")
    );
    const pl = String(node.plugin || "");
    const o = node["plugin-opts"] || {};
    if (pl === "obfs") {
      parts.push("obfs=" + (o.mode || "http"));
      if (o.host) parts.push("obfs-host=" + o.host);
    } else if (pl) {
      return null;
    }
  } else if (t === "vmess") {
    if (net !== "tcp" && net !== "ws") return null;
    parts.push(
      "vmess",
      host,
      String(port),
      "username=" + (node.uuid || ""),
      "tls=" + (node.tls ? "true" : "false"),
      "vmess-aead=" + (intOr(node.alterId, 0) === 0 ? "true" : "false")
    );
    if (net === "ws") wsParams();
    const effSni = sni || wsHostOf(node);
    if (node.tls && effSni) parts.push("sni=" + effSni);
    if (scv) parts.push("skip-cert-verify=true");
  } else if (t === "trojan") {
    if (net !== "tcp" && net !== "ws") return null;
    parts.push(
      "trojan",
      host,
      String(port),
      "password=" + (node.password || "")
    );
    if (net === "ws") wsParams();
    const effSni = sni || wsHostOf(node);
    if (effSni) parts.push("sni=" + effSni);
    if (scv) parts.push("skip-cert-verify=true");
  } else if (t === "hysteria2") {
    parts.push(
      "hysteria2",
      host,
      String(port),
      "password=" + (node.password || "")
    );
    if (node.obfs) {
      parts.push("obfs=" + node.obfs);
      if (node["obfs-password"]) {
        parts.push("obfs-password=" + node["obfs-password"]);
      }
    }
    if (sni) parts.push("sni=" + sni);
    if (scv) parts.push("skip-cert-verify=true");
  } else if (t === "anytls") {
    if (realityOf(node)) return null;
    parts.push(
      "anytls",
      host,
      String(port),
      "password=" + (node.password || "")
    );
    if (sni) parts.push("sni=" + sni);
    if (scv) parts.push("skip-cert-verify=true");
  } else if (t === "snell") {
    parts.push(
      "snell",
      host,
      String(port),
      "psk=" + (node.psk || node.password || "")
    );
    const o = node["obfs-opts"] || {};
    if (o.mode) {
      parts.push("obfs=" + o.mode);
      if (o.host) parts.push("obfs-host=" + o.host);
    }
    if (node.version) parts.push("version=" + node.version);
  } else if (t === "socks5") {
    parts.push(node.tls ? "socks5-tls" : "socks5", host, String(port));
    if (node.username) parts.push("username=" + node.username);
    if (node.password) parts.push("password=" + node.password);
    if (node.tls && sni) parts.push("sni=" + sni);
    if (scv) parts.push("skip-cert-verify=true");
  } else if (t === "http") {
    parts.push("http", host, String(port));
    if (node.username) parts.push("username=" + node.username);
    if (node.password) parts.push("password=" + node.password);
    parts.push("tls=" + (node.tls ? "true" : "false"));
    if (scv) parts.push("skip-cert-verify=true");
  } else {
    return null;
  }
  if (node.tfo === true) parts.push("tfo=true");
  if (node.udp === true) parts.push("udp-relay=true");
  return parts.join(", ");
}
function loonEmit(node) {
  const t = nodeType(node);
  const host = hostOf(node);
  const port = portOf(node);
  const sni = sniOf(node);
  const scv = node["skip-cert-verify"] === true;
  const net = netOf(node);
  const parts = [];
  const quoted = (v) => `"${String(v ?? "")}"`;
  if (t === "ss" || t === "shadowsocks") {
    parts.push(
      "Shadowsocks",
      host,
      String(port),
      node.cipher || "aes-256-gcm",
      quoted(node.password || "")
    );
    const pl = String(node.plugin || "");
    const o = node["plugin-opts"] || {};
    if (pl === "obfs") {
      parts.push(String(o.mode || "http"));
      if (o.host) parts.push(String(o.host));
    } else if (pl) {
      return null;
    }
  } else if (t === "ssr") {
    parts.push(
      "ShadowsocksR",
      host,
      String(port),
      node.cipher || "aes-256-cfb",
      quoted(node.password || ""),
      "protocol=" + (node.protocol || "origin"),
      "protocol-param=" + (node["protocol-param"] || ""),
      "obfs=" + (node.obfs || "plain"),
      "obfs-param=" + (node["obfs-param"] || "")
    );
  } else if (t === "vmess") {
    if (net !== "tcp" && net !== "ws") return null;
    const method = !node.cipher || node.cipher === "auto" ? "chacha20-ietf-poly1305" : node.cipher;
    parts.push(
      "vmess",
      host,
      String(port),
      method,
      quoted(node.uuid || ""),
      "over-tls=" + (node.tls ? "true" : "false")
    );
    if (node.tls && sni) parts.push("tls-name=" + sni);
    if (net === "ws") {
      parts.push("transport=ws");
      if (wsPathOf(node)) parts.push("path=" + wsPathOf(node));
      if (wsHostOf(node)) parts.push("host=" + wsHostOf(node));
    } else {
      parts.push("transport=tcp");
    }
    if (scv) parts.push("skip-cert-verify=true");
  } else if (t === "vless") {
    if (net !== "tcp" && net !== "ws") return null;
    parts.push("VLESS", host, String(port), quoted(node.uuid || ""));
    if (net === "ws") {
      parts.push("transport=ws");
      if (wsPathOf(node)) parts.push("path=" + wsPathOf(node));
      if (wsHostOf(node)) parts.push("host=" + wsHostOf(node));
    } else {
      parts.push("transport=tcp");
    }
    if (node.flow) parts.push("flow=" + node.flow);
    const ro = realityOf(node);
    if (ro) {
      parts.push("public-key=" + quoted(ro["public-key"] || ""));
      if (ro["short-id"]) parts.push("short-id=" + ro["short-id"]);
    }
    parts.push("over-tls=" + (node.tls || ro ? "true" : "false"));
    if (sni) parts.push("sni=" + sni);
    if (scv) parts.push("skip-cert-verify=true");
  } else if (t === "trojan") {
    parts.push("trojan", host, String(port), quoted(node.password || ""));
    if (net === "ws") {
      parts.push("transport=ws");
      if (wsPathOf(node)) parts.push("path=" + wsPathOf(node));
      if (wsHostOf(node)) parts.push("host=" + wsHostOf(node));
    }
    if (sni) parts.push("tls-name=" + sni);
    if (scv) parts.push("skip-cert-verify=true");
  } else if (t === "hysteria2") {
    parts.push("hysteria2", host, String(port), quoted(node.password || ""));
    if (node.obfs) {
      parts.push("obfs=" + node.obfs);
      if (node["obfs-password"]) {
        parts.push("obfs-password=" + node["obfs-password"]);
      }
    }
    if (sni) parts.push("sni=" + sni);
    if (scv) parts.push("skip-cert-verify=true");
  } else if (t === "tuic") {
    parts.push(
      "tuic",
      host,
      String(port),
      quoted(node.uuid || ""),
      quoted(node.password || "")
    );
    const alpn = Array.isArray(node.alpn) && node.alpn.length ? node.alpn[0] : "h3";
    parts.push("alpn=" + alpn);
    if (node["congestion-controller"]) {
      parts.push("congestion-controller=" + node["congestion-controller"]);
    }
    if (node["udp-relay-mode"]) {
      parts.push("udp-relay-mode=" + node["udp-relay-mode"]);
    }
    if (sni) parts.push("sni=" + sni);
    if (scv) parts.push("skip-cert-verify=true");
  } else if (t === "anytls") {
    parts.push("anytls", host, String(port), quoted(node.password || ""));
    if (sni) parts.push("sni=" + sni);
    if (scv) parts.push("skip-cert-verify=true");
  } else if (t === "snell") {
    parts.push(
      "snell",
      host,
      String(port),
      "psk=" + (node.psk || node.password || "")
    );
    const o = node["obfs-opts"] || {};
    if (o.mode) {
      parts.push("obfs=" + o.mode);
      if (o.host) parts.push("obfs-host=" + o.host);
    }
    if (node.version) parts.push("version=" + node.version);
  } else if (t === "socks5") {
    parts.push("socks5", host, String(port));
    if (node.username || node.password) {
      parts.push(String(node.username || ""), quoted(node.password || ""));
    }
    parts.push("over-tls=" + (node.tls ? "true" : "false"));
    if (node.tls && sni) parts.push("tls-name=" + sni);
    if (scv) parts.push("skip-cert-verify=true");
  } else if (t === "http") {
    parts.push(node.tls ? "https" : "http", host, String(port));
    if (node.username || node.password) {
      parts.push(String(node.username || ""), quoted(node.password || ""));
    }
    if (node.tls && sni) parts.push("tls-name=" + sni);
    if (scv) parts.push("skip-cert-verify=true");
  } else {
    return null;
  }
  if (node.tfo === true) parts.push("fast-open=true");
  if (node.udp === true) parts.push("udp=true");
  return parts.join(",");
}
function quanxEmit(node) {
  const t = nodeType(node);
  const host = hostOf(node);
  const port = portOf(node);
  const sni = sniOf(node);
  const scv = node["skip-cert-verify"] === true;
  const net = netOf(node);
  const ro = realityOf(node);
  const parts = [];
  const realityParams = () => {
    if (!ro) return;
    parts.push("reality-base64-pubkey=" + (ro["public-key"] || ""));
    if (ro["short-id"]) {
      parts.push("reality-hex-shortid=" + ro["short-id"]);
    }
  };
  const obfsParams = (withTls) => {
    if (net === "grpc") return false;
    if (net === "ws") {
      parts.push("obfs=" + (withTls ? "wss" : "ws"));
      const h = wsHostOf(node) || sni;
      if (h) parts.push("obfs-host=" + h);
      if (wsPathOf(node)) parts.push("obfs-uri=" + wsPathOf(node));
    } else if (withTls) {
      parts.push("obfs=over-tls");
      if (sni) parts.push("obfs-host=" + sni);
    }
    return true;
  };
  if (t === "ss" || t === "shadowsocks") {
    parts.push(
      `shadowsocks=${host}:${port}`,
      "method=" + (node.cipher || "aes-256-gcm"),
      "password=" + (node.password || "")
    );
    const pl = String(node.plugin || "");
    const o = node["plugin-opts"] || {};
    if (pl === "obfs") {
      parts.push("obfs=" + (o.mode || "http"));
      if (o.host) parts.push("obfs-host=" + o.host);
    } else if (pl === "v2ray-plugin") {
      parts.push("obfs=" + (o.tls ? "wss" : "ws"));
      if (o.host) parts.push("obfs-host=" + o.host);
      if (o.path) parts.push("obfs-uri=" + o.path);
    } else if (pl) {
      return null;
    }
  } else if (t === "ssr") {
    parts.push(
      `shadowsocks=${host}:${port}`,
      "method=" + (node.cipher || "aes-256-cfb"),
      "password=" + (node.password || ""),
      "ssr-protocol=" + (node.protocol || "origin")
    );
    if (node["protocol-param"]) {
      parts.push("ssr-protocol-param=" + node["protocol-param"]);
    }
    parts.push("obfs=" + (node.obfs || "plain"));
    if (node["obfs-param"]) parts.push("obfs-host=" + node["obfs-param"]);
  } else if (t === "vmess") {
    const method = !node.cipher || node.cipher === "auto" ? "chacha20-ietf-poly1305" : node.cipher;
    parts.push(
      `vmess=${host}:${port}`,
      "method=" + method,
      "password=" + (node.uuid || "")
    );
    if (intOr(node.alterId, 0) !== 0) parts.push("aead=false");
    if (!obfsParams(!!node.tls || !!ro)) return null;
    realityParams();
    if (scv) parts.push("tls-verification=false");
  } else if (t === "vless") {
    parts.push(
      `vless=${host}:${port}`,
      "method=none",
      "password=" + (node.uuid || "")
    );
    if (!obfsParams(!!node.tls || !!ro)) return null;
    realityParams();
    if (node.flow) parts.push("vless-flow=" + node.flow);
    if (scv) parts.push("tls-verification=false");
  } else if (t === "trojan") {
    parts.push(
      `trojan=${host}:${port}`,
      "password=" + (node.password || "")
    );
    if (net === "ws") {
      parts.push("obfs=wss");
      const h = wsHostOf(node) || sni;
      if (h) parts.push("obfs-host=" + h);
      if (wsPathOf(node)) parts.push("obfs-uri=" + wsPathOf(node));
      realityParams();
    } else if (net === "tcp") {
      parts.push("over-tls=true");
      if (sni) parts.push("tls-host=" + sni);
      realityParams();
      if (scv) parts.push("tls-verification=false");
    } else {
      return null;
    }
  } else if (t === "anytls") {
    parts.push(
      `anytls=${host}:${port}`,
      "password=" + (node.password || ""),
      "over-tls=true"
    );
    if (sni) parts.push("tls-host=" + sni);
    realityParams();
    if (scv) parts.push("tls-verification=false");
  } else if (t === "socks5") {
    parts.push(`socks5=${host}:${port}`);
    if (node.username) parts.push("username=" + node.username);
    if (node.password) parts.push("password=" + node.password);
    if (node.tls) {
      parts.push("over-tls=true");
      if (sni) parts.push("tls-host=" + sni);
      realityParams();
      if (scv) parts.push("tls-verification=false");
    }
  } else if (t === "http") {
    parts.push(`http=${host}:${port}`);
    if (node.username) parts.push("username=" + node.username);
    if (node.password) parts.push("password=" + node.password);
    if (node.tls) {
      parts.push("over-tls=true");
      if (sni) parts.push("tls-host=" + sni);
      realityParams();
      if (scv) parts.push("tls-verification=false");
    }
  } else {
    return null;
  }
  if (node.tfo === true) parts.push("fast-open=true");
  if (node.udp === true) parts.push("udp-relay=true");
  return parts.join(", ");
}
var TEXT_EMITTERS = { surge: surgeEmit, loon: loonEmit, quanx: quanxEmit };
function renderPairs(target, nodes, rename) {
  const emit = TEXT_EMITTERS[target];
  const out = [];
  for (const n of nodes) {
    const body = emit(n);
    if (body === null) continue;
    out.push({ name: txtName(rename ? rename(n.name) : n.name), body });
  }
  return out;
}
var PRIVATE_RULES = [
  ["10.0.0.0/8"],
  ["100.64.0.0/10"],
  ["127.0.0.0/8"],
  ["172.16.0.0/12"],
  ["192.168.0.0/16"]
];
function assembleSurge(entries, exits) {
  const lines = [
    "# Generated by subscription-chain-converter (native Surge renderer)",
    "[General]",
    "loglevel = notify",
    "",
    "[Proxy]",
    "DIRECT = direct"
  ];
  for (const p of entries || []) lines.push(`${p.name} = ${p.body}`);
  for (const p of exits) {
    lines.push(`${p.name} = ${p.body}` + (entries ? `, underlying-proxy=${ENTRY_AUTO}` : ""));
  }
  const en = (entries || []).map((p) => p.name);
  const xn = exits.map((p) => p.name);
  const all = [...en, ...xn];
  lines.push("", "[Proxy Group]");
  if (entries) {
    lines.push(`${ENTRY_AUTO} = url-test, ${en.join(", ")}, url=${TEST_URL}, interval=30, tolerance=100`);
    lines.push(`${EXIT_AUTO} = url-test, ${xn.join(", ")}, url=${TEST_URL}, interval=30, tolerance=100`);
  }
  lines.push("Proxy = select, " + (entries ? `${EXIT_AUTO}, ${ENTRY_AUTO}, ` : "") + `${AUTO_GROUP}, ${all.join(", ")}, DIRECT`);
  lines.push(`${AUTO_GROUP} = url-test, ${xn.join(", ")}, url=${TEST_URL}, interval=30, tolerance=100`);
  lines.push("", "[Rule]");
  for (const [cidr] of PRIVATE_RULES) {
    lines.push(`IP-CIDR,${cidr},DIRECT,no-resolve`);
  }
  lines.push(
    "IP-CIDR6,::1/128,DIRECT,no-resolve",
    "GEOIP,CN,DIRECT",
    "FINAL,Proxy"
  );
  return lines.join("\n") + "\n";
}
function assembleLoon(entries, exits) {
  const lines = [
    "# Generated by subscription-chain-converter (native Loon renderer)",
    "[Proxy]"
  ];
  for (const p of entries || []) lines.push(`${p.name} = ${p.body}`);
  for (const p of exits) lines.push(`${p.name} = ${p.body}`);
  const en = (entries || []).map((p) => p.name);
  const xn = exits.map((p) => p.name);
  const all = [...en, ...xn];
  if (entries) {
    lines.push(
      "",
      "[Proxy Chain]",
      `${CHAIN_GROUP} = ${ENTRY_AUTO},${EXIT_AUTO},udp=true`
    );
  }
  lines.push("", "[Proxy Group]");
  if (entries) {
    lines.push(`${ENTRY_AUTO} = url-test,${en.join(",")},url=${TEST_URL},interval=30,tolerance=100`);
    lines.push(`${EXIT_AUTO} = url-test,${xn.join(",")},url=${TEST_URL},interval=30,tolerance=100`);
  }
  lines.push("Proxy = select," + (entries ? `${CHAIN_GROUP},${EXIT_AUTO},${ENTRY_AUTO},` : "") + `${AUTO_GROUP},${all.join(",")},DIRECT`);
  lines.push(`${AUTO_GROUP} = url-test,${xn.join(",")},url=${TEST_URL},interval=30,tolerance=100`);
  lines.push("", "[Rule]");
  for (const [cidr] of PRIVATE_RULES) {
    lines.push(`IP-CIDR,${cidr},DIRECT,no-resolve`);
  }
  lines.push(
    "IP-CIDR6,::1/128,DIRECT,no-resolve",
    "GEOIP,CN,DIRECT",
    "FINAL,Proxy"
  );
  return lines.join("\n") + "\n";
}
function assembleQuanx(entries, exits) {
  const lines = [
    "# Generated by subscription-chain-converter (native Quantumult X renderer)",
    "[general]",
    `server_check_url = ${TEST_URL}`,
    "",
    "[server_local]"
  ];
  for (const p of entries || []) lines.push(`${p.body}, tag=${p.name}`);
  for (const p of exits) {
    lines.push(`${p.body}` + (entries ? `, via-server=${ENTRY_AUTO}` : "") + `, tag=${p.name}`);
  }
  const en = (entries || []).map((p) => p.name);
  const xn = exits.map((p) => p.name);
  const all = [...en, ...xn];
  lines.push("", "[policy]");
  if (entries) {
    lines.push(`url-latency-benchmark=${ENTRY_AUTO}, ${en.join(", ")}, check-interval=30, tolerance=100`);
    lines.push(`url-latency-benchmark=${EXIT_AUTO}, ${xn.join(", ")}, check-interval=30, tolerance=100`);
  }
  lines.push("static=Proxy, " + (entries ? `${EXIT_AUTO}, ${ENTRY_AUTO}, ` : "") + `${AUTO_GROUP}, ${all.join(", ")}, direct`);
  lines.push(`url-latency-benchmark=${AUTO_GROUP}, ${xn.join(", ")}, check-interval=30, tolerance=100`);
  lines.push("", "[filter_local]");
  for (const [cidr] of PRIVATE_RULES) {
    lines.push(`ip-cidr, ${cidr}, direct`);
  }
  lines.push(
    "ip6-cidr, ::1/128, direct",
    "geoip, cn, direct",
    "final, Proxy"
  );
  return lines.join("\n") + "\n";
}
var TEXT_ASSEMBLERS = {
  surge: assembleSurge,
  loon: assembleLoon,
  quanx: assembleQuanx
};
var TEXT_FORMAT_NAMES = {
  surge: "Surge",
  loon: "Loon",
  quanx: "Quantumult X"
};
function buildTextPlain(target, nodes) {
  if (target === "v2ray") {
    const links = [];
    for (const n of nodes) {
      const link = nodeToShareLink(n);
      if (link) links.push(link);
    }
    if (!links.length) {
      throw new Error("\u6CA1\u6709\u53EF\u8F93\u51FA\u4E3A\u5206\u4EAB\u94FE\u63A5\u7684\u8282\u70B9");
    }
    return [
      textToB64(links.join("\n") + "\n"),
      "text/plain; charset=utf-8"
    ];
  }
  const pairs = renderPairs(target, nodes, null);
  if (!pairs.length) {
    throw new Error(`\u6CA1\u6709 ${TEXT_FORMAT_NAMES[target]} \u53EF\u7528\u7684\u8282\u70B9\uFF08\u8BE5\u5BA2\u6237\u7AEF\u4E0D\u652F\u6301\u6240\u7ED9\u534F\u8BAE\uFF09`);
  }
  return [
    TEXT_ASSEMBLERS[target](null, pairs),
    "text/plain; charset=utf-8"
  ];
}
async function mergeTextChain(target, entryItems, exitItems) {
  if (target === "v2ray") {
    STAGE.cur = "exit-convert";
    const xnodes2 = chainPool(await gather(exitItems));
    if (!xnodes2.length) throw new Error("\u6CA1\u6709\u53EF\u7528\u8282\u70B9");
    STAGE.cur = "merge";
    return buildTextPlain("v2ray", xnodes2);
  }
  STAGE.cur = "entry-convert";
  const enodes = chainPool(await gather(entryItems));
  if (!enodes.length) throw new Error("\u6CA1\u6709\u53EF\u7528\u8282\u70B9");
  STAGE.cur = "exit-convert";
  const xnodes = chainPool(await gather(exitItems));
  if (!xnodes.length) throw new Error("\u6CA1\u6709\u53EF\u7528\u8282\u70B9");
  STAGE.cur = "merge";
  const entries = renderPairs(
    target,
    enodes,
    (name) => clashPrefixedName("\u5165\u53E3-", name)
  );
  const exits = renderPairs(
    target,
    xnodes,
    (name) => clashPrefixedName("\u51FA\u53E3-", name)
  );
  if (!entries.length || !exits.length) {
    throw new Error(`\u6CA1\u6709 ${TEXT_FORMAT_NAMES[target]} \u53EF\u7528\u7684\u5165\u53E3\u6216\u51FA\u53E3\u8282\u70B9\uFF08\u8BE5\u5BA2\u6237\u7AEF\u4E0D\u652F\u6301\u6240\u7ED9\u534F\u8BAE\uFF09`);
  }
  return [
    TEXT_ASSEMBLERS[target](entries, exits),
    "text/plain; charset=utf-8"
  ];
}
function buildChainFor(target, entry, exit_, origin) {
  if (target === "singbox") return mergeSingbox(entry, exit_, origin);
  if (target === "clash") return mergeClash(entry, exit_, origin);
  return mergeTextChain(target, entry, exit_);
}
function materialize(raw, origin) {
  return JSON.parse(JSON.stringify(raw).replaceAll("__PUBLIC_ORIGIN__", origin));
}
function fillMembers(mem, entryNames, exitNames) {
  if (Array.isArray(mem) && mem.length === 1 && MEMBER_TOKENS.has(mem[0])) {
    if (mem[0] === "@ENTRIES@") return [...entryNames];
    if (mem[0] === "@EXITS@") return [...exitNames];
    return [...entryNames, ...exitNames];
  }
  return mem;
}
function isRegionalIndicator(ch) {
  const cp = ch.codePointAt(0);
  return cp >= 127462 && cp <= 127487;
}
function clashPrefixedName(prefix, name) {
  name = name || "";
  const cps = [...name];
  if (cps.length >= 2 && isRegionalIndicator(cps[0]) && isRegionalIndicator(cps[1])) {
    return cps[0] + cps[1] + " " + prefix + cps.slice(2).join("");
  }
  return prefix + name;
}
function sbLeafFix(o) {
  const st = String(o.domain_strategy || "");
  const cur = o.domain_resolver;
  if (isObj(cur)) {
    cur.server = "dns-cn";
    if (st && !cur.strategy) cur.strategy = st;
  } else if (cur || st) {
    o.domain_resolver = st ? { server: "dns-cn", strategy: st } : "dns-cn";
  }
  delete o.domain_strategy;
  if (o.type !== "wireguard") {
    o.tcp_keep_alive = "60s";
    if (!o.tcp_keep_alive_interval) o.tcp_keep_alive_interval = "60s";
  }
  if (o.name && o.name !== o.tag) delete o.name;
  return o;
}
function ownClashChain(eprox, xprox, origin) {
  const sk = materialize(skeleton_clash_default, origin);
  const entries = [], exits = [];
  for (const p of eprox) {
    const q = { ...p };
    q.name = clashPrefixedName("\u5165\u53E3-", q.name);
    entries.push(q);
  }
  for (const p of xprox) {
    const q = { ...p };
    q.name = clashPrefixedName("\u51FA\u53E3-", q.name);
    q["dialer-proxy"] = ENTRY_AUTO;
    exits.push(q);
  }
  const en = entries.map((p) => p.name);
  const xn = exits.map((p) => p.name);
  const specials = (sk.proxies || []).filter((x) => x !== "@NODES@");
  sk.proxies = [...entries, ...exits, ...specials];
  for (const g of sk["proxy-groups"] || []) {
    g.proxies = fillMembers(g.proxies, en, xn);
  }
  return [
    dump(sk, { noRefs: true, lineWidth: 80 }),
    "text/yaml; charset=utf-8"
  ];
}
function ownSingboxChain(enodes, xnodes, origin) {
  const sk = materialize(skeleton_singbox_default, origin);
  const entries = [], exits = [];
  for (const o0 of enodes) {
    const o = sbLeafFix({ ...o0 });
    delete o.detour;
    o.tag = "\u5165\u53E3-" + o.tag;
    entries.push(o);
  }
  for (const o0 of xnodes) {
    const o = sbLeafFix({ ...o0 });
    o.tag = "\u51FA\u53E3-" + o.tag;
    o.detour = ENTRY_AUTO;
    exits.push(o);
  }
  const en = entries.map((o) => o.tag);
  const xn = exits.map((o) => o.tag);
  const out = [];
  for (const o of sk.outbounds || []) {
    if (o.type === "@nodes@") {
      out.push(...entries, ...exits);
      continue;
    }
    if ("outbounds" in o) o.outbounds = fillMembers(o.outbounds, en, xn);
    out.push(o);
  }
  sk.outbounds = out;
  return [JSON.stringify(sk, null, 2), "application/json; charset=utf-8"];
}
function echQueryNames(cfg) {
  const names = [];
  for (const key of ["outbounds", "endpoints"]) {
    for (const o of cfg[key] || []) {
      if (!isObj(o)) continue;
      const tls = o.tls || {};
      const ech = tls.ech || {};
      if (!isObj(ech) || !Object.keys(ech).length) continue;
      if (ech.enabled === false) continue;
      let q = String(ech.query_server_name || ech["query-server-name"] || "").trim();
      if (!q && !ech.config) q = String(tls.server_name || "").trim();
      if (q && !names.includes(q)) names.push(q);
    }
  }
  return names;
}
async function fetchEchConfig(name) {
  if (ECH_CFG_CACHE.has(name)) return ECH_CFG_CACHE.get(name);
  let result = null;
  try {
    const url = "https://dns.alidns.com/resolve?name=" + encodeURIComponent(name) + "&type=HTTPS";
    const resp = await fetch(url, {
      headers: { Accept: "application/dns-json", "User-Agent": BROWSER_UA },
      signal: AbortSignal.timeout(6e3)
    });
    const data = await resp.json();
    for (const ans of data.Answer || []) {
      const text = String(ans.data || "");
      if (text.includes('ech="')) {
        result = text.split('ech="', 2)[1].split('"', 1)[0] || null;
        if (result) break;
        result = null;
      }
    }
  } catch {
    result = null;
  }
  ECH_CFG_CACHE.set(name, result);
  return result;
}
async function ensureEchRoute(cfg) {
  const names = echQueryNames(cfg);
  if (!names.length) return cfg;
  for (const key of ["outbounds", "endpoints"]) {
    for (const o of cfg[key] || []) {
      if (!isObj(o)) continue;
      const ech = (o.tls || {}).ech || {};
      if (!isObj(ech) || !Object.keys(ech).length) continue;
      if (ech.enabled === false || ech.config) continue;
      const q = String(ech.query_server_name || ech["query-server-name"] || "").trim();
      if (!q) continue;
      const fetched = await fetchEchConfig(q);
      if (fetched) {
        const chunks = [];
        for (let i = 0; i < fetched.length; i += 64) {
          chunks.push(fetched.slice(i, i + 64));
        }
        ech.config = ["-----BEGIN ECH CONFIGS-----\n" + chunks.join("\n") + "\n-----END ECH CONFIGS-----"];
      }
    }
  }
  const outs = cfg.outbounds || (cfg.outbounds = []);
  let bypass = null;
  for (const o of outs) {
    if (isObj(o) && o.type === "direct" && o.tag) {
      if (String(o.tag).toLowerCase() === "direct") {
        bypass = o;
        break;
      }
      if (bypass === null) bypass = o;
    }
  }
  if (bypass === null) {
    bypass = { type: "direct", tag: "direct", connect_timeout: "8s" };
    outs.push(bypass);
  } else if (![
    "connect_timeout",
    "domain_resolver",
    "override_address",
    "override_port",
    "proxy_protocol"
  ].some((k) => k in bypass)) {
    bypass.connect_timeout = "8s";
  }
  const dns = cfg.dns || (cfg.dns = {});
  const servers = dns.servers || (dns.servers = []);
  let tag = null;
  for (const s of servers) {
    if (isObj(s) && String(s.tag || "").startsWith("ech-")) {
      tag = s.tag;
      s.detour = bypass.tag;
      break;
    }
  }
  if (tag === null) {
    tag = "ech-dns";
    if (!servers.some((s) => isObj(s) && s.tag === tag)) {
      servers.push({
        type: "https",
        tag: "ech-dns",
        server: "223.5.5.5",
        server_port: 443,
        path: "/dns-query",
        tls: { enabled: true, server_name: "dns.alidns.com" },
        detour: bypass.tag
      });
    }
  }
  const rules = dns.rules || (dns.rules = []);
  const covered = /* @__PURE__ */ new Set();
  for (const r of rules) {
    if (isObj(r) && r.server === tag) {
      if (typeof r.domain === "string") covered.add(r.domain.toLowerCase());
      else if (Array.isArray(r.domain)) {
        for (const x of r.domain) covered.add(String(x).toLowerCase());
      }
    }
  }
  const missing = names.filter((n) => !covered.has(n.toLowerCase()));
  if (missing.length) {
    rules.unshift({ domain: missing, action: "route", server: tag });
  }
  return cfg;
}
async function echFixBody(body) {
  let cfg;
  try {
    cfg = JSON.parse(body);
  } catch {
    return body;
  }
  if (echQueryNames(cfg).length) {
    await ensureEchRoute(cfg);
    return JSON.stringify(cfg, null, 2);
  }
  return body;
}
function chainGlyphName(name) {
  const base = name.startsWith("\u267B") ? name.slice(2).trimStart() : name;
  return "\u26D3 " + base;
}
function markChainGroupsClash(cfg) {
  const exits = new Set((cfg.proxies || []).filter((p) => isObj(p) && p["dialer-proxy"]).map((p) => p.name));
  const groups = cfg["proxy-groups"] || [];
  if (!exits.size || !groups.length) return cfg;
  const existing = new Set(groups.map((g) => g && g.name));
  const ren = /* @__PURE__ */ new Map();
  for (const g of groups) {
    if (!isObj(g)) continue;
    const name = g.name || "";
    const mem = (g.proxies || []).filter((m) => typeof m === "string");
    if (!mem.length || name.startsWith("\u26D3") || !mem.every((m) => exits.has(m))) continue;
    const nw = chainGlyphName(name);
    if (!existing.has(nw)) {
      ren.set(name, nw);
      g.name = nw;
      existing.add(nw);
    }
  }
  const chainParams = {
    url: "https://www.gstatic.com/generate_204",
    interval: 30,
    tolerance: 100,
    lazy: false,
    timeout: 5e3,
    "max-failed-times": 3
  };
  const entriesC = new Set((cfg.proxies || []).filter((p) => isObj(p) && !p["dialer-proxy"]).map((p) => p.name));
  for (const g of groups) {
    if (!isObj(g)) continue;
    const mem = (g.proxies || []).filter((m) => typeof m === "string");
    if (["url-test", "fallback", "load-balance"].includes(g.type) && mem.length && (mem.every((m) => exits.has(m)) || mem.every((m) => entriesC.has(m)))) {
      Object.assign(g, chainParams);
    }
    if (g.name === "\u9ED8\u8BA4\u4EE3\u7406" && Array.isArray(g.proxies) && g.proxies.includes(EXIT_AUTO)) {
      g.proxies = [
        EXIT_AUTO,
        ...g.proxies.filter((m) => m !== EXIT_AUTO)
      ];
    }
  }
  if (!ren.size) return cfg;
  for (const g of groups) {
    if (isObj(g) && Array.isArray(g.proxies)) {
      g.proxies = g.proxies.map((m) => ren.get(m) ?? m);
    }
  }
  if (Array.isArray(cfg.rules)) {
    cfg.rules = cfg.rules.map((r) => {
      if (typeof r !== "string" || !r.includes(",")) return r;
      const parts = r.split(",");
      const idx = parts[parts.length - 1].trim() === "no-resolve" ? parts.length - 2 : parts.length - 1;
      const tgt = parts[idx].trim();
      if (ren.has(tgt)) {
        parts[idx] = ren.get(tgt);
        return parts.join(",");
      }
      return r;
    });
  }
  return cfg;
}
function finishChainClash(body) {
  try {
    const cfg = load(body);
    if (isObj(cfg)) {
      markChainGroupsClash(cfg);
      return dump(cfg, { noRefs: true, lineWidth: 80 });
    }
  } catch {
  }
  return body;
}
function markChainGroupsSingbox(cfg) {
  const exits = new Set((cfg.outbounds || []).filter((o) => isObj(o) && o.detour).map((o) => o.tag));
  const obs = cfg.outbounds || [];
  if (!exits.size || !obs.length) return cfg;
  const existing = new Set(obs.map((o) => o && o.tag));
  const ren = /* @__PURE__ */ new Map();
  for (const o of obs) {
    if (!isObj(o)) continue;
    const tag = o.tag || "";
    const mem = (o.outbounds || []).filter((m) => typeof m === "string");
    if (!mem.length || tag.startsWith("\u26D3") || !mem.every((m) => exits.has(m))) continue;
    const nw = chainGlyphName(tag);
    if (!existing.has(nw)) {
      ren.set(tag, nw);
      o.tag = nw;
      existing.add(nw);
    }
  }
  const entriesS = new Set(obs.filter((o) => isObj(o) && !o.detour && !("outbounds" in o)).map((o) => o.tag));
  for (const o of obs) {
    if (!isObj(o)) continue;
    const mem = (o.outbounds || []).filter((m) => typeof m === "string");
    if (o.type === "urltest" && mem.length && (mem.every((m) => exits.has(m)) || mem.every((m) => entriesS.has(m)))) {
      o.interval = "30s";
      o.tolerance = 100;
    }
    if (o.tag === "\u9ED8\u8BA4\u4EE3\u7406" && Array.isArray(o.outbounds) && o.outbounds.includes(EXIT_AUTO)) {
      o.outbounds = [
        EXIT_AUTO,
        ...o.outbounds.filter((m) => m !== EXIT_AUTO)
      ];
    }
  }
  if (!ren.size) return cfg;
  for (const o of obs) {
    if (!isObj(o)) continue;
    if (Array.isArray(o.outbounds)) {
      o.outbounds = o.outbounds.map((m) => ren.get(m) ?? m);
    }
    if (ren.has(o.detour)) o.detour = ren.get(o.detour);
  }
  const route = cfg.route || {};
  if (ren.has(route.final)) route.final = ren.get(route.final);
  for (const r of route.rules || []) {
    if (isObj(r) && ren.has(r.outbound)) r.outbound = ren.get(r.outbound);
  }
  return cfg;
}
function finishChainSingbox(body) {
  try {
    const cfg = JSON.parse(body);
    if (isObj(cfg)) {
      markChainGroupsSingbox(cfg);
      return JSON.stringify(cfg, null, 2);
    }
  } catch {
  }
  return body;
}
function chainPool(nodes) {
  return nodes.filter((n) => {
    const t = String(n.type ?? "").toLowerCase();
    return t !== "direct" && t !== "reject";
  });
}
async function mergeSingbox(entryItems, exitItems, origin) {
  STAGE.cur = "entry-convert";
  const enodesRaw = chainPool(await gather(entryItems));
  if (!enodesRaw.length) throw new Error("\u6CA1\u6709\u53EF\u7528\u8282\u70B9");
  const enodes = enodesRaw.map(sbEmit);
  STAGE.cur = "exit-convert";
  const xnodesRaw = chainPool(await gather(exitItems));
  if (!xnodesRaw.length) throw new Error("\u6CA1\u6709\u53EF\u7528\u8282\u70B9");
  const xnodes = xnodesRaw.map(sbEmit);
  STAGE.cur = "merge";
  if (!enodes.length || !xnodes.length) {
    throw new Error("\u5165\u53E3\u6216\u51FA\u53E3\u6CA1\u6709\u53EF\u7528\u8282\u70B9");
  }
  const built = ownSingboxChain(enodes, xnodes, origin);
  return [await echFixBody(finishChainSingbox(built[0])), built[1]];
}
async function mergeClash(entryItems, exitItems, origin) {
  STAGE.cur = "entry-convert";
  const eproxRaw = chainPool(await gather(entryItems));
  if (!eproxRaw.length) throw new Error("\u6CA1\u6709\u53EF\u7528\u8282\u70B9");
  const eprox = eproxRaw.map(clashEmit);
  STAGE.cur = "exit-convert";
  const xproxRaw = chainPool(await gather(exitItems));
  if (!xproxRaw.length) throw new Error("\u6CA1\u6709\u53EF\u7528\u8282\u70B9");
  const xprox = xproxRaw.map(clashEmit);
  STAGE.cur = "merge";
  if (!eprox.length || !xprox.length) {
    throw new Error("\u5165\u53E3\u6216\u51FA\u53E3\u6CA1\u6709\u53EF\u7528\u8282\u70B9");
  }
  const built = ownClashChain(eprox, xprox, origin);
  return [finishChainClash(built[0]), built[1]];
}
async function buildConfig(target, items, origin) {
  const nodes = await gather(items);
  if (!nodes.length) throw new Error("\u6CA1\u6709\u53EF\u7528\u8282\u70B9");
  if (TEXT_TARGETS.has(target)) return buildTextPlain(target, nodes);
  const plain = preparePlainNodes(nodes);
  if (!plain.nodes.length) throw new Error("\u6CA1\u6709\u53EF\u7528\u8282\u70B9");
  if (target === "singbox") {
    const emitted = plain.nodes.map((n) => {
      const o = sbLeafFix(sbEmit(n));
      delete o.detour;
      return o;
    });
    const tags = emitted.map((o) => o.tag);
    const sk2 = materialize(skeleton_singbox_default, origin);
    const out = [];
    for (const o of sk2.outbounds || []) {
      if (o.type === "@nodes@") {
        out.push(...emitted);
        continue;
      }
      if ("outbounds" in o) o.outbounds = fillMembers(o.outbounds, [], tags);
      out.push(o);
    }
    const sbOut = out.filter(
      (o) => o.tag !== ENTRY_AUTO && o.tag !== EXIT_AUTO
    );
    for (const g of sbOut) {
      if (Array.isArray(g.outbounds)) {
        g.outbounds = g.outbounds.filter(
          (m) => m !== ENTRY_AUTO && m !== EXIT_AUTO
        );
      }
      if ((g.default === ENTRY_AUTO || g.default === EXIT_AUTO) && Array.isArray(g.outbounds) && g.outbounds.length) {
        g.default = g.outbounds[0];
      }
    }
    const sbPlan = regionPlan(tags);
    const sbPairs = [];
    const addSbPair = (rname, members) => {
      const autoTag = `${rname}-\u81EA\u52A8\u9009\u62E9`;
      sbPairs.push({
        type: "urltest",
        tag: autoTag,
        outbounds: members,
        url: "https://www.gstatic.com/generate_204",
        interval: "1m",
        tolerance: 100,
        interrupt_exist_connections: false
      });
      sbPairs.push({
        type: "selector",
        tag: rname,
        outbounds: [autoTag, ...members],
        interrupt_exist_connections: false
      });
    };
    for (const p of sbPlan.pairs) addSbPair(p.name, p.members);
    if (sbPairs.length) {
      const sbAt = sbOut.findIndex((o) => Array.isArray(o.outbounds));
      sbOut.splice(sbAt < 0 ? sbOut.length : sbAt, 0, ...sbPairs);
      const SB_NO_APPEND = /* @__PURE__ */ new Set([
        "GLOBAL",
        "\u9ED8\u8BA4\u4EE3\u7406",
        "\u624B\u52A8\u9009\u62E9",
        "\u81EA\u52A8\u9009\u62E9",
        "AdBlock",
        "\u8FDC\u63A7\u5DE5\u5177",
        "\u76F4\u8FDE"
      ]);
      for (const g of sbOut) {
        if (!Array.isArray(g.outbounds)) continue;
        if (g.tag === "\u9ED8\u8BA4\u4EE3\u7406") {
          g.outbounds = [...sbPlan.selectNames, ...g.outbounds];
        } else if (g.tag === "GLOBAL") {
          g.outbounds = [
            ...g.outbounds,
            ...sbPlan.pairNames.filter((t) => !g.outbounds.includes(t))
          ];
        } else if (!SB_NO_APPEND.has(g.tag) && !sbPlan.pairNames.includes(g.tag) && g.type === "selector") {
          g.outbounds = [
            ...g.outbounds,
            ...sbPlan.selectNames.filter((t) => !g.outbounds.includes(t))
          ];
        }
        if (g.default && !g.outbounds.includes(g.default)) {
          g.default = g.outbounds[0];
        }
      }
    }
    sk2.outbounds = sbOut;
    return [JSON.stringify(sk2, null, 2), "application/json; charset=utf-8"];
  }
  const proxies = plain.nodes.map((n) => {
    const p = clashEmit(n);
    if (p["dialer-proxy"] && plain.renameMap.has(p["dialer-proxy"])) {
      p["dialer-proxy"] = plain.renameMap.get(p["dialer-proxy"]);
    }
    return p;
  });
  const names = proxies.map((p) => String(p.name));
  const sk = materialize(skeleton_clash_default, origin);
  const specials = (sk.proxies || []).filter((x) => x !== "@NODES@");
  sk.proxies = [...proxies, ...specials];
  const groups = [];
  for (const g of sk["proxy-groups"] || []) {
    if (g.name === ENTRY_AUTO || g.name === EXIT_AUTO) continue;
    g.proxies = fillMembers(g.proxies, [], names);
    if (Array.isArray(g.proxies)) {
      g.proxies = g.proxies.filter(
        (m) => m !== ENTRY_AUTO && m !== EXIT_AUTO
      );
    }
    groups.push(g);
  }
  const plan = regionPlan(names);
  const regionGroups = [];
  for (const p of plan.pairs) {
    const autoName = `${p.name}-\u81EA\u52A8\u9009\u62E9`;
    regionGroups.push({
      name: autoName,
      type: "url-test",
      interval: 600,
      timeout: 3e3,
      url: "https://www.apple.com/library/test/success.html",
      lazy: true,
      "max-failed-times": 3,
      "empty-fallback": "REJECT",
      tolerance: 50,
      "exclude-type": "DIRECT",
      icon: AUTO_ICON,
      hidden: true,
      proxies: p.members
    });
    const sel = {
      name: p.name,
      type: "select",
      interval: 600,
      timeout: 3e3,
      url: "https://www.apple.com/library/test/success.html",
      lazy: true,
      "max-failed-times": 3,
      "empty-fallback": "REJECT",
      proxies: [autoName, ...p.members]
    };
    if (p.icon) sel.icon = p.icon;
    regionGroups.push(sel);
  }
  if (regionGroups.length) {
    groups.unshift(...regionGroups);
    const NO_APPEND = /* @__PURE__ */ new Set([
      "GLOBAL",
      "\u9ED8\u8BA4\u4EE3\u7406",
      "\u624B\u52A8\u9009\u62E9",
      "\u81EA\u52A8\u9009\u62E9",
      "\u8D1F\u8F7D\u5747\u8861",
      "\u6545\u969C\u8F6C\u79FB",
      "\u76F4\u8FDE",
      "AdBlock",
      "\u8FDC\u63A7\u5DE5\u5177"
    ]);
    for (const g of groups) {
      if (!Array.isArray(g.proxies)) continue;
      if (g.name === "\u9ED8\u8BA4\u4EE3\u7406") {
        g.proxies = [...plan.selectNames, ...g.proxies];
      } else if (g.name === "GLOBAL") {
        g.proxies = [
          ...g.proxies,
          ...plan.pairNames.filter((n) => !g.proxies.includes(n))
        ];
      } else if (!NO_APPEND.has(g.name) && !plan.pairNames.includes(g.name)) {
        g.proxies = [
          ...g.proxies,
          ...plan.selectNames.filter((n) => !g.proxies.includes(n))
        ];
      }
    }
  }
  sk["proxy-groups"] = groups;
  return [
    dump(sk, { noRefs: true, lineWidth: 80 }),
    "text/yaml; charset=utf-8"
  ];
}
async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", _enc.encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function linkIdentity(record) {
  return JSON.stringify([
    record.kind ?? null,
    record.entry ?? null,
    record.exit ?? null,
    record.url ?? null
  ]);
}
function samePayload(a, b) {
  return isObj(a) && isObj(b) && (a.kind ?? null) === (b.kind ?? null) && (a.entry ?? null) === (b.entry ?? null) && (a.exit ?? null) === (b.exit ?? null) && (a.url ?? null) === (b.url ?? null);
}
function validCode(code) {
  const cps = [...String(code)];
  return cps.length >= 3 && cps.length <= 32 && cps.every((ch) => CODE_CHARS.includes(ch));
}
function genCode() {
  const L = LINK_ALPHABET.length;
  const limit = 256 - 256 % L;
  const buf = new Uint8Array(1);
  let code = "";
  while (code.length < 10) {
    crypto.getRandomValues(buf);
    if (buf[0] < limit) code += LINK_ALPHABET[buf[0] % L];
  }
  return code;
}
var SQL_LINKS_SCHEMA = [
  "CREATE TABLE IF NOT EXISTS links (code TEXT PRIMARY KEY, kind TEXT NOT NULL, target TEXT, url TEXT, entry TEXT, exit TEXT, hash TEXT NOT NULL, created_at TEXT NOT NULL, hits INTEGER NOT NULL DEFAULT 0)",
  "CREATE INDEX IF NOT EXISTS idx_links_hash ON links(hash)",
  "CREATE TABLE IF NOT EXISTS refresh_log (id INTEGER PRIMARY KEY AUTOINCREMENT, time TEXT NOT NULL, ok INTEGER NOT NULL, failed TEXT NOT NULL)"
];
var SQL_LINK_BY_CODE = "SELECT code, kind, target, url, entry, exit, hits, created_at FROM links WHERE code = ?";
var SQL_CODE_BY_HASH = "SELECT code FROM links WHERE hash = ?";
var SQL_LINK_INSERT = "INSERT INTO links (code, kind, target, url, entry, exit, hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
var SQL_LINK_HIT = "UPDATE links SET hits = hits + 1 WHERE code = ?";
var SQL_LINK_UPDATE = "UPDATE links SET kind = ?, target = ?, url = ?, entry = ?, exit = ?, hash = ? WHERE code = ?";
var SQL_REFRESH_LOG = "INSERT INTO refresh_log (time, ok, failed) VALUES (?, ?, ?)";
var _dbReady = null;
async function ensureDb(env) {
  if (!env.DB) return false;
  if (!_dbReady) {
    _dbReady = (async () => {
      for (const sql of SQL_LINKS_SCHEMA) {
        await env.DB.prepare(sql).run();
      }
      return true;
    })().catch((e) => {
      _dbReady = null;
      throw e;
    });
  }
  return _dbReady;
}
function rowToRecord(row) {
  if (!row) return null;
  const rec = { kind: row.kind, target: row.target };
  if (row.url != null) rec.url = row.url;
  if (row.entry != null) rec.entry = row.entry;
  if (row.exit != null) rec.exit = row.exit;
  rec.hits = row.hits ?? 0;
  if (row.created_at != null) rec.created = row.created_at;
  return rec;
}
async function dbGetLink(env, code) {
  await ensureDb(env);
  const row = await env.DB.prepare(SQL_LINK_BY_CODE).bind(code).first();
  return rowToRecord(row);
}
async function dbStoreLink(env, record, wantCode, hash, force) {
  await ensureDb(env);
  const db = env.DB;
  if (wantCode) {
    const existing = await dbGetLink(env, wantCode);
    if (existing) {
      if (samePayload(existing, record)) return wantCode;
      if (!force) return null;
      await db.prepare(SQL_LINK_UPDATE).bind(
        record.kind,
        record.target ?? null,
        record.url ?? null,
        record.entry ?? null,
        record.exit ?? null,
        hash,
        wantCode
      ).run();
      return wantCode;
    }
    await db.prepare(SQL_LINK_INSERT).bind(
      wantCode,
      record.kind,
      record.target ?? null,
      record.url ?? null,
      record.entry ?? null,
      record.exit ?? null,
      hash,
      (/* @__PURE__ */ new Date()).toISOString()
    ).run();
    return wantCode;
  }
  const byHash = await db.prepare(SQL_CODE_BY_HASH).bind(hash).first();
  if (byHash && byHash.code) {
    const rec = await dbGetLink(env, byHash.code);
    if (rec && samePayload(rec, record)) return byHash.code;
  }
  let code = genCode();
  while (await dbGetLink(env, code)) code = genCode();
  await db.prepare(SQL_LINK_INSERT).bind(
    code,
    record.kind,
    record.target ?? null,
    record.url ?? null,
    record.entry ?? null,
    record.exit ?? null,
    hash,
    (/* @__PURE__ */ new Date()).toISOString()
  ).run();
  return code;
}
async function storeLink(env, record, wantCode, force) {
  const hash = await sha256Hex(linkIdentity(record));
  if (env.DB) {
    try {
      return await dbStoreLink(env, record, wantCode, hash, force);
    } catch {
    }
  }
  if (wantCode) {
    const existing = await env.KV.get("link:" + wantCode, "json");
    if (existing) {
      if (samePayload(existing, record)) return wantCode;
      if (!force) return null;
    }
    await env.KV.put("link:" + wantCode, JSON.stringify(record));
    await env.KV.put("idx:" + hash, wantCode);
    return wantCode;
  }
  const idxKey = "idx:" + hash;
  const existingCode = await env.KV.get(idxKey);
  if (existingCode) {
    const rec = await env.KV.get("link:" + existingCode, "json");
    if (rec && samePayload(rec, record)) return existingCode;
  }
  let code = genCode();
  while (await env.KV.get("link:" + code)) code = genCode();
  await env.KV.put("link:" + code, JSON.stringify(record));
  await env.KV.put(idxKey, code);
  return code;
}
async function getLink(env, code) {
  if (env.DB) {
    try {
      const rec = await dbGetLink(env, code);
      if (rec) return rec;
    } catch {
    }
  }
  return env.KV.get("link:" + code, "json");
}
async function bumpLinkHit(env, code) {
  if (!env.DB) return;
  try {
    await ensureDb(env);
    await env.DB.prepare(SQL_LINK_HIT).bind(code).run();
  } catch {
  }
}
function validRule(dst, bytes) {
  if (bytes.length < 64) return false;
  if (dst.endsWith(".svg")) {
    const head = _dec.decode(bytes.slice(0, 2048));
    return head.includes("<svg") || head.trimStart().startsWith("<?xml");
  }
  let i = 0;
  while (i < bytes.length && [32, 9, 10, 13, 11, 12].includes(bytes[i])) i++;
  return !(i < bytes.length && bytes[i] === 60);
}
async function putRule(env, dst, bytes) {
  if (env.RULES) {
    await env.RULES.put(dst, bytes);
    return;
  }
  await env.KV.put("rule:" + dst, bytes);
}
async function getRule(env, dst) {
  if (env.RULES) {
    try {
      const obj = await env.RULES.get(dst);
      if (obj) return obj.arrayBuffer();
    } catch {
    }
  }
  return env.KV.get("rule:" + dst, "arrayBuffer");
}
async function refreshRules(env) {
  const results = /* @__PURE__ */ new Map();
  const chunk = 8;
  for (let i = 0; i < MANIFEST.length; i += chunk) {
    const part = MANIFEST.slice(i, i + chunk);
    await Promise.all(part.map(async (entry) => {
      const { dst, src } = entry;
      try {
        const resp = await fetch(src, {
          headers: { "User-Agent": REFRESH_UA },
          signal: AbortSignal.timeout(12e4)
        });
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        const buf = new Uint8Array(await resp.arrayBuffer());
        if (!validRule(dst, buf)) throw new Error("validation failed");
        await putRule(env, dst, buf);
        results.set(dst, true);
      } catch {
        results.set(dst, false);
      }
    }));
  }
  let ok = 0;
  const failed = [];
  for (const e of MANIFEST) {
    if (results.get(e.dst)) ok++;
    else failed.push(e.dst);
  }
  const status = { time: (/* @__PURE__ */ new Date()).toISOString(), ok, failed };
  await env.KV.put("meta:rules_status", JSON.stringify(status));
  if (env.DB) {
    try {
      await ensureDb(env);
      await env.DB.prepare(SQL_REFRESH_LOG).bind(status.time, ok, JSON.stringify(failed)).run();
    } catch {
    }
  }
  return status;
}
function send(body, { status = 200, ctype = "text/plain; charset=utf-8" } = {}) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": ctype,
      // Browser-based converter frontends call this backend cross-origin.
      "Access-Control-Allow-Origin": "*"
    }
  });
}
async function proxyToConverter(env, pathAndQuery, ua) {
  const base = (env.EXTERNAL_SUBCONVERTER_URL || "").replace(/\/+$/, "");
  if (!base) {
    return send(
      "Unknown target format. clash, singbox, v2ray, surge, loon and quanx are rendered natively by this converter; any other target needs the EXTERNAL_SUBCONVERTER_URL variable set to an external subconverter base URL.",
      { status: 501 }
    );
  }
  try {
    const resp = await fetch(base + pathAndQuery, {
      headers: { "User-Agent": ua }
    });
    const body = await resp.arrayBuffer();
    return send(body, {
      status: resp.status,
      ctype: resp.headers.get("Content-Type") || "text/plain"
    });
  } catch (e) {
    return send(`backend proxy failed: ${errMsg(e)}`, { status: 502 });
  }
}
async function handleShorten(request, env) {
  let data = {};
  const text = await request.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      return send("bad request", { status: 400 });
    }
    if (!isObj(data)) return send("bad request", { status: 400 });
  }
  const S = (v) => v ? String(v) : "";
  const target = S(data.target);
  const entry = S(data.entry);
  const exit_ = S(data.exit);
  const items = S(data.url);
  const want = S(data.code).trim();
  if (want && !validCode(want)) {
    return send(
      "\u81EA\u5B9A\u4E49\u540E\u7F00\u53EA\u80FD\u7528\u5B57\u6BCD\u3001\u6570\u5B57\u3001-\u3001_\uFF0C\u957F\u5EA6 3 \u5230 32",
      { status: 400 }
    );
  }
  let record;
  if (entry || exit_) {
    if (!ALL_TARGETS.has(target) || !entry || !exit_) {
      return send("bad request", { status: 400 });
    }
    record = { kind: "chain", target, entry, exit: exit_ };
  } else if (items && target) {
    record = { kind: "conv", target, url: items };
  } else {
    return send("bad request", { status: 400 });
  }
  const code = await storeLink(
    env,
    record,
    want || null,
    data.force === true
  );
  if (code === null) {
    return send("\u8FD9\u4E2A\u540E\u7F00\u5DF2\u88AB\u5360\u7528\uFF0C\u6362\u4E00\u4E2A\u8BD5\u8BD5", { status: 409 });
  }
  const host = request.headers.get("Host") || new URL(request.url).host;
  const p = { clash: "m", singbox: "s" }[target];
  if (p) return send(`https://${host}/${p}/${code}`);
  return send(`https://${host}/c/${code}`);
}
async function handleFetch(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  const origin = url.origin;
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Content-Length": "0"
      }
    });
  }
  if (request.method === "POST") {
    if (path === "/shorten") return handleShorten(request, env);
    if (path === "/admin/refresh") {
      const token = env.REFRESH_TOKEN;
      const authed = !!token && request.headers.get("Authorization") === `Bearer ${token}`;
      if (!authed && await env.KV.get("meta:rules_status")) {
        return send("unauthorized", { status: 401 });
      }
      const status = await refreshRules(env);
      return send(
        JSON.stringify(status),
        { ctype: "application/json; charset=utf-8" }
      );
    }
    return send("not found", { status: 404 });
  }
  if (request.method !== "GET") return send("not found", { status: 404 });
  if (path === "/" || path === "/index.html") {
    return send(PAGE, { ctype: "text/html; charset=utf-8" });
  }
  if (path.startsWith("/rules/")) {
    let rel = path.slice("/rules/".length);
    try {
      rel = decodeURIComponent(rel);
    } catch {
    }
    if (!DST_SET.has(rel)) return send("not found", { status: 404 });
    const data = await getRule(env, rel);
    if (!data) return send("not found", { status: 404 });
    const ctype = rel.endsWith(".svg") ? "image/svg+xml" : "application/octet-stream";
    return send(data, { ctype });
  }
  if (path.startsWith("/api/link/")) {
    const raw = path.slice("/api/link/".length);
    let code = raw;
    try {
      code = decodeURIComponent(raw);
    } catch {
    }
    code = code.replace(/^\/+|\/+$/g, "");
    const rec = code ? await getLink(env, code) : null;
    if (!rec) return send("link not found", { status: 404 });
    return send(
      JSON.stringify(rec),
      { ctype: "application/json; charset=utf-8" }
    );
  }
  const fmt = { c: null, m: "clash", s: "singbox" };
  const sm = path.match(/^\/([cms])\/(.+)$/);
  if (sm && path.length > 3) {
    const code = sm[2].replace(/^\/+|\/+$/g, "");
    const rec = code ? await getLink(env, code) : null;
    if (!rec) return send("link not found", { status: 404 });
    if (ctx && ctx.waitUntil) ctx.waitUntil(bumpLinkHit(env, code));
    const want = fmt[sm[1]] || rec.target || "";
    if (rec.kind === "chain") {
      STAGE.cur = "start";
      try {
        const [body, ctype] = await buildChainFor(
          want,
          rec.entry,
          rec.exit,
          origin
        );
        return send(body, { ctype });
      } catch (e) {
        return send(
          `chain generate failed at ${STAGE.cur}: ${errMsg(e)}`,
          { status: 502 }
        );
      }
    }
    const target = want;
    const items = rec.url || "";
    if (ALL_TARGETS.has(target) && items) {
      try {
        const [body, ctype] = await buildConfig(target, items, origin);
        return send(body, { ctype });
      } catch (e) {
        return send(`convert failed: ${errMsg(e)}`, { status: 502 });
      }
    }
    const q = new URLSearchParams({ target, url: items }).toString();
    return proxyToConverter(env, "/sub?" + q, BROWSER_UA);
  }
  if (path === "/version") {
    return send("subscription-converter cf-worker");
  }
  if (path === "/sub") {
    const target = url.searchParams.get("target") || "";
    const items = url.searchParams.get("url") || "";
    if (ALL_TARGETS.has(target) && items) {
      try {
        const [body, ctype] = await buildConfig(target, items, origin);
        return send(body, { ctype });
      } catch (e) {
        return send(`convert failed: ${errMsg(e)}`, { status: 502 });
      }
    }
    return proxyToConverter(
      env,
      path + url.search,
      request.headers.get("User-Agent") || BROWSER_UA
    );
  }
  if (path === "/conv") {
    const target = url.searchParams.get("target") || "";
    const items = url.searchParams.get("url") || "";
    if (!ALL_TARGETS.has(target) || !items) {
      return send("bad request", { status: 400 });
    }
    try {
      const [body, ctype] = await buildConfig(target, items, origin);
      return send(body, { ctype });
    } catch (e) {
      return send(`convert failed: ${errMsg(e)}`, { status: 502 });
    }
  }
  if (path === "/chain") {
    const target = url.searchParams.get("target") || "";
    const entry = url.searchParams.get("entry") || "";
    const exit_ = url.searchParams.get("exit") || "";
    if (!ALL_TARGETS.has(target) || !entry || !exit_) {
      return send(
        "bad request: need target=clash|singbox|v2ray|surge|loon|quanx, entry, exit",
        { status: 400 }
      );
    }
    STAGE.cur = "start";
    try {
      const [body, ctype] = await buildChainFor(
        target,
        entry,
        exit_,
        origin
      );
      return send(body, { ctype });
    } catch (e) {
      return send(
        `chain generate failed at ${STAGE.cur}: ${errMsg(e)}`,
        { status: 502 }
      );
    }
  }
  return send("not found", { status: 404 });
}
var worker_default = {
  fetch: (request, env, ctx) => handleFetch(request, env, ctx),
  async scheduled(event, env, ctx) {
    ctx.waitUntil(refreshRules(env));
  }
};
export {
  worker_default as default
};
/*! Bundled license information:

js-yaml/dist/js-yaml.mjs:
  (*! js-yaml 5.5.0 https://github.com/nodeca/js-yaml @license MIT *)
*/
