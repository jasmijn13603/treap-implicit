import { test } from "node:test";
import assert from "node:assert/strict";
import { Treap } from "../src/index.js";

test("push and length", () => {
  const t = new Treap();
  assert.equal(t.length, 0);
  t.push(1); t.push(2); t.push(3);
  assert.equal(t.length, 3);
});

test("toArray preserves order", () => {
  const t = new Treap([1, 2, 3, 4, 5]);
  assert.deepEqual(t.toArray(), [1, 2, 3, 4, 5]);
});

test("get returns value at index", () => {
  const t = new Treap([10, 20, 30]);
  assert.equal(t.get(0), 10);
  assert.equal(t.get(1), 20);
  assert.equal(t.get(2), 30);
});

test("get out of bounds returns undefined", () => {
  const t = new Treap([1]);
  assert.equal(t.get(-1), undefined);
  assert.equal(t.get(1), undefined);
});

test("set updates value", () => {
  const t = new Treap([1, 2, 3]);
  assert.equal(t.set(1, 99), true);
  assert.equal(t.get(1), 99);
});

test("set out of bounds returns false", () => {
  const t = new Treap([1]);
  assert.equal(t.set(5, 99), false);
});

test("pop removes last", () => {
  const t = new Treap([1, 2, 3]);
  assert.equal(t.pop(), 3);
  assert.deepEqual(t.toArray(), [1, 2]);
});

test("shift removes first", () => {
  const t = new Treap([1, 2, 3]);
  assert.equal(t.shift(), 1);
  assert.deepEqual(t.toArray(), [2, 3]);
});

test("unshift adds to front", () => {
  const t = new Treap([2, 3]);
  t.unshift(1);
  assert.deepEqual(t.toArray(), [1, 2, 3]);
});

test("reverseRange middle", () => {
  const t = new Treap([1, 2, 3, 4, 5]);
  t.reverseRange(1, 4);
  assert.deepEqual(t.toArray(), [1, 4, 3, 2, 5]);
});

test("reverseRange full", () => {
  const t = new Treap([1, 2, 3]);
  t.reverseRange(0, 3);
  assert.deepEqual(t.toArray(), [3, 2, 1]);
});

test("reverseRange is a no-op when start >= end", () => {
  const t = new Treap([1, 2, 3]);
  t.reverseRange(2, 2);
  assert.deepEqual(t.toArray(), [1, 2, 3]);
});

test("reverseRange clamps out-of-bounds indices", () => {
  const t = new Treap([1, 2, 3]);
  t.reverseRange(-1, 10);
  assert.deepEqual(t.toArray(), [3, 2, 1]);
});

test("double reverseRange cancels out", () => {
  const t = new Treap([1, 2, 3, 4]);
  t.reverseRange(0, 4);
  t.reverseRange(0, 4);
  assert.deepEqual(t.toArray(), [1, 2, 3, 4]);
});

test("swapRanges disjoint equal length", () => {
  const t = new Treap([1, 2, 3, 4, 5, 6]);
  t.swapRanges(0, 2, 4, 6);
  assert.deepEqual(t.toArray(), [5, 6, 3, 4, 1, 2]);
});

test("swapRanges adjacent", () => {
  const t = new Treap([1, 2, 3, 4]);
  t.swapRanges(0, 2, 2, 4);
  assert.deepEqual(t.toArray(), [3, 4, 1, 2]);
});

test("swapRanges with args swapped still works", () => {
  const t = new Treap([1, 2, 3, 4, 5, 6]);
  t.swapRanges(4, 6, 0, 2);
  assert.deepEqual(t.toArray(), [5, 6, 3, 4, 1, 2]);
});

test("swapRanges throws on unequal length", () => {
  const t = new Treap([1, 2, 3, 4]);
  assert.throws(() => t.swapRanges(0, 2, 3, 4), RangeError);
});

test("swapRanges throws on overlap", () => {
  const t = new Treap([1, 2, 3, 4]);
  assert.throws(() => t.swapRanges(0, 3, 2, 4), RangeError);
});

test("swapRanges throws on out of bounds", () => {
  const t = new Treap([1, 2]);
  assert.throws(() => t.swapRanges(0, 2, 3, 5), RangeError);
});

test("empty treap operations", () => {
  const t = new Treap();
  assert.equal(t.pop(), undefined);
  assert.equal(t.shift(), undefined);
  assert.equal(t.get(0), undefined);
  assert.deepEqual(t.toArray(), []);
});

test("mixed operations preserve integrity", () => {
  const t = new Treap([1, 2, 3, 4, 5]);
  t.reverseRange(0, 5);
  t.push(6);
  assert.deepEqual(t.toArray(), [5, 4, 3, 2, 1, 6]);
  t.shift();
  assert.deepEqual(t.toArray(), [4, 3, 2, 1, 6]);
  t.swapRanges(0, 2, 3, 5);
  assert.deepEqual(t.toArray(), [1, 6, 2, 4, 3]);
});

test("single element operations", () => {
  const t = new Treap([42]);
  t.reverseRange(0, 1);
  assert.deepEqual(t.toArray(), [42]);
  assert.equal(t.get(0), 42);
});

test("deterministic with same seed", () => {
  const a = new Treap([3, 1, 4, 1, 5, 9, 2, 6], 12345);
  const b = new Treap([3, 1, 4, 1, 5, 9, 2, 6], 12345);
  a.reverseRange(0, 8);
  b.reverseRange(0, 8);
  assert.deepEqual(a.toArray(), b.toArray());
});
