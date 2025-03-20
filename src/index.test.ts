import { describe, it, beforeEach, afterEach } from "bun:test";
import assert from "node:assert";
import sinon from "sinon";
import { Highlight } from "./index.js";

describe("default configuration", () => {
  it("should correctly highlight a text", () => {
    const text1 = "The quick brown fox jumps over the lazy dog";
    const searchTerm1 = "fox";
    const expectedResult1 =
      'The quick brown <mark class="orama-highlight">fox</mark> jumps over the lazy dog';

    const text2 =
      "Yesterday all my troubles seemed so far away, now it looks as though they're here to stay oh, I believe in yesterday";
    const searchTerm2 = "yesterday I was in trouble";
    const expectedResult2 =
      '<mark class="orama-highlight">Yesterday</mark> all my <mark class="orama-highlight">trouble</mark>s seemed so far away, now <mark class="orama-highlight">i</mark>t looks as though they\'re here to stay oh, <mark class="orama-highlight">I</mark> bel<mark class="orama-highlight">i</mark>eve <mark class="orama-highlight">i</mark>n <mark class="orama-highlight">yesterday</mark>';

    const highlighter = new Highlight();

    assert.strictEqual(
      highlighter.highlight(text1, searchTerm1).HTML,
      expectedResult1
    );
    assert.strictEqual(
      highlighter.highlight(text2, searchTerm2).HTML,
      expectedResult2
    );
  });

  it("should return the correct positions", () => {
    const text = "The quick brown fox jumps over the lazy dog";
    const searchTerm = "fox";
    const expectedPositions = [{ start: 16, end: 18 }];

    const highlighter = new Highlight();

    assert.deepStrictEqual(
      highlighter.highlight(text, searchTerm).positions,
      expectedPositions
    );
  });

  it("should return multiple positions", () => {
    const text = "The quick brown fox jumps over the lazy dog";
    const searchTerm = "the";
    const expectedPositions = [
      { start: 0, end: 2 },
      { start: 31, end: 33 },
    ];

    const highlighter = new Highlight();

    assert.deepStrictEqual(
      highlighter.highlight(text, searchTerm).positions,
      expectedPositions
    );
  });
});

describe("custom configuration", () => {
  it("should correctly highlight a text (case sensitive)", () => {
    const text1 = "The quick brown fox jumps over the lazy dog";
    const searchTerm1 = "Fox";
    const expectedResult1 = "The quick brown fox jumps over the lazy dog";

    const text2 =
      "Yesterday all my troubles seemed so far away, now it looks as though they're here to stay oh, I believe in yesterday";
    const searchTerm2 = "yesterday I was in trouble";
    const expectedResult2 =
      'Yesterday all my <mark class="orama-highlight">trouble</mark>s seemed so far away, now it looks as though they\'re here to stay oh, <mark class="orama-highlight">I</mark> believe <mark class="orama-highlight">in</mark> <mark class="orama-highlight">yesterday</mark>';

    const highlighter = new Highlight({ caseSensitive: true });

    assert.strictEqual(
      highlighter.highlight(text1, searchTerm1).HTML,
      expectedResult1
    );
    assert.strictEqual(
      highlighter.highlight(text2, searchTerm2).HTML,
      expectedResult2
    );
  });

  it("should correctly set a custom CSS class", () => {
    const text = "The quick brown fox jumps over the lazy dog";
    const searchTerm = "fox";
    const expectedResult =
      'The quick brown <mark class="custom-class">fox</mark> jumps over the lazy dog';

    const highlighter = new Highlight({ CSSClass: "custom-class" });

    assert.strictEqual(
      highlighter.highlight(text, searchTerm).HTML,
      expectedResult
    );
  });

  it("should correctly use a custom HTML tag", () => {
    const text = "The quick brown fox jumps over the lazy dog";
    const searchTerm = "fox";
    const expectedResult =
      'The quick brown <div class="orama-highlight">fox</div> jumps over the lazy dog';

    const highlighter = new Highlight({ HTMLTag: "div" });

    assert.strictEqual(
      highlighter.highlight(text, searchTerm).HTML,
      expectedResult
    );
  });

  it("should correctly highlight whole word matches only", () => {
    const text = "The quick brown fox jumps over the lazy dog";
    const searchTerm = "fox jump";
    const expectedResult =
      'The quick brown <mark class="orama-highlight">fox</mark> jumps over the lazy dog';

    const highlighter = new Highlight({ strategy: "whole word match" });

    assert.strictEqual(
      highlighter.highlight(text, searchTerm).HTML,
      expectedResult
    );
  });

  it("should correctly highlight whole words on partial matches only", () => {
    const text = "The quick brown fox jumps over the lazy dog";
    const searchTerm = "fo umps ve";
    const expectedResult =
      'The quick brown <mark class="orama-highlight">fox</mark> <mark class="orama-highlight">jumps</mark> <mark class="orama-highlight">over</mark> the lazy dog';

    const highlighter = new Highlight({
      strategy: "partial match - full word highlight",
    });

    assert.strictEqual(
      highlighter.highlight(text, searchTerm).HTML,
      expectedResult
    );
  });

  it("should not highlight anything on 0 matches on a partial match - full word highlight strategy when the search term is nothing", () => {
    const text = "The quick brown fox jumps over the lazy dog";
    const searchTerm = "";
    const expectedResult = "The quick brown fox jumps over the lazy dog";

    const highlighter = new Highlight({
      strategy: "partial match - full word highlight",
    });

    assert.strictEqual(
      highlighter.highlight(text, searchTerm).HTML,
      expectedResult
    );
  });
});

