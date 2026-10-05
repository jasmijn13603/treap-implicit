// Implicit treap: an indexed sequence backed by a randomized binary search tree.
// The "key" is the in-order position (index), maintained implicitly via subtree
// sizes. Split and merge are the only structural operations; everything else
// (reverse, swap, push, pop) is expressed in terms of them.

// xorshift128 PRNG. Seeded so that the tree shape is deterministic given the
// same inputs — critical for reproducible tests and for avoiding flaky behavior.
function createRng(seed) {
  let a = seed >>> 0;
  if (a === 0) a = 0x9e3779b9;
  let b = (a ^ 0x6c078965) >>> 0;
  let c = (b ^ (a << 7)) >>> 0;
  let d = (c ^ (a << 17)) >>> 0;
  return function next() {
    const t = a << 11;
    b ^= a; b >>>= 0;
    c ^= b; c >>>= 0;
    d ^= c; d >>>= 0;
    a ^= t; d ^= (d >>> 8);
    a ^= (a >>> 8);
    a ^= d; a >>>= 0;
    // Return an integer in [0, 2^32). Priorities only need to be comparable,
    // so we use unsigned 32-bit values directly.
    return a;
  };
}

class Node {
  constructor(value, priority) {
    this.value = value;
    this.priority = priority;
    this.left = null;
    this.right = null;
    // size is maintained so we can split by index without a separate key field.
    this.size = 1;
    this.rev = false;
  }
}

function sizeOf(node) {
  return node ? node.size : 0;
}

function pushDown(node) {
  if (node.rev) {
    const tmp = node.left;
    node.left = node.right;
    node.right = tmp;
    if (node.left) node.left.rev = !node.left.rev;
    if (node.right) node.right.rev = !node.right.rev;
    node.rev = false;
  }
}

function updateSize(node) {
  node.size = 1 + sizeOf(node.left) + sizeOf(node.right);
}

// Split the subtree rooted at `node` into [0, k) and [k, end).
// `pushDown` is called before descending so lazy state is always applied
// before we read structure or recurse.
function split(node, k) {
  if (!node) return [null, null];
  pushDown(node);
  const leftSize = sizeOf(node.left);
  if (k <= leftSize) {
    const [l, r] = split(node.left, k);
    node.left = r;
    updateSize(node);
    return [l, node];
  }
  const [l, r] = split(node.right, k - leftSize - 1);
  node.right = l;
  updateSize(node);
  return [node, r];
}

// Merge two trees where every key in `a` precedes every key in `b`.
// The heap property on `priority` keeps expected depth O(log n).
function merge(a, b) {
  if (!a) return b;
  if (!b) return a;
  if (a.priority > b.priority) {
    pushDown(a);
    a.right = merge(a.right, b);
    updateSize(a);
    return a;
  }
  pushDown(b);
  b.left = merge(a, b.left);
  updateSize(b);
  return b;
}

export class Treap {
  constructor(values, seed) {
    this.root = null;
    const s = typeof seed === "number" ? seed : 0x12345678;
    this._rng = createRng(s);
    if (values) {
      for (const v of values) this.push(v);
    }
  }

  get length() {
    return sizeOf(this.root);
  }

  push(value) {
    const node = new Node(value, this._rng());
    this.root = merge(this.root, node);
  }

  unshift(value) {
    const node = new Node(value, this._rng());
    this.root = merge(node, this.root);
  }

  pop() {
    if (!this.root) return undefined;
    const [a, b] = split(this.root, this.root.size - 1);
    this.root = a;
    pushDown(b);
    return b.value;
  }

  shift() {
    if (!this.root) return undefined;
    const [a, b] = split(this.root, 1);
    this.root = b;
    pushDown(a);
    return a.value;
  }

  get(index) {
    if (index < 0 || index >= this.length) return undefined;
    let node = this.root;
    let i = index;
    while (node) {
      pushDown(node);
      const ls = sizeOf(node.left);
      if (i === ls) return node.value;
      if (i < ls) node = node.left;
      else { i -= ls + 1; node = node.right; }
    }
    return undefined;
  }

  set(index, value) {
    if (index < 0 || index >= this.length) return false;
    const [a, rest] = split(this.root, index);
    const [target, b] = split(rest, 1);
    if (!target) {
      this.root = merge(a, b);
      return false;
    }
    target.value = value;
    target.rev = false;
    this.root = merge(a, merge(target, b));
    return true;
  }

  toArray() {
    const out = [];
    const walk = (node) => {
      if (!node) return;
      pushDown(node);
      walk(node.left);
      out.push(node.value);
      walk(node.right);
    };
    walk(this.root);
    return out;
  }

  reverseRange(start, end) {
    if (start < 0) start = 0;
    if (end > this.length) end = this.length;
    if (start >= end) return;
    const [a, rest] = split(this.root, start);
    const [mid, b] = split(rest, end - start);
    if (mid) mid.rev = !mid.rev;
    this.root = merge(a, merge(mid, b));
  }

  swapRanges(s1, e1, s2, e2) {
    if (s1 > s2) { [s1, s2] = [s2, s1]; [e1, e2] = [e2, e1]; }
    const len1 = e1 - s1;
    const len2 = e2 - s2;
    if (len1 <= 0 || len2 <= 0) throw new RangeError("empty range");
    if (len1 !== len2) throw new RangeError("ranges must be equal length");
    if (e1 > s2) throw new RangeError("ranges must not overlap");
    if (s1 < 0 || e2 > this.length) throw new RangeError("range out of bounds");
    // Cut into four ordered pieces: [0,s1) | A | gap | B | tail,
    // then reassemble with A and B swapped.
    const [p0, rest0] = split(this.root, s1);
    const [a, rest1] = split(rest0, len1);
    const [gap, rest2] = split(rest1, s2 - e1);
    const [b, tail] = split(rest2, len2);
    this.root = merge(p0, merge(b, merge(gap, merge(a, tail))));
  }
}
