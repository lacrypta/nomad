# Appendix B - List of JavaScript Objects Available to Nomad Scripts

The following is a hierarchical list of global objects available to Nomad scripts in their `this` reference:

- `AggregateError`
  - `@@hasInstance`
  - `apply`
  - `bind`
  - `call`
  - `constructor`
  - `hasOwnProperty`
  - `isPrototypeOf`
  - `length`
  - `name`
  - `propertyIsEnumerable`
  - `prototype`
    - `constructor`
    - `hasOwnProperty`
    - `isPrototypeOf`
    - `name`
    - `propertyIsEnumerable`
    - `toLocaleString`: mapped to `this.AggregateError.prototype.toString`.
    - `toString`
    - `valueOf`
  - `toLocaleString`: mapped to `this.AggregateError.toString`.
  - `toString`
  - `valueOf`
- `Array`
  - `@@hasInstance`
  - `@@species`
  - `apply`
  - `bind`
  - `call`
  - `constructor`
  - `from`
  - `fromAsync`
  - `hasOwnProperty`
  - `isArray`
  - `isPrototypeOf`
  - `length`
  - `name`
  - `of`
  - `propertyIsEnumerable`
  - `prototype`
    - `@@iterator`
    - `@@unscopables`
    - `at`
    - `concat`
    - `constructor`
    - `copyWithin`
    - `entries`
    - `every`
    - `fill`
    - `filter`
    - `find`
    - `findIndex`
    - `findLast`
    - `findLastIndex`
    - `flat`
    - `flatMap`
    - `forEach`
    - `hasOwnProperty`
    - `includes`
    - `indexOf`
    - `isPrototypeOf`
    - `join`
    - `keys`
    - `lastIndexOf`
    - `length`
    - `map`
    - `pop`
    - `propertyIsEnumerable`
    - `push`
    - `reduce`
    - `reduceRight`
    - `reverse`
    - `shift`
    - `slice`
    - `some`
    - `sort`
    - `splice`
    - `toLocaleString`: mapped to `this.Array.prototype.toString`.
    - `toReversed`
    - `toSorted`
    - `toSpliced`
    - `toString`
    - `unshift`
    - `valueOf`
    - `values`
    - `with`
  - `toLocaleString`: mapped to `this.Array.toString`.
  - `toString`
  - `valueOf`
- `ArrayBuffer`
  - `@@hasInstance`
  - `@@species`
  - `apply`
  - `bind`
  - `call`
  - `constructor`
  - `hasOwnProperty`
  - `isPrototypeOf`
  - `isView`
  - `length`
  - `name`
  - `propertyIsEnumerable`
  - `prototype`
    - `@@toStringTag`
    - `byteLength`
    - `constructor`
    - `detached`
    - `hasOwnProperty`
    - `isPrototypeOf`
    - `maxByteLength`
    - `propertyIsEnumerable`
    - `resizable`
    - `resize`
    - `slice`
    - `toLocaleString`: mapped to `this.ArrayBuffer.prototype.toString`.
    - `toString`
    - `transfer`
    - `transferToFixedLength`
    - `valueOf`
  - `toLocaleString`: mapped to `this.ArrayBuffer.toString`.
  - `toString`
  - `valueOf`
- `AsyncFunction`
  - `constructor`
    - `@@hasInstance`
    - `apply`
    - `bind`
    - `call`
    - `constructor`
    - `hasOwnProperty`
    - `isPrototypeOf`
    - `length`
    - `name`
    - `propertyIsEnumerable`
    - `prototype`
      - `@@hasInstance`
      - `@@toStringTag`
      - `apply`
      - `bind`
      - `call`
      - `constructor`
      - `hasOwnProperty`
      - `isPrototypeOf`
      - `propertyIsEnumerable`
      - `prototype`
      - `toLocaleString`: mapped to `this.AsyncFunction.prototype.toString`.
      - `toString`
      - `valueOf`
    - `toLocaleString`: mapped to `this.AsyncFunction.toString`.
    - `toString`
    - `valueOf`
- `AsyncGeneratorFunction`
  - `constructor`
    - `@@hasInstance`
    - `apply`
    - `bind`
    - `call`
    - `constructor`
    - `hasOwnProperty`
    - `isPrototypeOf`
    - `length`
    - `name`
    - `propertyIsEnumerable`
    - `prototype`
      - `@@hasInstance`
      - `@@toStringTag`
      - `apply`
      - `bind`
      - `call`
      - `constructor`
      - `hasOwnProperty`
      - `isPrototypeOf`
      - `propertyIsEnumerable`
      - `prototype`
      - `toLocaleString`: mapped to `this.AsyncGeneratorFunction.prototype.toString`.
      - `toString`
      - `valueOf`
    - `toLocaleString`: mapped to `this.AsyncGeneratorFunction.toString`.
    - `toString`
    - `valueOf`
- `Atomics`
  - `@@toStringTag`
  - `add`
  - `and`
  - `compareExchange`
  - `exchange`
  - `isLockFree`
  - `load`
  - `notify`
  - `or`
  - `store`
  - `sub`
  - `wait`
  - `waitAsync`
  - `xor`
- `BigInt`
  - `@@hasInstance`
  - `apply`
  - `asIntN`
  - `asUintN`
  - `bind`
  - `call`
  - `constructor`
  - `hasOwnProperty`
  - `isPrototypeOf`
  - `length`
  - `name`
  - `propertyIsEnumerable`
  - `prototype`
    - `@@toStringTag`
    - `constructor`
    - `hasOwnProperty`
    - `isPrototypeOf`
    - `propertyIsEnumerable`
    - `toLocaleString`: mapped to `this.BigInt.prototype.toString`.
    - `toString`
    - `valueOf`
  - `toLocaleString`: mapped to `this.BigInt.toString`.
  - `toString`
  - `valueOf`