describe("highlight function - infinite loop protection", () => {
  let regexExecStub: sinon.SinonStub;

  beforeEach(() => {
    regexExecStub = sinon.stub(RegExp.prototype, "exec");
  });

  afterEach(() => {
    regexExecStub.restore();
  });

  it("should exit the loop if regex.lastIndex does not advance", () => {
    const text = "The quick brown fox jumps over the lazy dog";
    const searchTerm = "fox";

    regexExecStub.callsFake(function () {
      // @ts-expect-error
      this.lastIndex = 0;
      return null;
    });

    const highlighter = new Highlight();
    const result = highlighter.highlight(text, searchTerm);

    assert.strictEqual(result.HTML, text);

    assert(regexExecStub.called);
  });
});

describe("trim method", () => {
  it("should correctly trim the text", () => {
    const text = "The quick brown fox jumps over the lazy dog";
    const searchTerm = "fox";
    const highlighter = new Highlight();

    assert.strictEqual(
      highlighter.highlight(text, searchTerm).trim(10),
      '...rown <mark class="orama-highlight">fox</mark> j...'
    );
    assert.strictEqual(
      highlighter.highlight(text, searchTerm).trim(5),
      '...n <mark class="orama-highlight">fox</mark>...'
    );
    assert.strictEqual(
      highlighter.highlight(text, "the").trim(5),
      '<mark class="orama-highlight">The</mark> q...'
    );
    assert.strictEqual(
      highlighter.highlight(text, "dog").trim(5),
      '...y <mark class="orama-highlight">dog</mark>'
    );
    assert.strictEqual(
      highlighter.highlight(text, "dog").trim(5, false),
      'y <mark class="orama-highlight">dog</mark>'
    );
    assert.strictEqual(
      highlighter.highlight(text, "the").trim(5, false),
      '<mark class="orama-highlight">The</mark> q'
    );
  });
  it("should correctly trim the text when no match is found", () => {
    const text = "The quick brown dog jumps over the lazy dog in a forrest";
    const searchTerm = "fox";
    const highlighter = new Highlight();

    assert.strictEqual(
      highlighter.highlight(text, searchTerm).trim(10),
      "The quick ..."
    );
    assert.strictEqual(
      highlighter.highlight(text, searchTerm).trim(10, false),
      "The quick "
    );
  });
});

describe("special characters", () => {
  it("should correctly highlight a text with special characters", () => {
    const text = "C++ is a hell of a language";
    const searchTerm = "C++";
    const expectedResult =
      '<mark class="orama-highlight">C++</mark> is a hell of a language';

    const highlighter = new Highlight();

    assert.strictEqual(
      highlighter.highlight(text, searchTerm).HTML,
      expectedResult
    );
  });
});

describe("null example", () => {
  // even though it is not expected we should make sure it won't break
  it("should not break when text is null", () => {
    const searchTerm = "C";
    const highlighter = new Highlight();

    // @ts-expect-error
    assert.strictEqual(highlighter.highlight(null, searchTerm).HTML, "");
  });
  it("should not break when text and search term is null", () => {
    const highlighter = new Highlight();

    assert.strictEqual(
      // @ts-expect-error
      highlighter.highlight(null, null).HTML,
      ""
    );
  });
});
