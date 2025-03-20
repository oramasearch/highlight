export interface HighlightOptions {
  caseSensitive?: boolean;
  strategy?:
    | "whole word match"
    | "partial match"
    | "partial match - full word highlight";
  HTMLTag?: string;
  CSSClass?: string;
}
export type Position = { start: number; end: number };

type Positions = Position[];

const defaultOptions: Required<HighlightOptions> = {
  caseSensitive: false,
  strategy: "partial match",
  HTMLTag: "mark",
  CSSClass: "orama-highlight",
};

export class Highlight {
  private readonly options: HighlightOptions;
  private _positions: Positions = [];
  private _HTML: string = "";
  private _searchTerm: string = "";
  private _originalText: string = "";

  constructor(options: HighlightOptions = defaultOptions) {
    this.options = { ...defaultOptions, ...options };
  }

  public highlight(text: string, searchTerm: string): Highlight {
    this._searchTerm = searchTerm ?? "";
    this._originalText = text ?? "";

    if (!this._searchTerm || !this._originalText) {
      this._positions = [];
      this._HTML = this._originalText;
      return this;
    }

    const HTMLTag = this.options.HTMLTag ?? defaultOptions.HTMLTag;
    const CSSClass = this.options.CSSClass ?? defaultOptions.CSSClass;

    const caseSensitive =
      this.options.caseSensitive ?? defaultOptions.caseSensitive;
    const strategy = this.options.strategy ?? defaultOptions.strategy;
    const regexFlags = caseSensitive ? "g" : "gi";
    const searchTerms = this.escapeRegExp(
      caseSensitive ? this._searchTerm : this._searchTerm.toLowerCase()
    )
      .trim()
      .split(/\s+/)
      .join("|");

    let regex: RegExp;
    if (strategy === "whole word match") {
      regex = new RegExp(`\\b${searchTerms}\\b`, regexFlags);
    } else if (strategy === "partial match") {
      regex = new RegExp(searchTerms, regexFlags);
    } else if (strategy === "partial match - full word highlight") {
      regex = new RegExp(`\\b[^\\s]*(${searchTerms})[^\\s]*\\b`, regexFlags);
    } else {
      throw new Error("Invalid highlighter strategy");
    }

    const positions: Array<{ start: number; end: number }> = [];
    const highlightedParts: string[] = [];

    let match;
    let lastEnd = 0;
    let previousLastIndex = -1;

    while ((match = regex.exec(this._originalText)) !== null) {
      if (regex.lastIndex === previousLastIndex) {
        break;
      }
      previousLastIndex = regex.lastIndex;

      const start = match.index;
      const end = start + match[0].length - 1;

      positions.push({ start, end });

      highlightedParts.push(this._originalText.slice(lastEnd, start));
      highlightedParts.push(
        `<${HTMLTag} class="${CSSClass}">${match[0]}</${HTMLTag}>`
      );

      lastEnd = end + 1;
    }

    highlightedParts.push(this._originalText.slice(lastEnd));

    this._positions = positions;
    this._HTML = highlightedParts.join("");

    return this;
  }

  public trim(trimLength: number, ellipsis: boolean = true): string {
    if (this._positions.length === 0) {
      return `${this._HTML.substring(0, trimLength)}${ellipsis ? `...` : ""}`;
    }

    if (this._originalText.length <= trimLength) {
      return this._HTML;
    }

    const firstMatch = this._positions[0].start;
    const start = Math.max(firstMatch - Math.floor(trimLength / 2), 0);
    const end = Math.min(start + trimLength, this._originalText.length);
    const trimmedContent = `${
      start === 0 || !ellipsis ? "" : "..."
    }${this._originalText.slice(start, end)}${
      end < this._originalText.length && ellipsis ? "..." : ""
    }`;

    this.highlight(trimmedContent, this._searchTerm);
    return this._HTML;
  }

  get positions(): Positions {
    return this._positions;
  }

  get HTML(): string {
    return this._HTML;
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