- `BigInt64Array`
  - `@@hasInstance`
  - `@@species`
  - `BYTES_PER_ELEMENT`
  - `apply`
  - `bind`
  - `call`
  - `constructor`
  - `from`
  - `hasOwnProperty`
  - `isPrototypeOf`
  - `length`
  - `name`
  - `of`
  - `propertyIsEnumerable`
  - `prototype`
    - `@@iterator`
    - `@@toStringTag`
    - `BYTES_PER_ELEMENT`
    - `at`
    - `buffer`
    - `byteLength`
    - `byteOffset`
    - `constructor`
    - `copyWithin`
    - `entries`
    - `every`
    - `fill`
    - `filter`
    - `find`
    - `findIndex`
    - `findLast`
    - `findLastIndex`
    - `forEach`
    - `hasOwnProperty`
    - `includes`
    - `indexOf`
    - `isPrototypeOf`
    - `join`
    - `keys`
    - `lastIndexOf`
    - `length`
    - `map`
    - `propertyIsEnumerable`
    - `reduce`
    - `reduceRight`
    - `reverse`
    - `set`
    - `slice`
    - `some`
    - `sort`
    - `subarray`
    - `toLocaleString`: mapped to `this.BigInt64Array.prototype.toString`.
    - `toReversed`
    - `toSorted`
    - `toString`
    - `valueOf`
    - `values`
    - `with`
  - `toLocaleString`: mapped to `this.BigInt64Array.toString`.
  - `toString`
  - `valueOf`
- `BigUint64Array`
  - `@@hasInstance`
  - `@@species`
  - `BYTES_PER_ELEMENT`
  - `apply`
  - `bind`
  - `call`
  - `constructor`
  - `from`
  - `hasOwnProperty`
  - `isPrototypeOf`
  - `length`
  - `name`
  - `of`
  - `propertyIsEnumerable`
  - `prototype`
    - `@@iterator`
    - `@@toStringTag`
    - `BYTES_PER_ELEMENT`
    - `at`
    - `buffer`
    - `byteLength`
    - `byteOffset`
    - `constructor`
    - `copyWithin`
    - `entries`
    - `every`
    - `fill`
    - `filter`
    - `find`
    - `findIndex`
    - `findLast`
    - `findLastIndex`
    - `forEach`
    - `hasOwnProperty`
    - `includes`
    - `indexOf`
    - `isPrototypeOf`
    - `join`
    - `keys`
    - `lastIndexOf`
    - `length`
    - `map`
    - `propertyIsEnumerable`
    - `reduce`
    - `reduceRight`
    - `reverse`
    - `set`
    - `slice`
    - `some`
    - `sort`
    - `subarray`
    - `toLocaleString`: mapped to `this.BigUInt64Array.prototype.toString`.
    - `toReversed`
    - `toSorted`
    - `toString`
    - `valueOf`
    - `values`
    - `with`
  - `toLocaleString`: mapped to `this.BigUInt64Array.toString`.
  - `toString`
  - `valueOf`
- `Boolean`
  - `prototype`
    - `constructor`
    - `hasOwnProperty`
    - `isPrototypeOf`
    - `propertyIsEnumerable`
    - `toLocaleString`: mapped to `this.Boolean.prototype.toString`.
    - `toString`
    - `valueOf`
- `DataView`
  - `@@hasInstance`
  - `apply`
  - `bind`
  - `call`
  - `constructor`
  - `hasOwnProperty`
  - `isPrototypeOf`
  - `length`
  - `name`
  - `propertyIsEnumerable`
  - `prototype`
    - `@@toStringTag`
    - `buffer`
    - `byteLength`
    - `byteOffset`
    - `constructor`
    - `getBigInt64`
    - `getBigUint64`
    - `getFloat32`
    - `getFloat64`
    - `getInt16`
    - `getInt32`
    - `getInt8`
    - `getUint16`
    - `getUint32`
    - `getUint8`
    - `hasOwnProperty`
    - `isPrototypeOf`
    - `propertyIsEnumerable`
    - `setBigInt64`
    - `setBigUint64`
    - `setFloat32`
    - `setFloat64`
    - `setInt16`
    - `setInt32`
    - `setInt8`
    - `setUint16`
    - `setUint32`
    - `setUint8`
    - `toLocaleString`: mapped to `this.DataView.prototype.toString`.
    - `toString`
    - `valueOf`
  - `toLocaleString`: mapped to `this.DataView.toString`.
  - `toString`
  - `valueOf`
