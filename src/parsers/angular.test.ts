import { describe, it } from "vitest";

import { sortClasses } from "better-tailwindcss:rules:tailwind-sort-classes.js";
import { createTrimTag, lint, TEST_SYNTAXES } from "better-tailwindcss:tests:utils.js";
import { MatcherType } from "better-tailwindcss:types:rule.js";


describe("angular", () => {

  describe("defaults", () => {
    it("should support normal classes", () => {
      lint(sortClasses, TEST_SYNTAXES, {
        invalid: [
          {
            angular: `<img class="b a" />`,
            angularOutput: `<img class="a b" />`,
            errors: 1,
            options: [{ order: "asc" }]
          },
          {
            angular: `<img [class]="'b a'" />`,
            angularOutput: `<img [class]="'a b'" />`,
            errors: 1,
            options: [{ order: "asc" }]
          },
          {
            angular: `<img [ngClass]="'b a'" />`,
            angularOutput: `<img [ngClass]="'a b'" />`,
            errors: 1,
            options: [{ order: "asc" }]
          }
        ]
      });
    });

    it("should support array binding in [class] and [ngClass]", () => {
      lint(sortClasses, TEST_SYNTAXES, {
        invalid: [
          {
            angular: `<img [class]="['b a', 'd c']" />`,
            angularOutput: `<img [class]="['a b', 'c d']" />`,
            errors: 2,
            options: [{ order: "asc" }]
          },
          {
            angular: `<img [ngClass]="['b a', 'd c']" />`,
            angularOutput: `<img [ngClass]="['a b', 'c d']" />`,
            errors: 2,
            options: [{ order: "asc" }]
          }
        ]
      });
    });

    it("should support expressions in literal arrays", () => {
      lint(sortClasses, TEST_SYNTAXES, {
        invalid: [
          {
            angular: `<img [class]="['b a', expression ? 'd c' : 'f e']" />`,
            angularOutput: `<img [class]="['a b', expression ? 'c d' : 'e f']" />`,
            errors: 3,
            options: [{ order: "asc" }]
          },
          {
            angular: `<img [ngClass]="['b a', expression ? 'd c' : 'f e']" />`,
            angularOutput: `<img [ngClass]="['a b', expression ? 'c d' : 'e f']" />`,
            errors: 3,
            options: [{ order: "asc" }]
          }
        ]
      });
    });

    it("should support object keys in [class] and [ngClass]", () => {
      lint(sortClasses, TEST_SYNTAXES, {
        invalid: [
          {
            angular: `<img [class]="{ 'b a': true, 'd c': false }" />`,
            angularOutput: `<img [class]="{ 'a b': true, 'c d': false }" />`,
            errors: 2,
            options: [{ order: "asc" }]
          },
          {
            angular: `<img [ngClass]="{ 'b a': true, 'd c': false }" />`,
            angularOutput: `<img [ngClass]="{ 'a b': true, 'c d': false }" />`,
            errors: 2,
            options: [{ order: "asc" }]
          }
        ]
      });
    });
  });

  describe("names", () => {
    it("should match attribute names via names regex", () => {
      lint(sortClasses, TEST_SYNTAXES, {
        invalid: [
          {
            angular: `<img customAttribute="b a" />`,
            angularOutput: `<img customAttribute="a b" />`,
            errors: 1,
            options: [{ attributes: [".*Attribute"], order: "asc" }]
          },
          {
            angular: `<img class="b a" />`,
            angularOutput: `<img class="a b" />`,
            errors: 1,
            options: [{ attributes: ["class"], order: "asc" }]
          },
          {
            angular: `<img [class]="'b a'" />`,
            angularOutput: `<img [class]="'a b'" />`,
            errors: 1,
            options: [{ attributes: ["\\[class\\]"], order: "asc" }]
          },
          {
            angular: `<img [ngClass]="'b a'" />`,
            angularOutput: `<img [ngClass]="'a b'" />`,
            errors: 1,
            options: [{ attributes: ["\\[ngClass\\]"], order: "asc" }]
          }
        ]
      });
    });
  });

  describe("matchers", () => {

    describe("string", () => {
      it("should match attribute names via matchers", () => {
        lint(sortClasses, TEST_SYNTAXES, {
          invalid: [
            {
              angular: `<img class="b a" />`,
              angularOutput: `<img class="a b" />`,
              errors: 1,
              options: [{ attributes: [["class", [{ match: MatcherType.String }]]], order: "asc" }]
            },
            {
              angular: `<img [class]="'b a'" />`,
              angularOutput: `<img [class]="'a b'" />`,
              errors: 1,
              options: [{ attributes: [["\\[class\\]", [{ match: MatcherType.String }]]], order: "asc" }]
            },
            {
              angular: `<img [ngClass]="'b a'" />`,
              angularOutput: `<img [ngClass]="'a b'" />`,
              errors: 1,
              options: [{ attributes: [["\\[ngClass\\]", [{ match: MatcherType.String }]]], order: "asc" }]
            }
          ]
        });
      });
    });

    describe("object keys", () => {
      it("should match object keys", () => {
        lint(sortClasses, TEST_SYNTAXES, {
          invalid: [
            {
              angular: `<img [class]="{ 'b a': true, 'd c': false }" />`,
              angularOutput: `<img [class]="{ 'a b': true, 'c d': false }" />`,
              errors: 2,
              options: [{
                attributes: [
                  [
                    "\\[class\\]", [
                      {
                        match: MatcherType.ObjectKey
                      }
                    ]
                  ]
                ],
                order: "asc"
              }]
            },
            {
              angular: `<img [ngClass]="{ 'b a': true, 'd c': false }" />`,
              angularOutput: `<img [ngClass]="{ 'a b': true, 'c d': false }" />`,
              errors: 2,
              options: [{
                attributes: [
                  [
                    "\\[ngClass\\]", [
                      {
                        match: MatcherType.ObjectKey
                      }
                    ]
                  ]
                ],
                order: "asc"
              }]
            }
          ]
        });
      });

      it("should still match the object key when there is a value with the same content", () => {
        lint(sortClasses, TEST_SYNTAXES, {
          invalid: [
            {
              angular: `<img [class]="{ 'b a': 'd c', 'd c': 'b a' }" />`,
              angularOutput: `<img [class]="{ 'a b': 'd c', 'c d': 'b a' }" />`,
              errors: 2,
              options: [{
                attributes: [
                  [
                    "\\[class\\]", [
                      {
                        match: MatcherType.ObjectKey
                      }
                    ]
                  ]
                ],
                order: "asc"
              }]
            },
            {
              angular: `<img [ngClass]="{ 'b a': 'd c', 'd c': 'b a' }" />`,
              angularOutput: `<img [ngClass]="{ 'a b': 'd c', 'c d': 'b a' }" />`,
              errors: 2,
              options: [{
                attributes: [
                  [
                    "\\[ngClass\\]", [
                      {
                        match: MatcherType.ObjectKey
                      }
                    ]
                  ]
                ],
                order: "asc"
              }]
            }
          ]
        });
      });
    });

    describe("object values", () => {
      // this is not used by angular, but matchers should still be able to handle it
      it("should support object values", () => {
        lint(sortClasses, TEST_SYNTAXES, {
          invalid: [
            {
              angular: `<img [ngClass]="{ '0': 'b a', '1': 'd c' }" />`,
              angularOutput: `<img [ngClass]="{ '0': 'a b', '1': 'c d' }" />`,
              errors: 2,
              options: [{
                attributes: [["\\[ngClass\\]", [
                  {
                    match: MatcherType.ObjectValue
                  }
                ]]],
                order: "asc"
              }]
            }
          ]
        });
      });
    });

    describe("arrays", () => {
      it("should support arrays", () => {
        lint(sortClasses, TEST_SYNTAXES, {
          invalid: [
            {
              angular: `<img [class]="['b a', 'd c']" />`,
              angularOutput: `<img [class]="['a b', 'c d']" />`,
              errors: 2,
              options: [{ attributes: [["\\[class\\]", [{ match: MatcherType.String }]]], order: "asc" }]
            },
            {
              angular: `<img [ngClass]="['b a', 'd c']" />`,
              angularOutput: `<img [ngClass]="['a b', 'c d']" />`,
              errors: 2,
              options: [{ attributes: [["\\[ngClass\\]", [{ match: MatcherType.String }]]], order: "asc" }]
            }
          ]
        });
      });

      it("should support expressions in arrays", () => {
        lint(sortClasses, TEST_SYNTAXES, {
          invalid: [
            {
              angular: `<img [class]="['b a', expression ? 'd c' : 'f e']" />`,
              angularOutput: `<img [class]="['a b', expression ? 'c d' : 'e f']" />`,
              errors: 3,
              options: [{ attributes: [["\\[class\\]", [{ match: MatcherType.String }]]], order: "asc" }]
            },
            {
              angular: `<img [ngClass]="['b a', expression ? 'd c' : 'f e']" />`,
              angularOutput: `<img [ngClass]="['a b', expression ? 'c d' : 'e f']" />`,
              errors: 3,
              options: [{ attributes: [["\\[ngClass\\]", [{ match: MatcherType.String }]]], order: "asc" }]
            }
          ]
        });
      });
    });

    describe("expressions", () => {
      it("should lint classes returned from expressions", () => {
        lint(sortClasses, TEST_SYNTAXES, {
          invalid: [
            {
              angular: `<img class="{{ true === 'b a' ? 'b a' : 'd c' }}" />`,
              angularOutput: `<img class="{{ true === 'b a' ? 'a b' : 'c d' }}" />`,
              errors: 2,
              options: [{ attributes: [["class", [{ match: MatcherType.String }]]], order: "asc" }]
            },
            {
              angular: `<img [class]="true === 'b a' ? 'b a' : 'd c'" />`,
              angularOutput: `<img [class]="true === 'b a' ? 'a b' : 'c d'" />`,
              errors: 2,
              options: [{ attributes: [["\\[class\\]", [{ match: MatcherType.String }]]], order: "asc" }]
            },
            {
              angular: `<img [ngClass]="true === 'b a' ? 'b a' : 'd c'" />`,
              angularOutput: `<img [ngClass]="true === 'b a' ? 'a b' : 'c d'" />`,
              errors: 2,
              options: [{ attributes: [["\\[ngClass\\]", [{ match: MatcherType.String }]]], order: "asc" }]
            }
          ]
        });
      });
    });

    describe("template literals", () => {
      it("should support template literals in interpolated class", () => {
        lint(sortClasses, TEST_SYNTAXES, {
          invalid: [
            // 1st pass of multi pass fix
            {
              angular: "<img class=\"{{`b a ${true && 'd c'} f e`}}\" />",
              angularOutput: "<img class=\"{{`a b ${true && 'c d'} f e`}}\" />",
              errors: 3,
              options: [{ order: "asc" }]
            },

            // 2nd pass of multi pass fix
            {
              angular: "<img class=\"{{`a b ${true && 'c d'} f e`}}\" />",
              angularOutput: "<img class=\"{{`a b ${true && 'c d'} e f`}}\" />",
              errors: 1,
              options: [{ order: "asc" }]
            }
          ]
        });
      });

      it("should support short circuiting", () => {
        lint(sortClasses, TEST_SYNTAXES, {
          invalid: [
            {
              angular: "<img [class]=\"`${'b a' && 'd c'}`\" />",
              angularOutput: "<img [class]=\"`${'b a' && 'c d'}`\" />",
              errors: 1,
              options: [{ attributes: [["\\[class\\]", [{ match: MatcherType.String }]]], order: "asc" }]
            },
            {
              angular: "<img [ngClass]=\"`${'b a' && 'd c'}`\" />",
              angularOutput: "<img [ngClass]=\"`${'b a' && 'c d'}`\" />",
              errors: 1,
              options: [{ attributes: [["\\[ngClass\\]", [{ match: MatcherType.String }]]], order: "asc" }]
            }
          ]
        });
      });

      it("should lint classes around expressions", () => {
        lint(sortClasses, TEST_SYNTAXES, {
          invalid: [
          // 1st pass of multi pass fix
            {
              angular: "<img [class]=\"`b a ${'d c'} f e`\" />",
              angularOutput: "<img [class]=\"`a b ${'d c'} e f`\" />",
              errors: 3,
              options: [{ attributes: [["\\[class\\]", [{ match: MatcherType.String }]]], order: "asc" }]
            },
            // 2nd pass of multi pass fix
            {
              angular: "<img [class]=\"`a b ${'d c'} e f`\" />",
              angularOutput: "<img [class]=\"`a b ${'c d'} e f`\" />",
              errors: 1,
              options: [{ attributes: [["\\[class\\]", [{ match: MatcherType.String }]]], order: "asc" }]
            },

            // 1st pass of multi pass fix
            {
              angular: "<img [ngClass]=\"`b a ${'d c'} f e`\" />",
              angularOutput: "<img [ngClass]=\"`a b ${'d c'} e f`\" />",
              errors: 3,
              options: [{ attributes: [["\\[ngClass\\]", [{ match: MatcherType.String }]]], order: "asc" }]
            },
            // 2nd pass of multi pass fix
            {
              angular: "<img [ngClass]=\"`a b ${'d c'} e f`\" />",
              angularOutput: "<img [ngClass]=\"`a b ${'c d'} e f`\" />",
              errors: 1,
              options: [{ attributes: [["\\[ngClass\\]", [{ match: MatcherType.String }]]], order: "asc" }]
            }
          ]
        });
      });

      it("should support multiline template literal types", () => {

        const trim = createTrimTag(8);

        const dirty = trim(`
          b a
          d c
        `);

        const clean = trim(`
          a b
          c d
        `);

        lint(sortClasses, TEST_SYNTAXES, {
          invalid: [
            {
              angular: `<img [class]="\`${dirty}\`" />`,
              angularOutput: `<img [class]="\`${clean}\`" />`,
              errors: 1,
              options: [{ order: "asc" }]
            },
            {
              angular: `<img [ngClass]="\`${dirty}\`" />`,
              angularOutput: `<img [ngClass]="\`${clean}\`" />`,
              errors: 1,
              options: [{ order: "asc" }]
            }
          ]
        });
      });

    });

  });

});
