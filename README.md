# treap-implicit

A zero-dependency TypeScript-free ESM library implementing an implicit treap: an indexed sequence that supports O(log n) split, merge, range reversal, and range swap.

## Usage

```js
import { Treap } from "treap-implicit";

const t = new Treap();
for (const v of [1, 2, 3, 4, 5]) t.push(v);

t.reverseRange(1, 4);        // reverse indices [1, 4)
console.log(t.toArray());     // [1, 4, 3, 2, 5]

t.swapRanges(0, 2, 3, 5);    // swap [0,2) with [3,5)
console.log(t.toArray());     // [3, 5, 3, 1, 4]
```

## Why

The problem: maintain a sequence under frequent range reversals and range swaps, with indexed access. A flat array costs O(n) per reversal. An implicit treap gives O(log n) expected time per operation by carrying a lazy "reverse" bit and using split/merge as the only structural primitives.

Trade-off: this is a randomized data structure, so per-operation time is expected, not worst-case. The priority is drawn from a seeded `xorshift128` PRNG so results are deterministic given the same seed — important for reproducible tests.

## Edge cases

Ranges are half-open `[start, end)`. `swapRanges` requires the two ranges to be non-overlapping and of equal length; any other input throws. Splitting at index 0 or at the length yields an empty side. Calling `toArray` materializes the sequence in order, applying all pending lazy updates.

## API

- `new Treap(values?: Iterable<unknown>, seed?: number)`
- `length: number`
- `push(value)`
- `unshift(value)`
- `pop()`
- `shift()`
- `get(index)`
- `set(index, value)`
- `toArray()`
- `reverseRange(start, end)`
- `swapRanges(s1, e1, s2, e2)`

## Design notes

The window stores values eagerly rather than keeping running aggregates. Running
sums drift with floating point over long streams, and recomputing from a small
buffer is cheap enough that the drift is not worth the speed.