- `Date`: overridden to prevent access to current time via constructor.
  - `@@hasInstance`
  - `UTC`
  - `apply`
  - `bind`
  - `call`
  - `constructor`
  - `hasOwnProperty`
  - `isPrototypeOf`
  - `length`
  - `name`
  - `now`: overridden to always return `this.NaN`.
  - `parse`
  - `propertyIsEnumerable`
  - `prototype`
    - `@@toPrimitive`
    - `constructor`
    - `getDate`: mapped to `this.Date.prototype.getUTCDate`.
    - `getDay`: mapped to `this.Date.prototype.getUTCDay`.
    - `getFullYear`: mapped `this.Date.prototype.getUTCFullYear`.
    - `getHours`: mapped to `this.Date.prototype.getUTCHours`.
    - `getMilliseconds`: mapped to `this.Date.prototype.getUTCMilliseconds`.
    - `getMinutes`: mapped to `this.Date.prototype.getUTCMinutes`.
    - `getMonth`: mapped to `this.Date.prototype.getUTCMonth`.
    - `getSeconds`: mapped to `this.Date.prototype.getUTCSeconds`.
    - `getTime`
    - `getTimezoneOffset`: overridden to always return `0`.
    - `getUTCDate`
    - `getUTCDay`
    - `getUTCFullYear`
    - `getUTCHours`
    - `getUTCMilliseconds`
    - `getUTCMinutes`
    - `getUTCMonth`
    - `getUTCSeconds`
    - `hasOwnProperty`
    - `isPrototypeOf`
    - `propertyIsEnumerable`
    - `setDate`: mapped to `this.Date.prototype.setUTCDate`.
    - `setFullYear`: mapped to `this.Date.prototype.setUTCFullYear`.
    - `setHours`: mapped to `this.Date.prototype.setUTCHours`.
    - `setMilliseconds`: mapped to `this.Date.prototype.setUTCMilliseconds`.
    - `setMinutes`: mapped to `this.Date.prototype.setUTCMinutes`.
    - `setMonth`: mapped to `this.Date.prototype.setUTCMonth`.
    - `setSeconds`: mapped to `this.Date.prototype.setUTCSeconds`.
    - `setTime`
    - `setUTCDate`
    - `setUTCFullYear`
    - `setUTCHours`
    - `setUTCMilliseconds`
    - `setUTCMinutes`
    - `setUTCMonth`
    - `setUTCSeconds`
    - `toDateString`: overridden to return the date part of `this.Date.prototype.toISOString`.
    - `toISOString`
    - `toJSON`
    - `toLocaleDateString`: mapped to `this.Date.prototype.toDateString`.
    - `toLocaleString`: mapped to `this.Date.prototype.toString`.
    - `toLocaleTimeString`: mapped to `this.Date.prototype.toTimeString`.
    - `toString`: mapped to `this.Date.prototype.toISOString`.
    - `toTimeString`: overridden to return the time part of `this.Date.prototype.toISOString`.
    - `toUTCString`
    - `valueOf`
  - `toLocaleString`: mapped to `this.Date.toString`.
  - `toString`
  - `valueOf`
- `Error`
  - `@@hasInstance`
  - `apply`
  - `bind`
  - `call`
  - `constructor`
  - `hasOwnProperty`
  - `isPrototypeOf`
  - `length`
  - `name`
  - `propertyIsEnumerable`
  - `prototype`
    - `constructor`
    - `hasOwnProperty`
    - `isPrototypeOf`
    - `name`
    - `propertyIsEnumerable`
    - `toLocaleString`: mapped to `this.Error.prototype.toString`.
    - `toString`
    - `valueOf`
  - `toLocaleString`: mapped to `this.Error.toString`.
  - `toString`
  - `valueOf`
- `EvalError`
  - `@@hasInstance`
  - `apply`
  - `bind`
  - `call`
  - `constructor`
  - `hasOwnProperty`
  - `isPrototypeOf`
  - `length`
  - `name`
  - `propertyIsEnumerable`
  - `prototype`
    - `constructor`
    - `hasOwnProperty`
    - `isPrototypeOf`
    - `name`
    - `propertyIsEnumerable`
    - `toLocaleString`: mapped to `this.EvalError.prototype.toString`.
    - `toString`
    - `valueOf`
  - `toLocaleString`: mapped to `this.EvalError.toString`.
  - `toString`
  - `valueOf`
- `FinalizationRegistry`
  - `@@hasInstance`
  - `apply`
  - `bind`
  - `call`
  - `constructor`
  - `hasOwnProperty`
  - `isPrototypeOf`
  - `length`
  - `name`
  - `propertyIsEnumerable`
  - `prototype`
    - `@@toStringTag`
    - `constructor`
    - `hasOwnProperty`
    - `isPrototypeOf`
    - `propertyIsEnumerable`
    - `register`
    - `toLocaleString`: mapped to `this.FinalizationRegistry.prototype.toString`.
    - `toString`
    - `unregister`
    - `valueOf`
  - `toLocaleString`: mapped to `this.FinalizationRegistry.toString`.
  - `toString`
  - `valueOf`
- `Float32Array`
  - `@@hasInstance`
  - `@@species`
  - `BYTES_PER_ELEMENT`
  - `apply`
  - `bind`
  - `call`
  - `constructor`
  - `from`
  - `hasOwnProperty`
  - `isPrototypeOf`
  - `length`
  - `name`
  - `of`
  - `propertyIsEnumerable`
  - `prototype`
    - `@@iterator`
    - `@@toStringTag`
    - `BYTES_PER_ELEMENT`
    - `at`
    - `buffer`
    - `byteLength`
    - `byteOffset`
    - `constructor`
    - `copyWithin`
    - `entries`
    - `every`
    - `fill`
    - `filter`
    - `find`
    - `findIndex`
    - `findLast`
    - `findLastIndex`
    - `forEach`
    - `hasOwnProperty`
    - `includes`
    - `indexOf`
    - `isPrototypeOf`
    - `join`
    - `keys`
    - `lastIndexOf`
    - `length`
    - `map`
    - `propertyIsEnumerable`
    - `reduce`
    - `reduceRight`
    - `reverse`
    - `set`
    - `slice`
    - `some`
    - `sort`
    - `subarray`
    - `toLocaleString`: mapped to `this.Float32Array.prototype.toString`.
    - `toReversed`
    - `toSorted`
    - `toString`
    - `valueOf`
    - `values`
    - `with`
  - `toLocaleString`: mapped to `this.Float32Array.toString`.
  - `toString`
  - `valueOf`
- `Float64Array`
  - `@@hasInstance`
  - `@@species`
  - `BYTES_PER_ELEMENT`
  - `apply`
  - `bind`
  - `call`
  - `constructor`
  - `from`
  - `hasOwnProperty`
  - `isPrototypeOf`
  - `length`
  - `name`
  - `of`
  - `propertyIsEnumerable`
  - `prototype`
    - `@@iterator`
    - `@@toStringTag`
    - `BYTES_PER_ELEMENT`
    - `at`
    - `buffer`
    - `byteLength`
    - `byteOffset`
    - `constructor`
    - `copyWithin`
    - `entries`
    - `every`
    - `fill`
    - `filter`
    - `find`
    - `findIndex`
    - `findLast`
    - `findLastIndex`
    - `forEach`
    - `hasOwnProperty`
    - `includes`
    - `indexOf`
    - `isPrototypeOf`
    - `join`
    - `keys`
    - `lastIndexOf`
    - `length`
    - `map`
    - `propertyIsEnumerable`
    - `reduce`
    - `reduceRight`
    - `reverse`
    - `set`
    - `slice`
    - `some`
    - `sort`
    - `subarray`
    - `toLocaleString`: mapped to `this.Float64Array.prototype.toString`.
    - `toReversed`
    - `toSorted`
    - `toString`
    - `valueOf`
    - `values`
    - `with`
  - `toLocaleString`: mapped to `this.Float64Array.toString`.
  - `toString`
  - `valueOf`
- `Function`
  - `prototype`
    - `@@hasInstance`
    - `apply`
    - `bind`
    - `call`
    - `constructor`
    - `hasOwnProperty`
    - `isPrototypeOf`
    - `propertyIsEnumerable`
    - `toLocaleString`: mapped to `this.Function.prototype.toString`.
    - `toString`
    - `valueOf`
- `GeneratorFunction`
  - `constructor`
    - `@@hasInstance`
    - `apply`
    - `bind`
    - `call`
    - `constructor`
    - `hasOwnProperty`
    - `isPrototypeOf`
    - `length`
    - `name`
    - `propertyIsEnumerable`
    - `prototype`
      - `@@hasInstance`
      - `@@toStringTag`
      - `apply`
      - `bind`
      - `call`
      - `constructor`
      - `hasOwnProperty`
      - `isPrototypeOf`
      - `propertyIsEnumerable`
      - `prototype`
      - `toLocaleString`: mapped to `this.GeneratorFunction.prototype.toString`.
      - `toString`
      - `valueOf`
    - `toLocaleString`: mapped to `this.GeneratorFunction.toString`.
    - `toString`
    - `valueOf`
- `Infinity`
- `Int16Array`
  - `@@hasInstance`
  - `@@species`
  - `BYTES_PER_ELEMENT`
  - `apply`
  - `bind`
  - `call`
  - `constructor`
  - `from`
  - `hasOwnProperty`
  - `isPrototypeOf`
  - `length`
  - `name`
  - `of`
  - `propertyIsEnumerable`
  - `prototype`
    - `@@iterator`
    - `@@toStringTag`
    - `BYTES_PER_ELEMENT`
    - `at`
    - `buffer`
    - `byteLength`
    - `byteOffset`
    - `constructor`
    - `copyWithin`
    - `entries`
    - `every`
    - `fill`
    - `filter`
    - `find`
    - `findIndex`
    - `findLast`
    - `findLastIndex`
    - `forEach`
    - `hasOwnProperty`
    - `includes`
    - `indexOf`
    - `isPrototypeOf`
    - `join`
    - `keys`
    - `lastIndexOf`
    - `length`
    - `map`
    - `propertyIsEnumerable`
    - `reduce`
    - `reduceRight`
    - `reverse`
    - `set`
    - `slice`
    - `some`
    - `sort`
    - `subarray`
    - `toLocaleString`: mapped to `this.Int16Array.prototype.toString`.
    - `toReversed`
    - `toSorted`
    - `toString`
    - `valueOf`
    - `values`
    - `with`
  - `toLocaleString`: mapped to `this.Int16Array.toString`.
  - `toString`
  - `valueOf`
- `Int32Array`
  - `@@hasInstance`
  - `@@species`
  - `BYTES_PER_ELEMENT`
  - `apply`
  - `bind`
  - `call`
  - `constructor`
  - `from`
  - `hasOwnProperty`
  - `isPrototypeOf`
  - `length`
  - `name`
  - `of`
  - `propertyIsEnumerable`
  - `prototype`
    - `@@iterator`
    - `@@toStringTag`
    - `BYTES_PER_ELEMENT`
    - `at`
    - `buffer`
    - `byteLength`
    - `byteOffset`
    - `constructor`
    - `copyWithin`
    - `entries`
    - `every`
    - `fill`
    - `filter`
    - `find`
    - `findIndex`
    - `findLast`
    - `findLastIndex`
    - `forEach`
    - `hasOwnProperty`
    - `includes`
    - `indexOf`
    - `isPrototypeOf`
    - `join`
    - `keys`
    - `lastIndexOf`
    - `length`
    - `map`
    - `propertyIsEnumerable`
    - `reduce`
    - `reduceRight`
    - `reverse`
    - `set`
    - `slice`
    - `some`
    - `sort`
    - `subarray`
    - `toLocaleString`: mapped to `this.Int32Array.prototype.toString`.
    - `toReversed`
    - `toSorted`
    - `toString`
    - `valueOf`
    - `values`
    - `with`
  - `toLocaleString`: mapped to `this.Int32Array.toString`.
  - `toString`
  - `valueOf`
- `Int8Array`
  - `@@hasInstance`
  - `@@species`
  - `BYTES_PER_ELEMENT`
  - `apply`
  - `bind`
  - `call`
  - `constructor`
  - `from`
  - `hasOwnProperty`
  - `isPrototypeOf`
  - `length`
  - `name`
  - `of`
  - `propertyIsEnumerable`
  - `prototype`
    - `@@iterator`
    - `@@toStringTag`
    - `BYTES_PER_ELEMENT`
    - `at`
    - `buffer`
    - `byteLength`
    - `byteOffset`
    - `constructor`
    - `copyWithin`
    - `entries`
    - `every`
    - `fill`
    - `filter`
    - `find`
    - `findIndex`
    - `findLast`
    - `findLastIndex`
    - `forEach`
    - `hasOwnProperty`
    - `includes`
    - `indexOf`
    - `isPrototypeOf`
    - `join`
    - `keys`
    - `lastIndexOf`
    - `length`
    - `map`
    - `propertyIsEnumerable`
    - `reduce`
    - `reduceRight`
    - `reverse`
    - `set`
    - `slice`
    - `some`
    - `sort`
    - `subarray`
    - `toLocaleString`: mapped to `this.Int8Array.prototype.toString`.
    - `toReversed`
    - `toSorted`
    - `toString`
    - `valueOf`
    - `values`
    - `with`
  - `toLocaleString`: mapped to `this.Int8Array.toString`.
  - `toString`
  - `valueOf`
- `Iterator`
- `JSON`
  - `@@toStringTag`
  - `parse`
  - `stringify`
- `Map`
  - `@@hasInstance`
  - `@@species`
  - `apply`
  - `bind`
  - `call`
  - `constructor`
  - `groupBy`
  - `hasOwnProperty`
  - `isPrototypeOf`
  - `length`
  - `name`
  - `propertyIsEnumerable`
  - `prototype`
    - `@@iterator`
    - `@@toStringTag`
    - `clear`
    - `constructor`
    - `delete`
    - `entries`
    - `forEach`
    - `get`
    - `has`
    - `hasOwnProperty`
    - `isPrototypeOf`
    - `keys`
    - `propertyIsEnumerable`
    - `set`
    - `size`
    - `toLocaleString`: mapped to `this.Map.prototype.toString`.
    - `toString`
    - `valueOf`
    - `values`
  - `toLocaleString`: mapped to `this.Map.toString`.
  - `toString`
  - `valueOf`
- `Math`
  - `@@toStringTag`
  - `E`
  - `LN10`
  - `LN2`
  - `LOG10E`
  - `LOG2E`
  - `PI`
  - `SQRT1_2`
  - `SQRT2`
  - `abs`
  - `acos`
  - `acosh`
  - `asin`
  - `asinh`
  - `atan`
  - `atan2`
  - `atanh`
  - `cbrt`
  - `ceil`
  - `clz32`
  - `cos`
  - `cosh`
  - `exp`
  - `expm1`
  - `floor`
  - `fround`
  - `hypot`
  - `imul`
  - `log`
  - `log10`
  - `log1p`
  - `log2`
  - `max`
  - `min`
  - `pow`
  - `random`: overridden to always return `this.NaN`.
  - `round`
  - `sign`
  - `sin`
  - `sinh`
  - `sqrt`
  - `tan`
  - `tanh`
  - `trunc`
- `NaN`
- `Number`
  - `@@hasInstance`
  - `EPSILON`
  - `MAX_SAFE_INTEGER`
  - `MAX_VALUE`
  - `MIN_SAFE_INTEGER`
  - `MIN_VALUE`
  - `NEGATIVE_INFINITY`
  - `NaN`
  - `POSITIVE_INFINITY`
  - `apply`
  - `bind`
  - `call`
  - `constructor`
  - `hasOwnProperty`
  - `isFinite`
  - `isInteger`
  - `isNaN`
  - `isPrototypeOf`
  - `isSafeInteger`
  - `length`
  - `name`
  - `parseFloat`
  - `parseInt`
  - `propertyIsEnumerable`
  - `prototype`
    - `constructor`
    - `hasOwnProperty`
    - `isPrototypeOf`
    - `propertyIsEnumerable`
    - `toExponential`
    - `toFixed`
    - `toLocaleString`: mapped to `this.Number.prototype.toString`.
    - `toPrecision`
    - `toString`
    - `valueOf`
  - `toLocaleString`: mapped to `this.Number.toString`.
  - `toString`
  - `valueOf`
- `Object`
  - `@@hasInstance`
  - `apply`
  - `assign`
  - `bind`
  - `call`
  - `constructor`
  - `create`
  - `defineProperties`
  - `defineProperty`
  - `entries`
  - `freeze`
  - `fromEntries`
  - `getOwnPropertyDescriptor`
  - `getOwnPropertyDescriptors`
  - `getOwnPropertyNames`
  - `getOwnPropertySymbols`
  - `getPrototypeOf`
  - `groupBy`
  - `hasOwn`
  - `hasOwnProperty`
  - `is`
  - `isExtensible`
  - `isFrozen`
  - `isPrototypeOf`
  - `isSealed`
  - `keys`
  - `length`
  - `name`
  - `preventExtensions`
  - `propertyIsEnumerable`
  - `prototype`
    - `constructor`
    - `hasOwnProperty`
    - `isPrototypeOf`
    - `propertyIsEnumerable`
    - `toLocaleString`: mapped to `this.Object.prototype.toString`.
    - `toString`
    - `valueOf`
  - `seal`
  - `setPrototypeOf`
  - `toLocaleString`: mapped to `this.Object.toString`.
  - `toString`
  - `valueOf`
  - `values`
- `Promise`
  - `@@hasInstance`
  - `@@species`
  - `all`
  - `allSettled`
  - `any`
  - `apply`
  - `bind`
  - `call`
  - `constructor`
  - `hasOwnProperty`
  - `isPrototypeOf`
  - `length`
  - `name`
  - `propertyIsEnumerable`
  - `prototype`
    - `@@toStringTag`
    - `catch`
    - `constructor`
    - `finally`
    - `hasOwnProperty`
    - `isPrototypeOf`
    - `propertyIsEnumerable`
    - `then`
    - `toLocaleString`: mapped to `this.Promise.prototype.toString`.
    - `toString`
    - `valueOf`
  - `race`
  - `reject`
  - `resolve`
  - `toLocaleString`: mapped to `this.Promise.toString`.
  - `toString`
  - `valueOf`
  - `withResolvers`
- `Proxy`
  - `@@hasInstance`
  - `apply`
  - `bind`
  - `call`
  - `constructor`
  - `hasOwnProperty`
  - `isPrototypeOf`
  - `length`
  - `name`
  - `propertyIsEnumerable`
  - `revocable`
  - `toLocaleString`: mapped to `this.Proxy.toString`.
  - `toString`
  - `valueOf`
- `RangeError`
  - `@@hasInstance`
  - `apply`
  - `bind`
  - `call`
  - `constructor`
  - `hasOwnProperty`
  - `isPrototypeOf`
  - `length`
  - `name`
  - `propertyIsEnumerable`
  - `prototype`
    - `constructor`
    - `hasOwnProperty`
    - `isPrototypeOf`
    - `name`
    - `propertyIsEnumerable`
    - `toLocaleString`: mapped to `this.RangeError.prototype.toString`.
    - `toString`
    - `valueOf`
  - `toLocaleString`: mapped to `this.RangeError.toString`.
  - `toString`
  - `valueOf`
- `ReferenceError`
  - `@@hasInstance`
  - `apply`
  - `bind`
  - `call`
  - `constructor`
  - `hasOwnProperty`
  - `isPrototypeOf`
  - `length`
  - `name`
  - `propertyIsEnumerable`
  - `prototype`
    - `constructor`
    - `hasOwnProperty`
    - `isPrototypeOf`
    - `name`
    - `propertyIsEnumerable`
    - `toLocaleString`: mapped to `this.ReferenceError.prototype.toString`.
    - `toString`
    - `valueOf`
  - `toLocaleString`: mapped to `this.ReferenceError.toString`.
  - `toString`
  - `valueOf`
- `Reflect`
  - `@@toStringTag`
  - `apply`
  - `construct`
  - `defineProperty`
  - `deleteProperty`
  - `get`
  - `getOwnPropertyDescriptor`
  - `getPrototypeOf`
  - `has`
  - `isExtensible`
  - `ownKeys`
  - `preventExtensions`
  - `set`
  - `setPrototypeOf`
- `RegExp`
  - `@@hasInstance`
  - `@@species`
  - `apply`
  - `bind`
  - `call`
  - `constructor`
  - `hasOwnProperty`
  - `isPrototypeOf`
  - `length`
  - `name`
  - `propertyIsEnumerable`
  - `prototype`
    - `@@match`
    - `@@matchAll`
    - `@@replace`
    - `@@search`
    - `@@split`
    - `constructor`
    - `dotAll`
    - `exec`
    - `flags`
    - `global`
    - `hasIndices`
    - `hasOwnProperty`
    - `ignoreCase`
    - `isPrototypeOf`
    - `lastIndex`
    - `multiline`
    - `propertyIsEnumerable`
    - `source`
    - `sticky`
    - `test`
    - `toLocaleString`: mapped to `this.RegExp.prototype.toString`.
    - `toString`
    - `unicode`
    - `unicodeSets`
    - `valueOf`
  - `toLocaleString`: mapped to `this.RegExp.toString`.
  - `toString`
  - `valueOf`
- `Set`
  - `@@hasInstance`
  - `@@species`
  - `apply`
  - `bind`
  - `call`
  - `constructor`
  - `hasOwnProperty`
  - `isPrototypeOf`
  - `length`
  - `name`
  - `propertyIsEnumerable`
  - `prototype`
    - `@@iterator`
    - `@@toStringTag`
    - `add`
    - `clear`
    - `constructor`
    - `delete`
    - `difference`
    - `entries`
    - `forEach`
    - `has`
    - `hasOwnProperty`
    - `intersection`
    - `isDisjointFrom`
    - `isPrototypeOf`
    - `isSubsetOf`
    - `isSupersetOf`
    - `keys`
    - `propertyIsEnumerable`
    - `size`
    - `symmetricDifference`
    - `toLocaleString`: mapped to `this.Set.prototype.toString`.
    - `toString`
    - `union`
    - `valueOf`
    - `values`
  - `toLocaleString`: mapped to `this.Set.toString`.
  - `toString`
  - `valueOf`
- `String`
  - `@@hasInstance`
  - `apply`
  - `bind`
  - `call`
  - `constructor`
  - `fromCharCode`
  - `fromCodePoint`
  - `hasOwnProperty`
  - `isPrototypeOf`
  - `length`
  - `name`
  - `propertyIsEnumerable`
  - `prototype`
    - `@@iterator`
    - `at`
    - `charAt`
    - `charCodeAt`
    - `codePointAt`
    - `concat`
    - `constructor`
    - `endsWith`
    - `hasOwnProperty`
    - `includes`
    - `indexOf`
    - `isPrototypeOf`
    - `isWellFormed`
    - `lastIndexOf`
    - `length`
    - `localeCompare`: overridden to return the byte-wise comparison.
    - `match`
    - `matchAll`
    - `normalize`
    - `padEnd`
    - `padStart`
    - `propertyIsEnumerable`
    - `repeat`
    - `replace`
    - `replaceAll`
    - `search`
    - `slice`
    - `split`
    - `startsWith`
    - `substring`
    - `toLocaleLowerCase`: mapped to `this.String.prototype.toLowerCase`.
    - `toLocaleString`: mapped to `this.String.prototype.toString`.
    - `toLocaleUpperCase`: mapped to `this.String.prototype.toLowerCase`.
    - `toLowerCase`
    - `toString`
    - `toUpperCase`
    - `toWellFormed`
    - `trim`
    - `trimEnd`
    - `trimStart`
    - `valueOf`
  - `raw`
  - `toLocaleString`: mapped to `this.String.toString`.
  - `toString`
  - `valueOf`
- `Symbol`
  - `@@hasInstance`
  - `apply`
  - `asyncIterator`
  - `bind`
  - `call`
  - `constructor`
  - `for`
  - `hasInstance`
  - `hasOwnProperty`
  - `isConcatSpreadable`
  - `isPrototypeOf`
  - `iterator`
  - `keyFor`
  - `length`
  - `match`
  - `matchAll`
  - `name`
  - `propertyIsEnumerable`
  - `prototype`
    - `@@toPrimitive`
    - `@@toStringTag`
    - `constructor`
    - `description`
    - `hasOwnProperty`
    - `isPrototypeOf`
    - `propertyIsEnumerable`
    - `toLocaleString`: mapped to `this.Symbol.prototype.toString`.
    - `toString`
    - `valueOf`
  - `replace`
  - `search`
  - `species`
  - `split`
  - `toLocaleString`: mapped to `this.Symbol.toString`.
  - `toPrimitive`
  - `toString`
  - `toStringTag`
  - `unscopables`
  - `valueOf`
- `SyntaxError`
  - `@@hasInstance`
  - `apply`
  - `bind`
  - `call`
  - `constructor`
  - `hasOwnProperty`
  - `isPrototypeOf`
  - `length`
  - `name`
  - `propertyIsEnumerable`
  - `prototype`
    - `constructor`
    - `hasOwnProperty`
    - `isPrototypeOf`
    - `name`
    - `propertyIsEnumerable`
    - `toLocaleString`: mapped to `this.SyntaxError.prototype.toString`.
    - `toString`
    - `valueOf`
  - `toLocaleString`: mapped to `this.SyntaxError.toString`.
  - `toString`
  - `valueOf`
- `TypeError`
  - `@@hasInstance`
  - `apply`
  - `bind`
  - `call`
  - `constructor`
  - `hasOwnProperty`
  - `isPrototypeOf`
  - `length`
  - `name`
  - `propertyIsEnumerable`
  - `prototype`
    - `constructor`
    - `hasOwnProperty`
    - `isPrototypeOf`
    - `name`
    - `propertyIsEnumerable`
    - `toLocaleString`: mapped to `this.TypeError.prototype.toString`.
    - `toString`
    - `valueOf`
  - `toLocaleString`: mapped to `this.TypeError.toString`.
  - `toString`
  - `valueOf`
- `URIError`
  - `@@hasInstance`
  - `apply`
  - `bind`
  - `call`
  - `constructor`
  - `hasOwnProperty`
  - `isPrototypeOf`
  - `length`
  - `name`
  - `propertyIsEnumerable`
  - `prototype`
    - `constructor`
    - `hasOwnProperty`
    - `isPrototypeOf`
    - `name`
    - `propertyIsEnumerable`
    - `toLocaleString`: mapped to `this.URIError.prototype.toString`.
    - `toString`
    - `valueOf`
  - `toLocaleString`: mapped to `this.URIError.toString`.
  - `toString`
  - `valueOf`
- `Uint16Array`
  - `@@hasInstance`
  - `@@species`
  - `BYTES_PER_ELEMENT`
  - `apply`
  - `bind`
  - `call`
  - `constructor`
  - `from`
  - `hasOwnProperty`
  - `isPrototypeOf`
  - `length`
  - `name`
  - `of`
  - `propertyIsEnumerable`
  - `prototype`
    - `@@iterator`
    - `@@toStringTag`
    - `BYTES_PER_ELEMENT`
    - `at`
    - `buffer`
    - `byteLength`
    - `byteOffset`
    - `constructor`
    - `copyWithin`
    - `entries`
    - `every`
    - `fill`
    - `filter`
    - `find`
    - `findIndex`
    - `findLast`
    - `findLastIndex`
    - `forEach`
    - `hasOwnProperty`
    - `includes`
    - `indexOf`
    - `isPrototypeOf`
    - `join`
    - `keys`
    - `lastIndexOf`
    - `length`
    - `map`
    - `propertyIsEnumerable`
    - `reduce`
    - `reduceRight`
    - `reverse`
    - `set`
    - `slice`
    - `some`
    - `sort`
    - `subarray`
    - `toLocaleString`: mapped to `this.Uint16Array.prototype.toString`.
    - `toReversed`
    - `toSorted`
    - `toString`
    - `valueOf`
    - `values`
    - `with`
  - `toLocaleString`: mapped to `this.Uint16Array.toString`.
  - `toString`
  - `valueOf`
- `Uint32Array`
  - `@@hasInstance`
  - `@@species`
  - `BYTES_PER_ELEMENT`
  - `apply`
  - `bind`
  - `call`
  - `constructor`
  - `from`
  - `hasOwnProperty`
  - `isPrototypeOf`
  - `length`
  - `name`
  - `of`
  - `propertyIsEnumerable`
  - `prototype`
    - `@@iterator`
    - `@@toStringTag`
    - `BYTES_PER_ELEMENT`
    - `at`
    - `buffer`
    - `byteLength`
    - `byteOffset`
    - `constructor`
    - `copyWithin`
    - `entries`
    - `every`
    - `fill`
    - `filter`
    - `find`
    - `findIndex`
    - `findLast`
    - `findLastIndex`
    - `forEach`
    - `hasOwnProperty`
    - `includes`
    - `indexOf`
    - `isPrototypeOf`
    - `join`
    - `keys`
    - `lastIndexOf`
    - `length`
    - `map`
    - `propertyIsEnumerable`
    - `reduce`
    - `reduceRight`
    - `reverse`
    - `set`
    - `slice`
    - `some`
    - `sort`
    - `subarray`
    - `toLocaleString`: mapped to `this.Uint32Array.prototype.toString`.
    - `toReversed`
    - `toSorted`
    - `toString`
    - `valueOf`
    - `values`
    - `with`
  - `toLocaleString`: mapped to `this.Uint32Array.toString`.
  - `toString`
  - `valueOf`
- `Uint8Array`
  - `@@hasInstance`
  - `@@species`
  - `BYTES_PER_ELEMENT`
  - `apply`
  - `bind`
  - `call`
  - `constructor`
  - `from`
  - `hasOwnProperty`
  - `isPrototypeOf`
  - `length`
  - `name`
  - `of`
  - `propertyIsEnumerable`
  - `prototype`
    - `@@iterator`
    - `@@toStringTag`
    - `BYTES_PER_ELEMENT`
    - `at`
    - `buffer`
    - `byteLength`
    - `byteOffset`
    - `constructor`
    - `copyWithin`
    - `entries`
    - `every`
    - `fill`
    - `filter`
    - `find`
    - `findIndex`
    - `findLast`
    - `findLastIndex`
    - `forEach`
    - `hasOwnProperty`
    - `includes`
    - `indexOf`
    - `isPrototypeOf`
    - `join`
    - `keys`
    - `lastIndexOf`
    - `length`
    - `map`
    - `propertyIsEnumerable`
    - `reduce`
    - `reduceRight`
    - `reverse`
    - `set`
    - `slice`
    - `some`
    - `sort`
    - `subarray`
    - `toLocaleString`: mapped to `this.Uint8Array.prototype.toString`.
    - `toReversed`
    - `toSorted`
    - `toString`
    - `valueOf`
    - `values`
    - `with`
  - `toLocaleString`: mapped to `this.Uint8Array.toString`.
  - `toString`
  - `valueOf`
- `Uint8ClampedArray`
  - `@@hasInstance`
  - `@@species`
  - `BYTES_PER_ELEMENT`
  - `apply`
  - `bind`
  - `call`
  - `constructor`
  - `from`
  - `hasOwnProperty`
  - `isPrototypeOf`
  - `length`
  - `name`
  - `of`
  - `propertyIsEnumerable`
  - `prototype`
    - `@@iterator`
    - `@@toStringTag`
    - `BYTES_PER_ELEMENT`
    - `at`
    - `buffer`
    - `byteLength`
    - `byteOffset`
    - `constructor`
    - `copyWithin`
    - `entries`
    - `every`
    - `fill`
    - `filter`
    - `find`
    - `findIndex`
    - `findLast`
    - `findLastIndex`
    - `forEach`
    - `hasOwnProperty`
    - `includes`
    - `indexOf`
    - `isPrototypeOf`
    - `join`
    - `keys`
    - `lastIndexOf`
    - `length`
    - `map`
    - `propertyIsEnumerable`
    - `reduce`
    - `reduceRight`
    - `reverse`
    - `set`
    - `slice`
    - `some`
    - `sort`
    - `subarray`
    - `toLocaleString`: mapped to `this.Uint8ClampedArray.prototype.toString`.
    - `toReversed`
    - `toSorted`
    - `toString`
    - `valueOf`
    - `values`
    - `with`
  - `toLocaleString`: mapped to `this.Uint8ClampedArray.toString`.
  - `toString`
  - `valueOf`
- `WeakMap`
  - `@@hasInstance`
  - `@@toStringTag`
  - `apply`
  - `bind`
  - `call`
  - `constructor`
  - `hasOwnProperty`
  - `isPrototypeOf`
  - `length`
  - `name`
  - `propertyIsEnumerable`
  - `prototype`
    - `constructor`
    - `delete`
    - `get`
    - `has`
    - `hasOwnProperty`
    - `isPrototypeOf`
    - `propertyIsEnumerable`
    - `set`
    - `toLocaleString`: mapped to `this.WeakMap.prototype.toString`.
    - `toString`
    - `valueOf`
  - `toLocaleString`: mapped to `this.WeakMap.toString`.
  - `toString`
  - `valueOf`
- `WeakRef`
  - `@@hasInstance`
  - `apply`
  - `bind`
  - `call`
  - `constructor`
  - `hasOwnProperty`
  - `isPrototypeOf`
  - `length`
  - `name`
  - `propertyIsEnumerable`
  - `prototype`
    - `@@toStringTag`
    - `constructor`
    - `deref`
    - `hasOwnProperty`
    - `isPrototypeOf`
    - `propertyIsEnumerable`
    - `toLocaleString`: mapped to `this.WeakRef.prototype.toString`.
    - `toString`
    - `valueOf`
  - `toLocaleString`: mapped to `this.WeakRef.toString`.
  - `toString`
  - `valueOf`
- `WeakSet`
  - `@@hasInstance`
  - `@@toStringTag`
  - `apply`
  - `bind`
  - `call`
  - `constructor`
  - `hasOwnProperty`
  - `isPrototypeOf`
  - `length`
  - `name`
  - `propertyIsEnumerable`
  - `prototype`
    - `add`
    - `constructor`
    - `delete`
    - `has`
    - `hasOwnProperty`
    - `isPrototypeOf`
    - `propertyIsEnumerable`
    - `toLocaleString`: mapped to `this.WeakSet.prototype.toString`.
    - `toString`
    - `valueOf`
  - `toLocaleString`: mapped to `this.WeakSet.toString`.
  - `toString`
  - `valueOf`
- `decodeURI`
- `decodeURIComponent`
- `encodeURI`
- `encodeURIComponent`
- `eval`: overridden with version that only allows strict mode [indirect eval](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval#direct_and_indirect_eval).
- `globalThis`
- `isFinite`
- `isNaN`
- `parseFloat`
- `parseInt`
- `undefined`